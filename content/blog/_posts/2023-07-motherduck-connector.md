---
title: "OLAP for Event Streaming with MotherDuck Connector"
author:
    name: "Sehyo Chang"
    github: "sehz"
description: "Using InfinyOn DuckDB/MotherDuck connector to send data to MotherDuck"
date: 2023-07-20
metadata:
    - TECH
    - DuckDB
    - MotherDuck
slug: motherduck-infinyon
url: /blog/2023/07/infinyon-motherduck
img: blog/images/infinyon-motherduck/infinyon-motherduck-olap.jpg
twitter-card: summary_large_image
show-header-img: false
---

# Introduction

We are excited to announce the release of the Motherduck/DuckDB connector for InfinyOn Cloud. This connector lets you to stream data from the InfinyOn cloud to MotherDuck in real time.  MotherDuck is a cloud data analytics platform powered by DuckDB, an open-source OLAP engine.  InfinyOn Cloud is the next generation of data streaming platform allowing anyone to connect, transform and dispatch data to anywhere.  InfinyOn Cloud has built-in connectors that can connect to various data sources such as HTTP, MQTT, and SQL.  Using a combination of InfinyOn and MotherDuck, you can build complete real-time data analytics solutions for use cases such as fraud detection, inventory management, and a real-time recommendation engine.

This blog post will show you how to use InfinyOn Cloud to stream data to MotherDuck. We will use the MQTT connector to stream data from Helsinki transit data and transform data suitable for  MotherDuck. You can stream data from InfinyOn Cloud to MotherDuck without any additional steps. 

# Prerequisite

This blog assumes that you have an InfinyOn Cloud account.  You can [sign-up for InfinyOn Cloud] if you don't have one.  You must also install [Fluvio CLI](https://www.fluvio.io/download/) on your local machine.   InfinyOn cloud allows you to run managed fluvio cluster on the cloud. You can use Fluvio CLI to interact with it or a built-in UI dashboard to monitor ongoing activities. At this time, please log in to InfinyOn Cloud and set up the default cluster.

# Demo Scenario

In this example, we will consume live data from [transit vehicles in Helsinki], Finland. The city publishes real-time metrics such as speed, acceleration, route, etc., and makes this data publicly available via MQTT at  `mqtt://mqtt.hsl.fi`.  The data is in JSON format.  For more information, please see [Helsinki City's MQTT documentation](https://digitransit.fi/en/developers/apis/4-realtime-api/vehicle-positions/).

The demo pipeline consists of the following:

* Use MQTT connector to stream data from Helsinki MQTT endpoint to Fluvio topic as JSON.
* The DuckDB connector will trim and transform JSON data and insert SQL records to MotherDuck/DuckDB.
* Use MotherDuck/DuckDB to perform SQL analysis on the data.  

## Creating a Fluvio topic to store MQTT data

We will use a fluvio topic to stream MQTT data from Helsinki City. The fluvio topic is an immutable store of events. Helsinki MQTT stream is a high-volume stream. So we will use a short retention time of 2 hours to ensure data fit into the default topic volume quota.

%copy first-line%
```bash
 $ fluvio topic create helsinki --retention-time 2h
```


## Starting MQTT connector

Create the following configuration file `conn-mqtt.yaml` on your local directory, which specific the MQTT connector configuration:

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.3
  name: helsinki-mqtt 
  type: mqtt-source
  topic: helsinki
mqtt:
  url: "mqtt://mqtt.hsl.fi"
  topic: "/hfp/v2/journey/ongoing/vp/+/+/+/#"
  timeout:
    secs: 30
    nanos: 0
  payload_output_type: json
```

Then use `fluvio` CLI to start the connector:

%copy first-line%
```bash
$ fluvio cloud connector create --config conn-mqtt.yaml 
```

This will start the MQTT connector and connect to the Helsinki MQTT broker. It will subscribe to the topic `/hfp/v2/journey/ongoing/vp/+/+/+/#` and publish the data to the Fluvio topic `helsinki`.

You can verify that the connector is running by running the following command to see the latest MQTT data stream into Fluvio topic `helsinki`.  You can use the following command to see live data.

%copy first-line%
```bash
$ fluvio consume helsinki

Consuming records from 'helsinki'
{"mqtt_topic":"/hfp/v2/journey/ongoing/vp/bus/0012/02244/1098/1/Rastila(M)/19:03/1453126/5/60;25/20/07/96","payload":{"VP":{"desi":"98","dir":"1","oper":12,"veh":2244,"tst":"2023-02-02T17:00:15.231Z","tsi":1675357215,"spd":0.0,"hdg":244,"lat":60.209415,"long":25.076423,"acc":0.0,"dl":179,"odo":90,"drst":0,"oday":"2023-02-02","jrn":304,"line":145,"start":"19:03","loc":"GPS","stop":1453126,"route":"1098","occu":0}}}
.....
```

If you are using [InfinyOn Cloud], check out the Dashboard:

<img src="/blog/images/fluvio-duckdb/cloud-traffic.png"
     alt="InfinyOn Cloud Traffic"
     style="justify: center; max-width: 90%" />

The Dashboard should show that InfinyOn Cloud is processing lots of data.

Note that this connector does not perform any transformation or filtering.  It simply streams the data from the MQTT broker to the Fluvio topic.  We will use the MotherDuck connector to transform the data and insert it into MotherDuck/DuckDB.

## Starting MotherDuck/DuckDB connector.

Make sure you have [MotherDuck](https://motherduck.com) account and request an API Token.  The API Token is needed by the MotherDuck connector to authenticate with MotherDuck.

Before we start the MotherDuck connector, we need to create a table in MotherDuck to receive data from InfinyOn Cloud.  Use MotherDuck UI or DuckDB CLI.  Please run this command to create a table:

%copy first-line%
```sql
create table speed( lat float, long float, vehicle integer, speed float, time timestamp );
```

Ensure you have successfully created the table by running the following command:

%copy first-line%
```sql
select count(*) from speed;
```

You can also use the same command to see the progress of the data being inserted into the table.

## Create secrets to store token

MotherDuck connector needs to authenticate with MotherDuck.  We can securely store the authentication token using InfinyOn cloud's secret store.  To create a secret, run the following command:

%copy first-line%
```bash
$ fluvio cloud secret set MD_TOKEN <token_value>
```

Where <token_value> is the token value you get from MotherDuck.  The connector will use the token name `MD_TOKEN` to retrieve the token value.

## Downloading SmartModules into InfinyOn Cloud

MotherDuck connector uses SmartModules to transform the data.  SmartModules are reusable data transformation components that can transform data in real time.  In this demo, we download two SmartModules, `jolt` and `json-sql,` from the  InfinyOn Hub.  The `Hub` is a central repository of SmartModules.

The `jolt` SmartModule transforms JSON data into another JSON data.  The raw MQTT JSON from Helsinki transit is complex.  In this scenario, we only need small subsets of the data.  The transformation step will pick a few fields in the nested object and flatten them out to simplify the downstream transformation.

You can download the `jolt` SmartModule using the CLI:

%copy first-line%
```bash
$ fluvio hub sm download infinyon/jolt@0.3.0
```

The `json-sql` SmartModule is used to transform a JSON into SQL data which can be inserted into MotherDuck/DuckDB. 

%copy first-line%
```bash
$ fluvio hub sm download infinyon/json-sql@0.2.1
```
 
## Creating a MotherDuck connector

Similar to the MQTT connector, create the configuration file `conn-md.yaml` on your local directory:

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.1.0
  name: md-helsinki
  type: duckdb-sink
  topic: helsinki
  secrets:
    - name: MD_TOKEN
duckdb:
  url: "md:?token=${{ secrets.MD_TOKEN }}"
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            payload:
              VP:
                lat: "lat"
                long: "long"
                veh: "vehicle"
                route: "route"
                spd: "speed"
                tst: "tst"
  - uses: infinyon/json-sql@0.2.1
    with:
      mapping:
        table: "speed"
        map-columns:
          "lat":
            json-key: "lat"
            value:
              type: "float"
              default: "0"
              required: true
          "long":
            json-key: "long"
            value:
              type: "float"
              required: true
          "vehicle":
            json-key: "vehicle"
            value:
              type: "int"
              required: true
          "speed":
            json-key: "speed"
            value:
              type: "float"
              required: true
          "time":
            json-key: "tst"
            value:
              type: "timestamp"
              required: true
```

To start the connector, run the following command in the local directory:

%copy first-line%
```bash
$ fluvio cloud connector create --config conn-md.yaml 
```

## To check the status of the connector

Once both connectors are running, you can check the status of the connector by running the following command:

%copy first-line%
```bash
$ fluvio cloud connector list
```

You can also follow the progress of how many records are inserted into MotherDuck/DuckDB by running the following command:

%copy first-line%
```sql
select count(*) from speed;
```


## Performing analytics

With data flowing into MotherDuck, you can perform any analytics using SQL.  For example, we can compute the average speed of vehicles by running this on the MotherDuck UI query tool or DuckDB CLI:

%copy first-line%
```bash
select vehicle, avg(speed) from speed  group by vehicle;
┌─────────┬────────────────────┐
│ vehicle │     avg(speed)     │
│  int32  │       double       │
├─────────┼────────────────────┤
│    1407 │  5.878316847404631 │
│    1823 │ 12.250563307966985 │
│    2244 │   4.29509804763046 │
│    1334 │ 3.4598148077450417 │
│    1606 │ 5.9982051315725355 │
│    1347 │ 2.4579999693802423 │
│    1211 │  5.198823541402817 │
│      25 │ 10.653684204542323 │
│    1156 │  5.878526310583479 │
│    1382 │  8.446666672116233 │
│    1173 │ 12.593883457005893 │
│    1170 │  4.158035727151271 │
│    1831 │  8.553492042753431 │
│    2215 │  9.572083353996277 │
│    1391 │ 0.8761818246407942 │
│     285 │  2.562727277929133 │
│    1410 │  9.533480930366094 │
│    1037 │ 11.678289494558907 │
│    1114 │   5.06574714663385 │
│    1534 │  8.432022506936212 │
│      ·  │           ·        │
│      ·  │           ·        │
│      ·  │           ·        │
│     790 │   8.17142847606114 │
│     964 │  8.327142868723188 │
│    1503 │ 16.708571434020996 │
│    1602 │  8.161858405687113 │
│    6326 │  29.88338432312012 │
│    1049 │ 12.826333268483479 │
│     454 │ 3.5763491903032576 │
│    1343 │ 0.9916250079870224 │
│     320 │ 17.509583353996277 │
│     266 │ 3.7031999796628954 │
│    1023 │  7.556637190084542 │
│     418 │ 1.9262499809265137 │
│    1900 │  8.037222094006008 │
│    1916 │  5.429999947547913 │
│     921 │  22.95133336385091 │
│    2208 │ 11.416666603088379 │
│    1103 │ 11.645714351109095 │
│    1535 │ 12.809999942779541 │
│     988 │  3.474313719599855 │
│    1341 │  9.315308665787732 │
├─────────┴────────────────────┤
│     920 rows (40 shown)      │
└──────────────────────────────┘
```

The current version of the connector provides default mapping of JSON data to SQL, such as int, float, string, and timestamp.  For detailed configuration parameters, please see details of [MotherDuck connector properties](https://www.fluvio.io/connectors/).


## Clean-up

This demo transforms quite a bit of traffic in real-time, which will rapidly consume your free InfinyOn Cloud credits.  After completing the demo, please delete the connectors and topic to avoid unnecessary charges.

%copy first-line%
```bash
$ fluvio cloud connector delete helsinki-mqtt md-helsinki
```


## Conclusion

In this blog post, we demonstrated that building real-time OLAP analytics solutions can be done easily and quickly using InfinyOn Cloud and MotherDuck.  We can't wait for you to try and create your real-time analytics solution.


## Further reading

- [Handling XML data in Fluvio SmartModules](/blog/2022/06/smartmodule-xml/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)

[DuckDb]: https://duckdb.org/
[Sign-up for InfinyOn Cloud]:  https://infinyon.cloud?utm_campaign=duckdb&utm_source=website&utm_medium=blog&utm_term=duckdb&utm_content=cloud-registration
[InfinyOn Cloud]:  https://infinyon.cloud?utm_campaign=duckdb&utm_source=website&utm_medium=blog&utm_term=duckdb&utm_content=cloud-registration
[Install Fluvio on your local machine]: https://fluvio.io/docs/get-started/mac/
[transit vehicles in Helsinki]: https://www.hsl.fi/
[setup instructions]: https://www.rust-lang.org/tools/install 
[SmartModule Hub]: https://www.fluvio.io/smartmodules/

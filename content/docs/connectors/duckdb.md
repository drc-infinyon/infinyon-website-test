---
title: DuckDB Connector
menu: DuckDB 
description: "Reference for configuring DuckDB data connectors in InfinyOn Cloud"
---


| Data Direction | Inbound | [Outbound](#outbound-connector) |
|:--------------:|:-----------------------------:|:-------------------------------:|
|                | ❌                             | [✅](#outbound-connector)        |


DuckDb connector is experimental.


## Outbound Connector

The DuckDB Sink connector reads records from Fluvio topic, applies configured transformations, and 
sends new records to the SQL database (via `INSERT` statements). 

## SQL Model to DuckDB types mapping

The DuckDB Sink connector expects the data in Fluvio SQL Model in JSON format.
In order to work with different data formats or data structures.

The following table shows the mapping between SQL Model and DuckDB types:

| Model           | DuckDB    |                                          
|:----------------|:----------|
| Bool            | bool      |
| Char            | str       |
| SmallInt        | i16       |
| Int             | i32       |
| BigInt          | i64       |
| Float           | f32       |
| DoublePrecision | f64       |
| Text            | str       |
| Bytes           | [u8]      |
| Numeric         | TODO      |
| Timestamp       | Timestamp |
| Date            | TODO      |
| Time            | TODO      |
| Uuid            | UUID      |
| Json            | JSON      |

## Configuration

This connector can be configured using the following properties:
### URL

A URL is path to duckdb database path.  It can be any expression duckdb supports.  For example, to use a local database, it can be `my_duckdb_file`.

To connect to Motherduck server, use prefix: `md`.  For example, `md://motherduck_path`.  Please see MotherDuck documentation for more details.

### Example of opening to local duckdb
```yaml
apiVersion: 0.1.0
meta:
  version: 0.1.0
  name: duckdb-connector
  type: duckdb-sink
  topic: fluvio-topic-source
  create-topic: true
duckdb:
  url: 'local.db'    # local duckdb
```

### Transformations

 `transformations` can be applied.
The transformation is a SmartModule pulled from the SmartModule Hub. Transformations are chained according to the order
in the config. If a SmartModule requires configuration, it is passed via `with` section of `transforms` entry. 



### Secrets

The connector can use secrets in order to hide sensitive information.  The example below uses secrets to pass the token to MotherDuck server.

```yaml
apiVersion: 0.1.0
meta:
  version: 0.1.0
  name: motherduck-connector
  type: duckdb-sink
  topic: sql-topic
  secrets:
    - name: MD_TOKEN
duckdb:
  url: "md:?token=${{ secrets.MD_TOKEN }}"
```
### Usage Example
Let's look at the example of the connector with one transformation named [infinyon/json-sql]({{<ref "/docs/smartmodules/json-sql.md">}}). The transformation takes
records in JSON format and creates SQL insert operation to `topic_message` table. The value from `device.device_id`
JSON field will be put to `device_id` column and the entire json body to `record` column.

The JSON record:
```json
{
  "device": {
    "device_id": 1
  }
}
```

The SQL database (Postgres):
```
CREATE TABLE topic_message (device_id int, record json);
```

Connector configuration file:
```yaml
# connector-config.yaml
apiVersion: 0.1.0
meta:
  version: 0.1.0
  name: json-sql-connector
  type: duckdb-sink
  topic: sql-topic
  create-topic: true
  secrets:
    - name: MD_TOKEN
duckdb:
  url: "md:?token=${{ secrets.MD_TOKEN }}"
transforms:
  - uses: infinyon/json-sql
    with:
      mapping:
        table: "topic_message"
        map-columns:
          "device_id":
            json-key: "device.device_id"
            value:
              type: "int"
              default: "0"
              required: true
          "record":
            json-key: "$"
            value:
              type: "jsonb"
              required: true
```

You can use Fluvio `fluvio cloud connector` tool to deploy the connector:

and then:
```bash
fluvio cloud connector create --config connector-config.yaml
```
To delete the connector run:
```bash
fluvio cloud connector delete <name of connector> 

```
After you run the connector you will see records in your database table.

See more in our [MQTT to SQL]({{<ref "/docs/guides/mqtt-to-sql.md">}}) and [HTTP to SQL]({{<ref "/docs/guides/http-to-sql.md">}}) guides.
---
title: "How to Write to Apache Kafka from a Fluvio topic"
author:
    name: "Grant Swanson"
    github: "ruststreaming"
    title: "VP Marketing"
description: "Aggregate and Transform data in real-time with Fluvio before writing to a Kafka topic"
date: 2022-09-19
metadata: 
    - Kafka
    - Fluvio   
slug: write-to-kafka-from-fluvio
url: /blog/2022/09/write-to-kafka-from-fluvio
img: blog/images/Fluvio-to-Kafka-blog.png
twitter-card: summary_large_image
code:
    height: 9000
---

This blog shows the power of Fluvio for performing real-time data transformations and provides a step by step example of how to stream clean data to a Kafka topic. In this example we are taking source data from the Finnhub API with our HTTP source connector, aggregating stock prices, and caluclating unrealised gains or losses in real-time before we send it to Apache Kafka.

[Fluvio]: https://fluvio.io/
[Rust]: https://www.rust-lang.org/


### Start

Install minikube, helm, kubectr with the following instructions: https://www.fluvio.io/docs/get-started/linux/#installing-kubernetes-cluster.

### Install Fluvio.

Install Fluvio CLI:

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

This command will download the Fluvio Version Manager (fvm), Fluvio CLI (fluvio) and config files into `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`. To complete the installation, you will need to add the executables to your shell `$PATH`.

Start Fluvio Cluster:

%copy first-line%
```bash
$ fluvio cluster start
```

Verify the cluster is running:

%copy%
```bash
$ fluvio topic create greetings
echo "Hello, Fluvio" | fluvio produce greetings
fluvio consume greetings -B -d
```



### Part one

<img src="/blog/images/fluvio-topic-kafka-sink.png"
     alt="Fluvio topic to Kafka Sink"
     style="margin: auto; max-width: 800px" />

### Recap of the Financal Services Demo

• git clone https://github.com/infinyon/fluvio-demo-04-12-2022-finance-demo.git

• register on finhub.io and obtain api token

• update API token in `quote-data-input.yaml`

Create a HTTP connector Check if the fluvio topic is populated:

%copy first-line%
```bash
$ fluvio consume gme-stocks -B
```

### Start a local Apache Kafka dev
Clone https://github.com/infinyon/kafka_webinar_16_August_2022 and change the value ADV_HOST in docker-compose-webinar.yml, where ADV_HOST is pinned to minikube network gateway 192.168.49.1:

check minikube ip

%copy%
```bash
$ minikube ip
192.168.49.2
```
and amend ADV_HOST in docker-compose-webinar.yml

%copy first-line%
```bash
$ docker compose -f docker-compose-webinar.yml up -d
```

Validate that Kafka is working

%copy first-line%
```bash
$ docker run --rm -it --net=host lensesio/fast-data-dev kafka-topics --zookeeper localhost:2181 --list
```

### Write to Kafka from Fluvio topic
 `ADV_HOST` and `kafka_url` in `webinar-kafka-sink-connector.yml` shall match to local IP (ifconfig| grep inet for linux)

%copy%
```bash
fluvio connector create -c ./webinar-kafka-sink-connector.yml
fluvio connector logs -f my-kafka-sink1
```

### Part two

<img src="/blog/images/Write-clean-data-to-Kafka-from-Fluvio-Topic.png"
     alt="Write clean data to Kafka from a Fluvio topic"
     style="margin: auto; max-width: 800px" />

Apply a Smart Module to a fluvio topic before writing to Kafka
Smart module calculates unrealised gains or losses. Runs an aggregate function on an assumed "purchased" stocks (warrant).

%copy%
```bash
fn update_profit(&mut self) {
        let mut profit = 0.0;
        for warrant in &self.warrants {
            profit += (self.current_price - (warrant.exercise_price + warrant.purchase_price))*warrant.count as f64;
        }
```

where warrents.txt

%copy%
```bash
{"expiry_date": "Tue, 11 Apr 2022 13:50:37 +0000", "exercise_price": 140.0, "purchase_price": 12.0, "count": 10}
{"expiry_date": "Tue, 12 Apr 2022 13:50:37 +0000", "exercise_price": 110.0, "purchase_price": 10.0, "count": 11}
{"expiry_date": "Tue, 12 Apr 2022 17:50:37 +0000", "exercise_price": 150.0, "purchase_price": 11.0, "count": 12}
{"expiry_date": "Tue, 13 Apr 2022 13:50:37 +0000", "exercise_price": 160.0, "purchase_price": 13.0, "count": 13}
```
 
In the fluvio-demo-04-12-2022-finance-demo folder run

%copy%
```bash
make sm-upload
make produce-warrants
make sm-consume
```

Those commands will compile and upload a smart module. Produce warrants will generate purchase orders so current profit can be calculated.

### Start Kafka sink connector with SmartModule

%copy%
```bash
fluvio connector create -c ./webinar-kafka-sink-connector-with-sm.yml
```

Rerun produce warrants: In fluvio-demo-04-12-2022-finance-demo run

%copy%
Sink connector reads fluvio topic from the end, and we are re-running `make produce-warrants` to make sure fluvio topic is populated, which is then appearing in kafka-aggregate-fluvio.

Watch kafka topic via Web UI `http://localhost:3030/kafka-topics-ui/#/cluster/fast-data-dev/topic/n/kafka-aggregate-fluvio/` or via command line:

%copy%
```bash
docker run --rm -it --net=host landoop/fast-data-dev kafka-console-consumer --topic kafka-aggregate-fluvio --bootstrap-server "192.168.1.89:9092"
```

### Webinar recording: Enhance your kafka infrastructure with fluvio

{{%link "https://www.infinyon.com/resources/enhance-your-kafka-infrastructure-with-fluvio/" "See webinar with live demo. " %}}

Stay connected

#### Connect with us:

Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions.

{{%link "https://www.youtube.com/channel/UCIY6TD_kIHA86468tmTEdHQ" "Subscribe to our YouTube channel" %}}

{{%link "https://twitter.com/infinyon" "Follow us on Twitter" %}}

{{%link "https://www.linkedin.com/company/infinyon/" "Follow us on LinkedIn" %}}

Have a happy coding, and stay tuned!

### Additional Notes
Running Kafka commands:

%copy%
```bash
docker run --rm -it --net=host landoop/fast-data-dev kafka-topics --zookeeper localhost:2181 --list
```

%copy%
```bash
docker run --rm -it --net=host landoop/fast-data-dev kafka-console-consumer --topic kafka-aggregate-fluvio --bootstrap-server "192.168.49.1:9092"
```


### Further reading

- [Handling JSON data in Fluvio SmartModules](/blog/2022/06/smartmodule-json/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)
- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)

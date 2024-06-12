---
title: Kafka Connector
menu: Kafka
description: "Reference for configuring Kafka data connectors in InfinyOn Cloud"
---


| Data Direction | [Inbound](#inbound-connector) | [Outbound](#outbound-connector) |
|:--------------:|:-----------------------------:|:-------------------------------:|
|                | [✅](#inbound-connector) | [✅](#outbound-connector)        |

## Inbound Connector

This is a connector for taking data from a Kafka topic and sending to a Fluvio topic.

### Configuration

| Opt            | default               | type     | description                            |
| :---           | :---                  | :---     | :----                                  |
| url            | -                     | String   | The url for the kafka connector        |
| topic          | -                     | String   | The kafka topic                        |
| partition      | 0                     | Integer  | The kafka partition                    |
| group          | fluvio-kafka-source   | String   | The kafka consumer group               |

Example:
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: my-kafka-connector
  type: kafka-source
  topic: kafka-topic
  create-topic: true
kafka:
  url: "my.kafka.host:9092"
  topic: fluvio-topic 
```

### Transformations
Fluvio Kafka Connectors support [Transformations]({{<ref "/docs/resources/transformation-chaining.md">}}).

---

## Outbound Connector

This is a connector for taking data from a Fluvio topic and sending to a Kafka topic.

### Configuration

| Opt            | default               | type     | description                            |
| :---           | :---                  | :---     | :----                                  |
| url            | -                     | String   | The url for the kafka connector        |
| topic          | -                     | String   | The kafka topic                        |
| partition      | 0                     | Integer  | The kafka partition                    |
| create-topic   | false                 | Boolean  | Create or not a topic before start     |
| options        | -                     | Mapping  | The kafka client options               |
| security       | -                     | Mapping  | Optional. The kafka security config    |

#### Security configuration
| Option               | default  | type     | description                            |
| :---                 | :---     | :---     | :----                                  |
| security_protocol    | ssl      | String   | The kafka security protocol            |
| ssl_key              | -        | Mapping  | The SSL key file to use                |
| ssl_cert             | -        | Mapping  | The SSL cert file to use               |
| ssl_ca               | -        | Mapping  | The SSL ca file to use                 |

Parameters `ssl_key`, `ssl_cert` and `ssl_ca` can be defined via `file` - path to the file, or `pem` - content as string value.

Example without security:
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.7
  name: my-kafka-connector
  type: kafka-sink
  topic: kafka-topic
  create-topic: true
kafka:
  url: "my.kafka.host:9092"
  topic: fluvio-topic 
  create-topic: true
```

Example with security enabled:
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.7
  name: my-kafka-connector
  type: kafka-sink
  topic: kafka-topic
  create-topic: true
  secrets:
    - name: KAFKA_BROKER_URL
    - name: SSL_CERT_PEM
kafka:
  url: ${{ secrets.KAFKA_BROKER_URL }}
  topic: fluvio-topic 
  create-topic: true
  security:
    ssl_key:
      file: /path/to/file
    ssl_cert:
      pem: "${{ secrets.SSL_CERT_PEM }}"
    ssl_ca:
      file: /path/to/file
    security_protocol: ssl
```

### Testing with security
[Instructions](https://github.com/galibey/kafka-docker-ssl) of how to deploy local kafka cluster with SSL using docker.
After all steps done, in the `secrets` folder there will be `fluvio.key.pem`, `fluvio.pem` and `fake-ca-1.crt` files that can be used
in the connector config as `ssl_key`, `ssl_cert` and `ssl_ca` correspondingly.

### Transformations
Fluvio Kafka Connectors support [Transformations]({{<ref "/docs/resources/transformation-chaining.md">}}).

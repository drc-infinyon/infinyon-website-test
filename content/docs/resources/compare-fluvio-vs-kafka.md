---
title: "Comparison: Fluvio vs Kafka"
weight: 40
---
### Context
This purpose of this document is to compare and contrast [Apache Kafka](https://kafka.apache.org/) with [Fluvio Open Source](https://www.fluvio.io/).

Fluvio is a cloud native data streaming runtime that was architected from the ground up in Rust to solve the challenges with Kafka and alternatives to Kafka.

Fluvio is built to deliver a lean and mean data streaming platform with all the core functionality with unmatched performance and efficiency without the complexities and overhead of operating and managing Kafka.

### What is Apache Kafka?

Apache Kafka is a ubiquitous open-source streaming platform used for real-time data processing and event-driven architectures. It allows data to be published to topics and consumed by various applications, making it popular for building scalable and fault-tolerant data pipelines.

According to the official website, Apache Kafka is widely used by 80% of Fortune 100 companies as a robust distributed log solution.

At the same time if we look at the [Confluent](https://www.confluent.io/) or the [RedPanda](https://redpanda.com/) website it is clear that there are several challenges with Kafka in terms of performance, efficiency, complexity, maintenance toil, ops overhead, and costs.

There are 2 types of alternatives available to solve the Kafka challenges.
- Managed cloud native solutions based on Kafka
- Alternative streaming platforms compatible with Kafka

### What is Fluvio?

InfinyOn Fluvio emerges as a cutting-edge streaming platform, designed to seamlessly integrate with cloud-native architectures. It distinguishes itself through a user-centric interface and the incorporation of SmartModules for in-stream data transformations, achieving unparalleled resource efficiency via Rust and WebAssembly.

Unlike alternative streaming platforms, Fluvio is a single small binary that consumes minimal resources to run and operates using a simple and powerful client and CLI to build streaming flows without the limitations of the JVM.

Fluvio streaming runtime is complemented with SDKs to develop protocol level connectors and web assembly based on stream transformations that offers fine grained composability and control, and is also immune to memory issues.

### Indicators of performance
To run kafka cluster locally, need to download images amounting to 6.97 GB:
- enterprise-control-center - 1.31 GB
- enterprise-kafka - 1.01 GB
- kafka-rest - 1.85 GB
- schema-registry - 1.94 GB
- zookeeper - 863 MB.

Fluvio is a single binary less than 150 Mb that currently has a dependency on Kubernetes that we are decoupling to get a single binary.

While we are working on our implementation of the [open messaging benchmark](https://openmessaging.cloud/docs/benchmarks/), one of our customers compared their kafka clusters with fluvio and shared their results with us.

As per our customer data, Fluvio turned out to be 7 times leaner in CPU utilization, consumed 50 times less memory, while delivering 5 times more throughput.

## General 

| Parameter | Infinyon Fluvio | Apache Kafka |
| --- | --- | --- |
| License | Apache 2.0 | Apache 2.0 |
| Components | Fluvio + Kubernetes (K8 decoupling ready by Q4 2023 to support single binary deployment)  | Kafka + Zookeeper/KRaft (KIP-833) |
| Message Consumption Model | Pull | Pull |
| Storage Architecture  | Log | Log |                     

### License

Both Fluvio and Kafka use Apache 2.0, which is a fully open-source license.

### Components

Kafka uses Apache Zookeeper in production for its distributed coordination and configuration management, until KRaft mode is standard.

Fluvio uses Kubernetes for its cluster and configuration management on InfinyOn Cloud. For Fluvio open source we are enabling deploying local clusters with a single independent binary.

### Message Consumption Model

Both Kafka and Fluvio use pull-based message consumption models. Suitable for event streaming use-cases.

### Storage Architecture

Both Kafka and Fluvio use a storage layer built on a distributed log. New entries are added to the end of the log, and data is read in a sequential fashion starting from an offset. Data is transferred using zero-copy techniques to move from the disk buffer to the network buffer.

Using Fluvio SmartModules, data can be transformed in-stream. For example, before it is written to the log, or before it is sent over the network. This can favorably reduce bandwidth requirements and eliminate time spent cleaning data afterwards.


### Ecosystem and User Experience

| Parameter  | Infinyon Fluvio  | Apache Kafka  |
| --- | --- | --- |
| Deployment  | Run 1 CLI command  | Requires experience for tuning performance  |
| Enterprise Support  | InfinyOn Cloud  | 3rd parties like Confluent, AWS MSK  |
| Managed Cloud Offerings  | InfinyOn Cloud  | 3rd parties like Confluent, AWS MSK  |
| Self-Healing  | Yes  | No  |

### Deployment

Kafka is highly configurable, and may require time investment for performance. Production installations have zookeeper to maintain until KIP-833.

Fluvio requires a binary installation and a Kubernetes cluster. A cluster can be deployed with a single CLI command

### Enterprise Support and managed cloud

Kafka is offered by many vendors for enterprise support, and managed cloud offerings.

InfinyOn provides enterprise support, as well as a managed cloud offering InfinyOn Cloud

### Self-Healing

Kafka clusters can require an operator to invest in the skills or services for performance tuning, management, and monitoring.

Fluvio clusters come out of the box with internal cluster management with Kubernetes operators.


### Availability and Messaging

| Parameter  | InfinyOn Fluvio  | Apache Kafka  |
| --- | --- | --- |
| Replication  | Yes  | Yes  |
| Multi-tenancy  | Yes via k8 namespaces  | No  |
| Ordering guarantees  | Partition Level  | Partition level  |
| Permanent storage  | Yes  | Yes  |
| Delivery guarantees  | At least once, Exactly once  | At least once, Exactly once  |
| Idempotency  | Yes  | Yes  |
| Geo-Replication (Multi-region)  | Yes - [Mirror topic]({{<relref "iot-mirroring-local" >}})  | Yes  |

### Replication

Kafka and Fluvio replication work by having multiple copies spread over multiple brokers/SPUs for High Availability storage. 

### Multi-tenancy

Kafka doesn’t natively support multi-tenancy, but it can be achieved.

Fluvio supports multi-tenancy through Kubernetes namespaces.

### Ordering guarantees

Both Kafka and Fluvio have partition level ordering guarantees.

### Permanent storage

Both Kafka and Fluvio have durable, reliable storage. Data retention is configured at the topic level.

### Delivery guarantees

Both Kafka and Fluvio support At least once, and Exactly Once.

### Idempotency

Kafka supports idempotent producers, but clients are responsible for retrying transmission.

Fluvio SmartModules can implement idempotent producers and consumers with its deduplication filter.

### Geo-Replication (Multi-region)

Kafka MirrorMaker supports data replication between different Kafka environments

Fluvio topics can be [configured to mirror different Fluvio environments]({{<relref "iot-mirroring-local" >}})

### Features

| Parameter | Infinyon Fluvio | Apache Kafka |
| --- | --- | --- |
| GUI | Yes w/ InfinyOn Cloud | 3rd party |
| Schema Management | No (In development) | No |
| Message Routing | Partial | Yes. Using Kafka connect and KStreams |
| Log Compaction | No | Yes |
| Message Replay, time travel | Yes | Yes |
| Stream enrichment | SmartModules | SQL-based using KStreams |
| Pull retry mechanism | Client responsibility | Client responsibility |


### GUI

Kafka GUIs exist and are supported by 3rd-parties

Fluvio does not have a native GUI. InfinyOn Cloud serves as a GUI for Fluvio 

### Schema Management

Kafka has Schema Registry which is offered by Confluent.

Fluvio does not have schema management yet, but is planned.

### Message routing

Kafka Connect and KStreams can dynamically route events other topics based on data and also branch a single event stream into multiple new topics

Fluvio Connectors with SmartModules can filter, transform or enrich messages to downstream services. Fluvio does not support dynamic routing of messages to other topics.

### Log compaction

Kafka supports log compaction to retain the last known value for each message key for a single topic partition.

Fluvio does not support log compaction

### Message replay

Kafka and Fluvio both support the ability to replay messages by consumers seeking specific offsets

### Stream Enrichment

Kafka Streams and Connect can provide stream enrichment

Fluvio SmartModules provide stream enrichment

### Pull retry mechanism

In both Kafka, and Fluvio, the client is responsible for implementing a retry mechanism based on their needs.

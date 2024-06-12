---
title: "Stateful Services Overview"
menu: "Stateful Services (*preview*)"
description: Stateful Services is an advanced data composition platform that integrates event streaming with sophisticated data processing to automate data operations at scale.
show-page: true
weight: 5
hide-section: true
---

Stateful Services is an advanced **data composition platform** that seamlessly integrates event streaming with stateful processing and enrichment capabilities, empowering organizations to automate data-centric operations at scale. Built in Rust and powered by WebAssembly, Stateful Services engines are small, fast, and versatile, allowing you to write custom logic for data processing in Python, JavaScript, Go, Rust - any language compilable into WebAssembly.

<img src="/docs/images/stateful-services/stateful-services-stack.png" alt="Stateful Services building Blocks"  style="display:block;margin:0 auto;" width="680">


#### Who is this for?

This platform is tailored for developers creating event-driven applications with continuous enrichment. The product streamlines the composition of data pipelines with external sources such as databases, AI/ML models, and Redis caches, producing powerful results for analytics, application, and operational dashboards.

#### Stateful Services vs. Big Data Stream Processing

Diverging from traditional big data frameworks built in Java, like Kafka, Flink, KStream, and Spark, where each component is independently managed, scaled, and built into data pipelines through external Microservices, InfinyOn Stateful Services introduces a unique paradigm. This paradigm empowers users to quickly develop and test individual services on their favorite programming language and seamlessly integrate them into scalable end-to-end data pipelines, streamlining the entire data processing workflow.

#### Stateful Services vs. Legacy Solutions

Automating data operations within legacy technology stacks, spanning message brokers, databases, microservices, and batch jobs, typically demands months of setup and years of experimentation before yielding positive outcomes. InfinyOn Stateful Services frees you from infrastructure intricacies and lets you focus on your core business logic instead.


## Stateful Services Requirements

Stateful Services is an extension to Fluvio, a data streaming runtime that provides a robust communication layer for event streaming services.

In the context of Fluvio, Stateful Services leverages Fluvio topics as their data source and the target output. Fluvio topics serve as the interface with connectors or other services, making it easier to exchange data and facilitate communication between various cluster components.

Provisioning and operating a Stateful Service requires the following system components:

1. [Data Pipeline File] to define the schema, composition, and operations for your Stateful Service.

2. [Fluvio Cluster] to connect Stateful Services with data streaming.

2. [SSDK (Stateful Services Developer Kit)] to build, test, and deploy the Stateful Service. 

In the preview release, a Stateful Service is built and managed locally. When we announce General Availability, it can be provisioned in a cluster and shared via InfinyOn Hub. A Stateful Service published to Hub will be one click away from running in any InfinyOn cluster installation.


## Next Steps

In the [next section], we'll walk through the steps to get started with Stateful Services. 

[Let's Get Started].



[Data Pipeline File]: {{<relref "./data-pipeline-file" >}}
[Fluvio Cluster]: {{<relref "./getting-started#installing-fluvio--start-a-cluster" >}}
[SSDK (Stateful Services Developer Kit)]: {{<relref "./ssdk" >}}
[next section]: {{<relref "./getting-started" >}}
[Let's Get Started]: {{<relref "./getting-started" >}}

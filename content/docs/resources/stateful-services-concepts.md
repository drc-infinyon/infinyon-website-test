---
title: Stateful Services Concepts
weight: 95
---

Fluvio is an implementation of the [Event-Driven Architecture (EDA)], and Stateful Services are an extension of the same paradigm. The following concepts are essential for understanding the architecture:

* [Events](#events)
* [Event Streams & Partitions](#event-streams--partitions)
* [State](#state)
* [Operators](#operators)
* [Windowing](#windowing)
* [Service Chaining (DAG)](#service-chaining-dag)
* [WebAssembly Component Model](#webassembly-component-model)

#### Events

An [event] registers an activity that occurred in the past - an immutable fact. Events can be represented in formats like JSON, Avro, Protobuf, etc. Events can be produced by services such as databases, microservices, sensors, IoT devices, or other physical devices. Events can also be produced by other event streams. Stateful Services use events as triggers that start the chain of operations and generate one or more results. 

Events have the following properties:

* **Key** - the unique identity of an event.
* **Value** - the actual data of the event.
* **Time** - timestamp when the event was produced. 
* **Schema** - defines the structure of the event.

Time is a core system primitive utilized by the window processing operators to order and group events. Schema is also a core primitive that ensures the events comply with specific data formats to provide accurate data extraction for subsequent operations. Schema is designed to support multiple formats: JSON, Avro, Protobuf, etc.


#### Event Streams & Partitions

An [event stream] is an asynchronous unbounded collection of events. Unbounded means never-ending; for example, a temperature sensor generates events continuously. Asynchronous means events arrive at any time rather than fetched periodically from a data store. Event streams are partitioned to process high volumes of data in parallel. 

Stateful Services can apply a shared business logic in parallel across multiple partitions.


#### State

State is an "opinion derived from a fact." In technical terms, [states] are aggregate objects computed on streams of events. For example, counting cars passing an intersection, calculating profits on financial transactions, detecting fraud, etc. States are persistent and can survive restarts, ensuring the results remain accurate and deterministic. States enable users to make decision on accumulated data.

At present, Stateful Services support the following state types:

* **Key-value**
* **Windowing**

The key-value state performs aggregate operations on **unbounded** streams, where a specific key captures the value of a computation. Fluvio offsets management uses `key-value` to store the last value for a client key. The windowing state performs them on **bounded** streams as defined by the window configuration. Check out [Windowing](#windowing) for additional information.


#### Operators

[Operators] are system operations implemented by Fluvio and are available to use in your applications. The operations range from basic operations, such as filter, map, and flat-map, to complex windowing operations, such as group-by, aggregates, etc.

Check out [Operators Section] for additional information.


#### Smartmodules

Smartmodules are custom defined functions that applies domain logic to operators. Your Smartmodules can be programmed in any language that compiles to WebAssembly - Rust, Python, JavaScript, Go, C++, C#, etc. 

Smartmodules can be chained in Services to perform complex stateful operations.


#### Window Processing

Window processing, divides the data streams into bounded sets of records that are then processed in the window context.

Windowing builds table aggregates for many use cases - counting, trend analysis, anomaly detection, data collection for dashboards and tables, materialized views, etc.

For additional information, check out the [window operators] section.


#### Service Chaining (DAG)

Stateful Services use [DAG (Directed Acyclic Graph)] to chain multiple services. The DAG, in essence, represents the logical view of the data flow between operators.

The DAG definition is expressed in YAML format. The Stateful Services Development Kit (ssdk) converts this YAML file into a series of [Compoment Model](#webassembly-component-model) APIs.

*We are also considering a programmatic interface to express the DAG; don't hesitate to contact us if you are interested.*


#### WebAssembly Component Model

Stateful Services uses [WebAssembly Component Model] to combine multiple WebAssembly libraries. The component model requires [WIT], a language-agnostic [IDL], to represent the data model and the functional interfaces.

In the next section, we will describe the components of the service file and the WASM code generated by SSDK.


## Stateful Services Operations


Stateful Services is an extension to Fluvio, a data streaming runtime that provides a robust communication layer for event streaming services.

In the context of Fluvio, Stateful Services leverages Fluvio topics as their data source and the target output. Fluvio topics serve as the interface with connectors or other services, making it easier to exchange data and facilitate communication between various cluster components.

Provisioning and operating a Stateful Service requires the following system components:

1. [Data Pipeline File](#services-file) to define the schema and operations for your Stateful Service.

2. [Fluvio Cluster](#fluvio-cluster) is the underlying infrastructure that supports data streaming and Stateful Streaming management. 

2. [SSDK (Stateful Services Developer Kit)](#ssdk-stateful-services-developer-kit) is a binary toolset designed to assist developers in building, testing, and deploying Stateful Services. 

In the preview release, a Stateful Service is built and managed locally. When we announce General Availability, it can be provisioned in a cluster and shared via InfinyOn Hub. A Stateful Service published to Hub will be one click away from running in any InfinyOn cluster installation.


#### Services File

The services file defines how the service should interact with Fluvio topics, what data transformations or processing should be applied, and any other relevant configuration settings. This YAML file serves as a blueprint for the behavior of your services and it has the following sections:

* **meta, types, function,** and **states** - define the interfaces
* **operations** - defined in each service 

As a general pattern, each operation reads from a topic, computes a function, and passes the result to another function or writes to a topic.

The hierarchy of a services file is as follows:

```yaml
apiVersion: 0.1.0

meta:
  name: <services-name>
  namespace: <services-namespace>
  version: 0.1.0

types:
  <type-name> :
    type: { u32 | u64 | string | ... }
  ...

functions:
  <function-name>:
    type: { filter | filter-map | ... }
    inputs: ...
    output: ...
  ...

states:
  <state-name>:
    type: <type-name>
    interfaces:
      <interface-name>: ...
      ...
  ...

operations:
  <operation-name>:
    state:
      <state-name>:
        - <interface-name>
        - ...
      ...
    source:
      <topic-name>: ...
      ...
    steps:
      - operator: { filter | filter-map | ... }
        uses: <function-name>
        ...
      ...
    sink:
      <topic-name>: ...
      ...
  ...

```

The sections are defined as follows:

* **meta** - stores the metadata definition of a Stateful Service, such as the name and version number. The name and version form the unique identifier for this service.
* **types** - defines the schema for the records and the states.
* **functions** - defines the interfaces of the functions used in operations.
* **states** - defines the type and the interfaces for each state object used in operations.
* **operations** - is a group of steps each operation has the following section:
  * **state** - defines the state objects and the interfaces in current operators.
  * **source** - defines the source topics in current operators.
  * **sink** - defines the target topics in current operators.
  * **steps**  - defines each named operator and its corresponding function and parameters.

 Use the `steps` to sequence operations and `internal topics` to link them. You may think of an `internal topic` as an inter-service message bus. 

 Topics are accessible to multiple Stateful Services, which makes the service composition flexible. You may define the complete data streaming application in one service file or decompose it in multiple files and use topics to link them.

For additional information, check out the [Data Pipeline File] section.


#### Fluvio Cluster 

The Fluvio Cluster is responsible for managing and packaging all the necessary resources required to run Stateful Services. This includes creating and managing topics that serve as the source and sink of data for your Stateful Service to interact with. The cluser also ensures the availability, scalability, and reliability of your data streams.

Create an account on InfinyOn Cloud, and provision a Fluvio cluster:

1. Download FVM which also installs fluvio CLI:

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

This command will download the Fluvio Version Manager (fvm), Fluvio CLI (fluvio) and config files into `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`. To complete the installation, you will need to add the executables to your shell `$PATH`.

2. Sign-up for [a free InfinyOn Cloud account]

3. Login from the CLI, and provision a Fluvio cluster:

```bash
$ fluvio cloud login
$ fluvio cloud cluster create
```

Check out [Getting Started] section for additional informmation.


#### SSDK (Stateful Services Developer Kit)

SSDK is a binary toolset designed to assist developers in building, testing, and deploying Stateful Services. It ensures the services can be created and integrated efficiently into the Fluvio ecosystem. The SSDK binary is part of the fluvio client package.

SSDK takes a services file and generates a project of one or more WASM components. 

```bash
$ ssdk generate
```

The tool also offers a runtime environment, which starts the WASM components, links them with a local cluster, and enables an interactive shell for testing and troubleshooting. 

```bash
$ ssdk run
>> 
```

For additional information, check out the [SSDK] section.


### Next Steps
* [Getting Started]



[Event-Driven Architecture (EDA)]: https://en.wikipedia.org/wiki/Event-driven_architecture
[event]: https://en.wikipedia.org/wiki/Event_(computing)
[event stream]: https://en.wikipedia.org/wiki/Stream_(computing)
[states]: https://en.wikipedia.org/wiki/State_(computer_science)
[Operators]: https://en.wikipedia.org/wiki/Operator_(computer_programming)
[Partitions]: https://en.wikipedia.org/wiki/Partition_(database)
[Named Operators]: {{<relref "/docs/stateful-services/operators" >}}
[filter]: {{<relref "/docs/stateful-services/operators#filter" >}}
[map]: {{<relref "/docs/stateful-services/operators#map" >}}
[filter-map]: {{<relref "/docs/stateful-services/operators#filtermap" >}}
[array-map]: {{<relref "/docs/stateful-services/operators#arraymap" >}}
[aggregate]: {{<relref "/docs/stateful-services/operators#aggregate" >}}
[group-by]:  {{<relref "/docs/stateful-services/operators#group-by" >}}
[window]:  {{<relref "/docs/stateful-services/operators#window" >}}
[window operators]:  {{<relref "/docs/stateful-services/operators#window-operators" >}}
[operation]:  {{<relref "/docs/stateful-services/operators#operation" >}}
[update-state]:  {{<relref "/docs/stateful-services/operators#update-state" >}}
[DAG (Directed Acyclic Graph)]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[DAG]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[WebAssembly Component Model]: https://component-model.bytecodealliance.org/
[WIT]: https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md
[IDL]: https://en.wikipedia.org/wiki/Interface_description_language
[Data Pipeline File]: {{<relref "/docs/stateful-services/data-pipeline-file" >}}
[a free InfinyOn Cloud account]: https://infinyon.cloud/signup?utm_campaign=ss-preview&utm_source=website&utm_medium=ss-overview
[SSDK]: {{<relref "/docs/stateful-services/ssdk" >}}
[Getting Started]: {{<relref "/docs/stateful-services/getting-started" >}}
---
title: Data Pipeline File
description: Stateful Streaming Services file definition and examples.
weight: 50
---

The `data pipeline file` defines the composition between services, data streams, and state objects. It describes the end-to-end application [DAG], including the source and sink topics, data types, user-defined smartmodules, stateful windows, and aggregate. 

Services communicate with each other via topics, hence the service composition is defined by the topics they consume and produce.

## Data Pipeline Template

The data pipeline file is defined in YAML and has the following top level sections:

```yaml
apiVersion: ...

meta: 
  name: ...
  version: ...
  namespace: ...

config:
  converter: ...
  consumer: ...

types:
  <type> : ...
  ...

topics:
  <topic>: ...
  ...

services:
  <service>:
    sources: ...
    transforms:
      window: ...
      states: ...
      steps:
        <operator>: ...
        ...
      flush: ...
    sinks: ...
  ...
```

Where the sections are:

* **apiVersion** - the engine version compatible with this data pipeline file.
* **[config](#config)** - the configuration paramters.
* **[meta](#meta)** - the service metadata.
* **[types](#types)** - the schema definition.
* **[topics](#topics)** - the data streaming topic names.
* **[services](#services)** - the application composition definitions.
  * **[operators](#operators)** - the system pre-defined operators.
  * **[inline functions](#inline-functions)** - the business logic definition.
  * **[states](#states)** - the state object interface definitions.

### `meta`

Meta, short for metadata, holds the stateful service properties, such as name & version. 

```yaml
meta:
  name: string
  namespace: string
  version: semver
```

Where:
* **name** - is the name of the data pipeline.
* **namespace** - is the unique namespace where the data pipeline is deployed.

The tuple `namespace:name` becomes the [WASM Component Model] package name.


### `config`

Config, short for configurations, holds the service default settings.

```yaml
config:
  converter: raw, json
  consumer:
    default_starting_offset:
      value: u64
      position: start, end
```

The `convert` configuration currently suports only `raw` and `json` formats, with additional types to be implemented as required. This is used to set the default serialization/deserialization method. The configuration can be overwritten in each individual topic topic configuration.

The consumer default starting offset can begin reading from a specific value from the `start` or `end` of the data stream. 

For example:

```yaml
config:
  converter: json
  consumer:
    default_starting_offset:
      value: 0
      position: end
```

The consumer starts reading from the end of the data stream and parses the records as JSON.

### `types`

The types section defines the schema of the object used in the data pipeline. The primitive types are as follows:

```bash
 null
 bool
 u8 | u16 | u32 | u64
 i8 | i16 | i32 | i64 
 f32 | f64
 string
 enum
 key-value
 list
 object
```

These primitives allow you to create custom types. For example, you may define `user`, `job`, and `roles`  as follows:

```yaml
types:
  user:
    type: object
    properties:
      name:
        type: string
      age:
        type: u8
  job:
    type: object
    properties:
      name: 
        type: string
      role: 
        type: string
  roles:
    type: list
    items:
      type: key-value
      properties:
        key:
          type: string
        value:
          type: u32
```

Types define the data formats for topics, states, and smartmodules.


### `topics`

**Topics** represent the internal and external communication layer for the services. When the Stateful Service is first initialized, the engine provisions all undefined topics before it starts the services.

For example a list of topics can we defined as follows:

```yaml
topics:
  cars-topic:
    schema:
      value:
        type: Car
        converter: json
  car-events-topic:
    schema:
      value:
        type: CarEvent
        coverter: json
```

The definitions is a list of topic names and their schema. The topics also have an optional `converter` if different from the converter in the configuration section.


### `services`

Services define the data pipeline composition, operations, states, and topics consumed and produced. Each service has a name and several sub-sections. For example a simple service would be defined as follows:

```yaml 
  my-service:
    sources: 
      - type: topic
        id: my-source-topic

    transforms:
      steps:
        - operator: map     
          run: |
            fn to_uppercase(input: String) -> Result<String, String> {
              Ok(input.to_uppercase())
            }

    sinks:
      - type: topic
       id: my-sink-topic
```

In this example, the service `my-service` consumes the topic `my-source-topic`, transforms each record to uppercase, and writes the output to the topic `my-sink-topic`.

Services may be chained via topics, for example:

```yaml
# fields omitted for simplicity
services:
  service-1:
    sources: 
      - id: topic-1
    sinks:
      - id: topic-2

  service-2:
    sources: 
      - id: topic-2
    sinks:
      - id: topic-3
```

Services with different business logic may also consume from the same topic or produce to the same topic.

Services  may also have multiple sources and sinks, and they could have multiple transform steps to manipulate the data and turn it into the desired type. For example:

```yaml
# fields omitted for simplicity
services:
  service-1:
    sources: 
      - id: topic-1
        steps:
          - operator: filter
            run: |
              fn filter_fn(input: String) -> Result<bool, String> {
                Ok(input.len() > 5)
              }
      - id: topic-2
        steps:
          - operator: map
            run: |
              fn map_fn(input: String) -> Result<String, String> {
                Ok(input.to_uppercase())
    sinks:
      - id: topic-3
      - id: topic-4
        steps:
          - operator: filter
            run: |
              fn filter_fn(input: String) -> Result<bool, String> {
                Ok(input.starts_with("A"))
                }
```


### `operators`

**Operators** are pre-defined functions that can safely open the system for transformations. The operators have opinionated function signatures but flexible types. Some operators may be used independently, whereas others must be chained to accomplish the task.

The system exposes the following operators:

* **filter**
* **map**
* **filter-map**
* **flat-map**
* **assign-timestamp**
* **assign-key**
* **update-state**
* **flush**

Operators are defined in detail in the [Operators Section].


### `inline-functions`

**Inline Functions** is where you may define your custom logic. These inline functions are suitable for simple `hello world` transformations. In subsequent releases, we'll introduce external imports where you can express complex tranformations.

Inline functions are defined inside operators as follows:

```yaml
- operator: filter
  run: |
    fn user_filter_fn(user: User) -> Result<bool, String> {
        if user.age < 5 {
          Ok(false)
        } else {
          Ok(true)
        }
    }
```

In this example, we define a function named `user_filter_fn` with input `user` and output `bool` that performs a `filter` operation to remove users under the age of 5.

For additional examples checkout [Stateful Services Examples] in github.


### `states`

**States** are aggregate objects that accumulate data from the event streams. The state objects are defined by the users and maintained by the system. The system ensures the states object is durable and survives restarts.

States follow the [CQRS architecture], where each state has one writer and multiple readers. 

##### State writer (command)

The states are defined inside the `transforms` block of a services as follows:

```yaml
car-colors-counter-service:
  transforms:

    states:
      car-color-state:
        type: key-value
        properties:
          key:
            type: string
          value:
            type: u32
    
    steps:
      ...
    ...
```

The states are `key-value` objects where the key and value can be arbitrary types. In this example, `key` is the car color and `value` is the number of cars of each color. The state object is updated by one of the functions the `steps`.

##### State reader (query)

The state can be read from any other service the pipeline. To read the state it need to be referenced first:

```yaml
cars-prediction-service:
  transforms:

  states:
    car-color-state: 
      from: bcar-colors-counter-service.car-color-state
      
  steps:
    ...
```

The `car-color-state` is now usable in any of the steps of the `cars-prediction-service`.


### References
* [Operators]
* [SSDK]


[DAG]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[WASM Component Model]: https://component-model.bytecodealliance.org/
[Getting Started]: {{<relref "./getting-started" >}}
[Operators Section]: {{<relref "./operators" >}}
[Operators]: {{<relref "./operators" >}}
[SSDK]: {{<relref "./ssdk" >}}
[Stateful Services Examples]: https://github.com/infinyon/stateful-services-examples
[CQRS architecture]: https://en.wikipedia.org/wiki/Command_Query_Responsibility_Segregation

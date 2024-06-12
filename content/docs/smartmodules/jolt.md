---
title: Jolt
weight: 20
---

Jolt provides JSON to JSON transformation

This is a [map-type]({{<ref "/docs/resources/smartmodule-operator-reference.md#map">}}) SmartModule that transforms JSON records leveraging [Fluvio Jolt](https://github.com/infinyon/fluvio-jolt) library, which has its own DSL (Domain Specific Language) to remove the need for coding simple transformations.

The transformations in **Jolt** are a set of operations that are sequentially performed over incoming records.

-> Jolt only works on JSON text records.

There are three main types of operations:
* **Shift** - move the field from one location to another
* **Default** - specify a default value for the field, if not present
* **Remove** - delete the field from the object

There can be a mix and match of transformations applied at the same time. Let's see below:

#### Specification example
```json
[
    {
      "operation": "remove", // remove field $.id from incoming JSON object
      "spec": {
        "id": ""
      }
    },
    {
      "operation": "shift", // move everything inside $.data
      "spec": {
        "*": "data.&0",
      }
    },
    {
      "operation": "default", // if $.data.source does not exist, add it with value "http-connector"
      "spec": {
        "data": {
            "source": "http-connector"
        }
      }
    }
]
```

The Jolt SmartModule applies the operations in sequence: `remove` followed by `shift` followed by `default`.

### Usage example

First, we need to download it to our cluster:

%copy first-line%
```shell
$ fluvio hub sm download infinyon/jolt@0.1.0
```

Second, we create a file `transform.yaml` with transformation specification defined above:

%copy%
```yaml
# transform.yaml
transforms:
  - uses: infinyon/jolt@0.1.0
    with:
      spec:
        - operation: remove
          spec:
            id: ""
        - operation: shift
          spec:
            "*": "data.&0"
        - operation: default
          spec:
            data:
              source: "http-connector"
```

We'll use 2 terminals. One each for producer and consumer for our topic `jolt-topic`.

Create the topic `jolt-topic`. Pick either terminal to run this in.

%copy first-line%
```shell
$ fluvio topic create jolt-topic 
topic "jolt-topic" created
```

Next, in one terminal we start our producer. It will use `transform.yaml` to modify data before sending it to `jolt-topic`.

In the other terminal, and before we send data through the producer, start our consumer session.

%copy first-line%
```shell
$ fluvio produce --transforms-file ./transform.yaml jolt-topic
> {}
Ok!
> {"id":1, "name": "John Smith", "account": "1111" }
Ok!
> {"id":1, "name": "John Smith", "account": "1111", "type": "custom" }
Ok!
> {"id":1, "name": "John Smith", "source":"mqtt-connector" }
```

In the consumer terminal, we see the results of the transformation by Jolt SmartModule.

%copy first-line%
```shell
$ fluvio consume jolt-topic
Consuming records from 'jolt-topic'
{"data":{"source":"http-connector"}}
{"data":{"account":"1111","name":"John Smith","source":"http-connector"}}
{"data":{"account":"1111","name":"John Smith","source":"http-connector","type":"custom"}}
{"data":{"name":"John Smith","source":"mqtt-connector"}}
⠒
```
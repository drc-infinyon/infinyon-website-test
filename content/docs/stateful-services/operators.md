---
title: Operator Definitions
menu: Operators
description: Stateful Services operators definition.
weight: 70
---

Operators are primitive APIs that enable developers to customize their data. There are two types of operators:

#### **[Basic Operators](#basic-operators)**

* [filter](#filter)
* [map](#map)
* [filter-map](#map)
* [flat-map](#flat-map)

#### **[Window Operators](#window-operators)**

* [assign-timestamp](#assign-timestamp)
* [assign-key](#assign-key)
* [update-state](#update-state)
* [flush](#flush)
  * [aggregate](#aggregate)

#### **[State Operators](#state-operators)**

Checkout [States section] for additional information.

## Basic Operators

Basic operators may look familiar, as they were previously defined in SmartModules. These operators perform simple operations and may be used independently or chained in composite operations.


### `filter`

The filter operator takes a record and returns a boolean value. The return value tells the system to drop or pass the record to the next operator:
  
  * `true` - pass the record to the next operator.
  * `false` - drop the record.

An inline `filter` operator is defined as follows:

%copy%
```yaml
- operator: filter
  run: |
    fn only_errors(log: LogRecord) -> Result<bool, String> {
      match log.level {
        "ERROR" => Ok(true),
        _ => Ok(false)
    }
```

In this example, the operator filters out all records with a level other than ERROR.


### `map`

The map operator takes an input record, applies a transformation, and then forwards the modified record to the next operator.

An inline `map` operator is defined as follows:

%copy%
```yaml
- operator: map     
  run: |
    fn sentence_to_uppercase(input: String) -> Result<String, String> {
      Ok(input.to_uppercase())
    }
```

In this example, the operator transforms each string to uppercase.


### `filter-map`

The filter-map operator combines a filter and a map operation; it takes a record and returns a mapped record or none. The return value tells the system to pass the records it receives to the next operator:
  
  * `Some(Record)` - pass the record to the next operator.
  * `None` - do nothing.

An inline `filter-map` operator is defined as follows:

%copy%
```yaml
- operator: filter-map
  run: |
    fn long_sentence_to_uppercase(input: String) -> Result<Option<String>, String> {
      if input.len() > 10 {
        Ok(Some(input.to_uppercase()))
      } else {
        Ok(None)
      }
    }
```

In this example, the operator transforms sentences longer than 10 characters to uppercase.


### `flat-map`

The flat-map operator splits records into an array of records and then forwards each record to the next operator.

An inline `flat-map` operator is defined as follows:

%copy%
```yaml
- operator: flat-map
  run: |
    fn split_sentence(sentence: String) -> Result<Vec<String>, String> {
      Ok(sentence.split_whitespace().map(String::from).collect())
    }
```

In this example, the operator splits sentences into words.


## Window Operators

Window operators address a well-defined stream processing problem described in depth by the ["The Dataflow Model"] whitepaper. A window operation turns data streaming records into a group of finite records, also known as bounded context, defined by the window size computed by a watermark operation. Fluvio performs a window processing operation by chaining multiple operators to assign timestamps, group them by key, and apply custom operations. 

While there are several types of windows, and Fluvio will eventually implement all of them, this preview will focus on two: [tumbling window](#tumbling-window) and [sliding window](#sliding-window).

**Tumbling windows** are equal-sized, continuous and `non-overlapping` windows. Each record is present in exaclty one window.

<img src="/docs/images/stateful-services/ss-tumbling-window.svg" alt="Tumbling Windows"  style="display:block;margin:0 auto;" width="600">

**Sliding windows** are equal-sized, continuous and `overlapping` windows. Each record may be present in one or more window.

<img src="/docs/images/stateful-services/ss-sliding-window.svg" alt="Sliding Windows"  style="display:block;margin:0 auto;" width="600">

<br />

~> **Sliding windows** is in development targetted for the next release.

For example, you would configure a tumbling window with a 10-second size as follows:

%copy%
```yaml
transforms:
  window:
    tumbling:
      duration: 10s
```

Window processing operation is a configuration setting rather than an operator. 


### `assign-timestamp`

The assign-timestamp operator lets you choose a timestamp for the watermark. Watermark maps records to windows and controls when the window will flush.

The following example shows how to update the timestamp from the record metadata:

%copy%
```yaml
- operator: assign-timestamp
  run: |
    fn assign_timestamp(user_event: UserEvent, event_time: i64) -> Result<i64, String> {
      Ok(event_time)
    }
```

Assuming the user_event record has a `timestamp` field, the following example shows how to update the timestamp from the record value:

%copy%
```yaml
- operator: assign-timestamp
  run: |
    fn assign_timestamp(user_event: UserEvent, event_time: i64) -> Result<i64, String> {
      Ok(user_event.timestamp)
    }
```

The `assign_timestamp` operation is mandatory in window processing, as it helps assign records to specific windows.


### `assign-key`

The assign-key operation takes streams of records and assigns them a key. Records assigned to the same key are processed together.

<img src="/docs/images/stateful-services/ss-assign-key.svg" alt="Window assign-key operation"  style="display:block;margin:0 auto;" width="600">

The following example shows how to use assign-key operator to group cars by their color:

```yaml
- operator: assign-key
  run: |
    fn key_by_color(car: Car) -> Result<String, String> {
      Ok(car.color)
    }
```

While the assign-key operator can partition any data stream, it is most useful in window processing operations.


### `update-state`

The update-state operation takes a record and updates a state object. When used in a window operation, the system automatically retrieves the state value that matches the record key.

<img src="/docs/images/stateful-services/ss-aggregate-op.svg" alt="Window aggregate operation"  style="display:block;margin:0 auto;" width="600">

The following example shows how to use update-state to count cars:

```yaml
types:
  car:
    type: object
    properties:
      color:
        type: string
      count:
        type: u32

transforms:
  states:
    car-count:
      type: key-value
      properties:
        key:
          type: string
        value:
          type: u32

  - operator: process
    run: |
      fn count_cars(_car: Car) -> Result<(), String> {
        car_count().increment(1);
        Ok(())
      }
```

The `update-state` operator retrieves the state object `car_count()` and increments its value by one.

### `flush`

The flush section sits in parallel with the transforms section in a window operation. This section informs the system watermark where to send the state content when the window closes. The flush operator works in tandem with the [`aggregate`](#aggregate) operator to compute the result.

#### `aggregate`

The `aggregate` operator takes the full content of a window and performs the final computation before sending the result to the sink. The following example shows how to apply an aggregate function to sort the cars by color:


```yaml
types:
  car:
    type: object
    properties:
      color:
        type: string
      count:
        type: u32
  cars:
    type: list
    items:
      type: car

transforms:
  states:
    car-count:
      type: key-value
      properties:
        key:
          type: string
        value:
          type: u32

flush:
  operator: aggregate
  run: |
    fn sort_by_color(car_count: CarCount) -> Result<Cars, String> {
      let mut kv = car_count;
      kv.sort_by(|a, b| a.value.cmp(&b.value));
      kv.reverse();
      Ok(kv.iter().map( | entry | Car{ word: entry.key.clone(), count: entry.value }).collect())
    }
```

The `aggregate` operator reads all `car-count` key/value partitions, sorts them by value, and returns a list of cars sorted from highest to lowest.


### References
* [Data Pipeline File]


["The Dataflow Model"]: https://storage.googleapis.com/pub-tools-public-publication-data/pdf/43864.pdf
[Data Pipeline File]: {{<relref "./data-pipeline-file" >}}
[States section]: ../states
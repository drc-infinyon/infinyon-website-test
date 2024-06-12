---
title: "SmartModule Operators"
weight: 91
---

## Filter

The simplest type of SmartModule is a filter, which can examine each record in a stream and decide whether to accept or reject it. All accepted records are delivered down the pipeline, and rejected records are discarded. SmartModule applied in consumers or sink connectors filter records after they are stored in a topic, and will not impact persistence - it simply means that records filtered out are not delivered to the consumer. However, SmartModule filters applied to source connectors discard packets before they are stored in the topic and should be used with care. 

<img src="/docs/images/smartmodules/smartmodule-filter.svg" alt="SmartModule Filter" style="display:block;margin:0 auto;" width="600">

## Map

SmartModule Maps are used to transform or edit each Record in a stream. We say that these SmartModules "map" each input record into a new output record by applying a function to the input data. This type of SmartModule may be used for many use-cases, such as:

- Narrowing large records into a smaller subset of important fields
- Scrubbing sensitive fields of data to be invisible to downstream consumers
- Computing rich, derived fields from simple raw data

<img src="/docs/images/smartmodules/smartmodule-map.svg" alt="SmartModule Map" style="display:block;margin:0 auto;" width="600">

## FilterMap

SmartModule FilterMaps are used to both transform _and_ potentially filter records from a stream at the same time. This can be useful for a number of
scenarios including working with data with nullable fields, or working with subsets of event data. In these cases, FilterMap allows us discard irrelevant data - such as records with null fields or event types that we don't care about - while also performing meaningful work with relevant data - such as reformatting fields we've extracted or events we've gathered.

FilterMap functions work by returning an `Option` of a new record. To discard a record from the stream, return `None`. Otherwise, transform
the record according to your needs and return it as `Some(record)`.

<img src="/docs/images/smartmodules/smartmodule-filtermap.svg" alt="SmartModule FilterMap"  style="display:block;margin:0 auto;" width="600">

## ArrayMap

SmartModule ArrayMaps are used to break apart Records into smaller pieces. This can be very useful for working with your data at a fine granularity. Often, each record in a Topic may actually represent many data points, but we'd like to be able to analyze and manipulate those data points independently. ArrayMap allows us to dig in and break apart these composite records into the smaller units of data that we want to work with.

<img src="/docs/images/smartmodules/smartmodule-arraymap.svg" alt="SmartModule ArrayMap"  style="display:block;margin:0 auto;" width="600">

## Aggregate

SmartModule Aggregates are functions that define how to combine each record
in a stream with some accumulated value. In the functional programming world,
this type of operation is also known as `folding`, since the function "folds"
each new value into the accumulator.

<img src="/docs/images/smartmodules/smartmodule-aggregate.svg" alt="SmartModule Aggregate"  style="display:block;margin:0 auto;" width="600">

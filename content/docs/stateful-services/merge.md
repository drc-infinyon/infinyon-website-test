---
title: Merge
menu: Merge Events
description: Stateful Services merge feature.
weight: 90
---

Services can merge the events from multiple topics. The merge behavior is defined in the `sources` section of the service definition. The only requirement is that the the output of each source must be of the same type.

When merging topics with different data types, use transformations to bring them to a common schema.

The following example shows how to merge data from two topics:

```yaml
..
types:
  my-body:
    type: object
    properties:
      text:
        type: string
topics:
  topic-1:
    schema:
      value:
        type: my-body
        converter: json
  topic-2:
    schema:
      value:
        type: string
        converter: raw
services:
  my-service:
    sources:
      - id: topic-1
        type: topic
      - id: topic-2
        type: topic
        steps:
          - operator: map
            run: |
              fn to_common_schema(input: String) -> Result<MyBody, String> {
                Ok(MyBody{
                    text: input
                })
              }
    steps:
      ..
```

In this example, `my-service` merges data from `topic-1` and `topic-2`. The `topic-2` source has a transform step that converts the data to the common schema `my-body`. The `topic-1` source does not need a transform step because the schema is already `my-body`.

The `my-service` can then process the merged data as if it were a single topic.
---
title: Split
menu: Split Events
description: Stateful Services split feature.
weight: 90
---

Services can split events data into multiple topics. The split behavior is defined in the sinks section of the service definition. Similar to merge, the split operation can transform the event to match a target topic schema.

The following example shows how to split data into two topics:

```yaml
..
types:
  person:
    type: object
    properties:
      name:
        type: string
      age: 
        type: i32
topics:
  topic-kid:
    schema:
      value:
        type: person
  topic-adult:
    schema:
      value:
        type: person
services:
  my-service:
    sources:
      ..
    steps:
      ..
    sinks:
        - id: topic-kid
          type: topic
          steps:
            - operator: filter
              run: |
                fn is_kid(person: Person) -> Result<bool, String> {
                    Ok(person.age < 18)
                }
        - id: topic-adult
          type: topic
          steps:
            - operator: filter
              run: |
                fn is_adult(person: Person) -> Result<bool, String> {
                    Ok(person.age >= 18)
                }
```

In this example, `my-service` splits the data into `topic-kid` and `topic-adult`. The `topic-kid` sink has a transform step that filters the data to only include records where the age is less than 18. The `topic-adult` sink has a transform step that filters the data to only include records where the age is greater than or equal to 18.

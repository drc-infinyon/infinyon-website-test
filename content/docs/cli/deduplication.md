---
title: Record Deduplication
---

Fluvio's `Deduplication` feature allows for the removal of duplicate records based on their keys, streamlining your data processing.

To utilize deduplication, enable it on a desired topic. Duplicates are identified and dropped within a specified window, governed by the `bounds` configuration.

The available `bounds` options are `age` and `count`, elaborated in the [bounds section](#bounds).

## Behavior

The deduplication process is deterministic and maintains its state across restarts. Upon a restart, the deduplication algorithm traverses the data stream, reconstructing the memory object accordingly.

## Example topic config

Example configuration on topic:

%copy%
```yaml
# topic.yaml
version: 0.1.0
meta:
  name: topic-with-dedup
deduplication:
  bounds:
    count: 5 # remember at least 5 last records
    age: 5s # remember records for at least 5 seconds
  filter:
    transform:
      uses: infinyon-labs/dedup-filter@0.0.2 
```
A topic can be created using this config file like so:

%copy first-line%
```bash
$ fluvio topic create -c topic.yaml
```

After creating the topic, it can be tested like so:

%copy first-line%
```bash
$ fluvio produce topic-with-dedup --key-separator :
1:2
1:2
2:5
```

%copy first-line%
```bash
$ fluvio consume -B topic-with-dedup
2
5
```

## Bounds

| Parameter       | default | type   | optional | description                                           |
|:-------------|:--------| :---   | :---   |:------------------------------------------------------|
| count |    -    | Integer | false | Base number of records the filter keeps in mind. It doesn't ensure remembering records from `count` records ago, but it sets a starting point. |
| age   |    -    | Integer | true  | The basic time length the filter holds onto a record. You can set it like this: `15days 2min 2s`, or `2min 5s`, or `15ms` to specify the duration. |

## Implementation

The deduplication task is managed by a SmartModule, and as of now, the `dedup-filter` is the designated SmartModule for this task.

The `dedup-filter` takes the data and divides it into smaller chunks, holding these chunks in memory. Each chunk is tagged with an age, indicating how old it is.

There's a limit to the total number of records the memory can hold, set by `bounds.count`. When this count is reached, `dedup-filter` looks at the oldest chunk, checks its age against the `bounds.age` setting, and if it's old enough, it's removed. This setup allows for quick removal of old data with a minimal amount of tracking.

The approach of breaking down data into chunks does use a bit more memory, but it ensures that the filter operates smoothly, without any sudden increases in the time or memory needed.
---
title: "New Jolt Capabilities on Fluvio and How To Use Them"
author:
    name: "Ozgur Akkurt"
    github: "ozgrakkurt"
description: "New capabilities of the jolt smartmodule and how to use them."
date: 2023-06-09
metadata:
    - TECH
    - JSON
slug: 
url: /blog/2023/06/new-jolt
img: blog/images/jolt-capabilities-in-fluvio.png
twitter-card: summary_large_image
show-header-img: false
---

JSON is ubiquitous in applications that need data and transforming data is very useful in almost every data pipeline.
So the capability to transform JSON is nice to have when building data pipelines. We though about this before and developed `fluvio-jolt`
which makes it easy to define and execute JSON-to-JSON mappings. It is based on the [original java library](https://github.com/bazaarvoice/jolt).
. Our use cases for `fluvio-jolt` have grown since, so we added more capabilities to it.

This blog explains these new capabilities, how they were implemented and how they can be used to map JSON in fluvio.

Let's get started.

## What is Jolt

Jolt is a library developed in [java](https://github.com/bazaarvoice/jolt) to map JSON-to-JSON. It lets the user define specifications in `JSON`, which describe how to map data from `JSON` to `JSON`. Jolt is capable of performing several operations, namely:
- shift
- default
- remove
- cardinality
- sort

We focus on the `shift` operation since it is the one that does most of the work. `shift` operation consists of matching the input keys, and
outputting the keys and values. `shift` matches the input keys based on the keys of the spec.

So if you had this input:

%copy%
```json
{
  "id": 1,
  "name": "John Smith",
  "account": {
    "id": 1000,
    "type": "Checking"
  }
}
```

And you defined this spec:

%copy%
```json
[
  {
    "operation": "shift",
    "spec": {
      "id": "__data.id",
      "name": "__data.name",
      "account": "__data.account"
    }
  }
]
```

It would produce this output:

%copy%
```json
{
  "__data": {
    "id": 1,
    "name": "John Smith",
    "account": {
      "id": 1000,
      "type": "Checking"
    }
  }
}
```

This example already worked on the older versions of `fluvio-jolt` so let's move on to the new features.

## What is new?

Previously `fluvio-jolt` didn't have the capability to use `@` and `$` wilcards. Also it didn't have the capability to process arrays fluently.
In the latest changes we implemented missing wildcards and added capability to process arrays. Although this seemed like a easy change, it proved
to require big changes in the implementation.

- First we needed do define what we wanted to implement, since the original implementation didn't have a spec, so we created [a simple description](https://github.com/infinyon/fluvio-jolt/blob/main/SPEC.md)
- Then we implemented a parser that parses the expressions into an abstract syntax tree and an interpreter that interprets this ast.
- And for the last step, we used the parser to parse the keys and values in the jolt spec. We used the interpreter to traverse the spec and the input in order to produce an output.

So now the user can execute this spec:

%copy%
```json
{
  "items": {
    "*": {
      "@(guid.value)": "data[&(1)].guid",
      "*": {
        "$": "data[&(2)].keys[]"
      }
    }
  }
}
```

Given this input:

%copy%
```json
{
  "description": "top description",
  "items": [
    {
      "description": "inner description 1",
      "guid": {
        "permalink": true,
        "value": "https://example.com/link1-1"
      },
      "link": "https://example.com/link1",
      "pub_date": "Tue, 18 Apr 2023 14:59:04 GMT",
      "title": "Title 1"
    },
    {
      "description": "inner description 2",
      "guid": {
        "permalink": true,
        "value": "https://example.com/link2-1"
      },
      "link": "https://example.com/link2",
      "pub_date": "Tue, 19 Apr 2023 14:20:04 GMT",
      "title": "Title 2"
    }
  ],
  "last_build_date": "Tue, 18 Apr 2023 15:00:01 GMT",
  "link": "https://example.com/top-link",
  "namespaces": {
    "blogChannel": "http://example.com/blogChannelModule"
  },
  "title": "Blog-Recent Entries"
}
```

It gives this output:

%copy%
```json
{
  "data": [
    {
      "guid": "https://example.com/link1-1",
      "keys": [
        "description",
        "guid",
        "link",
        "pub_date",
        "title"
      ]
    },
    {
      "guid": "https://example.com/link2-1",
      "keys": [
        "description",
        "guid",
        "link",
        "pub_date",
        "title"
      ]
    }
  ]
}
```

Lets go over how it works:
- The `items` in the spec matches the `items` key in the input.
- The `*` in the spec matches every array element.
- `@(guid.value)` indexes into the array element using `guid.value` expression which means go into `guid` key and then go into `value` key. 
- It outputs the result to `data[&(1)].guid` which means go into data field of the output and go into `&(1)`th index of it and then output to the `guid` field.
Please note that it is inferred that the output is an object, and it should have a `data` key, and the value of `data` should be an array from this expression.
- Then the inner `*` in the spec matches every key in the input object.
- `$` means output the matched key.
- `data[&(2)].keys[]` means output should be an object, it should have `data` key which has a array value, and that array has a `keys` field which is an array. It pushes the matched key to this array.

More resources:
- See [fluvio-jolt repository](https://github.com/infinyon/fluvio-jolt/blob/main/README.md) for more usage examples and documentation.
- For more usage examples, see [test cases](https://github.com/infinyon/fluvio-jolt/tree/main/tests/java/resources/shift). 

## SmartModule Example

Here we define a transform that implements the same transformation we defined in json format in the `What is new?` section.

```yaml
transforms:
 - uses: infinyon/jolt@0.3.0
   with:
     spec:
        operation: shift
        spec:
          items:
            "*":
              "@(guid.value)": data[&(1)].guid
              "*":
                "$": data[&(2)].keys[]
```

## How to use the new jolt capabilities?

We already deployed a new version of jolt smartmodule (`0.3.0`). So these new capabilites are available on infinyon cloud, users just need to use the newer versions of the smartmodule.

We also published a new version of the rust crate on [crates.io](https://crates.io/crates/fluvio-jolt).

Source code of the project can be found at [the fluvio-jolt repo](https://github.com/infinyon/fluvio-jolt).

## What is next?

We are looking into adding even more capabilities into Jolt and expanding data transformation capabilities of fluvio beyond JSON.

---

[Fluvio]: https://www.fluvio.io/
[Fluvio CLI]: https://www.fluvio.io/download
[InfinyOn Cloud]: https://infinyon.cloud/signup
[connectors]: https://www.fluvio.io/connectors/
[smartmodules]: https://www.fluvio.io/smartmodules/
[http-source]: https://www.fluvio.io/connectors/inbound/http/
[WebAssembly]: https://webassembly.org/
[Smartmodule Hub]: https://infinyon.cloud/hub
[Smartmodule Development Kit (smdk)]:https://www.fluvio.io/smartmodules/smdk/overview/
[Hub]: https://infinyon.cloud/hub
[DSL]: https://en.wikipedia.org/wiki/Domain-specific_language
[Incoming Webhooks]: https://api.slack.com/messaging/webhooks
[Discord Webhooks]: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
[Access Tokens]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
[github]: https://github.com/infinyon/labs-stars-forks-changes-sm

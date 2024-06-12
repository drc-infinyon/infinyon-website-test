---
title: "Masking PII with Stateful Service Composition"
author:
    name: "Deb RoyChowdhury"
    github: "drc-infinyon"
description: "Masking PII with Stateful Service Composition"
date: 2024-04-09
metadata: 
slug: mask-pii-composition
url: /blog/2024/04/mask-pii-stateful-streaming
img: blog/images/mask-pii/mask-ssn-social.png
twitter-card: summary_large_image
---
## Masking PII with Stateful Service Composition

* [Introduction](#introduction)
* [Data privacy use case](#data-privacy-use-case)
* [Stateful data flow to mask PII](#stateful-data-flow-to-mask-pii)
* [Conclusion](#conclusion)

## Introduction
Data privacy is a growing concern among individuals. More and more digital citizens are concerned about how businesses use their data. Naturally most businesses are careful to protect their data and to ensure that it is only used for the purpose for which it was collected.

In this blog, we will demonstrate how to use Stateful Streaming Service Composition to mask personally identifiable information (PII) in a streaming data pipeline.

## Data governance use case
Businesses collect personally identifiable information (PII) like name, email, address, and social security numbers from customers.

Businesses protect the data by tagging private information, encryption, data retention, and data deletion. Masking PII is a basic aspect of a reliable data governance strategy.

The goal is to prevent exposing users' private information externally. PII masking is a critical and ubiquitous need due to the billions of consumers using digital services daily.

## Stateful data flow to mask PII

<img src="/blog/images/mask-pii/mask-ssn-data-flow.png"
     alt="Masking PII with Stateful Service Composition"
     width="900"
     style="border: 1px solid #ddd;" />

Typically PII is a part of user interactions and events. For example, on internet websites and mobile apps, users also use PII to identify themselves. When they interact with government services, tax, insurance, healthcare etc., they transmit personally identifiable information(PII) as part of on-line applications. 

Typically the raw data is stored in restricted servers or databases. Workflows with the required access processes the raw data in batches and create standardized datasets. Processing the events in a streaming data flow is a neat way to make the workflow easier to manage.

The data processing to mask PII commonly involves a combination of regex, string manipulation, and encryption. In a streaming data flow, we can use Stateful Streaming Service Composition to implement this functionality. This way the raw stream of data with PII can be processed and masked in a single pass.

Here the data flow in action. The raw stream of data with PII is received from `user-info` topic. The data is processed in a stateful service `mask-ssn-service` and the output is sent to `masked` topic.

### 1. Run the Dataflow on SSDK

SSDK looks for the `dataflow.yaml` in the local directory to run:

Here is the dataflow.yaml file:
```yaml
apiVersion: 0.4.0

meta:
  name: mask-user-info
  version: 0.1.0
  namespace: example

imports:
  - pkg: example/mask-ssn-pkg@0.1.0
    path: ../_packages/mask-ssn-pkg
    functions:
      - name: mask-ssn

config:
  converter: raw

topics:
  user-info:
    schema:
      value:
        type: string
  masked:
    schema:
      value:
        type: string

services:
  mask-ssn-service:
    sources:
      - type: topic
        id: user-info

    transforms:
      - operator: map
        uses: mask-ssn

    sinks:
      - type: topic
        id: masked

# Development only, it does not get published to hub
dev:
  imports:
    - pkg: example/mask-ssn-pkg@0.1.0
      path: ../_packages/mask-ssn-pkg
```

In the `dataflow.yaml` we simply describe the dataflow by listing the topics, services, and the functions.

The `mask-ssn-service` is a stateful service that uses the `mask-ssn` function from the `mask-ssn-pkg` package that has been built and tested independently.

The `mask-ssn` function uses regex to mask the SSN. We can run the service with a single command that builds and runs the dataflow:

```bash
ssdk run
```

### 2. Test data flow

We test the data flow with a few records and see how the data is processed.

Produce a few records to the `user-info` topic:

```bash
fluvio produce user-info
> {"name":"alice","ssn":"123-45-6789"}
Ok!
> {"name":"bob","ssn":"987-65-4321"}
Ok!
```

Consume from `masked` topic:

```bash
fluvio consume masked -Bd

{"name":"alice","ssn":"***-**-****"}
{"name":"bob","ssn":"***-**-****"}
```

### 3. Check service statistics

We use `show state` command in service runtime to display statistics:

```bash
>> show state mask-ssn-service/mask-ssn/metrics --table

Key    Window  succeeded  failed
stats  *       2          0
```

```bash
>> show state mask-ssn-service/mask-ssn/metrics --table

Key    Window  succeeded  failed
stats  *       2          0
```

## Conclusion
Just like that in a few simple steps we were able to mask PII in a streaming data pipeline. Stateful Streaming Service Composition is a powerful tool that can be used to build complex data flows.

The workflow to build the function package is simple and straightforward. Developers can publish end to end data flows, functions, schemas, and types on InfinyOn Hub and reuse in other similar data flows.

If you'd like to explore how you can implement stateful streaming data flows {{%link "https://cal.com/debadyuti/infinyon-discovery" "Setup a 1:1 call" %}} with me.


#### Connect with us:

You can contact us through [Github Discussions](https://github.com/infinyon/fluvio/discussions) or [our Discord](https://discordapp.com/invite/bBG2dTz) if you have any questions or comments, we welcome your insights on `stateful services`

{{%link "https://youtube.com/@InfinyOn" "Subscribe to our YouTube channel" %}}

{{%link "https://twitter.com/infinyon" "Follow us on Twitter" %}}

{{%link "https://www.linkedin.com/company/infinyon/" "Follow us on LinkedIn" %}}
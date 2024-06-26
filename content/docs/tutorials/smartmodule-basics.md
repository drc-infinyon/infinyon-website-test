---
title: "SmartModule Basics"
weight: 32
description: "A short tutorial on using SmartModules"
---

<img src="/docs/images/smartmodules/smartmodule-overview.svg">

This tutorial assumes that `fluvio` is installed, and logged-in to InfinyOn Cloud. Follow the [Quick Start]({{<ref "/docs/">}}) to get set up.

SmartModules are the basic building blocks for transformations in Fluvio, allowing users to define custom functions for processing or transforming streaming data. They provide a flexible way to tailor data handling to meet particular needs, enhancing Fluvio's capabilities.

## See list of available SmartModules

%copy first-line%
```shell
$ fluvio hub sm list
  SMARTMODULE                              Visibility 
  infinyon-labs/array-map-json@0.1.0       public     
  infinyon-labs/dedup-filter@0.0.2         public     
  infinyon-labs/json-formatter@0.1.0       public     
  infinyon-labs/key-gen-json@0.1.0         public     
  infinyon-labs/regex-map-json@0.1.1       public     
  infinyon-labs/regex-map@0.1.0            public     
  infinyon-labs/stars-forks-changes@0.1.2  public     
  infinyon/jolt@0.3.0                      public     
  infinyon/json-sql@0.2.1                  public     
  infinyon/regex-filter@0.1.0              public
```

## Download SmartModules

SmartModules must be downloaded before they can be used. Afterwards, downloaded SmartModules are available for your Producers and Consumers. 


%copy first-line%
```shell
$ fluvio hub sm download infinyon/regex-filter@0.1.0
downloading infinyon/regex-filter@0.1.0 to infinyon-regex-filter-0.1.0.ipkg
... downloading complete
... checking package
trying connection to fluvio router.infinyon.cloud:9003
... cluster smartmodule install complete
```

## Use SmartModule with Producer and Consumer

You can specify a SmartModule to use with `fluvio produce` and `fluvio consume`

This consumer is using the SmartModule we just downloaded with `--smartmodule`, and is also configuring it with `--params`/`-e`. 

%copy first-line%
```shell
$ fluvio consume --smartmodule infinyon/regex-filter@0.1.0 --params regex='[Cc]at' cat-facts
```

{{<idea>}}
You can configure SmartModules with multiple parameters by passing multiple `--params`/`-e`.

e.g.

%copy first-line%
```shell
$ fluvio produce --smartmodule example/my-smartmodule@0.1.0 -e name=example -e point_made=true
```
{{</idea>}}

The `--transforms-file` flag are for more complex transformations defined in a YAML file. See the [Transformation Chaining]({{<ref "/docs/resources/transformation-chaining.md">}}) page for more detail.

Example `transforms.yaml` with multiple transformations. Order matters here, so `infinyon/jolt@0.3.0` is first and `infinyon/regex-filter@0.1.0` is second.

%copy%
```yaml
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            fact: "animal.fact"
            length: "length"
  - uses: infinyon/regex-filter@0.1.0
    with:
      regex: "[Cc]at"
```

%copy first-line%
```shell
$ fluvio consume --transforms-file ./my-transforms.yaml my-topic
```

## See list of Downloaded SmartModules

%copy first-line%
```shell
$ fluvio sm list
  SMARTMODULE                  SIZE     
  infinyon/jolt@0.3.0          611.5 KB 
  infinyon/json-sql@0.1.0      558.4 KB 
  infinyon/regex-filter@0.1.0  312.7 KB 
  infinyon/jolt@0.1.0          564.0 KB 
  infinyon/json-sql@0.2.1      559.6 KB
```

## Delete SmartModules

%copy first-line%
```shell
$ fluvio sm delete infinyon/json-sql@0.2.1 
smartmodule "infinyon/json-sql@0.2.1" deleted
```

## Use SmartModule with Connector

You can define transforms when you create connectors with `transforms`

%copy%
```yaml
# connector-example.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: cat-facts
  type: http-source
  topic: cat-facts
  create-topic: true
  secrets:
    - name: AUTHORIZATION_TOKEN
http:
  endpoint: "https://catfact.ninja/fact"
  interval: 10s  
  headers:
    - "Authorization: token ${{ secrets.AUTHORIZATION_TOKEN }}"
    - "Cache-Control: no-cache"
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            fact: "animal.fact"
            length: "length"
  - uses: infinyon/regex-filter@0.1.0
    with:
      regex: "[Cc]at"
```

Everything is in the config file. You create a connector as usual.

%copy first-line%
```shell
$ fluvio cloud connector create --config connector-example.yaml
```

## Use SmartModule with Webhook

%copy%
```yaml
# example-webhook.yaml
meta:
  name: my-webhook
  topic: my-topic 
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            fact: "animal.fact"
            length: "length"
  - uses: infinyon/regex-filter@0.1.0
    with:
      regex: "[Cc]at"
webhook:
  outputParts: body
```

Just like Connectors, everything is in the config file. You create a webhook as usual.

%copy first-line%
```shell
fluvio cloud webhook create --config example-webhook.yaml
```

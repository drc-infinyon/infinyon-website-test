---
title: Connector config file 
weight: 102
---

This is the template YAML connector file. To make it useful, it needs to be
populated. In the next section we will go over the different sections of the connector configuration file.

%copy%
```yaml
# connector.yaml

# Version of the schema of the connector config
# Valid value is `0.1.0`
apiVersion: 0.1.0

meta:
  name:
  version:
  type:
  topic:

  # optional
  producer:
    # optional
    linger:
    # optional
    batch-size:
    # optional
    compression:

  # optional
  consumer:
    # optional
    partition:
    # optional
    max_bytes:

  # optional
  secrets:
    - name: secret_1

# optional
transforms:
  - uses: smartmodule_name
    with:
      param_name: param_value
# Type specific configs
# key depends on connector
# <custom_key>:
#   foo: bar
#
# eg.
# http:
#   endpoint: https://example.com
```


## Connector `apiVersion` configuration

The `apiVersion` is the version of the connector API that the connector uses to parse the configuration file. The current only accepted version is `0.1.0`.

## Connector `meta` configuration

The `meta` section contains the metadata for the connector:

* The `name` is the name of the connector. e.g. `my-connector`.
* The `type` is the type of the connector. e.g. `http-source`, `http-sink`, `mqtt-source`.
  * See the Connectors section in the navigation for the full list of connectors supported.
* The `version` is the version of the connector. e.g. `0.2.0`.
* The `topic` is the topic that the connector will connect to. e.g. `my-topic`. The topic will be created automatically if it does not exist.
* The `secrets`(optional) is a list of secrets that the connector will use. This accepts a list of objects with the key `name`.
  * See the [secrets]() section for more information.
* The `producer`(optional) is the producer configuration for the connector. Currently, this is only used for `source`/`inbound` connectors. The current supported configurations are `linger`, `compression` and `batch_size`. All configurations are optional. See examples to a list of valid values for each configuration.
* The `consumer`(optional) is the consumer configuration for the connector. Currently, this is only used for `sink`/`outbound` connectors. The current supported configurations are `partition` and `max_bytes`. Both configurations are optional. See examples to a list of valid values for each configuration.

An example with all the keys filled for a `http-source` connector:

%copy%
```yaml
apiVersion: 0.1.0
meta:
  name: my-http-source-connector
  type: http-source
  version: 0.2.0
  topic: my-topic
  producer:
    linger: 1ms
    batch_size: "44.0 MB"
    # possible values: `none`, `gzip`, `snappy` and `lz4`
    compression: gzip
  secrets:
    - name: MY_SECRET
```

An example with all the keys filled for a `http-sink` connector:

%copy%
```yaml
apiVersion: 0.1.0
meta:
  name: my-http-sink-connector
  type: http-sink
  version: 0.1.0
  topic: my-topic
  consumer:
    max_bytes: 3 MB
    partition: 0
  secrets:
    - name: MY_SECRET
```


## Connector `transforms` configuration

Connectors support `transforms`. Records can be modified before they are sent to the topic. The `transforms` section is a list of `transform` objects. Each `transform` object has an `uses` and a `with` section.

* `uses` is the reference to the SmartModule used in the transform.
* `with` is the configuration for the transform
  * The section is different for each transform
  * See the connectors reference documentation for available configuration options

See the [Transformations]({{<ref "/docs/resources/transformation-chaining.md">}}) section for more information.
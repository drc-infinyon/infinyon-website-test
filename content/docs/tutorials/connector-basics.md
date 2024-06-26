---
title: "Connector Basics"
weight: 40
description: "A short tutorial for using Connectors"
---

Ensure `fluvio` is installed and logged in to InfinyOn Cloud before proceeding. If not set up, follow the [Quick Start]({{<ref "/docs/_index.md">}}).

Connectors serve to transmit data into or out of your cluster, configurable via a YAML file.

Utilizing [InfinyOn Cloud] for managing connectors centralizes your data pipelines, both locally and on the cloud.

Manage your connectors efficiently with the [`fluvio cloud connector`]({{<ref "/docs/cli/connector.md">}}) CLI.

## Create Your First Connector on InfinyOn Cloud

This guide demonstrates creating an Inbound HTTP connector to ingest JSON data from an HTTP endpoint.

Sign up for [InfinyOn Cloud] and log into the CLI to begin:

%copy first-line%
```bash
$ fluvio cloud login
```

### Example HTTP connector

Below is the configuration for the [Inbound HTTP connector]({{<ref "/docs/connectors/http.md#inbound-connector">}}):

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.1
  name: cat-facts
  type: http-source
  topic: cat-facts
  create-topic: true
http:
  endpoint: "https://catfact.ninja/fact"
  interval: 10s
```

In this configuration, a connector named `cat-facts` is created. It requests data from [a cat fact API](https://catfact.ninja) every 30 seconds and receives JSON data, which is stored in a topic named `cat-facts-data`.

#### Start a connector

Create a connector using the following command:

%copy first-line%
```bash
$ fluvio cloud connector create --config catfacts-basic-connector.yml
connector "cat-facts" (http-source) created
```

#### List all connectors

Once created, list the connectors and view their current status:

%copy first-line%
```bash
$ fluvio cloud connector list
 NAME       TYPE         VERSION  CDK  STATUS
 cat-facts  http-source  0.1.0    V3   Running
```

#### View connector logs

Debug connector behavior by accessing the logs:

%copy first-line%
```bash
$ fluvio cloud connector logs cat-facts
connector-startup infinyon/http-source@0.1.0
2023-03-25T03:41:29.570294Z  INFO surf::middleware::logger::native: sending request    
2023-03-25T03:41:29.702213Z  INFO surf::middleware::logger::native: request completed    
2023-03-25T03:41:29.702258Z  INFO connector_startup::startup: downloading package url="https://hub.infinyon.cloud/hub/v0/connector/pkg/infinyon/http-source/0.1.0"
2023-03-25T03:41:29.702290Z  INFO surf::middleware::logger::native: sending request    
2023-03-25T03:41:29.993001Z  INFO surf::middleware::logger::native: request completed    
2023-03-25T03:41:30.108220Z  INFO connector_startup::startup: writing file file="connector.ipkg"
... checking package
2023-03-25T03:41:30.301199Z  INFO connector_startup::startup: connector binary from package path="./http-source"
2023-03-25T03:41:30.301224Z  INFO connector_startup::startup: Starting deployment
Connector runs with process id: 15
2023-03-25T03:41:30.303333Z  INFO http_source: Reading config file from: /home/fluvio/config.yaml
2023-03-25T03:41:30.303526Z  INFO http_source: starting processing
2023-03-25T03:41:30.304337Z  INFO fluvio::config::tls: Using verified TLS with certificates from paths domain="odd-butterfly-0dea7a035980a4679d0704f654e1a14e.c.cloud-dev.fluvio.io"
2023-03-25T03:41:30.308822Z  INFO fluvio::fluvio: Connecting to Fluvio cluster fluvio_crate_version="0.16.0" fluvio_git_hash="8d4023ee0dc7735aaa0c823dd2b235662112f090"
2023-03-25T03:41:30.369634Z  INFO connect: fluvio_socket::versioned: connect to socket add=fluvio-sc-public:9003
2023-03-25T03:41:30.412895Z  INFO connect:connect_with_config: fluvio::config::tls: Using verified TLS with certificates from paths domain="odd-butterfly-0dea7a035980a4679d0704f654e1a14e.c.cloud-dev.fluvio.io"
2023-03-25T03:41:30.473242Z  INFO connect:connect_with_config:connect: fluvio_socket::versioned: connect to socket add=fluvio-sc-public:9003
2023-03-25T03:41:30.582726Z  INFO dispatcher_loop{self=MultiplexDisp(12)}: fluvio_socket::multiplexing: multiplexer terminated
2023-03-25T03:41:30.632722Z  INFO fluvio_connector_common::monitoring: using metric path: /fluvio_metrics/connector.sock
2023-03-25T03:41:30.632795Z  INFO fluvio_connector_common::monitoring: monitoring started
2023-03-25T03:41:31.172075Z  INFO run:create_serial_socket_from_leader{leader_id=0}:connect_to_leader{leader=0}:connect: fluvio_socket::versioned: connect to socket add=fluvio-spu-main-0.acct-ce0c1782-ca61-4c54-a08c-3ba985524553.svc.cluster.local:9005
```

#### View data in topic

The HTTP connector should now be storing data in the specified topic:

%copy first-line%
```shell
$ fluvio topic list
  NAME            TYPE      PARTITIONS  REPLICAS  RETENTION TIME  COMPRESSION  STATUS                   REASON
  cat-facts-data  computed  1           1         7days           any          resolution::provisioned
```

Verify by consuming from the topic:

%copy first-line%
```shell
$ fluvio consume cat-facts-data -B
{"fact":"Female felines are \\superfecund","length":31}
{"fact":"Cats only sweat through their paws and nowhere else on their body","length":65}
{"fact":"While many parts of Europe and North America consider the black cat a sign of bad luck, in Britain and Australia, black cats are considered lucky.","length":146}
^C
```

{{<idea>}}
The `--disable-continuous` flag exits the stream after displaying the last record.
{{</idea>}}

#### Delete a connector

To stop the connector, delete it:

%copy first-line%
```shell
$ fluvio cloud connector delete cat-facts
connector "cat-facts" deleted
```

This action won’t delete the topic. Delete it separately if needed:

%copy first-line%
```shell
$ fluvio topic delete cat-facts
topic "cat-facts" deleted
```

### Conclusion

You've created an Inbound HTTP connector, accessed the logs, viewed the HTTP response data in the Fluvio topic, and deleted the connector and topic post-exploration. You are now prepared to create your own connectors. Check the documentation for our supported Inbound and Outbound connectors to get started with your own data sources.

[InfinyOn Cloud]: https://infinyon.cloud
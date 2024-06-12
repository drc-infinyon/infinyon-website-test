---
title: HTTP Connector
menu: HTTP 
description: "Reference for configuring HTTP data connectors in InfinyOn Cloud"
---


| Data Direction | [Inbound](#inbound-connector) | [Outbound](#outbound-connector) |
|:--------------:|:-----------------------------:|:-------------------------------:|
|                | [✅](#inbound-connector) | [✅](#outbound-connector)        |

## Inbound Connector


Read HTTP Responses given input HTTP request configuration options and `interval` x and produces them to Fluvio topics.

Supports HTTP/1.0, HTTP/1.1, HTTP/2.0 protocols.

See [docs](https://www.fluvio.io/connectors/inbound/http/) here.
Tutorial for [HTTP to SQL Pipeline](https://www.fluvio.io/docs/tutorials/data-pipeline/).

### Configuration
| Option       | default                    | type    | description                                                                                |
| :------------| :--------------------------| :-----  | :----------------------------------------------------------------------------------------- |
| interval     | 10s                        | String  | Interval between each HTTP Request. This is in the form of "1s", "10ms", "1m", "1ns", etc. |
| method       | GET                        | String  | GET, POST, PUT, HEAD                                                                       |
| endpoint     | -                          | String  | HTTP URL endpoint                                                                          |
| headers      | -                          | Array\<String\> | Request header(s) "Key:Value" pairs                                                  |
| body         | -                          | String  | Request body e.g. in POST                                                                  |
| user-agent   | "fluvio/http-source 0.1.0" | String  | Request user-agent                                                                         |
| output_type  | text                       | String  | `text` = UTF-8 String Output, `json` = UTF-8 JSON Serialized String                        |
| output_parts | body                       | String  | `body` = body only, `full` = all status, header and body parts                             |

#### Record Type Output
| Matrix                                                      | Output                                  |
| :---------------------------------------------------------- | :-------------------------------------- |
| output_type = text (default), output_parts = body (default) | Only the body of the HTTP Response      |
| output_type = text (default), output_parts = full           | The full HTTP Response                  |
| output_type = json, output_parts = body (default)           | Only the "body" in JSON struct          |
| output_type = json, output_parts = full                     | HTTP "status", "body" and "header" JSON |


### Usage Example

This is an example of simple connector config file:

```yaml
# config-example.yaml
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
```

The produced record in Fluvio topic will be:
```json
{
  "fact": "The biggest wildcat today is the Siberian Tiger. It can be more than 12 feet (3.6 m) long (about the size of a small car) and weigh up to 700 pounds (317 kg).",
  "length": 158
}
```
### Secrets

Fluvio HTTP Source Connector supports Secrets in the `endpoint` and in the `headers` parameters:

```yaml
# config-example.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: cat-facts
  type: http-source
  topic: cat-facts
  create-topic: true
  secrets:
    - name: MY_SECRET_URL
    - name: MY_AUTHORIZATION_HEADER
http:
 endpoint: 
   secret:
     name: MY_SECRET_URL
 headers: 
  - "Authorization: ${{ secrets.MY_AUTHORIZATION_HEADER }}
 interval: 10s
```


### Transformations
Fluvio HTTP Source Connector supports [Transformations]({{<ref "/docs/resources/transformation-chaining.md">}}). Records can be modified before sending to Fluvio topic.

The previous example can be extended to add extra transformations to outgoing records:
```yaml
# config-example.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: cat-facts
  type: http-source
  topic: cat-facts
  create-topic: true
http:
  endpoint: "https://catfact.ninja/fact"
  interval: 10s
transforms:
  - uses: infinyon/jolt@0.1.0
    with:
      spec:
        - operation: default
          spec:
            source: "http-connector"
        - operation: remove
          spec:
            length: ""
```
In this case, additional transformation will be performed before records are sent to Fluvio topic: field `length` will be removed and
field `source` with string value `http-connector` will be added.

Now produced records will have a different shape, for example:
```json
{
  "fact": "A cat has more bones than a human; humans have 206, and the cat - 230.",
  "source": "http-connector"
}
```

Read more about [JSON to JSON transformations]({{<ref "/docs/smartmodules/jolt.md">}}).

---

## Outbound Connector

HTTP sink connector reads records from data streaming and generates an HTTP request.

> Supports HTTP/1.0, HTTP/1.1, HTTP/2.0 protocols.

### Configuration

HTTP Sink is configured using a YAML file:

```yaml
# config-example.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: my-http-sink
  type: http-sink
  topic: http-sink-topic
  secrets:
    - name: HTTP_TOKEN
http:
  endpoint: "http://my.svc.tld/post"
  headers:
    - "Authorization: token ${{ secrets.HTTP_TOKEN }}"
    - "Cache-Control: no-cache"
```

| Option               | default                    | type            | description                                       |
| :--------------------| :--------------------------| :-------------- | :-------------------------------------------------|
| method               | POST                       | String          | POST, PUT                                         |
| endpoint             | -                          | String          | HTTP URL endpoint                                 |
| headers              | -                          | Array\<String\> | Request header(s) "Key:Value" pairs               |
| user-agent           | `fluvio/http-sink 0.2.2`   | String          | Request user-agent                                |
| http_request_timeout | 1s                         | String          | HTTP Request Timeout                              |
| http_connect_timeout | 15s                        | String          | HTTP Connect Timeout                              |

> By default HTTP headers will use `Content-Type: text/html` unless another value
> is provided to the Headers configuration.

### Usage

Login to your Fluvio Cloud Account via Fluvio CLI

```bash
fluvio cloud login --use-oauth2
```

Then configure the HTTP Request to be sent using a YAML file following the
connector configuration schema. The following configuration will send a POST
HTTP request to `http://httpbin.org/post`.

```yaml
# config.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: httpbin
  type: http-sink
  topic: httpbin-send-post

http:
  endpoint: http://httpbin.org/post
  interval: 3s
```

Finally create your connector by running:

```bash
fluvio cloud connector create --config ./config.yaml
```

> You can see active connectors by running the following command:
>
> ```bash
> fluvio cloud connector list
> ```

Check connector logs by running

```bash
fluvio cloud connector logs httpbin
```

```log
INFO connect:connect_with_config:connect: fluvio_socket::versioned: connect to socket add=fluvio-sc-public:9003
INFO dispatcher_loop{self=MultiplexDisp(10)}: fluvio_socket::multiplexing: multiplexer terminated
2023-05-02T20:59:50.192104Z  INFO stream_with_config:inner_stream_batches_with_config:request_stream{offset=Offset { inner: FromEnd(0) }}:create_serial_socket:create_serial_socket_from_leader{leader_id=0}:connect_to_leader{leader=0}:connect: fluvio_socket::versioned: connect to socket add=fluvio-spu-main-0.acct-584fd564-1d4a-4308-9061-09acea387bea.svc.cluster.local:9005
INFO fluvio_connector_common::monitoring: using metric path: /fluvio_metrics/connector.sock
INFO fluvio_connector_common::monitoring: monitoring started
```

### Produce Records to send as HTTP POST Requests

You can produce records using `fluvio produce <TOPIC>`, values produced will
be sent as HTTP Body payloads on HTTP Sink Connector.

Running the following command will attach stdin to the topic stream, any data
written to stdin will be sent as a record through the `httpbin-send-post` topic,
and as a side effect of the HTTP Sink Connector, these records will also be sent
as HTTP POST requests to http://httpbin.org/post, based on our configuration.

```bash
fluvio produce httpbin-send-post
```

Then send data:

```log
> {\"hello\": \"world\"}
Ok!
```

### Teardown

To stop your connector just use `fluvio cloud connector delete <NAME>`

```bash
fluvio cloud connector delete httpbin
```

> `httpbin` is our connector instance name from the configuration file shown above

### Transformations

Fluvio HTTP Sink Connector supports [Transformations]({{<ref "/docs/resources/transformation-chaining.md">}}). Records can be modified before sending to endpoint.

The previous example can be extended to add extra transformations to outgoing records:
```yaml
# config-example.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: my-http-sink
  type: http-sink
  topic: http-sink-topic
  secrets:
    - name: AUTHORIZATION_TOKEN
http:
  endpoint: "http://my.svc.tld/post"
  headers:
    - "Authorization: token ${{ secrets.AUTHORIZATION_TOKEN }}"
    - "Content-Type: application/json"
transforms:
  - uses: infinyon/jolt@0.1.0
    with:
      spec:
        - operation: shift
          spec:
            "result": "text"
```

In this case, additional transformation will be performed before records are sent the http endpoint. A json field called `result` will be renamed to `text`.

Read more about [JSON to JSON transformations]({{<ref "/docs/smartmodules/jolt.md">}}).
---
title: "Amplitude Analytics"
description: "Data pipeline that collects events from multiple services and sends them to Amplitude."
weight: 110
---

With this guide, you can send events from InfinyOn Cloud to Amplitude. Connecting your services to this pipeline is simpler than microservices running around

To follow along in this guide you need:
* The [Amplitude API key](https://www.docs.developers.amplitude.com/analytics/find-api-credentials/) from your account.
* [InfinyOn Cloud] cluster and [Fluvio CLI].

## Setup

### Create secret

You can follow [Amplitude's instructions for how to collect your api token](https://www.docs.developers.amplitude.com/analytics/find-api-credentials/) so you can create a secret the connector can use when building the json request for Amplitude.

The Amplitude upload requests requires an api token, and all events for the production environment use the same api token. We'll transform the service event to include this value in the next step.


%copy first-line%
```
$ fluvio cloud secret set AMPLITUDE_API_TOKEN <api-token>
Secret "AMPLITUDE_API_TOKEN" set successfully
```

### Create connector

Example event:

%copy%
```json
{
  "timestamp": "2023-09-06T12:02:29.658014825Z",
  "event": {
    "user_id": "user@example.com",
    "event_type": "ServiceAbcExampleEvent",
    "time": 1696629748241,
    "app_version": "c738ca3",
    "event_id": 5,
    "session_id": 9876645851321,
    "insert_id": "d768b1b3-1055-4db8-b214-619b5a321ef5"
  }
}
```

In this example, each service sends a json object to a topic containing a timestamp for when the event occurred and an [Amplitude event object](https://www.docs.developers.amplitude.com/analytics/apis/http-v2-api/#keys-for-the-event-argument).

Before sending to Amplitude with an HTTP outbound connector, we'll transform the original payload into the [Amplitude upload request json](https://www.docs.developers.amplitude.com/analytics/apis/http-v2-api/#upload-request-body-parameters).

The transform consists of:
* Removing the `timestamp` key
* Adding the `api_key` key with the value from our `AMPLITUDE_API_TOKEN` secret
* Shift the contents of the `event` key into an array with the key `events`

Example connector config w/ transforms

%copy%
```yaml
# amplitude-connector.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: amplitude-connector 
  type: http-sink
  topic: service-events
  secrets:
    - name: AMPLITUDE_API_TOKEN
http:
  endpoint: "https://api2.amplitude.com/2/httpapi"
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: remove
          spec:
            timestamp: ""
        - operation: shift
          spec:
            "event": "events[0]"
        - operation: default
          spec:
            api_key: "${{ secrets.AMPLITUDE_API_TOKEN }}"
```

Save the config and run the following command to create the connector.

%copy first-line%
```shell
$ fluvio cloud connector create -c amplitude-connector.yaml
connector "amplitude-connector" (http-sink) created
```

### Send a test event to topic

The following command will send an example event to the topic our connector is watching.

%copy first-line%
```shell
$ echo '{"timestamp":"2023-09-06T12:02:29.658014825Z","event":{"user_id":"user@example.com","event_type":"ServiceAbcExampleEvent"}}' | fluvio produce service-events
```

### Look at Amplitude for your event

In the Amplitude dashboard, you should be able to verify the test event arrive under `User Look-up`

<img src="/docs/images/amplitude/amplitude-example-event.png">

This is the end of the guide. Once you instrument your services, you should be able to quickly send analytics events to Amplitude from InfinyOn Cloud.

[InfinyOn Cloud]: https://infinyon.cloud/signup
[Fluvio CLI]: https://www.fluvio.io/download
---
title: "Integrate Cloudflare Workers with InfinyOn Cloud"
menu: "Cloudflare Workers"
description: "How to create a Cloudflare worker that sends events to a Webhook in InfinyOn Cloud."
weight: 120
---

Connect your Cloudflare workers with InfinyOn Cloud for powerful event-processing data pipelines. InfinyOn Cloud's robust data streaming allows you to seamlessly move and transform data and trigger actions. 

In this guide, we'll build a simple CloudFlare worker that sends events to InfinyOn Cloud through the webhook API.

##### Use Cases
* Send form submission [notifications to Slack].
* Send clickstream [events to Amplitude].
* Send form submissions to HubSpot.

## Prerequisites

To follow along you'll need the following:

* [npm] & [curl] installed locally
* [Fluvio CLI] installed locally
* Account on [InfinyOn Cloud]

Let's get started.

## Create a Webhook

External services send events to InfinyOn Cloud via webhooks, connectors, and custom clients. In this example, we'll use webhooks.

Use [Fluvio CLI] to create a webhook on [InfinyOn Cloud].

1. Create a webhook configuration file `cf-webhook.yaml`:

%copy%
```yaml
meta:
  name: cf-webhook
  topic: cf-events

webhook:
  outputParts: body
  outputType: json
```

2. Create the webhook endpoint:

%copy first-line%
```bash
$ fluvio cloud webhook create -c cf-webhook.yaml
Webhook "cf-webhook" created with url: https://infinyon.cloud/webhooks/v1/xyz
```

The command returns an endpoint that tells Cloudflare where InfinyOn is listening for events.

Use `fluvio cloud webhook list` to list all your webhooks.

## Build a Cloudflare Worker

Cloudflare uses [Wrangler], a command-line tool that helps developers build workers.

#### Install Wrangler

Use `npm` to install wrangler:

%copy first-line%
```bash
$ npm install -g wrangler
```

#### Create a Worker

Next, we'll create a directory, write the worker code, and provision a configuration file for wrangler to access our code.

1. Create a project directory:

%copy%
```bash
$ mkdir cf-infinyon; cd ./cf-infinyon
```

2. Create a file `index.js` and add the following code:

%copy%

{{< highlight js "hl_lines=1" >}}
const WEBHOOK_URL = "https://infinyon.cloud/webhooks/v1/xyz";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let jsonData = await request.json();
  
  const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-type": `application/json`,
      },
      body: JSON.stringify(jsonData)
    }
  );

  const text_response = response.ok ? "" : "Webhook gateway error.";

  return new Response(text_response, { status: response.status });
}
{{< /highlight >}}

The worker fetches an event, retrieves its JSON payload, and forwards it to the webhook gateway on InfinyOn Cloud.

**Note**: Update the endpoint link with your own ([see above](#create-a-webhook)).


3. Add a wrangler configuraiton file file `wrangler.toml` and add the following settings:

%copy%
```toml 
name = "cf-infinyon"
main = "index.js"
compatibility_date = "2023-09-04"
```

We are all set to run the code, but first let's review the directory:

```bash
├── index.js
└── wrangler.toml
```

## Test Cloudflare to InfinyOn Cloud Pipeline

With all the components provisioned, we should be ready to test our data pipeline end-to-end.

1. Start the Cloudflare worker:

%copy first-line%
```bash
$ wrangler dev
Starting local server...
Ready on http://0.0.0.0:8787
```

2. Start the InfinyOn Cloud consumer:

%copy first-line%
```bash
$ fluvio consume cf-events --output json
Consuming records from 'cf-events'
⠤         
```

3. Use curl to post an event:

%copy%
```bash
$ curl -v -X POST http://0.0.0.0:8787 \
    -H "Content-Type: application/json" \
    -d '{"hello": "world!"}'
```

4. The InfinyOn consumer show display the following event:

```
{
  "hello": "world!"
}
```

Congratulations! :tada: You have bridged Cloudflare workers with InfinyOn Cloud, the first set in building data reach event-driven services. 

**Next steps**: 
* apply [smartmodule transformations] inside the webhook configuration to shape the data before it is written to the topic
* attach sink connector that dispatches these events to other service such as [Slack], [Amplitude], [SQL databases], etc.


### References

* [Webhook to Slack]
* [Webhook Basics]
* [Webhook Configuration File]


[notifications to Slack]: {{<relref "./webhook-to-slack" >}}
[events to Amplitude]: {{<relref "./amplitude" >}}
[webhook API]: {{<relref "../tutorials/webhook-basics" >}}
[npm]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[curl]: https://everything.curl.dev/get
[Fluvio CLI]: https://www.fluvio.io/download
[InfinyOn Cloud]: https://infinyon.cloud/signup
[Wrangler]: https://developers.cloudflare.com/workers/wrangler/install-and-update/
[smartmodule transformations]: {{<relref "./webhook-to-slack/#create-webhook-configuration-file" >}}
[Slack]: {{<relref "./github-to-slack" >}}
[Amplitude]: {{<relref "./amplitude" >}}
[SQL databases]: {{<relref "./http-to-sql" >}}
[Webhook to Slack]: {{<relref "./webhook-to-slack" >}}
[Webhook Basics]: {{<relref "../tutorials/webhook-basics" >}}
[Webhook Configuration File]: {{<relref "../tutorials/webhook-basics" >}}

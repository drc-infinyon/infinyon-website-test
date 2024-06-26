---
title: "Hackernews Reader"
description: "Data pipeline that periodically reads articles from Hackernews and publishes them on a topic."
weight: 10
---

Hackernews Reader helps you build an XML reader that ingests hackernews articles, converts them to `json`, divides them into records, and publishes each record to a topic. This guide uses the following connector:

* [http-source]: to read periodically from a hackernews, parse the XML result into `json` records, and publish the result to a topic. 

## Prerequisites

* [Fluvio CLI] running locally
* Account on [InfinyOn Cloud]

## Step-by-Step

1. [Create http-source configuration file](#create-http-source-configuration-file)
2. [Download smartmodules](#download-startmodules)
3. [Start Connector](#start-connector)
4. [Check Results](#check-results)

### Create http-source configuration file

Create an HTTP source connector configuration file called `hackernews.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: hackernews 
  type: http-source
  topic: hackernews
http:
  method: GET
  endpoint: 'https://hnrss.org/newest'
  interval: 600s
transforms:
  - uses: infinyon-labs/rss-json@0.1.0
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
      - operation: shift
        spec:
          items: ""
  - uses: infinyon-labs/array-map-json@0.1.0
```

### Download startmodules

Download the smartmodules used by the connectors to your cluster:

%copy%
```bash
$ fluvio hub sm download infinyon/jolt@0.3.0
$ fluvio hub sm download infinyon-labs/rss-json@0.1.0
$ fluvio hub sm download infinyon-labs/array-map-json@0.1.0
```

### Start Connector

%copy%
```bash
$ fluvio cloud connector create -c hackernews.yaml
```

### Check Results

Connector logs:

%copy%
```bash
$ fluvio cloud connector log hackernews
```

Records produced:

%copy%
```bash
$ fluvio consume hackernews -T 10
```

### References

* [How to Stream and Transform Data from Hacker News RSS Feed (YouTube Video)]
* [labs-rss-json-sm](https://github.com/infinyon/labs-rss-json-sm)
* [labs-array-map-json-sm](https://github.com/infinyon/labs-array-map-json-sm)


---
[Fluvio CLI]: https://www.fluvio.io/download
[InfinyOn Cloud]: https://infinyon.cloud/signup
[http-source]: https://github.com/infinyon/http-source-connector
[rss-json]: https://github.com/infinyon/labs-rss-json-sm
[jolt]: https://github.com/infinyon/fluvio-jolt
[array-map-json]: https://github.com/infinyon/labs-array-map-json-sm
[How to Stream and Transform Data from Hacker News RSS Feed (YouTube Video)]: https://www.youtube.com/watch?v=raV5q6paAPM&t=1s&ab_channel=InfinyOn
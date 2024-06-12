---
title: "Create a Github Stars/Forks Event Pipeline"
author:
    name: "A.J. Hunyady"
    github: "ajhunyady"
description: "Create a data pipeline that notifies you in Slack or Discord anytime we get a new star or fork."
date: 2023-09-07
metadata:
    - TECH
    - PIPELINES
slug: github-stars-to-slack
url: /blog/2023/09/github-stars-to-slack
img: blog/images/github-stars-to-slack/github-stars-blog.jpg
twitter-card: summary_large_image
show-header-img: false
---

Nothing is more exhilarating than watching the github stars and forks go up on a newly launched github project. But constantly clicking on stars and forks tends to grow old. If you want to get notified in Slack or Discord anytime you receive a new star 🌟 or fork 🎏, this blog is for you!

This blog is a step-by-step tutorial on how to create a data pipeline that watches github for changes and notifies you in Slack or Discord.

<img src="/blog/images/github-stars-to-slack/github-data-pipeline.jpg"
     alt="Github Stars to Slack/Discord Archiecture"
     style="justify: center; max-width: 100%" />

The blog has an [Advanced Topics](#advanced-topics) optional section. There, we'll show you how to build your own `stars/forks` SmartModule instead of using the one from the Hub.

Let's get started.


## Requirements

This blog is a step-by-step tutorial producing a fully functional InfinyOn Cloud data pipeline. If you want to follow along, there are there are a few prerequisites:

* [Fluvio CLI] running on your local machine.
* An account on [InfinyOn Cloud].
* Admin access to Slack or Discord to generate a webhook API key.

**Optional**: If you want to access Github more often, you'll need to generate a token, which also requires admin access.



## Create a Data Pipeline

In fluvio, a data pipeline intermediating data exchanges between services requires a source and a sink connector. In our use case, we'll need a source connector that periodically queries github and write to a topic and a sink connector that reads from the topic and notifies github/discord when it detects a change. So, we'll tackle this problem in two parts:

1. [Build a Github Producer](#build-a-github-producer)
2. [Build a Slack Consumer](#build-a-slack-consumer)

Finally, we'll [build a Discord Consumer](#build-a-discord-consumer), which is virtually identical to the Slack consumer.


### Build a Github Producer

Source [connectors] are responsible for reading from external services and publishing the results to a fluvio topic. For our use case, we'll use the [http-source] connector. 

Before we start, let's examine the data we get from `github` and determine what we want to write to the topic.

%copy first-line%
```bash
$  curl https://api.github.com/repos/infinyon/fluvio
{
  "id": 205473061,
  "node_id": "MDEwOlJlcG9zaXRvcnkyMDU0NzMwNjE=",
  "name": "fluvio",
  "full_name": "infinyon/fluvio",
  "owner": {
    "login": "infinyon",
    "id": 52172389,
    ...
  },
  ...
  "stargazers_count": 1754,
  "forks_count": 137,
  ...
}
```

The query response returns a lot of data, but we only need a couple of fields, so we want to:

1. Discard all fields other than `stargazers_count` and `forks_count.`
2. Rename the fields to `stars` and `forks`, for better readability.

On each query response, we write an event into the data stream:

```json
{ "stars": 1890, "forks": 142 }
{ "stars": 1891, "forks": 143 }
```

#### Define the `http-source` Smart Connector

At InfinyOn, we call the connectors `Smart` to emphasize that they accept transformations. Let's go over to the [http-source] connector to see how to set things up.

A quick look at the https-source connector documentation shows that the connector manages the request and response and hands off the data to transformation to [smartmodules] for additional processing. Quick note for beginners; SmartModules are custom programs compiled to [WebAssembly] that shape data before sending it to the data stream.

At first, sight, performing data transformations may feel like a lot of work, but in reality, it's not too bad. The InfinyOn team built several smartmodules that we can download from [Smartmodule Hub] and use [DSL] to perform most of the work. For complex transformations, we can develop our own smartmodules and publish them to the Hub for sharing. The cool part is that we can mix and match public and custom smartmodules and seldom need to start from scratch.

Ok then, open an editor, create the following configuration file, and name it `github.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: github-stars-inbound
  type: http-source
  topic: github-stars
http:
  endpoint: 'https://api.github.com/repos/infinyon/fluvio'
  method: GET
  interval: 300s
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            "stargazers_count": "stars"
            "forks_count": "forks"
```

Below is a brief description of the most relevant fields:

* **meta** - for connector and data streaming information
    * `type` - connector type
    * `topic` - the target data streaming topic
* **http** - for connector-specific configurations
    * `endpiont` - endpoint to query
    * `interval` - the frequency of the query `5 minutes` to avoid the github rate-limit threshold (without a token)
* **transforms** for smarmodule definitions
    * `jolt` - to express `json` transformations in `DSL`.

The connector users `jolt` smartmodule for the transformation. As `jolt` is available in the [Hub], we need to download it to the cluster:

%copy first-line%
```bash
$ fluvio hub sm download infinyon/jolt@0.3.0
downloading infinyon/jolt@0.3.0 to infinyon-jolt-0.3.0.ipkg
... downloading complete
```

Great, we are ready to provision our first connector.


#### Run the connector in InfinyOn Cloud

We need [Fluvio CLI] to provision the connector in [InfinyOn Cloud]:

%copy first-line%
```bash
$ fluvio cloud connector create -c github.yaml
connector "github-stars-inbound" (http-source) created
```

Let's check the health of the connector:

%copy first-line%
```bash
$ fluvio cloud connector list
 NAME                  TYPE         VERSION  CDK  STATUS   LOG-LEVEL 
 github-stars-inbound  http-source  0.2.5    V3   Running  info      
 ```

The connector invokes a get request that generates a record, which it sends to `jolt` for the transformation, and it writes the result to the `github-stars` topic. 

Let's check what's in the topic:

%copy first-line%
```bash
$ fluvio consume github-stars -B
Consuming records from 'github-stars' starting from the beginning of log
{"stars":1890,"forks":143}
⠂
```

-> **Note**: _Fork_ and _star_ counts are updated at `5-minute` intervals. There is a way to increase the read frequency with a `github token`, which we'll describe below.

Great the producer is up and running, it's time to build the sonsumer.


### Build a Slack Consumer

The Slack consumer reads from the data stream, detects if there is a change in the number of forks or stars, and pushes a notification to Slack. We'll use the [http-sink] connector and a couple of smartmodules to do the job.

InfinyOn offers several Smartmodule that operate generic json fields. However, we want to build cusotm logic that generates a string with emojis for our Slack channel. So, let's go ahead and build our Smartmodule one.


#### Download the `stars/forks` smartmodule from Hub

Download the pre-built version from the [Hub]. If you prefer to build your own, checkout the `Advanced Topics` section:

%copy first-line%
```bash
$ fluvio hub sm download infinyon-labs/stars-forks-changes@0.1.2
```

%copy first-line%
```bash
$ fluvio sm list
  SMARTMODULE                              SIZE     
  infinyon/jolt@0.3.0                      612.7 KB
  infinyon-labs/stars-forks-changes@0.1.2  52.4 KB 
```

This smartmodule is downloaded from `infinyon-labs`, used for tutorial projects. InfinyOn supports multiple global identifiers, including custom ones, enabling you to build and publish your own smartmodules.


#### Setup Slack Webhook

The last piece of the puzzle is the Slack webhook. Check out [Incoming Webhooks] on Slack on how to set it up. 

Slack requries that we send the notification in a specific format:

```bash
POST https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
Content-type: application/json
{
    "text": "Hello, world."
}
```

In this example we'll chain `stars-forks-changes` smartmodule with `jolt` to rename the `result` to `text` as required by Slack syntax.

#### Define the `http-sink` Smart Connector

Create the following configuration file, and name it `slack.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: slack-stars-outbound
  type: http-sink
  topic: github-stars
  secrets:
    - name: SLACK_TOKEN
http:
  endpoint: "https://hooks.slack.com/services/${{ secrets.SLACK_TOKEN }}"
  headers:
    - "Content-Type: application/json"
transforms:
  - uses: infinyon-labs/stars-forks-changes@0.1.2
    lookback:
      last: 1
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            "result": "text"
```

Next, we'll need to upload `SLACK_TOKEN` to InfinyOn Cloud.


#### Add your Slack secret to InfinyOn Cloud

InfinyOn Cloud implements a secure vault for storing and referencing secrets. 

Grab your slack webhook token to write it to [InfinyOn Cloud]:

%copy first-line%
```bash
$ fluvio cloud secret set SLACK_TOKEN T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```


#### Run the connector in InfinyOn Cloud

Let's run the connector:

%copy first-line%
```bash
$ fluvio cloud connector create -c slack.yaml
connector "slack-stars-outbound" (http-sink) created
```

Check the logs to ensure it has been provisioned:

%copy first-line%
```bash
$ fluvio cloud connector logs slack-stars-outbound
```

Your end-to-end pipeline up and running; 
1. the sink connector reads the last record from `github-stars`
2. the smartmdule that detects changes and formats the output for Slack

Let's produce a fake record to test it:

%copy first-line%
```bash
$ fluvio produce github-stars
> {"stars":1891,"forks":144}
Ok
```

Awesome! The Slack bot sent us an alert:

```bash
my-stars-bot <APP>  12:35 PM
:flags: 144
:star2: 1891```
```

:tada: Congratulations!  

The following section focuses on Discord.


### Build a Discord Consumer

In fluvio, you can deploy multiple connectors reading form the same stream in parallel. Let's create a Discord connector tat reads from the same topic and notifies Discord. Check out [Discord Webhooks] on how to create one.

Create the following configuration file, and name it `discord.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: discord-stars-outbound
  type: http-sink
  topic: github-stars
  secrets:
    - name: DISCORD_TOKEN
http:
  endpoint: "https://discord.com/api/webhooks/${{ secrets.DISCORD_TOKEN }}"
  headers:
    - "Content-Type: application/json"
transforms:
  - uses: infinyon-labs/stars-forks-changes@0.1.2
    lookback:
      last: 1
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            "result": "content"
```

This configuration is similar to the `Slack` configuration, except for the `name`, `endpoint` and `jolt` transformation. Discords expects the json field to be named `content` instead of text.

Add your discord webhook token to [InfinyOn Cloud]:

%copy first-line%
```bash
$ fluvio cloud secret set DISCORD_TOKEN <webhook-token>
```

Start the connector:

%copy first-line%
```bash
$ fluvio cloud connector create -c discord.yaml
connector "discord-stars-outbound" (http-sink) created
```

Your end-to-end pipeline is up and running.

Let's produce a fake record to test it:

%copy first-line%
```bash
$ fluvio produce github-stars
> {"stars":1892,"forks":145}
Ok
```

If the webhooks has been configured correctly the alert is now published to `Discord`.

:tada: Congratulations! You've created two end-to-end data pipelines that are continuously monitoring github for changes.


# Advanced Topics

In this section, we'll cover a couple of advanced topics. The first one is catered toward developers and provides instructions on how to build your own smartmodule for `start/forks`. The second shows you how to apply a Github Token to increase the read frequency from github.

## Build a custom `stars/forks` smartmodule

We'll use [Smartmodule Development Kit (smdk)] to build, test, and deploy our smartmodule to the cluster. 

#### Install smkd

SMDK is a separate CLI for Smartmodule developers, let's install it:

%copy first-line%
```bash
$ fluvio install smdk
```

#### Generate a new project

Run the generator to create a `filter-map` smartmodule called `stars-forks-changes`:

%copy first-line%
```bash
$ smdk generate stars-forks-changes
Generating new SmartModule project: stars-forks-changes
✔ 🤷   Will your SmartModule use init parameters? · false
✔ 🤷   Will your SmartModule be public? · false
✔ 🤷   Which type of SmartModule would you like? · filter-map
[1/7]   Done: .gitignore
[2/7]   Done: Cargo.toml
[3/7]   Done: README.md
[4/7]   Done: SmartModule.toml
[5/7]   Done: rust-toolchain.toml
[6/7]   Done: src/lib.rs
[7/7]   Done: src
```

**Note** You may be prompted to add a `group` a globally unique namespace that you'll need to load to cluster and publish to [Smartmodule Hub]. In this blog we'll skip publishing to Hub.

Navigate to the project directory:

%copy first-line%
```bash
$ cd stars-forks-changes
```

#### Add the custom logic

Replace the content of `src/lib.rs` with our custom logic:

%copy%
```rust
use std::sync::atomic::{AtomicU32, Ordering};
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};
use serde::{Deserialize, Serialize};

// use u32 to represent the metric
type Metric = u32;
type AtomicMetric = AtomicU32;

/// Incoming record from Github
#[derive(Default, Deserialize)]
struct GithubRecord {
    stars: Metric,
    forks: Metric,
}

/// Outgoing record
#[derive(Default, Serialize)]
struct GithubOutgoing {
    result: String,
}

/// Accumulator for stars and forks
static STARS_FORKS: StarsForks = StarsForks::new();

/// Use Atomic to update internal state
#[derive(Default, Debug, Deserialize)]
struct StarsForks {
    stars: AtomicMetric,
    forks: AtomicMetric,
}

impl StarsForks {
    const fn new() -> Self {
        Self {
            stars: AtomicMetric::new(0),
            forks: AtomicMetric::new(0),
        }
    }

    fn get_stars(&self) -> Metric {
        self.stars.load(Ordering::SeqCst)
    }

    fn set_stars(&self, new: Metric) {
        self.stars.store(new, Ordering::SeqCst);
    }

    fn get_forks(&self) -> Metric {
        self.forks.load(Ordering::SeqCst)
    }

    fn set_forks(&self, new: Metric) {
        self.forks.store(new, Ordering::SeqCst);
    }

    fn set_both(&self, github_record: GithubRecord) {
        self.set_stars(github_record.stars);
        self.set_forks(github_record.forks);
    }

    // generate emoji string based on the new stars and forks
    fn update_and_generate_moji_string(&self, new: &GithubRecord) -> Option<GithubOutgoing> {
        let current_stars = self.get_stars();
        let current_forks = self.get_forks();

        if new.stars != current_stars && new.forks != current_forks {
            // if both stars and forks are changed, generate new emoji on prev stats
            let emoji = GithubOutgoing {
                result: format!(":flags: {} \n:star2: {}", new.forks, new.stars),
            };
            self.set_forks(new.forks);
            self.set_stars(new.stars);
            Some(emoji)
        } else if new.forks != current_forks {
            // if only forks are changed, generate new emoji on prev stats
            let emoji = GithubOutgoing {
                result: format!(":flags: {}", new.forks),
            };
            self.set_forks(new.forks);
            Some(emoji)
        } else if new.stars != current_stars {
            let emoji = GithubOutgoing {
                result: format!(":star2: {}", new.stars),
            };
            self.set_stars(new.stars);
            Some(emoji)
        } else {
            // no changes
            None
        }
    }
}

#[smartmodule(look_back)]
pub fn look_back(record: &Record) -> Result<()> {
    let last_value: GithubRecord = serde_json::from_slice(record.value.as_ref())?;

    STARS_FORKS.set_both(last_value);

    Ok(())
}

#[smartmodule(filter_map)]
pub fn filter_map(record: &Record) -> Result<Option<(Option<RecordData>, RecordData)>> {
    let new_data: GithubRecord = serde_json::from_slice(record.value.as_ref())?;

    if let Some(emoji) = STARS_FORKS.update_and_generate_moji_string(&new_data) {
        let output = serde_json::to_vec(&emoji)?;
        Ok(Some((record.key.clone(), output.into())))
    } else {
        Ok(None)
    }
}
```

The code reads the github records from the data stream, builds an accumulator, and generates a formatted string if the number of stars or forks has changed. It also uses a `look_back` API to initalize the internal state from the last value. 

This project is also available for download on [github].

%copy first-line%
```bash
$ smdk build
```

Let's do a quick test; save the following in a file `test-data.txt`:

%copy%
```json
{"forks":143,"stars":1890}
{"forks":143,"stars":1890}
{"forks":143,"stars":1890}
{"forks":143,"stars":1889}
{"forks":143,"stars":1889}
{"forks":144,"stars":1889}
{"forks":144,"stars":1889}
{"forks":145,"stars":1890}
{"forks":146,"stars":1890}
{"forks":146,"stars":1891}
```

Run the test:

%copy first-line%
```bash
$ smdk test --file ./test-data.txt --lookback-last 1 --record '{"forks":143,"stars":1890}'
{"result":":star2: 1889"}
{"result":":flags: 144"}
{"result":":flags: 145 \n:star2: 1890"}
{"result":":flags: 146"}
{"result":":star2: 1891"}
```

Great! Our smartmodule produces a json record `result`: "..." on changes, and ignores everything else.

Load the smartmodule to the cluster:

%copy first-line%
```bash
$ smdk load 
Loading package at: ~/stars-forks-changes
Found SmartModule package: stars-forks-changes
loading module at: ~/stars-forks-changes/target/wasm32-unknown-unknown/release-lto/stars_forks_changes.wasm
Trying connection to fluvio router.infinyon.cloud:9003
Creating SmartModule: stars-forks-changes
```

Let's double-check that the smartmodule is indeed on the cluster:

%copy first-line%
```bash
$ fluvio sm list
  SMARTMODULE                              SIZE     
  infinyon/jolt@0.3.0                      612.7 KB 
  <group>/stars-forks-changes@0.1.0        52.4 KB 
```

:tada: Congratulations, you built your first smartmodule! We'll leave it as an exercise to replace the pre-built smartmodule with your own. It's simple: delete the existing connector and re-create it with the updated configuration file.


## Increase github refresh interval (optional)

Github rate-limit can be extended from 60 to 5000 queries per hour by creating an application token.
Check out github documentation on [Access Tokens].

Let's update the `github.yaml` configuration with the access token:

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: github-stars-inbound
  type: http-source
  topic: github-stars
  secrets:
    - name: GITHUB_TOKEN  
http:
  endpoint: 'https://api.github.com/repos/infinyon/fluvio'
  method: GET
  headers: 
  - 'Authorization: token ${{ secrets.GITHUB_TOKEN }}'
  interval: 30s
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            "stargazers_count": "stars"
            "forks_count": "forks"
```

Note, with the access token, we can increse the query `interval` to 30 seconds.

Add the access token to [InfinyOn Cloud] :

%copy first-line%
```bash
$ fluvio cloud secret set GITHUB_TOKEN <access-token>
```

To refresh, let's delete & create the connector again:

%copy first-line%
```bash
$ fluvio cloud connector delete github-stars-inbound
```

%copy first-line%
```bash
$ fluvio cloud connector create -c github.yaml
```

## Conclusion

This blog taught us how to build data pipelines with [Fluvio] via [InfinyOn Cloud]. Now that we built and published all the smartmodules, creating a new pipeline that reads external sources and notifies Slack or Discord is a 2 step process:

1. Create and run the `http-source` connector
2. Create and run the `http-sink` connector

All the data magic is done via smartmodules. As your custom smartmodule library grows, adding new data pipelines becomes a trivial exercise.

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
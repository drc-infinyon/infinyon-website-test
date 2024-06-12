---
title: "Github to Discord"
description: "Data pipeline that detects changes in github and publishes them as events to Discord."
weight: 41
---

Create an end-to-end event pipeline that detects changes in github stars & forks and publishes the result to Discord. This guide uses two connectors:

* [http-source]: to read periodically from a github, parse the fields from the `json` output, and publish the result to a topic. 
* [http-sink]: to listen to the same topic, detect changes, and publish the result to Discord. 

Let's get started.

## Prerequisites

* [Fluvio CLI] running locally
* Account on [InfinyOn Cloud]

## Step-by-Step

1. [Create http-source configuration file](#create-http-source-configuration-file)
2. [Create http-sink configuration file](#create-http-sink-configuration-file)
3. [Download smartmodules](#download-smartmodules)
4. [Start Connectors](#start-connectors)
5. [Test Data Pipeline](#test-data-pipeline)

### Create http-source configuration file

Create an HTTP source connector configuration file called `github.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: github-stars-in
  type: http-source
  topic: stars-forks
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

Github rate-limits API requests to 60 per hour, which you an extend to 5000 by creating an application token. Check out github documentation on how to create an [Access Tokens].

Add the access token `secret` in [InfinyOn Cloud] :

%copy%
```bash
$ fluvio cloud secret set GITHUB_TOKEN <access-token>
```

### Create http-sink configuration file

Create an HTTP source connector configuration file called `discord.yaml` :

%copy%
```yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: discord-stars-out
  type: http-sink
  topic: stars-forks
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

Check out [Discord Webhooks] on how to create a channel webhook token.

Add the access token `secret` in [InfinyOn Cloud] :

%copy%
```bash
$ fluvio cloud secret set DISCORD_TOKEN <webhook-token>
```

### Download Smartmodules

Download the smartmodules used by the connectors to your cluster:

%copy%
```bash
$ fluvio hub sm download infinyon/jolt@0.3.0
$ fluvio hub sm download infinyon-labs/stars-forks-changes@0.1.2
```


### Start Connectors

Start source & sink connectors:

%copy%
```bash
$ fluvio cloud connector create -c github.yaml
$ fluvio cloud connector create -c discord.yaml
```

Check `fluvio cloud connector log` to ensure they have been successfully provisioned.

### Test Data Pipeline

Check the last values generated by the github connector:

%copy first-line%
```bash
$ fluvio consume -dT 1 stars-forks
{"stars":1770,"forks":138}
```

Produce a new value

%copy first-line%
```bash
$ fluvio produce stars-forks
> {"stars":1769,"forks":138}
OK
```

An alert with `:star2: 1769` will show-up in your discord channel. See it live at [Fluvio Community - #alerts] channel.


### References

* [Create a Github Stars/Forks Event Pipeline (Blog)]
* [labs-stars-forks-changes-sm](https://github.com/infinyon/labs-stars-forks-changes-sm)


---

[Fluvio CLI]: https://www.fluvio.io/download
[InfinyOn Cloud]: https://infinyon.cloud/signup
[http-sink]: https://github.com/infinyon/http-sink-connector
[http-source]: https://github.com/infinyon/http-source-connector
[Access Tokens]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
[Discord Webhooks]: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
[Create a Github Stars/Forks Event Pipeline (Blog)]: https://infinyon.com/blog/2023/07/github-stars-to-slack/
[Fluvio Community - #alerts]: https://discord.com/channels/695712741381636168/961802307727683644
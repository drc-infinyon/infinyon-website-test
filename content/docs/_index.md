---
title: Quick Start - InfinyOn Cloud
menu: Quick Start 
section: Docs
description: "A certifed version of Fluvio Open Source installed and maintained by the InfinyOn team."
img: docs/images/social/placeholder.png
show-page: true
twitter-card: summary_large_image
---

This guide will outline using the [`Fluvio CLI`] with [InfinyOn Cloud] or a local [Fluvio Cluster].

1. [Install Fluvio Client (CLI)](#1-installing-fluvio-client-cli)
2. [Create an InfinyOn Cloud Account](#2-create-an-infinyon-cloud-account)
2. [Start a Cluster](#3-start-a-cluster)
3. [Produce & Consume Records](#4-produce-and-consume-records)
4. [Use Connectors](#5-use-connectors)
5. [Use StartModules](#5-use-smartmodules)
6. [Build Stateful Services](#6-build-stateful-services)

Let's get started.

## 1. Installing Fluvio Client (CLI)

You'll need to download and install the CLI.

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

This command will download the Fluvio Version Manager (fvm), Fluvio CLI (fluvio) and config files into `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`. To complete the installation, you must add the executables to your shell `$PATH`.


## 2. Create an InfinyOn Cloud Account

Create a free InfinyOn Cloud account to get access to [InfinyOn Hub]. The Hub is a data streaming store for pre-built connectors, smartmodules and other workflow components. Your InfinyOn Cloud account has `free credits`, which you may use to run Fluvio clusters in the cloud.

Head over to the [InfinyOn Cloud sign-up page] and create an account. Depending on which method you choose in account creation, you can log in with OAuth2 or username/password.

Login to InfinyOn Cloud using **Oauth**:

%copy first-line%
```bash
$ fluvio cloud login --use-oauth2
A web browser has been opened at https://infinyon-cloud.us.auth0.com/activate?user_code=GLMC-QDDJ.
Please proceed with authentication.
```

Or, login with your **Username/Password**:

%copy first-line%

```bash
$ fluvio cloud login
InfinyOn Cloud email: john@example.com
Password:
```


## 3. Start a Cluster

Use [`Fluvio CLI`] to start a cluster on InfinyOn Cloud or your local machine.

Start cluster on **InfinyOn Cloud** (must be logged in as intructed in [section 2](#2-create-an-infinyon-cloud-account)):

%copy first-line%
```bash
$ fluvio cloud cluster create
```

Or, start a **Local** cluster:

%copy first-line%

```bash
$ fluvio cluster start
```

Check out [Docker Installation] if you want to run the cluster in Docker instead.


Run the following command to check the CLI and the Cluster platform versions:

%copy first-line%
```bash
$ fluvio version
```


## 4. Produce and Consume records

#### Create your first topic

Topics are used to store data and send data streams.

You can create a topic with the following command:

%copy first-line%
```bash
$ fluvio topic create quickstart-topic
```

Where `quickstart-topic` is the name of your topic

Read more [about Topics in the Fluvio docs].

#### Produce data to your topic

You can send data (aka *produce*) to your topic.

Let's try to produce text to your topic interactively:

%copy first-line%
```bash
$ fluvio produce quickstart-topic
> hello world!
Ok!
```

Typing anything and then pressing `Enter` will send a record to your topic.

Press `Ctrl+C` to exit the interactive producer prompt.

{{% idea %}}

You may also use the following commands:

%copy first-line%
```bash
$ fluvio produce -f ./path/to/file.txt
```

Or pipe output to `fluvio`:

%copy first-line%
```bash
$ echo "hello world!" | fluvio produce quickstart-topic
```

{{% /idea %}}

Read more [about Producers in the Fluvio docs].


#### Consume data from your topic

You can read data (aka *consume*) from your topic.

This command will create a consumer that listens to your topic for new records and then prints it to the screen:

%copy first-line%
```bash
$ fluvio consume quickstart-topic
Consuming records from the end of topic 'quickstart-topic'. This will wait for new records
```

To see this in action, open another terminal and produce new data.

To see previously sent data, you can add an option to your consume command to request a starting offset with the `-B <offset>` flag. 

%copy first-line%
```bash
$ fluvio consume quickstart-topic -B -d
hello world!
```

**Flags**:
* `-B` - reads from the beginning of the stream (defaults to `0` if no value supplied).
* `-d` - closes the consumer connection after all data has been sent.

Read more [about Consumers in the Fluvio docs].


## 5. Use Connectors

InfinyOn offers [a growing number of connectors] to communicate with external services.
In this example, we will be covering the [HTTP Source] connector. The connector polls data from an HTTP endpoint that returns [a random quote] every 3 seconds to a topic called `quotes`.

Save the following configuration file on your machine:

%copy%
```yaml
# quotes-source-connector.yml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: http-quotes
  type: http-source
  topic: quotes
http:
  endpoint: https://demo-data.infinyon.com/api/quote
  interval: 3s
```

You may run the connector on InfinyOn Cloud, or your local machine.


#### Run HTTP Connector on `InfinyOn Cloud`

To start a connector in **InfinyOn Cloud**, use the following command:

%copy first-line%
```bash
$ fluvio cloud connector create -c quotes-source-connector.yml
```

Use the following command to see the connector status.

%copy first-line%
```bash
$ fluvio cloud connector list
 NAME                 TYPE               VERSION  CDK  STATUS   LOG-LEVEL 
 http-quotes          http-source        0.2.6    V3   Running  info   
```

We can monitor new data in the connector's topic with `fluvio consume quotes`

%copy first-line%
```bash
$ fluvio consume quotes
Consuming records from 'quotes'
{"quote":"We cannot solve our problems with the same thinking we used when we created them.","by":"Albert Einstein"}
{"quote":"Whatever you are, be a good one.","by":"Abraham Lincoln"}
{"quote":"You can't build a reputation on what you're going to do.","by":"Henry Ford"}
{"quote":"Success is not final, failure is not fatal: It is the courage to continue that counts.","by":"Winston Churchill"}
```

You may delete your cloud connector with the following command: `fluvio cloud connector delete http-quotes`.


#### Run HTTP Connector on your `local` machine (alternative)

We'll use [Connector Development Kit (cdk)] to download and run the HTTP Source connector from [InfinyOn Hub]. With CDK, you also have the option to build your own connectors.

List the connectors available for download:

%copy first-line%
```bash
$ cdk hub list
  CONNECTOR                          Visibility 
  infinyon/http-source@0.2.6         public
  ... 
```

Download the connector on your local machine:

%copy first-line%
```bash
cdk hub download infinyon/http-source@0.2.6
downloading infinyon/http-source@0.2.6 to infinyon-http-source-0.2.6.ipkg
... downloading complete
```

Deploy the connector: 

%copy first-line%
```bash
$ cdk deploy start --ipkg infinyon-http-source-0.2.6.ipkg -c quotes-source-connector.yml  
... checking package
Log file: ./http-source.log
Connector runs with process id: 1154
Started connector `http-quotes`
```

The quotes are produced to `quotes` topic:

%copy first-line%
```bash
$ fluvio consume quotes
Consuming records from 'quotes'
{"quote":"We cannot solve our problems with the same thinking we used when we created them.","by":"Albert Einstein"}
{"quote":"It's not whether you get knocked down, it's whether you get up.","by":"Vince Lombardi"}
{"quote":"Simply with the change of mind you can change your life.","by":"Deepak Chopra"}
```

You may delete the local connector with the following command `cdk deploy shutdown --name http-quotes`.

**Note** Your local connector produces records to the cluster in your profile `fluvio profile list`.

Read more [about Connectors in the Fluvio docs].


## 5. Use SmartModules

SmartModules are user-defined functions compiled into [WebAssembly] and applied to data streaming for inline data manipulation. You can use SmartModules in the producers, consumers, as well as Connectors. InfinyOn has several pre-compiled SmartModules that you can use out of the box. Alternatively, you use [SmartModule Developer Kit (smdk)] to build your own.

#### Download a Smartmodule from the Hub

InfinyOn Hub has a growing library of SmartModules available for download:

%copy first-line%
```bash
$ fluvio hub smartmodule list
  SMARTMODULE                              Visibility 
  infinyon-labs/array-map-json@0.1.0       public     
  infinyon-labs/dedup-filter@0.0.2         public     
  infinyon-labs/json-formatter@0.1.0       public     
  infinyon-labs/key-gen-json@0.1.0         public     
  infinyon-labs/regex-map-json@0.1.1       public     
  infinyon-labs/regex-map@0.1.0            public     
  infinyon-labs/rss-json@0.1.0             public     
  infinyon-labs/stars-forks-changes@0.1.2  public     
  infinyon/jolt@0.3.0                      public     
  infinyon/json-sql@0.2.1                  public     
  infinyon/regex-filter@0.1.0              public     
```

In the example, we'll use a [SmartModule called jolt] to turn json records into sentences.

Let's download the Smartmodule to our cluster:

%copy first-line%
```bash
$ fluvio hub smartmodule download infinyon/jolt@0.3.0
... cluster smartmodule install complete
```

Check the cluster to ensure it has been successfully downloaded:

%copy first-line%
```bash
$  fluvio smartmodule list
  SMARTMODULE          SIZE     
  infinyon/jolt@0.3.0  611.5 KB 
```

Next, we'll create a transform file and test the output.


#### Create a SmartModule transformation file

SmartModules can be chained together and often require additional parameters. Fluvio uses a YAML file is used to define the transformations.

Create a `tranforms.yaml` file and copy/paste the following definition:

%copy%
```yaml
# File: tranforms.yaml
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift 
          spec:
            quote: ""
```

Jolt is a complex Smartmodule that allows you to perform multiple types of JSON transformations. For additional information, check out the [SmartModule Jolt] docs.


#### Test the SmartModule

As the `quotes` are readily available for us in the `quotes` topic, we'll use the consumer command to test this SmartModule. 

%copy first-line%
```bash
$  fluvio consume quotes --transforms-file tranforms.yaml -T=2
Consuming records from 'quotes' starting 2 from the end of log
"The greatest glory in living lies not in never falling, but in rising every time we fall."
"Simplicity is the ultimate sophistication."
```

We are consuming the last two quotes topic records and transforming the json into a string.


#### Apply the Smartmodule to the Connector

Let's say we don't use the authors in the quotes; instead, only the quote represented strings. We can accomplish this result by simply applying the transformation to the connector.

Let's create a new `http-source` connector and add the transformation:

%copy%

{{< highlight yaml "hl_lines=11-17" >}}
# string-quotes-source-connector.yml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: string-quotes
  type: http-source
  topic: string-quotes
http:
  endpoint: https://demo-data.infinyon.com/api/quote
  interval: 3s
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift 
          spec:
            quote: ""
{{< /highlight >}}

Ready to run the connector:

%copy first-line%
```bash
$ fluvio cloud connector create -c string-quotes-source-connector.yml
```

Use the following command to see the connector status.

%copy first-line%
```bash
$ fluvio cloud connector list
 NAME                 TYPE               VERSION  CDK  STATUS   LOG-LEVEL 
 string-quotes        http-source        0.2.5    V3   Running  info      
 http-quotes          http-source        0.2.5    V3   Running  info  
```

Let's take a look at `string-quotes`

%copy first-line%
```bash
$ fluvio consume string-quotes   
Consuming records from 'string-quotes'
"It's not whether you get knocked down, it's whether you get up."
"Honesty is the first chapter in the book of wisdom."
```

We now have two topics running in parallel and producing different results with a simple SmartModule transformation. When you apply inline transformations, the number of possibilities is virtually endless.


## 6. Build Stateful Services

Stateful Services is currently in preview. With stateful services, you can chain services, accumulate state, and perform window-based aggregates.

<img src="/docs/images/stateful-services.png"
     alt="Stateful Services"
     style="margin: auto; max-width: 700px" />

If you are interested to participate in our early access release, [sign up here].


## Clean-up Resources

During this tutorial, we've created connectors that continue generating traffic to our cloud cluster. Run the following commands to clean up:

%copy%
```
fluvio cloud connector delete http-quotes
fluvio cloud connector delete string-quotes
fluvio topic delete quotes
fluvio topic delete string-quotes
```


## Next Steps

Now you're familiar with using InfinyOn Cloud with the `fluvio` CLI, Check out our [Guides] and [Tutorials].

[`fluvio profile`]: https://fluvio.io/cli/client/profile/
[`Fluvio CLI`]: https://www.fluvio.io/cli/client/overview/
[Fluvio Cluster]: https://fluvio.io
[Infinyon Cloud]: https://infinyon.cloud/
[InfinyOn Hub]: https://infinyon.cloud/hub
[Connector Development Kit (cdk)]: https://fluvio.io/cli/connectors/cdk/
[SmartModule called jolt]: https://fluvio.io/smartmodules/certified/jolt/
[SmartModule Jolt]: https://fluvio.io/smartmodules/certified/jolt/
[SmartModule Developer Kit (smdk)]: https://www.fluvio.io/smartmodules/smdk/overview/
[about Topics in the Fluvio docs]: https://www.fluvio.io/cli/cluster/topic/
[about Producers in the Fluvio docs]: https://www.fluvio.io/cli/client/produce/
[about Consumers in the Fluvio docs]: https://www.fluvio.io/cli/client/consume/
[a growing number of connectors]: https://www.fluvio.io/connectors/
[a random quote]: https://demo-data.infinyon.com/api/quote
[about Connectors in the Fluvio docs]: https://www.fluvio.io/connectors/
[HTTP Source]: https://www.fluvio.io/connectors/inbound/http/
[free Infinyon Cloud account]: https://infinyon.cloud/signup
[InfinyOn Cloud sign-up page]: https://infinyon.cloud/signup
[Docker Installation]: {{<relref "/docs/tutorials/docker-installation" >}}
[sign up here]: https://infinyon.com/request/ss-early-access/
[WebAssembly]: https://webassembly.org/
[Guides]: {{<relref "/docs/guides" >}}
[Tutorials]: {{<relref "/docs/tutorials" >}}
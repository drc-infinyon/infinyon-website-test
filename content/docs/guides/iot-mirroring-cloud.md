---
title: "IoT Mirroring - Edge VM to Cloud"
menu: "IoT Mirroring - Cloud"
weight: 50
description: "Reliable IoT monitoring from movable Edges sensors with poor connections to Cloud."
---

InfinyOn IoT edge is a **~14 Mb** binary that runs on ARMv7 chips on less than **256 MB** memory. We are working with teams building the future of monitoring dynamic assets to push the boundaries of edge data stream processing.

* If connected, InfinyOn IoT edge sends telemetry and events to the InfinyOn Cloud in real-time using mirroring.

* If disconnected, the InfinyOn IoT edge stream processor caches events locally. When the connection resumes, the InfinyOn IoT edge stream processor brings InfinyOn Cloud up to date and continues mirroring until the subsequent connection loss.

~> **EXPERIMENTAL FEATURE** <br/> Join us on <u>[Discord]</u> to give us feedback as we make this feature production ready.


## Benefits

The benefits of the InfinyOn solution are as follows:
* Reliable edge-to-cloud synchronization:
  * Real-time publishing when connected.
  * Automatic synchronization after reconnect. 
    * Edge devices can be offline for extended periods (days).
* Edge collection without downtime when disconnected. 
  * Reliable local caching for gigabytes of data.
  * Simplified logic for edge clients.
    * Edge cluster provides a reliable connection to the local clients.
* Intelligent processing at the edge with InfnyOn Smartmodules
  * filter
  * transform
  * enrich
* Hierarchical processing, where you decide where to apply the transformations.
* Built-in cloud connectors to push events to databases and other core products.


## Installation

In this toutorial we'll use VM emulator to create and edge endpoint and mirror traffic to InfinyOn Cloud.

Let's get started.


## Setup InfinyOn Cloud

Mirroring is an experimental feature using a development cluster. Please get in touch with us on [Discord] to request access for your organization. Upon approval, please continue as follows:


### Create a Cloud account

Using your web browser, navigate to [https://dev.infinyon.cloud/signup](https://dev.infinyon.cloud/signup), where this experimental feature is available.

After the account is created, you will be placed in the Dashboard. You may choose to create a cluster in the GUI. In this tutorial, we'll create a cluster using the CLI later.


### Download `fluvio` binary

Download and install mirroring binary.

~> **Note**: This is an experimental build that conflicts with other fluvio installations. To ensure proper installation, please rename or remove `~/.fluvio/` directory.

Use `curl` to download and install:

%copy%
```bash
curl -fsS https://hub.infinyon.cloud/install/install.sh | VERSION='0.10.15-dev-2+mirroring-9961bdb' bash
```

Make sure to add `.fluvio/bin` to the `$PATH`as specified in the installation script.


### Login to InfinyOn Cloud

Login to InfinyOn Cloud (dev):

%copy%
```bash
fluvio cloud login --remote=https://dev.infinyon.cloud --use-oauth2
```

Leave out `--use-oauth2` if you prefer username/password method.


### Provision a new Cluster 

Let's provision a new cluster in AWS `eu-central` using the experimental fluvio version:

%copy%
```bash
fluvio cloud cluster create --region aws-eu-central-1 --version 0.10.15-dev-2+mirroring-b4f07fc
```

Check cluster status:

%copy%
```bash
fluvio cluster status
```

Next, we'll configure the cluster to receive traffic from the edge clusters.


### Create the mirror topic

Each edge cluster mirror connects a partion of a topic, where each partition has a `1-to-1` relationship with the edge cluster.

Create a partition assignment file with an array of edge mirros we expect to connect this cluster:

%copy%
```bash
echo '[
    "edge1", "edge2"
]' > assignment_file.json
```

Apply the configuration file to create the topic:

%copy%
```bash
fluvio topic create edge-topic --mirror-assignment assignment_file.json
```

List partitions to check the assignment:

%copy%
```bash
fluvio partition list
```

It should display all partitions:

```bash
  TOPIC       PARTITION  LEADER  MIRROR        REPLICAS  RESOLUTION  SIZE  HW  LEO  LRS  FOLLOWER OFFSETS     
  edge-topic  0          5001    edge1           []        Online      0 B   0   0    0    0                 [] 
  edge-topic  1          5001    edge2           []        Online      0 B   0   0    0    0                 [] 
```

We created 2 partitions, but we'll only use one in this tutorial.


### Register Edge cluster

Let's register the edge cluster `edge1` to inform our Cloud cluster  to accept connection requests from the remote device:

%copy%
```bash
fluvio cluster remote-cluster register --type mirror-edge edge1
```

List remote clusters to check their status:

%copy%
```bash
fluvio cluster remote-cluster list
```

It should show the following:

```bash
  RemoteCluster  RemoteType   Paired  Status  Last Seen 
  edge1          mirror-edge  -       -       -         
```


### Create a new directory

In the next step, we'll create a configuration file that we'll need to pass along to the edge device. It's easier if we make a clean directory and pass it along to the VM emulator:

%copy%
```bash
mkdir -p ~/local/projects/mirror; cd ~/local/projects/mirror
```


### Generate metadata for Edge Cluster

Each edge cluster requires a unique metadata file that informs the edge cluster how to connect with the target cluster. Create the config file by running the following command:

%copy%
```bash
fluvio cluster remote-cluster metadata export --topic edge-topic --mirror edge1 --file edge1.json
```

The Cloud cluster configuration is now complete. Next, we'll create an edge cluster and configure a mirror topic that synchronizes data to the Cloud.


## Install Edge Cluster on Local VM

We'll start an edge cluster on our local computer in a VM using OrbStack.

### Instal OrbStack

We'll use OrbStack for the VM management:

1. [Install OrbStack](https://orbstack.dev)

2. Start Ubuntu VM machine.  

3. Click the VM to open a terminal.

4. Using the terminal, navigate to your data directory:

%copy%
```bash
cd local/projects/mirror
```

All files we've generated on the local machines should be visible here.


### Download fluvio binaries

Download binaries:

%copy%
```bash
curl -fsS https://hub.infinyon.cloud/install/install.sh | VERSION='0.10.15-dev-2+mirroring-9961bdb' bash
```

Add to path:

%copy%
```bash
echo 'export PATH="${HOME}/.fluvio/bin:${PATH}"' >> ~/.bashrc
source ~/.bashrc
```

Run the following command to double check:

%copy%
```bash
fluvio version
```


### Start Edge Cluster

We'll use the metadata `edge1` to start the edge cluster:

%copy%
```bash
fluvio cluster start --read-only edge1.json
```

Let's check the partitions:

%copy%
```bash
fluvio partition list
```

The edge device should show the following partition:

```bash
  TOPIC       PARTITION  LEADER  MIRROR                REPLICAS  RESOLUTION  SIZE  HW  LEO  LRS  FOLLOWER OFFSETS     
  edge-topic  0          5001    upstream:0  []        Online      0 B   0   0    0    0                 [] 
```

---


## Test 1:  Mirroring from VM Edge to Cloud

Let's produce on the Edge VM cluster and consume from the Cloud cluster.

### Produce on Edge

Produce on the `edge` terminal:

%copy%
```bash
fluvio produce edge-topic
```

```bash
> 1
Ok!
> 2
Ok!
```

### Consume from Cloud

Consume on the `cloud` terminal:

%copy%
```bash
fluvio consume edge-topic --mirror edge1 -B
```

```bash
1
2
```

Mirror test is successful.


## Test 2: Cloud Cluster Offline

To simulate a disconnect, we'll perform the following steps:

1. **Turn off** the network connection to the internet.


2. **Produce** records on the `edge` terminal.

%copy%
```bash
fluvio produce edge-topic
```

```
> 3
Ok!
> 4
Ok!
> 5
Ok!
```

3. **Turn on** the network connection and check that the data is synced.

The topic on the Cloud cluster should automatically synchronize with the edge cluster.

4. **Consume** from the `cloud` terminal:

Wait for the connection retry interval to trigger for the new records to arrive, then consume:

%copy%
```bash
fluvio consume edge-topic --mirror edge1 -B
```

```
1
2
3
4
5
```

The disconnect test was successful.



## Test 3: Edge Cluster Offline

This test ensures that the edge cluster will preserve all cached data following a power loss.

### Restart Edge Cluster

On the `edge` terminal, shutdown the cluster:

%copy%
```bash
fluvio cluster shutdown --local
```

Restart the cluster:

%copy%
```bash
fluvio cluster upgrade --read-only edge1.json 
```

### Consume from edge cluster

On the `edge` terminal, consume from the cluster:

%copy%
```bash
fluvio consume edge-topic -B
```

```
1
2
3
4
5
```

Produce records and observe that the mirror will resume the synchronization.

:tada: Congratulations! These tests confirm that the synchronization from Edge to Cloud works as expected. It is now time to roll it out in your environment. 

Join us on [Discord] if you have questions, or would like to suggest new improvements.


[Discord]: https://discord.com/invite/bBG2dTz

#### Related
* ["IoT Mirroring -  Raspberry Pi to a Local Cluster"]


["IoT Mirroring -  Raspberry Pi to a Local Cluster"]: {{<relref "iot-mirroring-local" >}}
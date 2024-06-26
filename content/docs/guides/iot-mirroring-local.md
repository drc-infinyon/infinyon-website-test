---
title: "IoT Mirroring - Raspberry Pi to Local Cluster"
skill: "🛠️ advanced"
menu: "IoT Mirroring - Local (🛠️)"
weight: 51
description: "Reliable IoT monitoring from movable or static Edges sensors."
---

This advanced tutorial reuqires a Raspberry Pi and a local installation of your collector cluster running on Kubernetes. 
Checkout the basic versino at: ["IoT Mirroring - Edge VM to Cloud"]({{<relref "iot-mirroring-cloud" >}}).

## Raspberry Pi to Local Cluster

This section will use Raspberry Pi v3 running Ubuntu 32-bit as the edge device and our local machine for the target cluster.
Let's start with installing and configuring the target cluster.


##  Install Target Cluster on Local Machine

Installing the target cluster on Linux or Mac requires Kubernetes. Use the following instructions to set up Kubernetes on your local machine.

* [Install Rancher Desktop for Mac](https://fluvio.io/docs/get-started/mac/#install-rancher-desktop)
* [Install k3d, kubectl and helm for Linux](https://fluvio.io/docs/get-started/linux/#installing-kubernetes-cluster)

-> **Note** <br/>Install _Kubernetes_, then use the instructions below to install the experimental _fluvio binaries_.


### Create a new directory

Create a clean directory for the configuration and metadata files:

%copy%
```bash
mkdir -p local/projects/mirror; cd local/projects/mirror
```


### Download `fluvio` binary

Download and install mirroring binary.

~> **Note**: This is an experimental build that conflicts with other fluvio installations. To ensure proper installation, please rename or remove `~/.fluvio/` directory.

Use `curl` to download and install:

%copy%
```bash
curl -fsS https://hub.infinyon.cloud/install/install.sh | VERSION='0.10.15-dev-2+mirroring-9961bdb' bash
```

Make sure to add `.fluvio/bin` to the `$PATH`as specified in the installation script.


### Start target cluster

Use the fluvio binary to start the cluster:

%copy%
```bash
fluvio cluster start --local
```

Check the result with:

%copy%
```bash
fluvio cluster status
```


### Create the mirror topic

Mirror topics on the upstream clusters has multiple partitions, where each partition has a `1-to-1` relationship with the edge cluster.

Create a partition assignment file to define the edge devices:

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

### Register Edge clusters

Use the `remote-cluster` CLI to register the edge clusters (edge1 and edge2) with the upstream cluster:

**Edge 1**:

%copy%
```bash
fluvio cluster remote-cluster register --type mirror-edge edge1
```

**Edge 2**:

%copy%
```bash
fluvio cluster remote-cluster register --type mirror-edge edge2
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
  edge2          mirror-edge  -       -       -         
```

### Generate Metadata for Edge Clusters

Each edge cluster requires a unique metadata file that gives the edge cluster the information to connect to the upstream cluster and the topic/mirror where the data is synchronized.

Generate a metadata file for each cluster:

**Edge 1**:

The target edge device is a Virtual Machine emulating an IoT device:

%copy%
```bash
fluvio cluster remote-cluster metadata export --topic edge-topic --mirror edge1 --upstream host.orb.internal --file edge1.json
```

**Edge 2**:

The target edge device is a Raspberry Pi device. You may skip this if you don't have such a device.

-> **Note**: The IP address of our machine where the upstream server is running is `192.168.79.252`.  Please identify your own IP address and replace it in the command below.  

%copy%
```bash
fluvio cluster remote-cluster metadata export --topic edge-topic --mirror edge2 --upstream 192.168.79.252 --file edge2.json
```

We'll transfer these files to edge devices in the following sections.

# Install Edge Cluster on Raspberry Pi (optional)

We'll use the same procedure as before to mirror from Raspberry Pi to the same upstream cluster.
The test below was performed on a Raspberry Pi v3 running Ubuntu 32-bit image.

### Download metadata file

We'll use the metadata file `edge2.json` that we've exported above to provision this device.

-> **Note**: Iddentify the IP address of your Raspberry Pi device and it replace below

Using the `upstream` terminal, let's scp the `edge2.json` file to the edge device:

%copy%
```bash
scp edge2.json fluvio@192.168.79.139:~
```

### Login into the edge device

Spawn a new terminal and login into the Raspberry Pi:

%copy%
```bash
ssh fluvio@192.168.79.139
```

### Download fluvio binaries

On the raspberry pi, run the following command:

%copy%
```bash
curl -fsS https://hub.infinyon.cloud/install/install.sh | VERSION='0.10.15-dev-2+mirroring-9961bdb' bash
```

Run `fluvio version` to double check.

### Start cluster

We'll use the metadata file to start the edge cluster on the Raspberry Pi:

%copy%
```bash
fluvio cluster start --read-only edge2.json
```

Let's check the partitions:

%copy%
```bash
fluvio partition list
```

The edge device should show the following partition::

```bash
  TOPIC       PARTITION  LEADER  MIRROR                REPLICAS  RESOLUTION  SIZE  HW  LEO  LRS  FOLLOWER OFFSETS     
  edge-topic  0          5001    Source:upstream:5001  []        Online      0 B   11  11   11   0                 [] 
```


---

## Test 1:  Mirror from Raspberry Pi Edge to Upstream 

Let's produce on the Raspberry Pi and consume from the upstream cluster.

### Produce to edge cluster

Produce on the `pi` terminal:

%copy%
```bash
fluvio produce edge-topic
```

```bash
> A
Ok!
> B
Ok!
```

### Consume from upstream

Consume on the `upstream` terminal:

```bash
fluvio consume edge-topic --mirror edge2 -B 
```

```bash
A
B
```

Mirror test is successful.



## Test2:  Upstream Cluster Offline

Shutdown the upstream cluster and check that the edge cluster can continue receiving records. Then, resume the upstream cluster and ensure the data is synchronized and can consumed on both sides.

### Shutdown upstream cluster

On the `upstream` terminal, shutdown the cluster:

%copy%
```bash
fluvio cluster shutdown --local
kubectl delete spu custom-spu-5001
```

Ensure the cluster is shutdown:

%copy%
```bash
 fluvio cluster status
```

### On edge cluster

Produce a few more records on the `pi` terminal:

```bash
fluvio produce edge-topic
```

```
C
D
E
```

### Reconnect upstream cluster & consume from topic

On the `upstream` terminal, restart the cluster:

%copy%
```bash
fluvio cluster upgrade --local
```

The topic on the upstream cluster should automatically synchronize with the edge cluster.

-> **Note**: Wait for the connection retry interval to trigger for the new records to arrive.

Let's consume: 

%copy%
```bash
fluvio-0.10.15 consume edge-topic --mirror edge2 -B
```

```
A
B
C
D
E
```

The disconnect test was successful.



## Test 3: Edge Cluster Offline

This test ensures that the edge cluster will not lose data following a power loss.

### Restart edge cluster

On the `edge` terminal, shutdown the cluster:

%copy%
```bash
fluvio cluster shutdown --local
```

Restart the cluster:

%copy%
```bash
fluvio cluster upgrade --read-only edge2.json 
```

### Consume from edge cluster

On the `pi` terminal, consume from the cluster:

%copy%
```bash
fluvio consume edge-topic -B
```

```
A
B
C
D
E
```

Produce records and observe that the mirror will resume the synchronization.

:tada: Congratulations! You have successfully tested edge mirroring using Rapsberry Pi. It is now time to roll it out in your environment.


[Discord]: https://discord.com/invite/bBG2dTz
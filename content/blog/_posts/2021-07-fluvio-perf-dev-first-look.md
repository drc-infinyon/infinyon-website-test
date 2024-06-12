---
title: "First look at Fluvio's Performance in Development"
author:
    name: "T.J. Telan"
    github: "tjtelan"
description: ""
date: 2021-07-18
slug: fluvio-perf-dev-first-look
url: /blog/2021/07/fluvio-perf-dev-first-look
img: blog/images/
twitter-card: summary_large_image
hidden: true
---

Fluvio is a distributed streaming platform written in Rust. One of our primary goals with Fluvio is to provide excellent performance, especially with regard to latency.

However, until now we haven't had a comprehensive benchmarking suite to help us pinpoint exactly where we stand in terms of concrete numbers. We've been hard at work building up our benchmark game, so in this post we're going to talk about what we've discovered about where we are and what we've learned about where we can improve.

 >   Fluvio is still in alpha and we have not spent much time optimizing for performance, so we welcome constructive feedback with respect to performance development and measurement.

### Testing Methodology 

My methodology took inspiration from the [Pulsar performance report], the [Confluent report], and [Open Messaging Benchmark].

We will be sharing performance metrics of our workflow in terms of:

| Performance metrics | Source of metric |
|---------------------|------------------|
| Max Throughput | <ul><li>Maximum value observed from all records produced. Calculated by: `Size of Records sent from Producer` / `Produce Latency Time`</li><li>Maximum value observed from all records consumed. Calculated by: `Size of Records received by Consumer`/ `Consume Latency Time` </li></ul> |
| Latency | <ul><li>Time starting when Producer sends a record to a topic, until the record reported received by Fluvio</li><li>Time starting when Consumer start and completes downloading a record from a topic</li><li>The combined End-to-End (E2E) time from the same record being sent by the Producer then received by a Consumer</li></ul>
| Host machine resource usage | <ul><li>Memory, by sampling the difference between starting memory and current memory</li><li>CPU, by sampling the current CPU load average</li></ul> |

We will only be measuring one workflow against [locally installed Fluvio cluster](https://www.fluvio.io/download/) because it is the most common type of cluster application developers will use (other than our [Fluvio Cloud](https://cloud.fluvio.io/signup) service).

> A [Topic] is a handle that Producers or Consumers use to interact with a Fluvio data stream. They can be configured for parallelism (with partitions) or data resilency (with replication). 

[Topic]: (https://www.fluvio.io/docs/architecture/topic-partitions/)

The test starts with our producers sending 10K records (~1KB each) to a Fluvio topic.

> A Producer is an client that streams data to the Fluvio cluster, via a topic.

[Producer]: (https://www.fluvio.io/docs/connect/producer/)

At the same time a consumer starts listening to a topic for new records, until all 10K records are received.

> A Consumer is an client that requests a data stream from the Fluvio cluster, via topic

[Consumer]: (https://www.fluvio.io/docs/connect/consumer/)

We use our custom test harness to do the cluster testing that created the data for the visualizations we’re going to share. (Shameless self-promotion: If you’re a Rust dev too, just so you know, I also [wrote a post about writing your own custom test harness]({{< ref "/blog/_posts/2021-04-rust-custom-test-harness">}}) including why and how we did it. But it is not required reading for this post.)

Note: We did not use Open Messaging Benchmark even though we have a [Java client](https://www.fluvio.io/api/fluvio/java/), on account of my struggle-failure to set it up to reproduce Pulsar or Kafka tests.

Perhaps in a future report if there is enough interest? Let me know!

[Pulsar performance report]: https://streamnative.io/en/blog/tech/2020-11-09-benchmark-pulsar-kafka-performance-report
[Confluent report]: https://www.confluent.io/blog/kafka-fastest-messaging-system/
[Open Messaging Benchmark]: https://github.com/openmessaging/openmessaging-benchmark

### Host and Cluster configuration

#### Test Host 

| Host environment  |            |
|-------------------|------------|
| AWS instance type | i3.4xlarge |
| Rust version      | 1.53.0     |
| Fluvio version    | 0.8.5      |

All our testing is run off of a single [i3.4xlarge](https://aws.amazon.com/ec2/instance-types/). 

| Instance | vCPU | Mem (GiB) | Local Storage (GB) | Networking Performance (Gbps) |
|----------|------|-----------|--------------------|-------------------------------|
| i3.4xlarge | 16 | 122 | 2 x 1,900 NVMe SSD | Up to 10 |

This is the same instance type referenced in [Pulsar](https://github.com/openmessaging/openmessaging-benchmark/blob/master/driver-pulsar/deploy/terraform.tfvars) and [Kafka](https://github.com/openmessaging/openmessaging-benchmark/blob/master/driver-kafka/deploy/ssd-deployment/terraform.tfvars)'s Terraform vars in the Open Messaging Benchmark repo.

#### Cluster 
We will test using 1 type of Fluvio cluster and comparing their results with other relatable benchmarks when possible.

1. [Running a Fluvio cluster locally](https://www.fluvio.io/docs/get-started/linux/#start-fluvio-cluster), which is common for devs working locally on their own applications.

We will configure our [topics](https://www.fluvio.io/docs/architecture/topic-partitions/), the storage for our test events, with different replication settings:
* The Fluvio cluster is using 3 stream processing units or [SPU](https://www.fluvio.io/docs/architecture/spu/) (equivilent to Kafka/Pulsar "brokers") and the topic is configured for 3x replication.

| Cluster instance | # SPU | Topic partitions | Topic replication |
|------------------|-------|------------------|-------------------|
| Fluvio | 3 | 1 | 3x |

(The Fluvio cluster is similar to the configuration used in Pulsar's configuration for [Max throughput #4](https://streamnative.io/en/blog/tech/2020-11-09-benchmark-pulsar-kafka-performance-report#4-1-partition-1-subscription-1-producer-and-1-consumer). Our test measurements don't properly support partitions at the time of this writing.)

---
Now let's get on with the test results.

## Max Throughput

> This is the quantity of our record size sent/received within a period of time. Such as the latency of our producer or consumer. 
> 
> `Data tranfer size` / `Data transfer latency`
> 
> We'll be measuring throughput in Megabytes per second (MB/s). Larger values are desired.


### Producer

First we’re going to check out the maximum data rate. We transfered 10MB (10K records with ~1KB message sizes) from the Producer and to Consumer and calculated the throughput. Higher values are better.

| Producer Throughput | Bytes | Max rate (MBytes/s) |
|---------------------|-------|---------------------|
| Fluvio | 10358890 | 1.50 |

The closest data comparison we have from chart data from [Pulsar's Max Throughput #4](https://streamnative.io/en/blog/tech/2020-11-09-benchmark-pulsar-kafka-performance-report#4-1-partition-1-subscription-1-producer-and-1-consumer) Figure #7.

| Producer Throughput | Max rate (MBytes/s) |
|---------------------|--------------------|
| Kafka (ack-1) | ~230 |
| Pulsar (ack-1) | ~300 |

My first thought was that these results were a bit slow for sending ~10MB, if we compare the the rates seen by the more mature Pulsar or Kafka. However, now we know, and we can improve these rates with some optimization. 

### Consumer 

For the Consumer, we see higher values than the Producer.

| Consumer Throughput | Bytes | Max rate (MBytes/s) |
|---------------------|-------|---------------------|
| Fluvio | 10358890 | 4.75 |

## Latency

> Another commonly used term for latency is “response time”.
> 
> The reason we use latency as a quantitative measure of user experience is because users equate fast and accurate service with high quality. We'll be measuring latency in milliseconds (ms).
> 
> Smaller values of latency are desired.
> 
> (For more background on latency as a metric, check out this [very approachable post on latency](https://igor.io/latency/) which covers the math tools for measuring and how to interpret latency.)


Next we'll review the latency of the Producer uploading a record, a Consumer downloading and the End-to-End (E2E) latency of the Producer and Consumer. Lower values are better.

### Producer

For the producer latency, we measure the time to send 10K records. These contents of these records include a 1KB payload, plus some metadata and a timestamp used by the E2E measurement.

We have the Producer latency over the test run on the left, and the data organized into their percentiles. What we can see from the percentile chart is mostly how low the values are on the left-side of the chart. We see in the 99.9th percentile that we see the latency increase. 

<img src="/blog/images/fluvio-perf-dev-first-look/dev-producer.png"
     alt=""
     style="justify: center;" />

| Producer Latency | Average | P50 | P90 | P99 | P999 |
|------------------|---------|-----|-----|-----|------|
| Fluvio | 1.20ms | 1.26ms | 1.57ms | 1.89ms | 7.14ms  |


>Average is calculated by adding up all the measurement values, and dividing by the number of measurements. But it is given as just one of the aggregated values for our test results. Its intention is to communicate the common performance, but may be [misleading in certain contexts, such as latency](https://igor.io/latency/#average). So when we talk about latency, we offer averages with percentile measurements.
> 
> Percentiles are another calculated value based on the collection of measured values. They are a useful tool for communicating the distribution at different slices of the raw data.
> 
> We describe our latency results with multiple percentile values: P50, P99, P999 to describe the worst latency experienced by 50%, 99% and 99.9% of all requests.

---

The closest data comparison we have from chart data from [Pulsar's Max Throughput #4](https://streamnative.io/en/blog/tech/2020-11-09-benchmark-pulsar-kafka-performance-report#4-1-partition-1-subscription-1-producer-and-1-consumer) Figure 8.

| Producer Latency | P50 | P90 | P99 | P999 |
|------------------|-----|-----|-----|------|
| Kafka (ack-1)  | ~136ms | ~141ms | ~155ms | ~191ms |
| Pulsar (ack-1)  | ~8ms | ~10ms | ~11ms | ~22ms |

### Consumer

Consumer latency is time between when the Consumer starts an attempt to stream a record, and when it succeeds.

The Consumer also appears to have consistent latency. Glancing at the percentile graph, latency minimally increases until we look above the 99th percentile.

<img src="/blog/images/fluvio-perf-dev-first-look/dev-consumer.png"
     alt=""
     style="justify: center;" />

| Consumer Latency | Average | P50 | P90 | P99 | P999 |
|------------------|---------|-----|-----|-----|------|
| Fluvio | 11.37ms | 11.47ms | 11.80ms | 12.12ms | 21.50ms |

### E2E

The E2E charts look similar to the Consumer, signaling that the Consumer latency primarily represents the E2E experience, with the Producer latency contributing an overall smaller share of time. Whatever the reason may be for this Consumer latency, we still see that consistent percentile line until the P999.

<img src="/blog/images/fluvio-perf-dev-first-look/dev-e2e.png"
     alt=""
     style="justify: center;" />

| E2E Latency | Average | P50 | P90 | P99 | P999 |
|-------------|---------|-----|-----|-----|------|
| Fluvio | 11.99ms | 12.12ms | 12.39ms | 12.91ms | 18.87ms |

The closest data comparison we have from chart data from [Pulsar's Max Throughput #4](https://streamnative.io/en/blog/tech/2020-11-09-benchmark-pulsar-kafka-performance-report#4-1-partition-1-subscription-1-producer-and-1-consumer) Figure 9.

| Producer Latency | P50 | P90 | P99 | P999 |
|------------------|-----|-----|-----|------|
| Kafka (ack-1)  | ~171ms | ~177ms | ~203ms | ~227ms |
| Pulsar (ack-1)  | ~40ms | ~41ms | ~43ms | ~57ms |


### Memory usage

To measure memory usage, we take the snapshot of memory usage at the beginning of the test, and frequently sample the difference between the beginning usage and current usage.

One way to describe the memory usage over time is that it slowly increases, and occasionally jumps in usage by several megabytes before jumping back down to the main trend line.

We want to take these measurements, because one of the facts of Fluvio is that it is developed in Rust instead of a JVM language, which has a reputation of requiring memory tuning for their applications. As such, it is imperative that we show our memory usage.

I am unaware of any official memory usage benchmarks from Kafka or Pulsar to compare against, but we wanted to capture where we are now so we can follow up in the future.

<img src="/blog/images/fluvio-perf-dev-first-look/dev-memory.png"
     alt=""
     style="justify: center;" />

| Max Memory usage | MB |
|------------------|----|
| Fluvio | 21  |

### CPU

Just out of curiosity, we took measurements of CPU utilization during the tests too.

<img src="/blog/images/fluvio-perf-dev-first-look/dev-cpu.png"
     alt=""
     style="justify: center;" />

| Max CPU usage | % |
|---------------|---|
| Fluvio | 315  |

### Conclusion

Our memory footprint is fairly low compared to a JVM application. But our latency for sending records to and from a Fluvio cluster are consistent. 

We will continue to improve Fluvio, and report back. You can join our journey by signing up for [Fluvio Cloud](https://cloud.fluvio.io/signup), trying out Fluvio [locally](https://www.fluvio.io/docs/get-started/linux/) or giving us some [Github stars](https://github.com/infinyon/fluvio/stargazers/)!
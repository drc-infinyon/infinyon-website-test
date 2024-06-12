---
title: "Announcing InfinyOn Cloud's interactive real-time stream editor"
author:
    name: "Nick Cardin"
    github: "nacardin"
description: "InfinyOn Cloud adds new capabilities to enable interactive exploration and manipulation of streaming data."
metadata:
    - NEWS
    - CLOUD
date: 2021-08-19
slug: cloud-interactive-ui
url: /blog/2021/08/cloud-interactive-ui
img: blog/images/cloud-interactive-ui/social/infinyon-cloud.png
twitter-card: summary_large_image
hidden: true
---

We're excited to announce that [InfinyOn Cloud] has a new interactive web user interface for managing [Fluvio](https://www.fluvio.io) clusters which allows users to produce, consume, and manipulate data.

If you are unfamiliar with Fluvio, it is an open-source, high-performance distributed data streaming platform for real-time apps written in Rust. Infinyon Cloud provisions, manages, and scales your Fluvio cluster for you, so that you can focus on your data.

<video controls width="860px">
  <source src="/blog/images/cloud-interactive-ui/infinyon-cloud.mp4">
</video>

## Interactive UI

The new UI allows you to configure and monitor your cluster without switching to external tools such as the [Fluvio CLI](https://www.fluvio.io/download/). You now are able to view, create, and delete topics.

<img src="/blog/images/cloud-interactive-ui/topics.png"
     alt="Interactive UI"
     style="margin: auto; max-width: 591px" />

By selecting a topic you are presented with tabs for interacting with partitions, records, and SmartModules.

<img src="/blog/images/cloud-interactive-ui/statistics.png"
     alt="Statistics"
     style="margin: auto; max-width: 596px" />

### Low Latency

We're able to enable low latency access directly from the web UI to the Fluvio Cluster by using WebSockets. WebSockets allows bi-directional communication in binary format with as little overhead as TCP. We run the official Fluvio client directly in the web browser by compiling it to WebAssembly. This allows us to efficiently encode and decode Fluvio messages directly in the browser. This eliminates the need to use an intermediate format such as JSON, which would require us to buffer and transform messages in a separate backend component, which would add latency. This is significant since Fluvio is used for real-time, high-throughput applications, where even small amounts of latency and overhead are amplified and affect performance.

### Producing and Consuming

Under the Records tab you can produce new data to a topic and also consume all previously produced data and new data in realtime. This serves as a starting point for experimenting with the Fluvio platform. Once you are up and running with external producers and/or consumers, it serves as a debugging tool to quickly inspect your data stream and inject test data as needed.

<img src="/blog/images/cloud-interactive-ui/records.png"
     alt="Records"
     style="margin: auto; max-width: 593px" />

### SmartModule Editor

The [SmartModules]({{<ref "2021-06-smartmodule-filter.md" >}}) editor is an easy way to experience the powerful compute engine built into Fluvio. The editor currently allows you to create a filter program which filters the records in the current topic. The program has access to the bytes of each record so that it can perform any computation on the record to determine whether to filter. The editor will soon also support SmartModuels of type "map", which allows transforming the record contents into any desired format.

The editor is initialized with a simple filter which only allows records which contain the character "a". Clicking "Apply" compiles the filter program into a WASM module and uploads it to the SPU for execution. The result is streamed back to the UI and displayed to you. If the code is invalid, the compilation errors are displayed in the "Console" tab. You may create new records on this page and observe the filter being applied to your input in real-time.

<img src="/blog/images/cloud-interactive-ui/editor.png"
     alt="SmartModule Editor"
     style="margin: auto; max-width: 595px" />

Once satisfied with the code, you may compile it yourself, see instructions in  [SmartModules Quick Start Guide](https://www.fluvio.io/smartmodules), and use it with the Fluvio client in your applications.

Currently the editor only supports writing the program in Rust, however it's possible to write SmartModules in any language that can be compiled to WebAssembly. We chose Rust as the language to start with as our platform itself is written in it. We plan to add support for more languages in the editor.

## Summary

Setting up a real-time data streaming app with our platform just became easier.

Don't forget to join the conversation on
[Discord](https://discordapp.com/invite/bBG2dTz), follow [the project on
github](https://github.com/infinyon/fluvio/watchers) or open an
[issue](https://github.com/infinyon/fluvio/issues) if you find a bug or have a
feature request.
[InfinyOn Cloud]: https://infinyon.cloud/signup?utm_campaign=cloudui&utm_source=website&utm_medium=blog&utm_term=cloudui&utm_content=cloud-registration

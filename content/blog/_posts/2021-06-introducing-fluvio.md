---
title: "Introducing Fluvio: The Programmable Data Platform"
author:
    name: "Sehyo Chang"
    github: "sehz"
    title: "Co-founder & CTO"
description: "Fluvio is a blazing-fast programmable streaming platform for data-in-motion. Apply your own custom logic to protect, normalize, and enrich the data as it moves between services."
date: 2021-06-28
metadata:
    - NEWS
    - TECH
slug: introducing-fluvio
url: /blog/2021/06/introducing-fluvio
img: blog/images/intro-fluvio/introducing-fluvio.png
twitter-card: summary_large_image
---

In the last few years, organizations started to adopt [stream processing](https://www.sigops.org/2020/streams/) architectures to power a new generation of data-driven services that can detect events, predict behaviors, and respond to customer demand in real-time. As these early pilots become production-ready services, organizations gradually expand these stream processing and analytics pipelines to other services. Moreover, as data volumes double every few years, organizations that extract valuable and relevant business signals in the shortest amount of time gain a significant competitive advantage. We believe organizations that choose data streaming technology will enjoy an impactful, long-lasting competitive advantage.

## Yesterday's Monolithic Stream Processing Platforms

Most stream processing frameworks available today - [Kafka](https://kafka.apache.org/), [Pulsar](https://pulsar.apache.org/), [Flink](https://flink.apache.org/), [Spark](https://spark.apache.org/), etc. - were born in the [Big Data era](https://www.predictiveanalyticsworld.com/machinelearningtimes/the-death-of-big-data-and-the-emergence-of-the-multi-cloud-era/10527/) and designed as monolithic platforms that require sizeable specialized staff to deploy, operate and maintain. Some admin operations such as setting up data sharing or re-balancing stream after config update require an IT ticket to be handled by the operation team.

These Java-based stream processing platforms assume a homogenous and monolithic enterprise development environment of Y2000 where one language rules it all.  Some have reluctantly added partial support for Python.  Other languages such as Node, Go, Ruby offer a subset of functionality in independent client libraries. However, Java-derived languages remains the only reliable way to customize stream processing.  This barrier makes it difficult for many non-Java developer communities to leverage the power of real-time stream processing.  [Github expects 100M developers by 2025](https://www.infoworld.com/article/3599874/github-expects-100-million-software-developers-by-2025.html); most of them will be new developers and will not be familiar with Java.

[Softbank estimates over 1 trillion devices connected on the Internet of things by 2025](https://venturebeat.com/2018/10/16/softbank-believes-1-trillion-connected-devices-will-create-11-trillion-in-value-by-2025/) driven by wearables, drones, self-driving cars, inter-connected devices, and more. These networks need stream processing for immediate feedback and real-time analytics for mission-critical decisions. Java-based systems demand significant CPU and memory resources, making them unsuitable for extending stream processing to edge devices.

One of the most significant drawbacks of Java-based stream processing frameworks is the `Jar` wrapper required for distribution.  [Jars](https://en.wikipedia.org/wiki/JAR_(file_format)) were designed at the dawn of the Internet when Browsers were rudimentary HTML readers and programs required runtime applets (aka. sandboxes) to operate.  These sandboxes have been riddled with security vulnerabilities, and new browsers are gradually deprecating them.  Some frameworks resorted to container technologies such as [Docker](https://www.aquasec.com/cloud-native-academy/docker-container/) to add another layer of isolation and a workaround for dynamic loading.  Unfortunately, the container introduces another layer of [security issues](https://techbeacon.com/enterprise-it/container-security-what-you-need-know-about-nist-standards) and introduces more latencies and [cold-startup](https://builtin.com/software-engineering-perspectives/cold-starts-challenge-serverless-architecture) time.

The lack of adequate tooling available in the market makes the journey to real-time data stream processing challenging, error-prone, and packed with customizations often reserved for organizations with highly skilled architects and a virtually unlimited budget.

## Democratizing data-in-motion

Companies are striving to accelerate digital transformation and become agile data-driven organizations. Yet data is a precious asset often locked down in data lakes or specialized data silos and managed by data teams responsible for storage and safekeeping. As a result, data users lack visibility on what data is available to them and must wait on a lengthy approval process to gain access. This segregated approach to data hinders learning, prevents fast-paced innovation, and ultimately slows down the pace of the business. The <a href="https://martinfowler.com/articles/data-monolith-to-mesh.html" target="_blank">Data Mesh</a> white paper written by Zhamak Dehghani explains how current data paradigms are ill-suited for modern organizations.

Monolithic data lakes and data silos should be divided into data domains and managed by decentralized teams. These data owners treat data as products and manage the data lifecycle end-to-end. They are responsible for data discovery, quality, and the SLA required by data consumers. This level of autonomy is critical for stream processing, where teams are responsible for generating actionable signals in real-time.

Democratized stream processing requires a self-serviced operational model on top of shared infrastructure. In this model, an infrastructure maintains the shared infrastructure, and the data domain team manages the data. The infrastructure team scales on-demand and re-balances the data dynamically across entire organizations. The data domain teams operate their data stream products independently and export interfaces as needed.

A modern streaming platform must have the following attributes to meet these conditions:

### Cloud-Native by design

[Cloud-native-based](https://www.redhat.com/en/topics/cloud-native-apps) infrastructure is a loosely coupled system where each component can run and scale dynamically. As a result, these systems are well suited for dynamic platforms such as public, private clouds. The cloud-native streaming platform offer:

* **Horizontal scale** -  to meet data elasticity requirements.
* **Self-healing** - to recover from failures without human intervention.
* **Declarative management** - to reduce the management burden.
* **Kubernetes native** - to plug-in native in K8 environments.

### Small footprint and resource-efficient

The data-at-motion stream processing must handle an order of magnitude higher data than the products storing data-at-rest. Consequently, stream process platforms must be small enough to boot within milliseconds and operate efficiently on any system architecture. Moreover, it must support a variety of deployments from small organizations to large enterprises. The ideal platform has:

* **Small memory footing** - to save on cloud resources and run on IoT devices.
* **Low latency** - to meet real-time latency requirements.
* **Leverage multi-core CPU architecture** - to operate at maximum performance.
* **Fully event-driven with async architecture** - to support large I/O.

### Support Data protection and isolation

Shared infrastructures require a new level of security and privacy protection.  In today's [zero-trust](https://en.wikipedia.org/wiki/Zero_trust_security_model) environment, data centers, clouds, and edges are considered [**insecure by default**](https://media.defense.gov/2021/Feb/25/2002588479/-1/-1/0/CSI_EMBRACING_ZT_SECURITY_MODEL_UOO115131-21.PDF).  Products for data-in-motion must segregate data streams and isolate users and teams from each other.  Fine-grained context-area rules are used to define:

* **Roles** - to limit user access based on their role in a group and organization.
* **Geo-Locations** - to restrict access based on geographical location.
* **Identities** - to recognize and process data based on their identity.

Stream processing engines with access to data must have a robust **sandboxing environment** that can enforce access control and protect data records from impacting each other.

### Full featured data APIs

All companies are becoming technology companies. Since each team is the owner of their data, they must have API and tools to automate the data product.  The self-service stream processing platform must offer granular APIs for developers who want to build robust real-time data services and ease-to-use tools for non-technical users.  While SQL-based tools may be adequate for querying data-at-rest or a data lake, they offer limited functionality for developers who need full API access for automation.  Data owners need the ability to

* Customize and manage Data Lifecycle.
* Orchestrate long-running data process.
* Assign declarative API for stream processing.

Development APIs must be available in many widely used programming languages such as Node/JavaScript, Python, Go, Ruby, etc.

### Support for data governance

Self-service and de-centralization allow teams to become independent data owners.  However, to leverage the team's data as a whole, self-service infrastructure must implement federal governance to aggregate and correlate data cross-organization with policy enforcement.  Consumers and regulatory agencies have raised expectations for data protection and securities by regulating access to [PII](https://en.wikipedia.org/wiki/Personal_data) and imposing consumer data protection policies such as [GDPR](https://gdpr.eu).

The shared platform is well-positioned to implement federal data governess by baking consistent interoperability and policy standards across teams in conjunction with common access control and audit trails.

## Fluvio: Programmable Platform for Data-in-motion

At [Infinyon](https://www.infinyon.com), we are building [Fluvio](https://www.fluvio.io) as a purpose-built stream processing platform for data-in-motion. Although the platform starts with similar standard stream processing functionalities such as consumer and producer as with legacy Java-based stream processing frameworks, [Fluvio’s](https://www.fluvio.io) performance, scalability, deployment flexibility, and programmability allow building the data-in-motion infrastructure of the future.

### Powered by Rust

We start with a strong foundation; The [Rust](https://www.rust-lang.org) language powers [Fluvio](https://www.fluvio.io). Rust, a modern programming language built for speed, low overhead, cross-platform interoperability, and code safety.  AWS, Mozilla, Google, Facebook, Discord, Dropbox, and others use [Rust](https://www.rust-lang.org) to create a new class of high-performance products, such as browsers, chat servers, network proxies, database servers, real-time systems, and more.

[Fluvio](https://www.fluvio.io) needs to perform stream processing at a massive scale.  By choosing [Rust](https://www.rust-lang.org), we gained the following benefits:

#### Performance by Default

[Rust](https://www.rust-lang.org) compiles to native code for blazing-fast [performance](https://www.nature.com/articles/d41586-020-03382-2). Without [Garbage Collector](https://www.eginnovations.com/blog/what-is-garbage-collection-java/) pauses, [Rust](https://www.rust-lang.org) can process streams with very low consistent [latency](https://www.pubnub.com/blog/how-fast-is-realtime-human-perception-and-technology/). The language implements a zero-cost [async](https://blog.logrocket.com/a-practical-guide-to-async-in-rust/) framework capable of handling many concurrent I/O streams with minimum CPU usage. Rust developers can write high-level functional code similar to Java and Python without rolling out hand-crafted machine code to get performance.  Performance and zero-cost cost abstraction make Rust an ideal language for data-in-motion.

#### Safety by Default

Rust is [**safe by default**](https://msrc-blog.microsoft.com/2019/07/22/why-rust-for-safe-systems-programming/) programming language, unlike any other language such as C, C++, Go, or other.  It performs many safety checks during compile time instead of discovering fault during production.  Rust doesn't allow [NULL](https://blog.knoldus.com/rust-can-never-be-null/), which happens to be one of the worst in the software mistakes.  With borrow checker,  Rust prevents [buffer overflow](https://owasp.org/www-community/vulnerabilities/Buffer_Overflow) and dangling pointer that malicious hackers could take advantage of.  Microsoft stated that memory safety issues cause [70% of CVE in Windows](https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/).  The borrow checkers also check for concurrent logic, which is essential for creating scalable stream processing infrastructure

Safety and Performance of Rust enable the Fluvio community to ship a robust, high-performance data streaming platform from day one.

### Cloud-Native Control Plane

[Fluvio’s](https://www.fluvio.io) control plane took its inspiration from [Kubernetes](https://kubernetes.io). [Fluvio](https://www.fluvio.io) manages its software components using declarative programming with eventual consistency. With declarative management, the user specifies intent, and the platform attempts to fulfill the request by feedback loop monitoring controllers. For example, wait for additional resources, re-balance workloads, perform reconciliation, trigger self-healing from hardware or software failures, and more.

[Fluvio](https://www.fluvio.io) objects can be provisioned through various mechanisms: Kubernetes (kubectl) commands, Fluvio CLI, Infinyon Cloud, or programmatic admin API available in all supported programming languages.

### SmartModules: Programmable Stream Processing

At the heart of all stream-processing frameworks is the [Stream Processor](https://medium.com/stream-processing/what-is-stream-processing-1eadfca11b97).  SP treats a stream as the core unit of work.  Most of the legacy SP uses a fixed pipeline, which only implements fixed subsets of data-in-motion needs:

* Ingestion
* Persistence
* Transmission
* Dispatching
* Computation (filters, maps, aggregates, joins, derivates)


[Fluvio’s](https://www.fluvio.io) [SPU (Stream Processing Unit)](https://www.fluvio.io/docs/architecture/spu/) comes with a revolutionary programmable stream pipeline.  Data-in-motion pipelines need more customization than data-at-rest.  For example, filtering and cleaning data, idempotent producers, and others.   With a Java-based streaming framework, it is challenging to provide a programmable pipeline with performance and security.

#### Programmability by WebAssembly

[SPU](https://www.fluvio.io/docs/architecture/spu/) implements programmability by integration with [WebAssembly](https://webassembly.org) technology. [WebAssembly](https://webassembly.org) is a portable binary-code format designed to run in a [secure sandbox](https://webassembly.org/docs/security/).  It is proven W3 technology to bring programmability to software such as [Envoy Proxy](https://istio.io/latest/blog/2020/wasm-announce/), [Cloudflare worker](https://blog.cloudflare.com/webassembly-on-cloudflare-workers/), [Microsoft flight simulator](https://forums.flightsimulator.com/t/getting-started-with-wasm/343390), CDN proxies, and more.  [SmartModules](https://www.fluvio.io/smartmodules/) bring WebAssembly technology to real-time data streaming offering an unprecedented level of customization.

SPU's programmability capabilities eliminate the need to stitching together multiple clusters, as seen in other data streaming platforms. Smart pipelines runs at native speed, decreasing delays, increasing security, and reducing operational complexity.

##### Secure by Default

[SmartModules](https://www.fluvio.io/smartmodules/) separates user stream operations from system stream.   All user stream operations are executed as a WebAssembly module in a protected sandbox with separate [memory space](https://hacks.mozilla.org/2017/07/memory-in-webassembly-and-why-its-safer-than-you-think/) for user operations.  Since user modules can only access data supplied by SmartModules, it can't access or modify protected information as PII data.

##### Fast Inline Computation

With processing time measured in low milliseconds, [SmartModules](https://www.fluvio.io/smartmodules/) offer the fastest and most convenient way to manipulate data in motion. A Java-based system performing a similar operation in memory-hungry JARS would see delays from 10 to 100 fold higher with garbage collection and out-of-band management. A container-based system performing a similar function has a significantly higher image size and an out-of-band communication channel, increasing startup time and introducing communication overhead.

##### Support any development language

WebAssembly supports any language with bindings to the [LLVM toolchain](https://llvm.org) - Rust, JavaScript, Python, Ruby, and Go.  [Fluvio](https://www.fluvio.io) offers abstractions, templates, utilities, and tools to make it easy and convenient to build and customize stream processing modules.

We believe WebAssembly technology is the key to building high-performance, customizable data streaming platforms.

Solomon Hykes, the creator of Docker, said the [following](https://twitter.com/solomonstre/status/1111004913222324225?lang=en):

> If WASM+WASI existed in 2008, we wouldn't have needed to created Docker. That's how important it is. WebAssembly on the server is the future of computing. A standardized system interface was the missing link. Let's hope WASI is up to the task!

## Conclusion

[Infinyon's](https://www.infinyon.com) mission is to accelerate the world's transition to the real-time economy.

#### Programmable Data:  Cancelling Data Gravity

Democratizing data is really about overcoming data's [gravity](https://whatis.techtarget.com/definition/data-gravity) well.  Unless it moves, data sits in silos and accumulates gravity. Silo data are difficult to move due to physical storage limitations and fear of exposing ourselves to security breaches.  The key to canceling data gravity is programmability. When we apply programmability to data as it moves between services, we can protect, enrich, track and extract information in real-time. Data-in-motion will gradually become an intelligence layer that connects the organization - people, tools, and services. Programmable data, a simple concept that will change the way we manage data.

#### Fluvio is Open Source. Join Us

[Fluvio](https://www.fluvio.io) is an open-source project, and we are committing to make it accessible for everyone.  We are at the beginning of our journey. Join us in building the next-generation platform for data in motion. Whether you have feedback, ideas, suggestions, and want to become a contributor, reach out. You can find us on [Github] and in [Discord] →
<a href="https://discordapp.com/invite/bBG2dTz" class="discord">
    <img style="height:8%;width:auto;display:inline" src="https://img.shields.io/discord/695712741381636168?color=738ADB&logo=Discord" alt="Discord" />
</a>

We look forward to seeing you soon.

[Discord]: https://discordapp.com/invite/bBG2dTz
[GitHub]: https://github.com/infinyon/fluvio/

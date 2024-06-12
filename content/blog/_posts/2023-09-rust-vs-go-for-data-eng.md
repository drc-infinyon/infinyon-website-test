---
title: "Rust vs Go - Which programming language will power the data ecosystem?"
author:
    name: "Deb RoyChowdhury"
    github: "drc-infinyon"
description: "Which modern programming language between Rust and Go is better suited to power the data ecosystem."
date: 2023-09-08
metadata: 
    - rust vs go
    - data engineering
slug: rust-vs-go-for-data
url: /blog/2023/09/rust-or-Go
img: blog/images/fluvio-product-management/go-vs-rust.png
twitter-card: summary_large_image
---

## Content
* [Rust or Go](#rust-or-go)
* [Go Rust or go home](#go-rust-or-go-home)
* [Teleological argument](#teleological-arguments-for-go-and-rust)
* [Advantages](#advantages-of-go-and-rust)
* [Performance](#performance-benchmarks-to-compare-rust-and-go)
* [Concurrency](#concurrency)
* [Scalability](#scalability)
* [Memory Safety](#memory-safety)
* [Developer Experience](#developer-experience)
* [Why we chose Rust to build Fluvio](#why-we-chose-rust-to-build-fluvio)
* [Conclusion](#conclusion)


### Rust or Go

Someone on the [data engineering subReddit](https://www.reddit.com/r/dataengineering/) recently posted a discussion starter with the title - "Rust or Go." The author wanted the community's recommendation on picking up a new programming language for data engineering. Like every dichotomy, this is a simple question at the surface, but the answer to the question is complex.

In this post, we will compare [Rust](https://www.rust-lang.org/) and [Go](https://go.dev/) and rationalize a solution in the context of data engineering. Unlike most comparison articles that provide no definitive solution, this article will provide a clear taxonomy of constraints and our choice for data engineering.

### Go Rust or go home

It's impossible to resist the temptation of making puns with names like Rust and Go! There would be a few puns in this article. If you are not into puns, you have been warned!

I want to layout our biases upfront! [InfinyOn Cloud](https://infinyon.cloud/) is powered by [Fluvio](https://www.fluvio.io/) a data streaming runtime written entirely in Rust.

The ideal belief is that "Developers strive to be language agnostic and use the ideal tool for the ideal use case."

In reality, there are several other factors that influence the tools we choose beyond logic, data, and hard facts. Behavioral factors like resistance to change, defaulting to familiar tools and mental models, hard trades between functionality, cost, available talent capital, time and complexity of building and running the infrastructure, tech stack, codebase etc. impact tooling decisions.

**Here is the bottomline:**
Rust and Go are both really powerful languages.

> **Rust** is our choice for data applications.

For data engineering, there are several elements in the way Rust is built that make it a better choice above Go.

That's our take. The cards are on the table. Let's dig into why we have come to that conclusion!

### Teleological arguments for Go and Rust

Telos *(greek τέλος)* is a term used by Aristotle to refer to the ultimate cause. In this article, the telelogical argument identifies the purpose of existence of GoLang and RustLang. Using the term teleology brings in a bit of philosophy into the equation.

**Go** was [open sourced back in November 2009 by Google](https://opensource.googleblog.com/2009/11/hey-ho-lets-go.html). The pithy announcement describes Go as follows - "Go is a great language for systems programming with support for multi-processing, a fresh and lightweight take on object-oriented design, plus some cool features like true closures and reflection."

The current website for GoLang promises the following:
> "Build simple, secure, scalable systems with Go"

**The biggest arguments for Go are:**
* GoLang has built-in concurrency and robust standard library.
* GoLang is supported by a large ecosystem.
* GoLang is supported by Google.

**Go** shines for web and API development and building server side applications and microservices.
**Go is an ideal choice for:**
* Ease of writing code.
* Simplicity and readability.
* Fast build times and lean syntax.
* Flexibility in web and API development.

**Rust** was [a side project for 3 years before Mozilla sponsored Rust in 2009](https://web.archive.org/web/20160609195720/https://www.rust-lang.org/faq.html#project). The FAQs associated with the Rust project states - "Rust exists as an alternative that provides both efficient code and a comfortable level of abstraction, while improving on all four points(safety, concurrency, practical affordance, control over reseources)."

Mozilla created a project called [Oxidation](https://wiki.mozilla.org/Oxidation) to integrate Rust, and there are precise guidelines on the benefits to using Rust.

The current Rust website describes Rust as - 
> "A language empowering everyone to build reliable and efficient software."

The biggest arguments for Rust:
* Memory and thread safety.
* Performance and Efficiency.
* Great documentation and error messages.

**Rust** shines in data and platform engineering scenarios that need to deliver robust backend data processing.
**Rust is ideal choice for:**
* Reliability.
* Performance.
* Memory safety.
* Fine grained control.

Of the two websites, one of them is more mundane. In case you are wandering which one - it is the Rust one. Even the comment promoted by the Rust website by an engineer from npm, compliments Rust for being "boring!"

But that's just their website and narrative! Let's look at their advantages and performance.

### Advantages of Go and Rust

One of the amazing things about Go is the ability to run functions as subprocesses using Goroutines. The simplicity of adding ```go``` syntax in a function to run as a subprocess is magical. Add to it the ability to use multiple CPU cores to deploy workloads and you have a solid and efficient language.

Rust however is quite different. It has a bit of a learning curve to get started and used to. Rust uses references, traits, and the concept of borrowing to utilize memory objects effectively without the need for replicas or copies. Rust does not have a garbage collector and while it takes longer to get used to and front load compile times, the resulting software removes the dreaded out of memory exceptions!

### Performance benchmarks to compare Rust and Go

The top 5 language comparisons on [Benchmarks Game](https://benchmarksgame-team.pages.debian.net/benchmarksgame/index.html) are between C#, Java, Go, Ruby, Python, C++, and Rust.

It's interesting to cluster these programs based on the comparisons. A significant chunk of data projects especially in the [Apache Software Foundation directory](https://projects.apache.org/projects.html?category) is written in Java.

*Java is to the data ecosystem as Wordpress is to the content management and web development ecosystem.*

Anyways, back on topic. A peek into the [Rust vs Go performance](https://benchmarksgame-team.pages.debian.net/benchmarksgame/fastest/rust-go.html) shows that Rust fares pretty well!

The comparison between Rust and Go in terms of performance shows that Rust consistently outperforms Go by at least 30% in most cases, with some instances like the [binary tree](https://benchmarksgame-team.pages.debian.net/benchmarksgame/performance/binarytrees.html) reaching as much as 12 times faster than Go.

Beyond benchmarks, practical applications are a great source to see if the benefits are real. In early 2020 [Discord announced that they were switching form Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust). Their blog is consistent with the benchmarks.

Besides benchmarks, it is helpful to consider how each of these languages deal with concurrency, scalability, and memory safety.

### Concurrency

Go approach to concurrency and parallelism emphasizes goroutines and channels. Goroutines are lightweight execution units managed by the Go runtime, requiring fewer resources than traditional threads. This enables developers to easily create thousands or even millions of goroutines for highly concurrent and scalable applications.

Channels in Go provide a safe means of communication between goroutines, minimizing boilerplate and synchronization overhead when writing concurrent code. The select statement allows for the simultaneous handling of multiple channels, further simplifying parallel programming.

Rust offers a unique combination of threads, channels, and asynchronous programming to facilitate concurrency and parallelism. Rust's threads are similar to those in other languages, enabling multiple tasks to run concurrently. However, Rust's channels provide an additional layer of safety when communicating between threads, preventing data races and other synchronization issues.

Rust also supports asynchronous programming through its async/await syntax, which enables non-blocking I/O and efficient handling of tasks that may take a long time to complete. The Rust async ecosystem, including popular libraries like [async_std](https://github.com/async-rs/async-std) and [Tokio](https://github.com/tokio-rs/tokio), provides powerful tools for building high-performance, concurrent applications.

Rust is the better choice if the goal is to have fine grained control over concurrency and parallelism. And distributed systems are about concurrency and parallelism.

### Scalability

Both languages excel at harnessing the power of multiple CPU cores to process data in parallel. In Go, you can leverage Goroutines to handle each piece of data and use a WaitGroup to synchronize their completion.

Meanwhile, Rust offers an elegant solution through the [rayon](https://docs.rs/rayon/latest/rayon/) crate, which simplifies parallel iteration over containers.

### Memory Safety

In [a guest post on the Bitbucket blog](https://bitbucket.org/blog/why-rust), the author calls Rust's compiler very strict and pedantic! This is a key differentiator for Rust. Rust's unwavering commitment to memory safety means that you won't encounter buffer overflows or race conditions, thanks to the language's rigorous enforcement of safe programming practices. While this provides significant benefits in terms of stability and reliability, it also requires developers to be meticulous about memory management when writing code. In other words, Rust's safety features are a double-edged sword - while they offer great protection against common errors, they can also make coding more challenging due to the need for constant attention to detail regarding memory allocation.

Go shares some similarities with Rust when it comes to memory safety, but it falls short of Rust's level of rigor. While Go does block dangling pointers and prevents memory leaks to some extent, its garbage collection mechanism doesn't quite match the depth of Rust's ownership and borrowing system. In Go, various data structures, such as interfaces and slices, are typically implemented using non-atomic multi-word structs. However, this can lead to issues with data races, where invalid values may be produced because of memory corruption.

### Developer Experience

The developer experience is perhaps the oddest category of comparison.

While [Rust is the most admired language, more than 80% of developers that use it want to use it again next year](https://survey.stackoverflow.co/2023/). This category was updated in 2023. As of 2022, Rust was [on its seventh year as the most loved language with 87% of developers saying they want to continue using it](https://survey.stackoverflow.co/2022). Rust has been crushing the metric of retention since majority of the developers have been wanting to continue using the language. There is a major caveat to the survey results.

Despite extensive documentation and amazing level of detail in error messages, Rust is considered by many folks to be a tough language to get started with.

In terms of Developer Experience, syntax simplicity or compile times are areas where Go is preferred over Rust.

The development cycles and iterations are also faster in Go compared to Rust. It is easier for teams with a mix of people working on different project to work with Go in terms of simplicity of syntax.

The Rust compiler is known for it's error handling. It is trickier for developers to compile Rust code and they need to have a decent understanding of the design patterns of the language. This may be initially an uphill climb, but Rust developers are more confident of working code that compiles for the same reason.

There is not a clear winner here. It depends on the team composition, and project complexity. Go is easier for teams to start and iterate with. Rust is hard for beginners, but iterations become progressively easier.

### Why we chose Rust to build Fluvio

For this section, I asked [Sehyo](https://www.linkedin.com/in/sehyo/) our CTO the question - Why did we choose Rust? And the following is what I captured in conversation:

We were building a data streaming runtime with a goal of building stateful stream processing to offer a better alternative to [Kafka](https://kafka.apache.org/) and [Flink](https://flink.apache.org/) in a single platform.

We needed to pick a language that will enable us to build the building blocks of a distributed system that will be edge and cloud native and deliver high performance in data processing at scale.

We needed to write high performance code but didn’t want to use C++.

As data platform builders, we were always thinking about [garbage in garbage out](https://en.wikipedia.org/wiki/Garbage_in,_garbage_out). And we liked the fact that we did not have to write any garbage collection logic!

[There are no free lunches](http://www.no-free-lunch.org/) and we were willing to front load the development work needed to write high quality and performance code before mucking around with abstractions and integrations.

**Rust** offered:
* High performance.
* Excellent documentation and error handling.
* Good tooling infrastructure with Cargo and Crates.

Every technical decision has trade-offs. We had to go through the learning curve and embrace the development experience in Rust. It has been well worth it for us.

Our platform is for software engineers and developers who are ready to embrace the power of Rust and Web Assembly.

We support Go, Python, and Typescript clients, and our domain specific language construct is YAML.

We have over indexed building the primitives and abstractions to deliberately build a system that is built for data streaming in the wasm paradigm.

**Why?**
Because we are convinced that the future of data centric software is on Rust and WASM. It's our all-in bet. The stakes are high. The odds are dynamically changing. But we are all-in on Rust and Web Assembly to enable data engineering.

### Conclusion

Hopefully, this article won't cause some irreversible damage to your decision-making process and bias you towards Rust over Go as a programming language. Remember there are a pros and cons of every tool.

Go and Rust have distinct strengths and tradeoffs Go shines with its Goroutine-based architecture when it comes to building web APIs and small services. Rust excels in high-performance computing tasks, such as data processing and algorithm execution.

Rust's focus on safety and memory management pays off, making it a better choice for projects that require top-notch security and performance.

Data processing at scale is all about high performance computing and algorithm execution. With the steady increase in the demand for artificial intelligence applications and the rise of data products, data as a service, we have to improve the unit economics of developing data intensive solutions.

The economic aspects of the equation at scale are huge. [An article in the AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/sustainability-with-rust/) has already discussed the sustainability issues that needs to be addressed at scale. 

> Rust is a language that is currently best positioned to deliver the goods to the data ecosystem.

Let us know your take on our social channels below.

#### Connect with us:

Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have questions.

{{%link "https://www.youtube.com/channel/UCIY6TD_kIHA86468tmTEdHQ" "Subscribe to our YouTube channel" %}}

{{%link "https://twitter.com/infinyon" "Follow us on Twitter" %}}

{{%link "https://www.linkedin.com/company/infinyon/" "Follow us on LinkedIn" %}}

{{%link "https://infinyon.cloud?utm_campaign=bet%20on%20infinyon&utm_source=website&utm_medium=blog&utm_term=deb%20roychowdhury&utm_content=cloud-registration" "Try InfinyOn Cloud a fully managed Fluvio service" %}}
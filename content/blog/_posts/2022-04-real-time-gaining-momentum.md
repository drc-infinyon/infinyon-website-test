---
title: "Real-time Gaining Momentum in the Enterprise"
subtitle: "Real-time data infrastructure is becoming a growing priority in the enterprise"
author:
    name: "Grant Swanson"
    github: "ruststreaming"
    title: "VP Marketing"
description: "Real-time data infrastructure is becoming a growing priority in the enterprise."
date: 2022-04-26
metadata:
    - OPINION
slug: real-time-gaining-momentum
url: /blog/2022/02/real-time-gaining-momentum
img: blog/images/infinyon-ci/real-time-gaining-momentum.jpeg
twitter-card: summary_large_image
show-header-img: false
---

At InfinyOn, we believe enabling a real-time data infrastructure is becoming a growing priority in the enterprise. This is evident when looking at company performance and indicators from Confluent (ticker symbol: CFLT). Their most recent quarterly results had revenue growth of 71% including 211% growth in cloud and were supported by 65% growth in customers and 130%+ dollar based net retention. This highlights the multiple growth engines that are working in CFLT's favor and the need for real-time applications.

Confluent Cloud is a fully managed Apache Kafka service. Apache Kafka is the world's most popular open source event stream processing software with more than 80% of Fortune 100 companies using Kafka. The success has been phenomenal, however, Kafka is an aging technology that is over 10 years old. It was built using the Java programming language that has its limits compared to newer programming languages like Rust or Go. See our   <a href="https://www.infinyon.com/resources/java-vs-rust/" target="_blank">Java vs. Rust comparison</a> or  <a href="https://www.infinyon.com/resources/rust-in-100-seconds/" target="_blank">Rust in 100 seconds</a> for more information on the advantages and disadvantages.

## Fluvio and InfinyOn Cloud

InfinyOn is focused on building its <a href="https://www.fluvio.io/" target="_blank">Fluvio</a> open source community and educating the market on some of these new capabilities such as the ability to do real-time event stream processing and data transformation in a single unified cluster. Similar to Confluent Cloud, <a href="https://www.infinyon.com/cloud/" target="_blank">InfinyOn Cloud</a> is a fully managed Fluvio service but it is differentiated in how it helps to simplify data architectures and eliminates the need for <a href="https://www.infinyon.com/resources/real-time-data-trasformation/" target="_blank">ETL tools</a>. Current architectures often look like this diagram where legacy streaming technologies are essentially what we call a simple data pipeline that only functions as a messaging bus. Extract Transform and Load or (ETL) tools are needed for transformation and require batch processing.

<img src="/blog/images/infinyon-ci/Legacy-ETL-Approach.png"
     alt="Legacy ETL Approach"
     style="margin: auto; max-width: 800px" />

Infrastructure teams are stiching together and managing multiple tools to perform event stream processing and data transformation.

## Smart Data Pipelines

Smart data pipelines that leverage <a href="https://webassembly.org/" target="_blank">Wasm technology</a> have an enrichment layer where transformation happens on source connectors, sink connectors, producers, consumers, or within the stream processing unit (SPU).

<img src="/blog/images/infinyon-ci/Smart-data-pipelines.jpg"
     alt="Legacy ETL Approach"
     style="margin: auto; max-width: 800px" />

The advantages are numerous for teams with data governance and data quality initiatives. Data engineering teams can have distributed policy with centralized control and enjoy the cost savings of running their real-time data infrastructure on Fluvio or InfinyOn Cloud, the most memory efficient technology available today. Prospects and customers are finding the cost savings attractive compared to the memory intensive, Java-based Apache Kafka.

As the journey for enterprises continues the build out and design of data infrastructure that connects applications, systems and data layers to what Gartner coins a ENS or <a href="https://www.gartner.com/en/information-technology/glossary/ens-enterprise-nervous-system" target="_blank">Enterprise Nervous System</a>, organizations are doing more stream processing because of the need for continuous intelligence, faster decision making, and creating exceptional customer experiences. Companies are accumulating more streaming data every year from internal sources like corporate websites, IoT sensors, or transactional applications and from external sources such as business partners, data providers and social media platforms.


## Conclusion

It’s clear that real-time is gaining momentum in the enterprise. Our mission is to accelerate the world's transition to the real-time economy. Real-time data can give businesses valuable insight into product performance, customer behavior, supply chain management, business planning and more. Learn more about potential  <a href="https://www.infinyon.com/use-cases/" target="_blank">InfinyOn Cloud use-cases</a> including Change Data Capture (CDC), predictive maintenance, supply chain automation, real-time payments and secure transactions.


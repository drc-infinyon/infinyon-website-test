---
title: "Building Real-time IoT Apps."
subtitle: "Why Klarian Chose InfinyOn Cloud over Kafka or RabbitMQ"
author:
    name: "Grant Swanson"
    github: "ruststreaming"
    title: "VP Marketing"
description: "Why Klarian Chose InfinyOn Cloud over Kafka or RabbitMQ."
date: 2022-12-08
metadata:
    - OPINION
slug: building-real-time-iot-applications
url: /blog/2022/02/building-real-time-iot-applications
img: blog/images/iot-apps/IoT-Apps.png
twitter-card: summary_large_image
show-header-img: false
---

When building any kind of real-time IoT application, trying to figure out how to send data from the sensor to the cloud (or vice versa) is a big part of the equation. <a href="https://www.linkedin.com/in/ben-cleary-291501a9?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABcIlE0BxBKlEtbgHoyYNErlnC3Q7la0Bu8&lipi=urn%3Ali%3Apage%3Ad_flagship3_search_srp_all%3B51dyyhCsQZqj6sYv0MtJAA%3D%3D" target="_blank">Ben Cleary</a>, Head of Technology from Klarian, is focused on leading the software development and data teams as they continue to innovate on their <a href="https://klarian.com/intelligent-pipeline" target="_blank">Digipipe platform</a>. The product allows users to monitor their operations and physical pipelines used to transport products including oil, gas, or hydrogen. Klarian’s mission is to optimize pipeline infrastructure for a more sustainable planet. 

Klarian has built a real-time IoT application that captures data from multiple sources, including their edge controller and sensor hardware, systems, or processes. Beyond the sensor data, they use external APIs to gather important information such as commodity and energy pricing. Third-party data integrations from existing SCADA, Field Ops, and incident management systems are ingested, processed, and stored. Klarian customers get tremendous value from Klarian's analysis of this data to find meaningful insights, which generate actions needed to make better decisions. 

Data ingestion initially started as a complicated architecture for Klarian. Some of the major pain points for the Klarian team included the following:

<img src="/blog/images/iot-apps/klarian-pain-points.png"
     alt="Common pain points"
     style="margin: auto; max-width: 800px" />


## Why Klarian Chose InfinyOn Cloud over Kafka or RabbitMQ

<a href="https://www.infinyon.com/cloud/" target="_blank">InfinyOn Cloud</a> is a unified platform for event stream processing and real-time data transformation. Klarian decided to move away from Kafka and Rabbitmq to InfinyOn Cloud to reduce the cost and complexity of operating and managing real-time data pipelines. Other factors that contributed to their decision were time to market, ease of management, and improved data quality.

## Time to Market
 Klarian rolled out InfinyOn Cloud as an intelligent data collection pipeline fronting the Karian IoT application. The cloud platform is a versatile multi-dimensional product for data ingestion, real-time data visualization, STL workflow, and Streaming AI. Check out the following diagram for additional information:

<img src="/blog/images/iot-apps/how-klarian-uses-infinyon-cloud.png"
     alt="How Klarian uses InfinyOn Cloud"
     style="margin: auto; max-width: 800px" />

“InfinyOn Cloud is the heart of our data analytics platform” said Rupert Young, Klarian's Senior Delivery Manager

## Simplified Architecture with Ease of Management

Klarian has a small entrepreneurial team and did not want to deal with DevOps overhead associated with Kafka or RabbitMQ. Instead, they chose InfinyOn Cloud, a fully managed service, where they built end-to-end data pipelines with real-time data transformations in a fraction of the time compared to the other solutions. In their new deployment, Klarian Edge Controller, on the left, streams data into InfinyOn Cloud via the MQTT connector. Then, the platform performs a series of transformations and sends the result to Postgres via SQL sink. See the diagram below for details.

<img src="/blog/images/iot-apps/data-ingestion-architecture.png"
     alt="Data ingestion architecture"
     style="margin: auto; max-width: 800px" />

## Cost Reduction
As a bonus, Ben and his team were pleased to realize that <a href="https://www.infinyon.com/resources/cost-of-fluvio-vs-apache-kafka/" target="_blank">The Cost of Running Fluvio vs. Apache Kafka</a>, also offered them significant cost advantages. InfinyOn Cloud is a managed service for Fluvio, an open-source product built from the ground up using the Rust programming language. The <a href="https://www.infinyon.com/resources/java-vs-rust/" target="_blank">The Java vs Rust comparison</a> provides a detailed analysis of the benefits of using Rust for industry-leading high-performance services.


## Distributed Intelligence for Superior Data Quality

An IoT service's performance, security, resilience, and scalability are highly correlated with the quality of the data delivery service. No amount of strategy and new technology will help if the data isn't accurate, secure, and actionable. <a href="https://www.fluvio.io/smartmodules/hub/overview/" target="_blank">SmartModule Hub</a>, a recently launched service in InfinyOn Cloud, is an industry-first app store where users can share and reuse data transformations to accelerate the roll-out of intelligent data pipelines. InfinyOn SmartModules, powered by WebAssembly, allows users to program unique functions, apply intelligence and enrich data for superior data quality.

<img src="/blog/images/iot-apps/SmartModule-Hub.png"
     alt="Data ingestion architecture"
     style="margin: auto; max-width: 800px" />

One of the exciting aspects of the SmartModule Hub is helping organizations take control of the explosion of data from IoT services and beyond. When SmartModules are distributed between edge and core, they form a hierarchical cooperative intelligent system that can optimize data transfers, improve predictive maintenance, and minimize operational overhead.

<img src="/blog/images/iot-apps/smartmodule-hub-diagram.png"
     alt="Data ingestion architecture"
     style="margin: auto; max-width: 800px" />

## Additional IoT Use-cases

InfinyOn Cloud can be used for numerous IoT use cases, including <a href="https://www.infinyon.com/use-cases/predictive-maintenance/" target="_blank">predictive maintenance</a>, <a href="https://www.infinyon.com/use-cases/supply-chain-automation/" target="_blank">supply chain automation</a>, and <a href="https://www.infinyon.com/use-cases/real-time-inventory-management/" target="_blank">real-time inventory management</a>. If you are building a real-time IoT application and want to meet the InfinyOn team we would be delighted to spend some time with you to discuss your use-case. 

Feel free to <a href="https://calendly.com/infinyongreg" target="_blank">schedule time here</a>. We also welcome you to become a member of our <a href="https://discord.com/invite/bBG2dTz" target="_blank">Discord channel</a>, follow us on <a href="https://www.linkedin.com/company/infinyon/" target="_blank">LinkedIn</a> or <a href="https://twitter.com/infinyon" target="_blank">Twitter</a> and try <a href="https://infinyon.cloud/signup" target="_blank">InfinyOn Cloud</a>.
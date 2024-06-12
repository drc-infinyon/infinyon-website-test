---
title: "Why I am betting on InfinyOn"
author:
    name: "Deb RoyChowdhury"
    github: "drc-infinyon"
description: "Why I am excited about the future of InfinyOn and what made my want to take on building the product management system and practice here"
date: 2023-03-16
metadata: 
    - Data Apps
    - Opinion
slug: betting-on-infinyon
url: /blog/2023/03/betting-on-infinyon
img: blog/images/fluvio-product-management/betting-on-infinyon-v2.jpg
twitter-card: summary_large_image
---

### Goal
It's been 2 months for me at InfinyOn. In this post, I will share about the journey of joining InfinyOn as the Head of Product. This post will serve as a foundation for describing the product management system at InfinyOn as we build it out.

### Context

Close to the end of 2022, I was in an interview with the Chief Data officer at a large pharma company for a Director of Data Products role. The CDO posed a question about the hops, skips, and jumps in my career timeline.

She asked, “Why are you unable to find a fit to stay beyond a couple of years in your previous data product management roles?”

My response to the question was, “this is my way of trading off stability for learning the patterns in different market contexts.”

At that point, we both knew that even though that was a truthful and accurate representation of my rationale, it was certainly incomplete. While I did not end up continuing with the opportunity in the pharma company, I was exploring the problem space further.

> Why did I change 6 roles in the last 7 years? What are the various dimensions and attributions of the changes?

The exploration and discovery of the longevity of my career in data product management led to a few salient dimensions of the problem:
* Professional Development Fit
* People and Leadership Expertise
* Organization Design Effectiveness
* Data Maturity
* Technology Stack Complexity
* Market Forces and Economics

In this iteration, I am going to prioritize and focus the conversation on data maturity, technology stack, and the market forces.

### Patterns of data product opportunities

In November 2021, I was in my fifth product role with a well-funded eCommerce data play.

It was my fifth role in 5 years! How did I get here?

All of my past product roles have been about building out functional data platforms to enable data applications, including AI/ML, to be built at scale. Almost all the companies I worked with made significant investments to make it happen.

When I started out with data about five years into my career in 2011, the electronic health record database I was thrown into the deep end with had over 4200 tables and was deployed on-prem. That data intensive role in analytics and insights was also transformative for me in multiple other areas, including:
* on-prem deployment to SaaS
* waterfall to agile
* small data to big data.

Kinda messed up writing out that last point, especially since Jordan Tigani the CEO of MotherDuck, just published "BIG DATA IS DEAD" a week back.

Fast forward to 2016, I moved from data engineering and data science into my first data product management role as the 7th employee in a seed stage AI startup. I had tried and failed at building an augmented reality ecommerce play between 2014 and 2016, and this was my third attempt at an early stage startup. Turns out it's really hard to package speech, vision, and natural language algorithms into production software. In 2018, another AI startup gained us for the talent mainly and some of the algorithmic intellectual property. The CEO parted ways, and I moved with my family to Canada.

Between 2018 and 2021, I had worked with a series A stage life sciences AI play, A large100-year-old American Automaker in their AI Center of Excellence, A HR Tech SaaS play and then in the eCommerce analytics company.

It’s not typical to spend a lot of time in architecture deep dives in product management interviews, however, my distinct memory of the experience with the eCommerce company is that the presentation was focused on where the company wanted to go in terms of its tech stack and not the current state. 

The team was charged up. There was a palpable excitement about the future and a 9 figure runway. The customer portfolio and revenue were growing at a healthy scale and everyone was hoping for the next s-curve of growth.

But something was not quite right! There was a nagging anxiety among the exec leaders about the health of the business and even the most high energy town-halls would have this perceivable faking of confident motivational speech like the worst cuts of “The Wolf of Wall Street.”


### Patterns of data product nightmares

It took roughly 45 to 60 days to calibrate the gaps between the expectation and the reality. We had a ton of data. The state of the data and the platform were a hot mess. Amazon was loving our architectural patterns and data pipelines since they made over $1.5 for every $1 we made! Every time we onboarded an ideal customer, we needed to calculate how much it would cost us to serve them, which is an excellent muscle to develop.


The customers needed the data at a relevant and specific frequency. Beyond a handful of instant alerts, the pattern for checking the data was not real time. However, the customers were expecting fresh data and not looking to wait for hours to see the results of their search.

> Imagine you are a consumer product company managing your portfolio on ecommerce marketplaces and you come to a software to add a list of 1000s of products to see the trends of the product portfolio performance in the marketplace with up to two years of historical trends. Now imagine a platform that has to serve 10s of thousands of such cohorts of products.

While this may not seem super complex and folks may think, what’s the big deal with that? It’s the upstream data pipeline that collects data for over a billion products on eCommerce marketplaces like Amazon at varying frequency depending on popularity. As an example of frequency, the data on Amazon updates as frequently as hourly for top selling products. This is where things get interesting. The eCommerce players want to see the view of a slice of the market spanning related categories, subcategories, brand clusters and they would want the data to be updated at least daily.

> Data pipelines at scale are harder than most people realize!

The workflows involved:
* Maintaining an updated queue of products to track and update based on popularity in the marketplace
* Collect the data with a reasonable frequency
* Ensuring that the collected data is captured and streamed into the data storage, which included buckets, hot data stores, document stores, data warehouse and cache
* Resolving basic data quality issues, albeit reactively with some after the fact monitoring and alerting
* Running the legacy pipeline with the monolithic DAGs to support existing customers while building out the distributed parallel processing to process batches and deliver better bang for the buck
* The data was consumed by large-scale machine learning use cases, analytical aggregations and serving them up to the customers

What followed for the next year in my role were epochs of deliberate re-platforming work, paying off tech debt, 3 re-orgs and still the light at the end of the tunnel was not in sight!

Imagine running out of a 9 figure runway in 3 years and still lacking the ability to deliver quality data to customers on time.

### The desperate reality

I have been on the hamster wheel. People problems have kept growing. There were a lot of expectations. Delivering significant outcomes on the re-platforming work and optimizing hosting costs was not enough.

We had tried it all: file formats, partitioning, distributed batch processing.
We’d be in engineering meetings and data science teams would plead for easier access to data, feature stores, software engineering teams would like stream friendly data delivery without having to figure out distributed computation!

Data Science has gone from being the sexiest job of 21st century to recovering data scientists moving to data engineering or MLops.

Big data is dead.

Modern data stack is dead.

We are all in zombie land, trying to solve data pipeline problems and build data products. And sunk cost fallacy overshadowed the return on investments!

This is the data opportunity in 2023.
It's difficult, but it is what we are solving for.

### Alternative solutions

Based on my perception and interpretation of the reality of the ecosystem, I started having more dialogues with my circle of trustworthy architects with a goal of starting a venture that simplifies this Frankenstein modern data stack that is the beloved of the emperor who has no clothes!

I simply wanted to build a proof of concept of getting the data from web sources and APIs to get it into a form that one could make simple inferences and decisions on it. The pattern in my mind was to treat the entity that is central to the use case similar to a company stock and do precisely three things. Count relevant facts over specific time-steps, measure the deltas of the relevant facts and the correlations between related facts and simply plot these. And, I wanted to process these as efficiently as possible in terms of cost, complexity, and latency.

This is how one of my trusted architect buddies referred me to Fluvio.io.

A seed was sown.

As a data product lead, I was familiar with a significant amount of tooling, and I was familiar with the technical leaps in web assembly, but I knew little about Fluvio or rust.

I consider myself to be disillusioned towards new tooling.

Since picking up data engineering in 2011, I have had my fair share of tooling exposure and the forced refactoring of distributed data projects due to what I call “cotton candy syndrome.”

There are JVM based tools that we have all used for administrative overhead, workflow orchestration, to ultimately compile SQL queries into distributed batch jobs dependent on the highly efficient JVM and serializer deserializers.

All the use cases that I have worked on since the past 12 years are temporal, which is most business problems. And we all know how amazing the whole software ecosystem is at handling dates. Remember Y2K?

In my experience, it is like fixing the hole in the bucket with straw which needs to be cut with an ax which needs to be sharpened using a stone which needs to be moistened by water which needs to be fetched with the bucket which is leaking!

In the end, I did not reach a conclusion, and the problem remained in my head.

### An exciting opportunity

A few months later, a data practitioner was talking about web assembly and data tools on Linked and I simply shared Fluvio. That led to a conversation with Grant Swanson from InfinyOn the managed cloud platform that runs Fluvio and I was now triggered to learn more.

The findings were indeed compelling. At a high level there are two types of problems in the data world one where the expected temporal latency is miniscule i.e. the true real time use cases, and the other where the speed and volume of data creation calls for efficiency in processing the data just to keep up.

We all have hopefully learnt that monolithic systems and synchronous micro services are equally hard to scale in terms of infrastructure, talent capacity and cold hard cash needed to operate a data play at scale.

All DATA CONSUMERS ultimately want fresh and high-quality data fast and cheap to make decisions.

And the current systems simply have not delivered.

Yet another layer of abstraction to aggregate the existing tools and repackaging them will not solve it for the businesses. At least that is what the empirical evidence suggests.

The core performance issues are truly foundational. Not that these abstraction layers are useless, they have a significant role in improving the data maturity of many organizations. But ‌the foundational changes will be a function of innovation that will simplify the data capture, movement, and transformation and minimize it.

In the early days of distributed parallel computing with HDFS and Map Reduce, we were referencing the foundations of storage costs, size of storage capacity, read write speed, computational needs, workflow orchestration, cluster management.

In the epochs of artificial intelligence and machine learning, we have become more aware of the hidden cost of machine learning, the scale of computational needs, the need for bespoke hardware, as well as tooling integration. We have also become more aware of Garbage In Garbage Out, No free lunch theorem and similar mental models to appreciate the complexity at play.

The basic necessity of data informed decision making that is valuable to a business remains the same - Fresh high quality data with basic transformations over time delivered seamlessly to the data consumers.

This is no longer an internal platform play since analytics is a ubiquitous functionality provided with most of the software ecosystem

The problem space is diverse and in need of simple first-principle solutions!

This impressed me with InfinyOn. Connectors for source and sink, smart modules for data operations, and running with a ridiculous efficiency. This is what the data world really needs. This is how real time streams ought to be done.

We have a challenging yet exciting road ahead. But here I am, having finally found a purpose at the root of a problem space that would reform how data is processed. Excited to be building with an amazing team at InfinyOn a product that will make real time streaming how it's supposed to be.

If you are working with a challenging data stack and impactful data problems, I would love to connect and understand your current challenges and areas of risk in your data stack and explore how we could help you simplify your data pipeline and make it more efficient and effective:

{{%link "https://cal.com/debadyuti/infinyon-discovery" "Setup a 1:1 call" %}} with me.


#### Connect with us:

Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions.

{{%link "https://www.youtube.com/channel/UCIY6TD_kIHA86468tmTEdHQ" "Subscribe to our YouTube channel" %}}

{{%link "https://twitter.com/infinyon" "Follow us on Twitter" %}}

{{%link "https://www.linkedin.com/company/infinyon/" "Follow us on LinkedIn" %}}

{{%link " https://infinyon.cloud?utm_campaign=bet%20on%20infinyon&utm_source=website&utm_medium=blog&utm_term=deb%20roychowdhury&utm_content=cloud-registration" "Try InfinyOn Cloud a fully managed Fluvio service" %}}

Have a happy coding, and stay tuned!

### Further reading

- [Handling JSON data in Fluvio SmartModules](/blog/2022/06/smartmodule-json/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)
- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)



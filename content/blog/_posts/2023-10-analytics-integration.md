---
title: "Simplifying Analytics Integration"
author:
    name: "T.J. Telan"
    github: "tjtelan"
description: "Short development story about how we use Fluvio for our analytics"
date: 2023-10-27
metadata: 
slug: simplify-analytics-integration 
url: /blog/2023/10/simplify-analytics-integration
img: blog/images/analytics-integration-cover.jpg
twitter-card: summary_large_image
---

This is a short story from engineering about how we saved ourselves a lot of time and effort. Instead of spending more time tuning the code for a new microservice, we replaced it with a general purpose connector.

We started off wanting to add analytics to better understand how people use our product. Our default assumption is that creating a microservice was the way to go. But as we moved forward, we found that a simpler and more flexible solution was right in our own product - the connector.

This story shares our journey, the challenges we faced, and how switching to a connector-based model made our analytics and our work processes better and easier.

## Choosing the Right Path for Analytics

We decided to use Amplitude for analytics. The biggest impact of this detail was we had to manually instrument our production code for InfinyOn Cloud.

After the the modifications were made to our existing services, we needed a simple pattern for sending events that would be easy to adapt future additional microservices.

With urgency to quickly see our data, it was natural that a special microservice was quickly implemented to link our services and Amplitude and added to our deployment automation. The way it worked is that our `existing services` would send HTTP POST requests with json event data to this new `Analytics service`. The Analytics service would construct the json request for Amplitude and then pass it along.

<video controls autoplay="false" loop>
  <source src="/blog/media/analytics-integration/infinyon-amplitude-blog-initial-flow.mp4" type="video/mp4" />
</video>

## Unveiling the Hitches Post-Deployment

When we started integrating into production, we ran into some intermittent problems with our event streaming to Amplitude. This was a classic case of "works on my machine" failing to account for the realities of the production environment.

Our analytics microservice occasionally lagged behind the startup of other services, causing a race condition that affected the startup configuration. During this period of time, events were not being emitted. We are losing this data we're trying to collect.

<video controls autoplay="false" loop>
  <source src="/blog/media/analytics-integration/infinyon-amplitude-blog-startup-race-condition.mp4" type="video/mp4" />
</video>

The lack of a retry mechanism for service initialization exacerbated the issue, turning our analytics collection into a manual chore rather than an automated process. These problems were easily resolved once identified, but this is toil for the Ops team. 

The microservice, meant to simplify analytics, was instead adding layers of operational overhead. A long-term solution would require investing more dev time before this process meets our resilience needs.

## Embracing Our Own Product: The Connector Revelation

We thought about using our own product to fix the issues. We started considering using a connector instead of a microservice.

While testing this idea, we found that our `http-sink` connector could do the job, replacing the special analytics connector we were using. Using the `http-sink` connector, along with [Jolt]({{<ref "/docs/smartmodules/jolt.md">}}), a SmartModule to transform json data, we could do what we planned initially and even improve it.

Coincidentally, we prevent the deployment-time race conditions that caused us to lose event data. Our services have to connect to our Fluvio instance, and as infrastructure, it is deployed and available before microservices are deployed.

<video controls autoplay="false" loop>
  <source src="/blog/media/analytics-integration/infinyon-amplitude-fluvio.mp4" type="video/mp4" />
</video>

The following is an [example connector config from our Amplitude setup guide]({{<ref "/docs/guides/amplitude.md">}}). 

%copy%
```yaml
# amplitude-connector.yaml
apiVersion: 0.1.0
meta:
  version: 0.2.5
  name: amplitude-connector 
  type: http-sink
  topic: service-events
  secrets:
    - name: AMPLITUDE_API_TOKEN
http:
  endpoint: "https://api2.amplitude.com/2/httpapi"
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: remove
          spec:
            timestamp: ""
        - operation: shift
          spec:
            "event": "events[0]"
        - operation: default
          spec:
            api_key: "${{ secrets.AMPLITUDE_API_TOKEN }}"
```



## Conclusion

The journey illustrated the power of adapting and opting for simplicity.

Replacing a microservice with a connector not only resolved our operational issues but also presented a pattern that was easy to integrate and scale.

The connector model reduced the manual work, eliminated a good chunk of unnecessary code, and tests, paving the way for a more streamlined analytics integration.
---
title: Fluvio Policy
author: 
    name: "InfinyOn Team"
description: Fluvio Policy gives security operators and data owners centralized control over all data exchanges in the organization.
category: Fluvio
date: 2021-03-06
slug: fluvio-policy
url: /blog/2021/03/fluvio-policy
img: blog/images/fluvio-policy/social/gavel.jpg
hidden: true
---

Fluvio Policy gives security operators and data owners centralized control over all data exchanges in the organization. The policies follow the four stages - connect, protect, enrich, and store - of the Fluvio data streaming pipeline.

<img src="/blog/images/fluvio-policy/all-policies.svg"
     alt="Fluvio Workflow"
     style="margin: auto; max-width: 750px" />

Policies can be assigned to one, all, or groups of data streams. When used in combination with role-based access control (RBAC), the policies are a potent tool to control data movement across teams, tools, and geo-locations in the organization.

For example, an organization that needs HIPPA compliance may create two global policies: one for consumers who have legitimate access to patient data and another for everyone else. The first policy ensures all traffic is encrypted with a HIPPA key and exclusively sent to authorized consumers. The second policy strips off all sensitive information. These two policies are then applied globally and enforced for all data streams.


## Role-Based Access Control

Fluvio uses role-based access controls (RBAC) to maintain fine-grained access to system resources. Each identified user can access objects assigned to his role and restricted from all others.

For example, a user with a security role may apply security policies, whereas users with a developer role may only assign connection policies. 


## Object Profiles

Profiles are configuration parameters applied to one or more groups of objects. For example, a client profile uniquely identifies an endpoint, a QoS profile defines the quality of service parameters applied to a connection, or a storage profile defines the minimum number of replicas and the flush frequency. 

Each profile is defined in the context of the policy where it is used.


## Ingress/Egress Rules

Fluvio applies policies in the sequence derived from the internal pipeline. These policies can are divided into two logical groups: ingress and egress.

<img src="/blog/images/fluvio-policy/ingress-egress.svg"
     alt="Ingress, Enrich, Egress"
     style="margin: auto; max-width: 600px" />

In Fluvio, data writers are called producers and readers consumers. 

Ingress policies control consumers' data as it enters the stream, and apply rules to receive, permit, filter, map, transform, and write to the store. 

Egress policies restrict the data as it leaves the stream and apply rules to filter, map, transform, authorize, and send to consumers. 


### Connection Policies

Connection policies define the rules associated with the access and the transport properties of a data stream. For example, TLS rules may specify that only TLS 1.3 enabled clients can access the stream. Geo-location rules may restrict clients to the same country where the stream is stored.

<img src="/blog/images/fluvio-policy/connection-policies.svg"
     alt="Connection Policies"
     style="margin: auto; max-width: 500px" />

The system can apply policies on either side of a data stream - receive rules for ingress and send for egress. Receive rules allow authorized producers to connect to data streams and block all others. Send rules ensure unauthorized consumers are blocked.

#### Profiles

Connection policies use the following profiles:

* **Client Profiles** - A client profile is a configuration file that uniquely identifies a client to the Fluvio cluster. The profile contains parameters such as security certificates, authorization keys, and settings required by connection policies.
* **QOS Profiles** - A quality of service profile defines the connection parameters such bandwidth limit, prioritization, compression and more.


#### Receive Policy Rules

A receive policy describes the match criteria a producer must meet to connect to a specific data stream. The policy may also apply quality of service parameters to the connection. The criteria definition is defined in terms of:

* producer location
* client profile
* QOS profile

For example:

* Producers with IP addresses from outside of Europe must be denied access to data streams labeled "Germany."
* Producers with "development" profiles must be denied access to data streams labeled "production."
* Producers with "low priority" profiles are allowed to use up to 1% of the bandwidth.


#### Send Policy Rules

A send policy describes the match criteria a consumer must meet to connect to a specific data stream and the quality of service parameters to apply. The criteria definition is defined in terms of:

* consumer location
* client profile
* QOS profile

For example:

* Consumers with IP addresses from outside of Europe must be denied access to data streams labeled "Germany."
* Consumers with "development" profiles must be denied access to data streams labeled "finance."
* Consumers with "high priority" profiles must receive data before all other consumers.


### Security Policies

Security policies define rules that permit incoming and authorize outgoing data. For example, an encryption rule may specify that all fields containing personal identifiable information (PII) must be encrypted with a PII key. Permission rules may state that all data that have credit card information must be rejected. Authorization rules may specify that all PII fields must be stripped when sending data to untrusted clients.

<img src="/blog/images/fluvio-policy/security-policies.svg"
     alt="Security Policies"
     style="margin: auto; max-width: 530px" />

Fluvio can apply security policies to either side of the data stream - permit for ingress and authorize for egress.


#### Profiles

Security policies use the following profiles:

* **Client Profiles** - A client profile uniquely identifies a client and its security parameters.
* **Trust Profiles** - Trust profiles are associated with the metadata definitions. A metadata definition is trusted if it does not contain sensitive or private information. The data is declared trusted if it matches a trusted metadata definition.


#### Permit Policy Rules

A permit policy defines permission rules that ensure data is adequately protected or rejected before written to the store.Permit policies are defined in terms of:

* client profile
* trust profile

For example:

* Data containing sensitive or PII information must be rejected.
* Data containing sensitive or PII information must be encrypted with a PII key.


#### Authorize Policy Rules

An authorize policy defines authorization rules that ensure no sensitive data is sent to unauthorized consumers.
Authorize policies are defined in terms of:

* client profile
* trust profile

For example:

* Sensitive or PII data must not be sent to consumers with unauthorized client profile.
* Sensitive or PII data must be stripped when sent to consumers with unauthorized client profile.


### Control Policies

Control policies define rules to manage data enrichment such as filter, transform, and map (F.T.M.). For example, a filter rule may specify that users with invalid email addresses must be rejected. Transform rules may request to compute the tax field for a customer order based on geo-location - where the algorithm may be a static function or a dynamically loaded module. Map rules may specify that all credit card fields must be masked with a random value. 

<img src="/blog/images/fluvio-policy/control-policies.svg"
     alt="Control Policies"
     style="margin: auto; max-width: 530px" />

Fluvio can apply control policies to the ingress or egress side of the data stream.

#### Profiles

Controller policies use the following profiles:

* **Client Profiles** - A client profile uniquely identifies a client.


#### Ingress F.M.T. Policy Rules

Ingress F.M.T. policy defines rules to reject or manipulate data before it is written to store.

For example:

* For data matching "add order" event, compute the tax field.
* For data matching "add customer" event, check email address and reject if invalid.


#### Egress F.M.T. Policy Rules

Egress F.M.T. policy defines rules to reject or manipulate data before it is set to the consumers.

For example:
* Map "names" field to random string when sending to unauthorized consumers.
* Apply custom transformation when reading from `financial` data stream.


### Store Policies

Store policies define data persistency rules such as storage medium, retention period, replication factor, and others. For example, a retention rule may ask to keep all financial records for a minimum of two years. Storage medium rules may ask to move all data older than three months to cold storage. Replication rules may request a minimum replication factor of three distributed across availability zones.

<img src="/blog/images/fluvio-policy/store-policies.svg"
     alt="Store Policies"
     style="margin: auto; max-width: 530px" />

Fluvio can apply policies on writing to or reading from the store.

#### Profiles

Store policies use the following profiles:

* **Configuration Profiles** - A configuration profile defines parameters such as storage type, retention period, replication factor, and more. 

#### Write Policy Rules

Write policy defines rules enforced before writing the data to store.

For example:

* Data streams storing financial records must be preserved for 2 years. The system enforces policy over local retention settings.
* Data streams storing financial records cannot be compacted to prevent data loss. The system blocks all compaction attempts.

#### Read Policy Rules

Read policy defines rules enforced before sending the data to consumers.

For example:

* Unauthorized consumers cannot read data persisted in cold store.
* Unauthorized consumers can read up to the last 24 hours of data.


## Conclusion

Fluvio policies are potent constructs that give operators control over all data exchanges in the organization. Global policies allow security teams to protect sensitive information while continuing to offer safe access to other data. An organization using Fluvio Policy can operate in real-time with a high level of confidence that sensitive data is always protected from unauthorized use.

---
title: "Hub Basics"
weight: 35
description: "A short tutorial on InfinyOn Hub"
---

The InfinyOn Hub serves as a centralized repository for InfinyOn SmartConnectors, SmartModules, and other extensions. It facilitates the discovery and deployment of extensions to enhance the data streaming capabilities of Fluvio. The hub provides a platform for developers and data engineers to easily access pre-built solutions or share their own extensions.

## List

Listing SmartModules will display the SmartModules available to your cluster.

%copy first-line%
```shell
$ fluvio hub sm list
  SMARTMODULE                              Visibility 
  infinyon-labs/array-map-json@0.1.0       public     
  infinyon-labs/dedup-filter@0.0.2         public     
  infinyon-labs/json-formatter@0.1.0       public     
  infinyon-labs/key-gen-json@0.1.0         public     
  infinyon-labs/regex-map-json@0.1.1       public     
  infinyon-labs/regex-map@0.1.0            public     
  infinyon-labs/stars-forks-changes@0.1.2  public     
  infinyon/jolt@0.3.0                      public     
  infinyon/json-sql@0.2.1                  public     
  infinyon/regex-filter@0.1.0              public 
```

Listing Connectors will display the connector packages you can download locally.
%copy first-line%
```shell
$ fluvio hub conn list
  CONNECTOR                          Visibility 
  infinyon-labs/graphite-sink@0.1.2  public     
  infinyon/duckdb-sink@0.1.0         public     
  infinyon/http-sink@0.2.5           public     
  infinyon/http-source@0.2.5         public     
  infinyon/ic-webhook-source@0.1.2   public     
  infinyon/kafka-sink@0.2.7          public     
  infinyon/kafka-source@0.2.5        public     
  infinyon/mqtt-source@0.2.5         public     
  infinyon/sql-sink@0.3.3            public
```


## Download

Downloading a SmartModule is done with respect to your cluster. SmartModules need to be downloaded before they are used in transformations.

%copy first-line%
```shell
$ fluvio hub sm download infinyon/jolt@0.3.0
downloading infinyon/jolt@0.3.0 to infinyon-jolt-0.3.0.ipkg
... downloading complete
... checking package
trying connection to fluvio router.infinyon.cloud:9003
... cluster smartmodule install complete 
```

Running `fluvio hub conn download` will download the package containing source code of the Connector.

%copy first-line%
```shell
$ fluvio hub conn download infinyon/http-source@0.2.5
downloading infinyon/http-source@0.2.5 to infinyon-http-source-0.2.5.ipkg
... downloading complete 
```
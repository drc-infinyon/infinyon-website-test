## Use smartmodule developer kit (smdk) to build your own.
$ fluvio install smdk

## Create your smarmodule project
$ smdk generate 
🤷 Project Name: my-smartmodule
🤷 Which type of SmartModule would you like?
❯ filter
  map
  filter-map
  array-map
  aggregate

## Build & Test
$ smdk build
$ smdk test

## Load to Cluster
$ smdk load

## Publish to Hub
$ smkd publish
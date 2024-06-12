## Use connector developer kit (cdk) to build your own.
$ fluvio install cdk

## Create your connector project
$ cdk generate       
🤷 Project Name: my-connector
🤷 Which type of Connector would you like [source/sink]? ›
  source
❯ sink

## Build & Test
$ cdk build
$ cdk test

## Deploy on your machine
$ cdk deploy

## Publish to Hub
$ cdk publish
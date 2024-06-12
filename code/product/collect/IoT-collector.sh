## Cloud Collector 
$ fluvio topic create collector-topic --mirror
$ fluvio topic collector-topic --mirror-add 6001
$ fluvio cloud register cluster --id 6001 --source-ip 35:42:12:192 
$ fluvio cloud cluster metadata export --topic local-topic \
   --mirror-spu 6001 --file remote-6001.toml

## IoT Sensor (ARMv7, ARM64, etc.)
$ fluvio cluster start --local --config remote-6001.toml

## Produce at Edge
$ fluvio produce local-topic
> test from 6001

## Read from Cloud
$ fluvio consume collector-topic -B
test from 6001
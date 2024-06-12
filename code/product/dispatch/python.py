#!/usr/bin/env python
from fluvio import Fluvio, Offset

if __name__ == "__main__":
    topic = "python-topic";
    partition = 0;

    fluvio = Fluvio.connect()

    consumer = fluvio.partition_consumer(topic, partition)
    for idx, record in enumerate( consumer.stream(Offset.from_end(10)) ):
       print("{}".format(record.value_string()))
       if idx >= 9:
           break
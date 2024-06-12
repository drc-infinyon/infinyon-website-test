#!/usr/bin/env python
from fluvio import Fluvio

if __name__ == "__main__":
    topic = "python-topic";
    record = "Hello from rust!";

    fluvio = Fluvio.connect()

    producer = fluvio.topic_producer(topic)
    producer.send_string(record)

    producer.flush()
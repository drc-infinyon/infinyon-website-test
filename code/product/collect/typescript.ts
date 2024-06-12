import Fluvio from "@fluvio/client";

const produce = async () => {
   const TOPIC_NAME = "node-topic";
   const RECORD_TEXT = "Hello from node!"

   await fluvio.connect();

   const producer = await fluvio.topicProducer(TOPIC_NAME);
   await producer.send(RECORD_TEXT);
};

const fluvio = new Fluvio();
produce();
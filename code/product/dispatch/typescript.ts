import Fluvio, { Offset, Record } from "@fluvio/client";

const consume = async () => {
   const TOPIC_NAME = "hello-node";
   const PARTITION = 0;

   await fluvio.connect();

   const consumer = await fluvio.partitionConsumer(TOPIC_NAME, PARTITION);
   await consumer.stream(Offset.FromEnd(), async (record: Record) => {
      console.log(`Key=${record.keyString()}, Value=${record.valueString()}`);
      process.exit(0);
   });
};

const fluvio = new Fluvio();
consume();
use fluvio::{Fluvio, RecordKey};

#[async_std::main]
async fn main() {
   let topic = "rust-topic";
   let record = "Hello from rust!";

   let fluvio = Fluvio::connect().await.unwrap();

   let producer = fluvio::producer(topic).await.unwrap();
   producer.send(RecordKey::NULL, record).await.unwrap();

   producer.flush().await.unwrap();
}
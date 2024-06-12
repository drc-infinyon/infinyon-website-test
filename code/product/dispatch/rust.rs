use async_std::stream::StreamExt;
use fluvio::{Fluvio, Offset};

#[async_std::main]
async fn main() {
   let topic = "rust-topic";
   let partition = 0;

   let fluvio = Fluvio::connect().await.unwrap();

   let consumer = fluvio::consumer(topic, partitino).await.unwrap();
   let mut stream = consumer.stream(Offset::from_end(1)).await.unwrap();
   if let Some(Ok(record)) = stream.next().await {
       let string = String::from_utf8_lossy(record.value());
       println!("{}", string);
   }
}
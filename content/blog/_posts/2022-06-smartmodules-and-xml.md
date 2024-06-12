---
title: "Handling XML data in Fluvio SmartModules"
author:
    name: "Luis Moreno"
    github: "morenol"
    title: "Engineer"
description: "How to use SmartModules to process XML data in Fluvio"
date: 2022-06-01
metadata:
    - TECH
    - WASM
slug: smartmodule-xml
url: /blog/2022/06/smartmodule-xml
img: blog/images/smartmodule-xml/smartmodule-xml.png
twitter-card: summary_large_image
code:
    height: 9000
---

In [Fluvio], records are just raw bytes, therefore we can create them with any kind of data. In [SmartModules], we only need to know how to handle those raw bytes and how to convert them in something that we can process. In this blog, we will create a SmartModule that handles [XML](https://www.w3.org/XML/) data.


Check out the full code {{%link "https://github.com/infinyon/fluvio-smartmodule-examples/blob/10af0b00031aba782f7be943c9bd6ab7ab83cd39/smartmodule-xml/src/lib.rs" "in the fluvio-smartmodule-examples repository" %}}.


### Pre-conditions

In order to properly follow this blog, you need to have installed the [Fluvio CLI] and a have a Fluvio cluster up and running. You can accomplish both requirements using Infinyon Cloud following the next steps:

1. Download [Fluvio CLI]
2. Sign-up for a [free InfinyOn Cloud account].
3. Login to InfinyOn Cloud via CLI: `fluvio cloud login`

[Fluvio CLI]: https://fluvio.io/download
[free InfinyOn Cloud account]: https://infinyon.cloud/signup

### Scenario: Bike Occupancy in London

For this scenario, we are going to use one of the [public APIs](https://api-portal.tfl.gov.uk/) from [Transport for London](https://tfl.gov.uk/) to retrieve information from the Bike Occupancy in some of the Bike points that they have.

In particular, we are going to use the [get bike points occupancy] API. As an example, we can retrieve bike point occupancy for bike points `BikePoints_1` and `BikePoints2` in XML format using `curl` (beutified):

%copy first-line%
```bash
$ curl https://api.tfl.gov.uk/Occupancy/BikePoints/BikePoints_1,BikePoints_2 -H Accept:text/xml
<ArrayOfBikePointOccupancy
	xmlns:i="http://www.w3.org/2001/XMLSchema-instance"
	xmlns="http://schemas.datacontract.org/2004/07/Tfl.Api.Presentation.Entities">
	<BikePointOccupancy>
		<BikesCount>0</BikesCount>
		<EBikesCount>0</EBikesCount>
		<EmptyDocks>19</EmptyDocks>
		<Id>BikePoints_1</Id>
		<Name>River Street , Clerkenwell</Name>
		<StandardBikesCount>11</StandardBikesCount>
		<TotalDocks>19</TotalDocks>
	</BikePointOccupancy>
	<BikePointOccupancy>
		<BikesCount>31</BikesCount>
		<EBikesCount>0</EBikesCount>
		<EmptyDocks>6</EmptyDocks>
		<Id>BikePoints_2</Id>
		<Name>Phillimore Gardens, Kensington</Name>
		<StandardBikesCount>11</StandardBikesCount>
		<TotalDocks>37</TotalDocks>
	</BikePointOccupancy>
</ArrayOfBikePointOccupancy>
```

We want to use a SmartModule to transform this response into one record per BikePoint and in JSON format. So, for that response, we want to get two records with the following format (beutified):

```json
{
  "BikesCount": 0,
  "EBikesCount": 0,
  "EmptyDocks": 19,
  "Id": "BikePoints_1",
  "Name": "River Street , Clerkenwell",
  "StandardBikesCount": 0,
  "TotalDocks": 19
}
{
  "BikesCount": 31,
  "EBikesCount": 0,
  "EmptyDocks": 6,
  "Id": "BikePoints_2",
  "Name": "Phillimore Gardens, Kensington",
  "StandardBikesCount": 0,
  "TotalDocks": 37
}
```

### Using Connector as source

We want to feed our topic automatically in [Fluvio] with the information of that call. Fortunately, in Fluvio we can use [connectors] as a source to import data from third party services into Fluvio topics. For this case, we can use the [HTTP connector].

[HTTP connector]: https://www.fluvio.io/connectors/inbound/http/
[connectors]: https://www.fluvio.io/connectors/
[get bike points occupancy]: https://api.tfl.gov.uk/swagger/ui/index.html?url=/swagger/docs/v1#!/Occupancy/Occupancy_GetBikePointsOccupancies
[Fluvio]: https://fluvio.io/
[SmartModules]: https://www.fluvio.io/smartmodules/

In order to create the connector we need a config file. For this example, we created a file called `bikepoints.yml` with this content:

%copy%
```yaml
# bikepoints.yml
---
apiVersion: v1
version: 0.2.1
name: bikepoints-connector
type: http
topic: bikepoints-occupancy-xml
create_topic: true
direction: source
parameters:
  endpoint: https://api.tfl.gov.uk/Occupancy/BikePoints/BikePoints_1,BikePoints_2,BikePoints_3
  header: Accept:text/xml
  method: GET
  interval: 300
```

This configuration will create a `http` connector called `bikepoints-connector` that produces to topic `bikepoints-occupancy-xml` the response body from calling the [get bike points occupancy] endpoint each 300 seconds. Note that for this example we are retrieving information from three bike points (`BikePoints_1`, `BikePoints_2`, `BikePoints_3`) and that we are using the header `Accept`: `text/xml` in order to receive a response with XML format.

With that file, we can create a connector with the command:

%copy first-line%
```bash
$ fluvio connector create -c bikepoints.yml
```
Once that is created, the connector will start producing records to the `bikepoints-occupancy-xml` topic:

%copy first-line%
```bash
$ fluvio consume bikepoints-occupancy-xml -B
Consuming records from the beginning of topic 'bikepoints-occupancy-xml'
<ArrayOfBikePointOccupancy xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.datacontract.org/2004/07/Tfl.Api.Presentation.Entities"><BikePointOccupancy><BikesCount>0</BikesCount><EBikesCount>0</EBikesCount><EmptyDocks>19</EmptyDocks><Id>BikePoints_1</Id><Name>River Street , Clerkenwell</Name><StandardBikesCount>0</StandardBikesCount><TotalDocks>19</TotalDocks></BikePointOccupancy><BikePointOccupancy><BikesCount>28</BikesCount><EBikesCount>0</EBikesCount><EmptyDocks>9</EmptyDocks><Id>BikePoints_2</Id><Name>Phillimore Gardens, Kensington</Name><StandardBikesCount>0</StandardBikesCount><TotalDocks>37</TotalDocks></BikePointOccupancy><BikePointOccupancy><BikesCount>19</BikesCount><EBikesCount>0</EBikesCount><EmptyDocks>13</EmptyDocks><Id>BikePoints_3</Id><Name>Christopher Street, Liverpool Street</Name><StandardBikesCount>0</StandardBikesCount><TotalDocks>32</TotalDocks></BikePointOccupancy></ArrayOfBikePointOccupancy>
```

### Create a new project for SmartModule

Since, we want to convert one record into multiple records, we should use an [array-map](https://www.fluvio.io/smartmodules/transform/array-map/) SmartModule. In order to get started, we can use the `cargo-generate` tool to create an `array-map` template project. If you don't already have it installed, you can get it with this command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

After you have `cargo-generate` installed, you can create a smartmodule project using `array-map` and no parameters template using the following command:

%copy first-line%
```bash
$ cargo generate --git=https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : smartmodule-xml
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · array-map
✔ 🤷   Want to use SmartModule parameters? · false
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `smartmodule-xml`...
✨   Done! New project created smartmodule-xml
```

Note that, we selected `array-map` as the SmartModule type and that we are not using SmartModule parameters.

Let's navigate into our project directory and take a look at the sample code
we were given:

%copy first-line%
```bash
$ cd smartmodule-xml && cat src/lib.rs
```

We should see the following code:

```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Result, Record, RecordData};

#[smartmodule(array_map, params)]
pub fn array_map(record: &Record) -> Result<Vec<(Option<RecordData>, RecordData)>> {
    // Deserialize a JSON array with any kind of values inside
    let array = serde_json::from_slice::<Vec<serde_json::Value>>(record.value.as_ref())?;

    // Convert each JSON value from the array back into a JSON string
    let strings: Vec<String> = array
        .into_iter()
        .map(|value| serde_json::to_string(&value))
        .collect::<core::result::Result<_, _>>()?;

    // Create one record from each JSON string to send
    let kvs: Vec<(Option<RecordData>, RecordData)> = strings
        .into_iter()
        .map(|s| (None, RecordData::from(s)))
        .collect();
    Ok(kvs)
}
```

Now, we want to edit this smartmodule to behave the way we want. First, we need a library to deserialize the record value that is stored in XML format. For that, we can use the [quick-xml](https://docs.rs/quick-xml/) crate. In order to use that library the way we need, we have to add that crate to our `Cargo.toml` file with the `serialize` feature enabled.

Paste the following code into `Cargo.toml`:

%copy%
```toml
quick-xml = { version = "0.23.0", features = ["serialize"] }
```

Then, we need to define the structs that will store the information from the records. In particular, for the shape of the data that the Bike occupancy API has, we can copy this into `src/lib.rs`:

%copy%
```rust
// src/lib.rs
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ArrayOfBikePointOccupancy {
    bike_point_occupancy: Vec<BikePointOccupancy>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct BikePointOccupancy {
    bikes_count: usize,
    e_bikes_count: usize,
    empty_docks: usize,
    id: String,
    name: String,
    standard_bikes_count: usize,
    total_docks: usize,
}
```

Once the structs are defined, we just need to deserialize the records values into those structs and then for each Bike Point information, we serialize them as JSON and create separated records. We can copy this into out `src/lib.rs` file to do that:

%copy%
```rust
// src/lib.rs
#[smartmodule(array_map)]
pub fn array_map(record: &Record) -> Result<Vec<(Option<RecordData>, RecordData)>> {
    // Deserialize XML from record using quick_xml crate
    let array = quick_xml:: de ::from_slice::<ArrayOfBikePointOccupancy>(record.value.as_ref())?;

    // Create a Json string for each bike point occupancy
    let strings: Vec<String> = array
        .bike_point_occupancy
        .into_iter()
        .map(|value| serde_json::to_string(&value))
        .collect::<core::result::Result<_, _>>()?;

    // Create one record from each JSON string to send
    let kvs: Vec<(Option<RecordData>, RecordData)> = strings
        .into_iter()
        .map(|s| (None, RecordData::from(s)))
        .collect();
    Ok(kvs)
}
```

Now, our `src/lib.rs` should look like this:

%copy%
```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};
use serde::{Deserialize, Serialize};

#[smartmodule(array_map)]
pub fn array_map(record: &Record) -> Result<Vec<(Option<RecordData>, RecordData)>> {
    // Deserialize XML from record
    let array = quick_xml:: de ::from_slice::<ArrayOfBikePointOccupancy>(record.value.as_ref())?;

    // Create a Json string for each bike point occupancy
    let strings: Vec<String> = array
        .bike_point_occupancy
        .into_iter()
        .map(|value| serde_json::to_string(&value))
        .collect::<core::result::Result<_, _>>()?;

    // Create one record from each JSON string to send
    let kvs: Vec<(Option<RecordData>, RecordData)> = strings
        .into_iter()
        .map(|s| (None, RecordData::from(s)))
        .collect();
    Ok(kvs)
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ArrayOfBikePointOccupancy {
    bike_point_occupancy: Vec<BikePointOccupancy>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct BikePointOccupancy {
    bikes_count: usize,
    e_bikes_count: usize,
    empty_docks: usize,
    id: String,
    name: String,
    standard_bikes_count: usize,
    total_docks: usize,
}
```

Once we have our code ready, we can build the smartmodule. First, make sure that you have the `wasm32-unknown-unknown` target installed and then compile with:

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
$ cargo build --release
```

Then, we can upload that SmartModule to fluvio with the name `smartmodule-xml`.

%copy first-line%
```bash
$ fluvio sm create smartmodule-xml --wasm-file target/wasm32-unknown-unknown/release/smartmodule_xml.wasm
```

Finally, we use the `smartmodule-xml` SmartModule uploaded to consume the `bikepoints-occupancy-xml` topic:

%copy first-line%
```bash
$ fluvio consume bikepoints-occupancy-xml -B --array-map smartmodule-xml
Consuming records from the beginning of topic 'bikepoints-occupancy-xml'
{"BikesCount":0,"EBikesCount":0,"EmptyDocks":19,"Id":"BikePoints_1","Name":"River Street , Clerkenwell","StandardBikesCount":0,"TotalDocks":19}
{"BikesCount":28,"EBikesCount":0,"EmptyDocks":9,"Id":"BikePoints_2","Name":"Phillimore Gardens, Kensington","StandardBikesCount":0,"TotalDocks":37}
{"BikesCount":19,"EBikesCount":0,"EmptyDocks":13,"Id":"BikePoints_3","Name":"Christopher Street, Liverpool Street","StandardBikesCount":0,"TotalDocks":32}
{"BikesCount":0,"EBikesCount":0,"EmptyDocks":19,"Id":"BikePoints_1","Name":"River Street , Clerkenwell","StandardBikesCount":0,"TotalDocks":19}
{"BikesCount":27,"EBikesCount":0,"EmptyDocks":10,"Id":"BikePoints_2","Name":"Phillimore Gardens, Kensington","StandardBikesCount":0,"TotalDocks":37}
{"BikesCount":20,"EBikesCount":0,"EmptyDocks":12,"Id":"BikePoints_3","Name":"Christopher Street, Liverpool Street","StandardBikesCount":0,"TotalDocks":32}
```

That's all! Now you can see that our smartmodule is transforming our XML data into multiple records with JSON format.


## Conclusion

That's it for this post. You can see that Fluvio can store any kind of binary data. And it is just responsability of the SmartModule Developer to be able to decode/deserialize that data successfully in order to apply custom logic on top of that.

Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions. Until next time!


### Further reading

- [Streaming the Reddit API using Fluvio's WASM ArrayMap]({{<ref "2021-10-smartmodule-array-map-reddit" >}})
- [The InfinyOn Continuous Intelligence Platform]({{<ref "2021-10-infinyon-continuous-intelligence" >}})
- [Future Trends in Real-Time Data]({{<ref "2022-02-future-trends-in-real-time-data" >}})

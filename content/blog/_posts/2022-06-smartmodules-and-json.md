---
title: "Handling JSON data in Fluvio SmartModules"
author:
    name: "Luis Moreno"
    github: "morenol"
    title: "Engineer"
description: "How to use SmartModules to process JSON data in Fluvio"
date: 2022-06-08
metadata:
    - TECH
    - WASM
slug: smartmodule-json
url: /blog/2022/06/smartmodule-json
img: blog/images/smartmodule-json/smartmodule-json.png
twitter-card: summary_large_image
code:
    height: 9000
---

In a [previous blog]({{< ref "2022-06-smartmodules-and-xml" >}}), we made an example on how we can work with XML data in [Fluvio]. Another very common data format in data streaming is JSON. In this blog, we will show an example on how to handle JSON data in [SmartModules].

This blog is intended for Rust beginners.

Check out the full code {{%link "https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/smartmodule-json/src/lib.rs" "in the fluvio-smartmodule-examples repository" %}}.

[Fluvio]: https://fluvio.io/
[SmartModules]: https://www.fluvio.io/smartmodules/


### Pre-conditions

In order to properly follow this blog, you need to have installed the [Fluvio CLI] and a have a Fluvio cluster up and running. You can accomplish both requirements using Infinyon Cloud following the next steps:

1. Download [Fluvio CLI]
2. Sign-up for a [free InfinyOn Cloud account].
3. Login to InfinyOn Cloud via CLI: `fluvio cloud login`

[Fluvio CLI]: https://fluvio.io/download
[free InfinyOn Cloud account]: https://infinyon.cloud/signup

### Scenario: Regional Weather in Hong Kong

For this scenario, we are going to use one of the [Hong Kong Observatory Open Data API] to retrieve information about the latest 10-minute mean visibility on some of the places in Hong Kong.

More description about the endpoint that we will use, can be found in the [latest 10-minute mean visibility](https://data.gov.hk/en-data/dataset/hk-hko-rss-regional-weather-latest-10-min-mean-visibility/resource/5d516c53-fbf9-4c78-86aa-41214c8a6145) section of the [Hong Kong Observatory Open Data API] documentation.

[Hong Kong Observatory Open Data API]:https://www.hko.gov.hk/en/abouthko/opendata_intro.html

First, let's try the API with curl:


%copy first-line%
```bash
$ curl "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=LTMV&lang=en&rformat=json"
{"fields":["Date time","Automatic Weather Station","10 minute mean visibility"],"data":[["202206082110","Central","13km"],["202206082110","Chek Lap Kok","45km"],["202206082110","Sai Wan Ho","17km"],["202206082110","Waglan Island","N\/A"]]}
```

Note that the API is intended to be used with CSV format, but since we want to handle JSON data, we will use the JSON format parameter.

We want to use a SmartModule to transform this response into a JSON where we have two keys. `datetime` with the Date time field of the response, and `stationsMeanVisibility` with the mean visibility of each station. For example, for the previous response, we will get something like:

```json
{"datetime":"202206082110","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"13km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"17km"}]}
```

### Using Connector as source

We want to feed our topic automatically in [Fluvio] with the information of that call. Fortunately, in Fluvio we can use [connectors] as a source to import data from third party services into Fluvio topics. For this case, we can use the [HTTP connector].

[HTTP connector]: https://www.fluvio.io/connectors/inbound/http/
[connectors]: https://www.fluvio.io/connectors/

In order to create the connector we need a config file. For this example, we created a file called `hk_mean_visibility.yml` with this content:

%copy%
```yaml
# hk_mean_visibility.yml
---
apiVersion: v1
version: 0.2.1
name: hk-mean-visibility-connector
type: http
topic: hk-mean-visibility
create_topic: true
direction: source
parameters:
  endpoint: https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=LTMV&lang=en&rformat=json
  method: GET
  interval: 600
```

This configuration will create a `http` connector called `hk-mean-visibility-connector` that produces to topic `hk-mean-visibility` the response body from calling the 10-minute mean visibility endpoint from [Hong Kong Observatory Open Data API] each 600 seconds.

With that file, we can create a connector with the command:

%copy first-line%
```bash
$ fluvio connector create -c hk_mean_visibility.yml
```
Once that is created, the connector will start producing records to the `hk-mean-visibility` topic:

%copy first-line%
```bash
$ fluvio consume hk-mean-visibility -B
Consuming records from the beginning of topic 'hk-mean-visibility'
{"fields":["Date time","Automatic Weather Station","10 minute mean visibility"],"data":[["202206082130","Central","12km"],["202206082130","Chek Lap Kok","45km"],["202206082130","Sai Wan Ho","13km"],["202206082130","Waglan Island","N\/A"]]}
```

### Create a new project for SmartModule

Since, we want to convert one record into a records with a different format, we should use a [map](https://www.fluvio.io/smartmodules/transform/array-map/) SmartModule. In order to get started, we can use the `cargo-generate` tool to create a `map` template project. If you don't already have it installed, you can get it with this command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

After you have `cargo-generate` installed, you can create a smartmodule project using `map` and no parameters template using the following command:

%copy first-line%
```bash
$ cargo generate --git=https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : smartmodule-json
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · map
✔ 🤷   Want to use SmartModule parameters? · false
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `smartmodule-json`...
✨   Done! New project created smartmodule-json
```

Note that, we selected `map` as the SmartModule type and that we are not using SmartModule parameters.

Now, it is time to edit our generated SmartModule template project to behave the way we want. First, we need to make sure that the dependencies to handle JSON in Rust are installed. In Rust, the defacto standard to handle JSON data is with the [`serde`](https://docs.serde.rs/serde/index.html) and [`serde_json`](https://docs.serde.rs/serde_json/index.html) crates. By default, our `cargo generate` template projects have both crates installed.

Make sure, that `Cargo.toml` have the `serde` (with the derive feature) and `serde_json` crates.

%copy%
```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Once we are sure that we can use `serde` and `serde_json` crates. It is time to create our Rust structures to represent the data from our records. Let's start with input data:

```json
{
  "fields": [
    "Date time",
    "Automatic Weather Station",
    "10 minute mean visibility"
  ],
  "data": [
    [
      "202206082130",
      "Central",
      "12km"
    ],
    [
      "202206082130",
      "Chek Lap Kok",
      "45km"
    ],
    [
      "202206082130",
      "Sai Wan Ho",
      "13km"
    ],
    [
      "202206082130",
      "Waglan Island",
      "N/A"
    ]
  ]
}
```

We have two fields in the json: `fields` and `data`. `fields` is a list of strings and `data` is a list of a list of strings. In Rust, that can be translated into:

%copy%
```rust
// src/lib.rs
struct InputHKMeanVisibility {
    fields: Vec<String>,
    data: Vec<Vec<String>>
}
```

Now let's do our Rust `struct` for the output:

```json
{
  "datetime": "202206082110",
  "stationsMeanVisibility": [
    {
      "stationName": "Central",
      "meanVisibility": "13km"
    },
    {
      "stationName": "Chek Lap Kok",
      "meanVisibility": "45km"
    },
    {
      "stationName": "Sai Wan Ho",
      "meanVisibility": "17km"
    }
  ]
}
```

In our planned JSON output, we have two fields, `datetime` that is a string and `stationsMeanVisibility` that is a list of objects that have a `stationName` (string) and `meanVisibility` (string). That can be translated in Rust to:

%copy%
```rust
// src/lib.rs
struct OutputHKMeanVisibility {
    datetime: String,
    stations_mean_visibility: Vec<StationMeanVisibility>,
}

struct StationMeanVisibility {
    station_name: String,
    mean_visibility: String,
}
```

Note that the [idiomatic](https://doc.rust-lang.org/1.0.0/style/style/naming/README.html) way to define `struct` fields in Rust is `snake_case`. We will add the changes later to create JSON with `camelCase` fields.

It is time to use `serde`. This is as easy as importing the `Serialize` and `Deserialize` derive macros and adding them to the structs that we just created.

%copy%
```rust
// src/lib.rs
use serde::{Serialize, Deserialize};

#[derive(Deserialize)]
struct InputHKMeanVisibility {
    fields: Vec<String>,
    data: Vec<Vec<String>>
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OutputHKMeanVisibility {
    datetime: String,
    stations_mean_visibility: Vec<StationMeanVisibility>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StationMeanVisibility {
    station_name: String,
    mean_visibility: String,
}
```

Note that we only need `Deserialize` for the input `struct` and `Serialize` for the output `struct`. Also note that we are using `#[serde(rename_all = "camelCase")]` to under the hood serialize the fields the way we want.

Now, let's create a method to transform from `InputHKMeanVisibility` type to `OutputHKMeanVisibility` type. In Rust, this kind of operation is typically done using the [From](https://doc.rust-lang.org/std/convert/trait.From.html) trait.

Let's implement the `From` trait for our structures.

%copy%
```rust
// src/lib.rs
impl From<InputHKMeanVisibility> for OutputHKMeanVisibility {
    fn from(input: InputHKMeanVisibility) -> Self {
        let datetime = input.data[0][0].to_owned();
        let stations_mean_visibility = input
            .data
            .into_iter()
            .map(|data| StationMeanVisibility {
                station_name: data[1].to_owned(),
                mean_visibility: data[2].to_owned(),
            })
            .collect();
        Self {
            datetime,
            stations_mean_visibility,
        }
    }
}

```

That's all the implementation for the `From` trait, we take `datetime` from the first element of the first element of `data` field. And we construct the `stations_mean_visibility` from the second and third element of each one of the elements of the `data` field.

Now, it is time to write our code logic for our SmartModule.

%copy%
```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};

#[smartmodule(map)]
pub fn mean_visibility_map(record: &Record) -> Result<(Option<RecordData>, RecordData)> {
    // Deserialize input from JSON record using serde_json
    let input = serde_json::from_slice::<InputHKMeanVisibility>(record.value.as_ref())?;

    // transform input into output struct using From trait
    let output = OutputHKMeanVisibility::from(input);

    // Serialize output into JSON using serde_json
    let serialized_output = serde_json::to_vec(&output)?;

    Ok((None, RecordData::from(serialized_output)))
}

```

Let's describe our code. First, we need to be aware that  our map `SmartModule` needs a function with the macro `#[smartmodule(map)]` and with the right parameters and output types. In that function, we write our SmartModule logic. In this case, our function is using the `serde_json` crate to deserialize the input from the record into our input struct, then we transform our input struct to our output struct using the `From` trait that we just implemented. Then, we serialize our output struct into JSON again using `serde_json` and finally, we return that result.

Our code now, is ready. It should look like this:

%copy%
```rust
//src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};
use serde::{Deserialize, Serialize};

#[smartmodule(map)]
pub fn mean_visibility_map(record: &Record) -> Result<(Option<RecordData>, RecordData)> {
    // Deserialize input from JSON record using serde_json
    let input = serde_json::from_slice::<InputHKMeanVisibility>(record.value.as_ref())?;

    // transform input into output struct using From trait
    let output = OutputHKMeanVisibility::from(input);

    // Serialize output into JSON using serde_json
    let serialized_output = serde_json::to_vec(&output)?;

    Ok((None, RecordData::from(serialized_output)))
}

#[derive(Deserialize)]
struct InputHKMeanVisibility {
    #[allow(dead_code)]
    fields: Vec<String>,
    data: Vec<Vec<String>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OutputHKMeanVisibility {
    datetime: String,
    stations_mean_visibility: Vec<StationMeanVisibility>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StationMeanVisibility {
    station_name: String,
    mean_visibility: String,
}

impl From<InputHKMeanVisibility> for OutputHKMeanVisibility {
    fn from(input: InputHKMeanVisibility) -> Self {
        let datetime = input.data[0][0].to_owned();
        let stations_mean_visibility = input
            .data
            .into_iter()
            .map(|data| StationMeanVisibility {
                station_name: data[1].to_owned(),
                mean_visibility: data[2].to_owned(),
            })
            .collect();
        Self {
            datetime,
            stations_mean_visibility,
        }
    }
}

```

Once we have our code ready, we can build the smartmodule. First, make sure that you have the `wasm32-unknown-unknown` target installed and then compile with:

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
$ cargo build --release
```

Then, we can upload that SmartModule to fluvio with the name `smartmodule-json`.

%copy first-line%
```bash
$ fluvio sm create smartmodule-json --wasm-file target/wasm32-unknown-unknown/release/smartmodule_json.wasm
```

Finally, we use the `smartmodule-json` SmartModule uploaded to consume the `hk-mean-visibility` topic:

%copy first-line%
```bash
$ fluvio consume hk-mean-visibility -B --map smartmodule-json
Consuming records from the beginning of topic 'hk-mean-visibility'
{"datetime":"202206082130","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"12km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"13km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082140","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"11km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"15km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082150","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"12km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"16km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082200","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"11km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"15km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082210","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"13km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"17km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082220","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"17km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"16km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082230","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"20km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"20km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
{"datetime":"202206082240","stationsMeanVisibility":[{"stationName":"Central","meanVisibility":"16km"},{"stationName":"Chek Lap Kok","meanVisibility":"45km"},{"stationName":"Sai Wan Ho","meanVisibility":"25km"},{"stationName":"Waglan Island","meanVisibility":"N/A"}]}
```

That's all! Now you can see that our smartmodule is transforming our input JSON data into a JSON data with a different schema.

## Conclusion

That's it for this post. As with the XML example, you again can see that Fluvio can store any kind of binary data. And it is just responsability of the SmartModule Developer to be able to decode/deserialize that data successfully in order to apply custom logic on top of that.

Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions. Until next time!


### Further reading

- [Handling XML data in Fluvio SmartModules](/blog/2022/06/smartmodule-xml/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)
- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)

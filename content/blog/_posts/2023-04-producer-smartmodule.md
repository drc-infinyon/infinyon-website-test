---
title: "Optimize Your Fluvio Cluster with Pre-Commit SmartModules "
author:
    name: "Carson Rajcan"
    github: "crajcan"
description: "Learn how to save resources and validate incoming data by applying SmartModules before save"
date: 2023-04-25
metadata:
    - TECH
    - WASM
slug: producer-smartmodule-fluvio
url: /blog/2023/04/producer-smartmodule
img: blog/images/producer-smartmodule/fluvio-croudsourced-weather-data.jpg
twitter-card: summary_large_image
show-header-img: false
---

SmartModules have long provided Fluvio users a way to manipulate data in real-time. Until recently, the Stream Processing Unit ([SPU](https://www.fluvio.io/docs/architecture/spu/)) performed these transformations just after reading messages from storage, before delivering them to Consumers. Now the SPU can apply SmartModule transformations just after receiving them from Producers, before writing to disk.

This post will demonstrate how the SPU can apply multiple types of SmartModules for Producers in order to save storage space, save compute, validate data, and offload latency from the consumption flow to the production flow. If you choose to follow along while reading, it is assumed you have the [Fluvio CLI](https://www.fluvio.io/cli/) installed **(version 0.10.7 or higher)**, as well as the [SmartModule Development Kit](https://www.fluvio.io/cli/smartmodules/smdk/) and a running Fluvio cluster connected.

### Scenario: Crowdsourced weather data

For the purpose of this demo, let's imagine that you are the head of a team of researchers studying (and monitoring for) sudden weather changes across your country. To collect your data, you've designed a low cost, wifi connected device complete with a thermometer, barometer, and sunlight sensor and named it "weather-button". You've sent weather-buttons to thousands of volunteers across the country who have connected them to power sources and wifi, so they can produce data to your Fluvio cluster. 

Because you were uncertain what data would be needed when shipping the initial weather-buttons, you designed them to send all the data read from the sensors, and some identifying metadata:

%copy%
```json
{
    "device_id": 3407,
    "device_version": "1.8.0",
    "resident_email": "johndoe@test.com",
    "source": "weather-button",
    "timestamp": "2023-04-12T15:07:55.312Z",
    "observation_location": {
        "city": "Houston",
        "state": "TX",
        "country": "US",
        "latitude": 29.7432,
        "longitude": -95.4011,
        "zip": 77002,
        "altitude": 80
    },
    "thermometer_reading": {
        "temperature": 23.88,
        "humidity": 52
    },
    "barometer_reading": {
        "absolute_pressure": 30.01,
        "temperature": 23.88,
        "humidity": 52,
        "computed_altitude": 81
    },
    "sunlight_sensor_reading": {
        "illuminance": 9582.5
    }
}
```

The useless and redundant data in the payloads could present a problem for you. Having spent the majority of your budget on manufacturing the weather-buttons, you can afford just enough storage to give your data team the context they need. Fortunately, you had the foresight to program the weather-buttons to invoke a SmartModule by name when producing to Fluvio:

%copy first-line%
```bash
$ fluvio produce weather-event --smartmodule weather-event-cleaner
```

Now that it's time to start recording data, we'll create a SmartModule named "weather-event-cleaner" and use it to reduce the storage burden of each request. We can use the [smdk](https://www.fluvio.io/smartmodules/smdk/overview/) to generate a [Map](https://www.fluvio.io/smartmodules/transform/map) type SmartModule:


%copy multiline-bash%
```bash
$ mkdir weather_research_group
$ cd weather_research_group
$ smdk generate \
    --no-params \
    --sm-type map \
    --project-group weather-research-group \
    --sm-public false \
    weather-event-cleaner
```

This leaves us with a simple Map SmartModule example:

%copy%
```rust
// weather-event-cleaner/src/lib.rs
use fluvio_smartmodule::{smartmodule, Result, Record, RecordData};

#[smartmodule(map)]
pub fn map(record: &Record) -> Result<(Option<RecordData>, RecordData)> {
    let key = record.key.clone();

    let string = std::str::from_utf8(record.value.as_ref())?;
    let int = string.parse::<i32>()?;
    let value = (int * 2).to_string();

    Ok((key, value.into()))
}
```
The sample SmartModule attempts to parse each record into an integer and if successful, doubles it. It also maintains the optional key for each record if one is provided.

Additionally, all the configs (`Cargo.toml`, `SmartModule.toml` and `rust-toolchain.toml`) that we'll need to build the SmartModule are included.

Now let's update the SmartModule for our use case. We'll use [serde](https://serde.rs/), which is already included in the generated Cargo.toml, to model the JSON data being produced by our weather-buttons:

%copy%
```rust
// weather-event-cleaner/src/input_weather_event.rs
use serde::{Deserialize, Serialize};

#[derive(Default, Serialize, Deserialize, Debug)]
pub(crate) struct InputWeatherEvent {
    pub device_id: usize,
    pub device_version: String,
    pub resident_email: String,
    pub source: String,
    pub timestamp: String,
    pub observation_location: InputObservationLocation,
    pub thermometer_reading: InputThermometerReading,
    pub barometer_reading: InputBarometerReading,
    pub sunlight_sensor_reading: InputSunlightSensorReading,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct InputObservationLocation {
    pub city: String,
    pub state: String,
    pub country: String,
    pub latitude: f64,
    pub longitude: f64,
    pub zip: usize,
    pub altitude: usize,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct InputThermometerReading {
    pub temperature: f64,
    pub humidity: usize,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct InputBarometerReading {
    pub absolute_pressure: f64,
    pub temperature: f64,
    pub humidity: usize,
    pub computed_altitude: usize,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct InputSunlightSensorReading {
    pub illuminance: f64,
}
```

Next let's use `serde` again to describe our SmartModule's output type. This time we'll define our structure without the unwanted metadata and redundancy, and we'll reduce the nesting:

%copy%
```rust
// weather-event-cleaner/src/output_weather_event.rs
use serde::{Deserialize, Serialize};

#[derive(Default, Serialize, Deserialize)]
pub(crate) struct OutputWeatherEvent {
    pub device_id: usize,
    pub timestamp: String,
    pub observation_location: OutputObservationLocation,
    pub temperature: f64,
    pub absolute_pressure: f64,
    pub humidity: usize,
    pub illuminance: f64,
}

#[derive(Default, Serialize, Deserialize)]
pub struct OutputObservationLocation {
    pub latitude: f64,
    pub longitude: f64,
    pub altitude: usize,
}
```
-> **Note**: The InfinyOn certified SmartModule [Jolt](https://www.infinyon.com/blog/2022/08/fluvio-jolt-intro/) is available to allow developers to implement JSON to JSON transformations like ours using a simple DSL.

Finally, we can implement the `From` trait to convert between our two types. This is all we need to fill in our `map()` method, which will just deserialize the input JSON, call the `from` method, and then serialize the output JSON:

%copy%
```rust
// weather-event-cleaner/src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};

mod output_weather_event;
mod input_weather_event;

use output_weather_event::{OutputWeatherEvent, OutputObservationLocation};
use input_weather_event::InputWeatherEvent;

impl From<InputWeatherEvent> for OutputWeatherEvent {
    fn from(input_event: InputWeatherEvent) -> Self {
        OutputWeatherEvent {
            device_id: input_event.device_id,
            timestamp: input_event.timestamp,
            observation_location: OutputObservationLocation {
                latitude: input_event.observation_location.latitude,
                longitude: input_event.observation_location.longitude,
                altitude: input_event.observation_location.altitude,
            },
            temperature: input_event.thermometer_reading.temperature,
            absolute_pressure: input_event.barometer_reading.absolute_pressure,
            humidity: input_event.barometer_reading.humidity,
            illuminance: input_event.sunlight_sensor_reading.illuminance,
        }
    }
}

#[smartmodule(map)]
pub fn map(record: &Record) -> Result<(Option<RecordData>, RecordData)> {
    let key = record.key.clone();

    let input_event: InputWeatherEvent =
        serde_json::from_slice(record.value.as_ref())?;

    let output_event = OutputWeatherEvent::from(input_event);
    let value = serde_json::to_vec_pretty(&output_event)?;

    Ok((key, value.into()))
}
```

Now our Map SmartModule is ready to build using the `smdk`:

%copy multiline-bash%
```bash
$ cd weather-event-cleaner
$ smdk build
```

And add to the cluster:

%copy%
```bash
$ smdk load
```

-> **Note**: You can also use the `fluvio smartmodule create` command to add smartmodules to your cluster.

To test what happens when our cluster receives records from the weather-buttons, we'll save a sample `weather_event.json`:

%copy%
```json
{
    "device_id": 3407,
    "device_version": "1.8.0",
    "resident_email": "johndoe@test.com",
    "source": "weather-button data collector",
    "timestamp": "2023-04-12T15:07:55.312Z",
    "observation_location": {
        "city": "Houston",
        "state": "TX",
        "country": "US",
        "latitude": 29.7432,
        "longitude": -95.4011,
        "zip": 77002,
        "altitude": 80
    },
    "thermometer_reading": {
        "temperature": 23.88,
        "humidity": 52
    },
    "barometer_reading": {
        "absolute_pressure": 30.01,
        "temperature": 23.88,
        "humidity": 52,
        "computed_altitude": 81
    },
    "sunlight_sensor_reading": {
        "illuminance": 9582.5
    }
}
```

And create a topic:

%copy%
```bash
$ fluvio topic create weather-events
```

Then produce to it:

%copy%
```bash
// delete the new lines so the entire JSON is interpreted as one record
$ tr -d '\n' < weather_event.json | fluvio produce weather-events --smartmodule weather-event-cleaner
```

Let's review the resulting records.

%copy first-line%
```bash
$ fluvio consume weather-events -B -d
Consuming records from 'weather-events' starting from the beginning of log
{
  "device_id": 3407,
  "timestamp": "2023-04-12T15:07:54.308Z",
  "observation_location": {
    "latitude": 29.7432,
    "longitude": -95.4011,
    "altitude": 80
  },
  "temperature": 23.88,
  "absolute_pressure": 30.01,
  "humidity": 52,
  "illuminance": 9582.5
}
```

That's a lot of storage space saved per record! And we still have all the data we need to feed our model.

## Expanding Our SmartModule's Functionality

Mapping our input data down is a useful function, but there is a lot more we can ask the SPU to help us with before committing our records.

Suppose now that the barometers we shipped with our weather-buttons were a bit unreliable. About 1 out of every 50 events our weather buttons send contains only the default values for the barometer data:

```json
{
    "...": "// --snipped",
    "thermometer_reading": {
        "temperature": 23.92,
        "humidity": 54
    },
    "barometer_reading": {
        "absolute_pressure": 0.0,
        "temperature": 0.0,
        "humidity": 0,
        "computed_altitude": 0
    },
    "sunlight_sensor_reading": {
        "illuminance": 9502.6
    }
}
```

We'll have to remove events such as these or they will skew our results. Luckily, if we remove these invalid events from our data pool, we will still have the density of data needed to feed to our model.

We could ask the `SPU` to perform this filtering on write (for the producer) or on read (for the consumer). Handling this filtering on write will save a few more bytes on disk. Additionally it will save us some compute as our dozens of Consumers won't have to filter the same records. So we'll modify our weather-event-cleaner SmartModule to filter out these records in addition to performing the JSON mapping.

To facilitate the filtering, we'll first have to trade in the `#[smartmodule(map)]` attribute for `#[smartmodule(filter_map)]`. Then we'll have to modify the return type from  `Result<(Option<RecordData>, RecordData)> ` to `Result<Option<(Option<RecordData>, RecordData)>>`. The additional `Option<T>` wrapping the tuple allows us to return `Ok(None)` when we want to drop the record:

%copy%
```rust
// src/lib.rs

// <--snipped-->

#[smartmodule(filter_map)]
pub fn filter_map(record: &Record) -> Result<Option<(Option<RecordData>, RecordData)>> {
    let key = record.key.clone();

    let input_event: InputWeatherEvent =
        serde_json::from_slice(record.value.as_ref())?;

    // filter out the invalid data
    if input_event.barometer_reading.absolute_pressure == 0.0 {
        return Ok(None);
    }

    let output_event = OutputWeatherEvent::from(input_event);
    let value = serde_json::to_vec_pretty(&output_event)?;

    Ok(Some((key, value.into()))) // remember to adjust the return value for new signature
}
```

Again we can build our SmartModule:

%copy%
```bash
$ smdk build
```

And replace our old SmartModule on the cluster:

%copy%
```bash
$ smdk load
```

To test that the new SmartModule still performs the mapping but also omits our invalid events, we'll add another test file, `weather_event2.json`:

%copy%
```json
{
    "device_id": 3407,
    "device_version": "1.8.0",
    "resident_email": "johndoe@test.com",
    "source": "weather-button data collector",
    "timestamp": "2023-04-12T15:07:56.317Z",
    "observation_location": {
        "city": "Houston",
        "state": "TX",
        "country": "US",
        "latitude": 29.7432,
        "longitude": -95.4011,
        "zip": 77002,
        "altitude": 80
    },
    "thermometer_reading": {
        "temperature": 23.92,
        "humidity": 54
    },
    "barometer_reading": {
        "absolute_pressure": 0.0,
        "temperature": 0.0,
        "humidity": 0,
        "computed_altitude": 0
    },
    "sunlight_sensor_reading": {
        "illuminance": 9502.6
    }
}
```

Then produce both files with the new smartmodule.

%copy%
```bash
// again remove the new lines but add one to demarcate
$ (tr -d '\n' < weather_event.json; echo ''; tr -d '\n' < weather_event2.json) | fluvio produce weather-events --smartmodule weather-event-cleaner
```

And verify the results:

%copy first-line%
```bash
$ fluvio consume weather-events -B -d 
Consuming records from 'weather-events' starting 1 from the end of log
{
  "device_id": 3407,
  "timestamp": "2023-04-12T15:07:55.312Z",
  "observation_location": {
    "latitude": 29.7432,
    "longitude": -95.4011,
    "altitude": 80
  },
  "temperature": 23.88,
  "absolute_pressure": 30.01,
  "humidity": 52,
  "illuminance": 9582.5
}
{
  "device_id": 3407,
  "timestamp": "2023-04-12T15:07:55.312Z",
  "observation_location": {
    "latitude": 29.7432,
    "longitude": -95.4011,
    "altitude": 80
  },
  "temperature": 23.88,
  "absolute_pressure": 30.01,
  "humidity": 52,
  "illuminance": 9582.5
}
```

Here we can see the invalid weather event was filtered out, while the valid event was again mapped and committed.

Now that the SPU is applying our new FilterMap SmartModule for the producers, we're maintaining the integrity of our results and avoiding any added latency on read.

## Conclusion

We've seen how applying Map and FilterMap type SmartModules while producing data rather than while consuming can help us to save storage & compute, validate our data once, and offload latency from Consumer processes. Be sure to brainstorm whether applying these or any other [types of SmartModules](https://www.fluvio.io/smartmodules/#data-streaming-apis-available-in-smartmodules) while producing can be helpful to your Fluvio use case.
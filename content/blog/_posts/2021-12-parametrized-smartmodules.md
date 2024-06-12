---
title: "Fluvio SmartModules with user-defined parameters"
author:
    name: "Luis Moreno"
    github: "morenol"
    title: "Engineer"
description: "How to use SmartModules parameters to define alternate behaviors in data stream processing."
date: 2021-12-30
metadata:
    - TECH
    - WASM
slug: smartmodule-params
url: /blog/2021/12/smartmodule-params
img: blog/images/smartmodule-params/smartmodule-params.png
twitter-card: summary_large_image
code:
    height: 9000
---

Since its creation, SmartModules have allowed users to write custom code to interact with their streaming data in real-time. This blog will explore a new way to impact a SmartModule behavior through in-line parameters. As a result, different consumers may apply the same SmartModule to a data stream and receive a different result based on its unique parameter. For example, in the {{%link "https://youtu.be/Ar4MxnN9imQ" "bus demo" %}} video, we used SmartModule parameters to locate a bus number from the fleet. This blog will use parameters on a  {{%link "/blog/2021/08/smartmodule-map-use-cases/" "SmartModule Map" %}} to transform records based on user-defined arguments.

Check out the full code {{%link "https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/smartmodule-with-params/src/lib.rs" "in the fluvio-smartmodule-examples repository" %}}.


### Scenario: Web user events

Let's say that we have a webpage where we track the actions that our registered users can do. In particular, let's say that our users can only do any of these events:

- `register`: a new user registered.
- `login`: user logged in.
- `logout`: user logged out.
- `home_page`: user visited home page.
- `play_demo`: user played demo video.
- `action_a`: user performed action A.
- `action_b`: user performed action B.

In our system, we may want to anonymize or hide particular fields of the events for specific use cases. For example, we may want to take an input like this:

```json
{"type":"login","account_id":"1", "timestamp": 1640878631,"user_client": "safari"}
{"type":"home_page","account_id":"1", "timestamp": 1640878637, "user_client": "safari"}
{"type":"play_demo","account_id":"1", "timestamp": 1640878650, "user_client": "safari"}
{"type":"action_a","account_id":"1", "timestamp": 1640878731, "user_client": "safari"}
{"type":"action_b","account_id":"1", "timestamp": 1640878763, "user_client": "safari"}
```

and turn it into a new stream that looks like this:

```json
{"type":"login", "timestamp": 1640878631, "user_client": "safari"}
{"type":"home_page", "timestamp": 1640878637, "user_client": "safari"}
{"type":"play_demo", "timestamp": 1640878650, "user_client": "safari"}
{"type":"action_a", "timestamp": 1640878731, "user_client": "safari"}
{"type":"action_b", "timestamp": 1640878763, "user_client": "safari"}
```

or maybe we may want to just remove the `account_id` and the `user_client` fields and turn it into a new stream that looks like this:

```json
{"type":"login", "timestamp": 1640878631}
{"type":"home_page", "timestamp": 1640878637}
{"type":"play_demo", "timestamp": 1640878650}
{"type":"action_a", "timestamp": 1640878731}
{"type":"action_b", "timestamp": 1640878763}
```

We'll use SmartModule parameters to implement these features in the next section.

### Create a new project

We can use the amazing `cargo-generate` tool to help us get started quickly with a
Map template project. If you don't already have it installed, you can get it
with this command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

After you have `cargo-generate` installed, you can create a smartmodule project using `map` and parameters template
using the following command:

%copy first-line%
```bash
$ cargo generate --git=https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : smartmodule-with-params
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · map
✔ 🤷   Want to use SmartModule parameters? · true
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `smartmodule-with-params`...
✨   Done! New project created smartmodule-with-params
```

Note that, we selected `map` as the SmartModule type and that we wanted to use SmartModule parameters.

Let's navigate into our project directory and take a look at the sample code
we were given:

%copy first-line%
```bash
$ cd smartmodule-with-params && cat src/lib.rs
```

We should see the following code:

```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Result, Record, RecordData};

#[smartmodule(map, params)]
pub fn map(record: &Record, _params: &SmartModuleOpt) -> Result<(Option<RecordData>, RecordData)> {
    let key = record.key.clone();

    let string = std::str::from_utf8(record.value.as_ref())?;
    let int = string.parse::<i32>()?;
    let value = (int * 2).to_string();

    Ok((key, value.into()))
}


#[derive(fluvio_smartmodule::SmartOpt, Default)]
pub struct SmartModuleOpt;
```

This template code is one of the smallest possible Maps. It takes each input
record as an integer, then multiplies it by two.

Note that in has a `_params` argument that is not being used and that the macro attribute of the `map` function includes the `params` keyword: `#[smartmodule(map, params)]`. This is needed in order to use SmartModule parameters.

In order to use SmartModule parameters we also need to define a struct that implements `Default` and that derives the `SmartOpt` derive macro.
It is also mandatory that all fields of the custom structure defined implement the `FromStr` trait.

For our purposes, we may want to start by defining a data structure that represents the different types
of events that appear in our stream. We can use the `serde` and `serde_json` crates to help us
deserialize this data structure from JSON. If you're following along with the template, you should already have
`serde` and `serde_json` as dependencies, so let's look at how to write the code we need.
Since we're talking about distinct event types, we can use a Rust `enum` to represent this data type.

Below is the full code for the example. Look at the `UserEvent` enum that represents the
input data, and the `UserEventOutput` struct that represents the output data we generate.

Paste the following code into `src/lib.rs`:

%copy%
```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum UserEvent {
    Login(UserEventMetadata),
    Logout(UserEventMetadata),
    Register(UserEventMetadata),
    ActionA(UserEventMetadata),
    ActionB(UserEventMetadata),
    HomePage(UserEventMetadata),
    PlayDemo(UserEventMetadata),
}

#[derive(Deserialize)]
pub struct UserEventMetadata {
    pub account_id: String,
    pub timestamp: i64,
    pub user_client: String,
}

impl UserEventMetadata {
    fn convert(self, params: &SmartModuleOpt) -> UserEventMetadataOutput {
        let account_id = if params.show_account_id {
            Some(self.account_id)
        } else {
            None
        };

        let timestamp = if params.show_timestamp {
            Some(self.timestamp)
        } else {
            None
        };

        let user_client = if params.show_user_client {
            Some(self.user_client)
        } else {
            None
        };
        UserEventMetadataOutput {
            account_id,
            timestamp,
            user_client,
        }
    }
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum UserEventOutput {
    Login(UserEventMetadataOutput),
    Logout(UserEventMetadataOutput),
    Register(UserEventMetadataOutput),
    ActionA(UserEventMetadataOutput),
    ActionB(UserEventMetadataOutput),
    HomePage(UserEventMetadataOutput),
    PlayDemo(UserEventMetadataOutput),
}

#[derive(Serialize)]
pub struct UserEventMetadataOutput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_client: Option<String>,
}

impl UserEvent {
    fn convert(self, params: &SmartModuleOpt) -> UserEventOutput {
        match self {
            UserEvent::Login(metadata) => UserEventOutput::Login(metadata.convert(params)),
            UserEvent::Logout(metadata) => UserEventOutput::Logout(metadata.convert(params)),
            UserEvent::Register(metadata) => UserEventOutput::Register(metadata.convert(params)),
            UserEvent::ActionA(metadata) => UserEventOutput::ActionA(metadata.convert(params)),
            UserEvent::ActionB(metadata) => UserEventOutput::ActionB(metadata.convert(params)),
            UserEvent::HomePage(metadata) => UserEventOutput::HomePage(metadata.convert(params)),
            UserEvent::PlayDemo(metadata) => UserEventOutput::PlayDemo(metadata.convert(params)),
        }
    }
}

#[smartmodule(map, params)]
pub fn map(record: &Record, params: &SmartModuleOpt) -> Result<(Option<RecordData>, RecordData)> {
    let event: UserEvent = serde_json::from_slice(record.value.as_ref())?;
    let output = event.convert(params);
    let value = serde_json::to_string(&output)?;
    Ok((record.key.clone(), value.into()))
}

#[derive(fluvio_smartmodule::SmartOpt)]
pub struct SmartModuleOpt {
    show_account_id: bool,
    show_timestamp: bool,
    show_user_client: bool,
}

impl Default for SmartModuleOpt {
    fn default() -> Self {
        Self {
            show_account_id: true,
            show_timestamp: true,
            show_user_client: true,
        }
    }
}
```

Let's quickly look at what's happening with our data structures:

- Since we're working with different event, each enum variant represents one event type
- We're using `#[serde(tag = "type")]` to add a "type" field to each event with the name of the variant
- We're using `#[serde(rename_all = "snake_case")]` to rename the variants from e.g. `PlayDemo` to `play_demo`
- We have a `SmartModuleOpt` struct that implements Default and has the derived macro `SmartOpt`
- All fields in SmartModuleOpt are booleans (boolean implements the `FromStr` trait)
- By default, all fields in SmartModuleOpt are `true`. This means that if we don't pass any parameters all the fields will be displayed.
- We implemented a `UserEvent::convert` function that takes as input the `&SmartModuleOpt` and returns an UserEventOutput.

Now, let's look at what's going on inside the `map` function itself:

- First, we read the input as a JSON UserEvent called `event`
- Then we transform our `UserEvent` into `UserEventOutput` using the `UserEvent::convert` function described above with paramaters passed
 to the smartmodule.

We are now ready to compile. If you've never compiled for WASM before, you'll need to install the proper `rustup` target.
You should only need to do this once.

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
```

Let's go ahead and compile it, using `--release` mode to get the smallest WASM binary possible:

%copy first-line%
```bash
$ cargo build --release
```

Let's get set up on Fluvio and see our new smartmodule with params in action!

### Testing the Parameters in smartmodule with Fluvio CLI

In order to follow along, make sure you {{%link "https://fluvio.io/download" "have Fluvio installed" %}} and are up and running
with a Fluvio cluster. The first thing we'll need to do is to create a new Fluvio topic
for us to stream our events.

%copy first-line%
```bash
$ fluvio topic create user-events
```

Next, we'll want to produce some sample records to this topic, these will act as the input to
our SmartModule.

%copy first-line%
```bash
$ fluvio produce user-events
> {"type":"login","account_id":"1", "timestamp": 1640878631,"user_client": "safari"}
Ok!
> {"type":"home_page","account_id":"1", "timestamp": 1640878637, "user_client": "safari"}
Ok!
> {"type":"play_demo","account_id":"1", "timestamp": 1640878650, "user_client": "safari"}
Ok!
> {"type":"action_a","account_id":"1", "timestamp": 1640878731, "user_client": "safari"}
Ok!
> {"type":"action_b","account_id":"1", "timestamp": 1640878763, "user_client": "safari"}
Ok!
```

At this point, we're ready to get to work with our smartmodule.
Let's use our Map while we consume records from our topic using the following command:

%copy first-line%
```bash
$ fluvio consume user-events -B --map=./target/wasm32-unknown-unknown/release/smartmodule_with_params.wasm
{"type":"login","account_id":"1","timestamp":1640878631,"user_client":"safari"}
{"type":"home_page","account_id":"1","timestamp":1640878637,"user_client":"safari"}
{"type":"play_demo","account_id":"1","timestamp":1640878650,"user_client":"safari"}
{"type":"action_a","account_id":"1","timestamp":1640878731,"user_client":"safari"}
{"type":"action_b","account_id":"1","timestamp":1640878763,"user_client":"safari"}
```
As you can see, the output remains unchanged. This is happening because we are calling the smartmodule without
passing values to the parameters it is using. When this happens, it uses the default value, which as we already mentioned is to
display everything.

In order to pass parameters to the smartmodule using the CLI, we need to use the `-e key=value` flag. Let's try
to hide the `account_id` field:

%copy first-line%
```bash
$ fluvio consume user-events --map target/wasm32-unknown-unknown/release/smartmodule_with_params.wasm  -B -e show_account_id=false
Consuming records from the beginning of topic 'events'
{"type":"login","timestamp":1640878631,"user_client":"safari"}
{"type":"home_page","timestamp":1640878637,"user_client":"safari"}
{"type":"play_demo","timestamp":1640878650,"user_client":"safari"}
{"type":"action_a","timestamp":1640878731,"user_client":"safari"}
{"type":"action_b","timestamp":1640878763,"user_client":"safari"}
```

Now, let's try to hide both `account_id` and `user_client` fields:

%copy first-line%
```bash
fluvio consume user-events --map target/wasm32-unknown-unknown/release/smartmodule_with_params.wasm  -B -e show_account_id=false -e show_user_client=false
Consuming records from the beginning of topic 'events'
{"type":"login","timestamp":1640878631}
{"type":"home_page","timestamp":1640878637}
{"type":"play_demo","timestamp":1640878650}
{"type":"action_a","timestamp":1640878731}
{"type":"action_b","timestamp":1640878763}
```

We can see that the output stream hides the fields that we don't want to display if we pass them through the CLI. This is useful if we want to reuse a smartmodule for different similar purposes.

## Conclusion

That's it for this post, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions. Until next time!

### Further reading

- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)
- [Using Fluvio FilterMap to apply focus to real-time data](/blog/2021/11/filter-map/)

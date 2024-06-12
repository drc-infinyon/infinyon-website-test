---
title: "Using Fluvio FilterMap to apply focus to real-time data"
author:
    name: "Nick Mosher"
    github: "nicholastmosher"
    title: "Engineer"
description: "How to narrow-in on an event stream to build a focused real-time application."
date: 2021-11-23
metadata: 
    - TECH
    - WASM    
slug: filter-map
url: /blog/2021/11/filter-map
img: blog/images/filter-map/filter-map.png
twitter-card: summary_large_image
code:
    height: 9000
---

In a data-driven
organization, one technique that's used to promote data-in-motion and enable
real-time reaction is called Event Sourcing, where the data in a system is
modeled as a stream of actions, rather than a sitting store of "current state".
Event Sourcing allows us to reconstruct the system's state at any point in time,
but to do this, we need to keep track of _all_ the events flowing through the
system, which can amount to terabytes or petabytes in large organizations.
Sometimes, however, we want to develop specialized microservices that just need
access to a small subset of the organization's data. In these cases, it doesn't
make sense to feed the massive firehose of events to the microservice - it might
get overwhelmed, or incur large costs for moving bulk data that might not be
needed!

In scenarios like this, we can use tools like Fluvio's FilterMap to
create a special-purpose stream for our microservice, capturing only those events
that are relevant, and pre-processing them to be most easily consumed and used
by the microservice. In this blog, we're going to explore a miniature version
of this use-case, where we create a focused stream of event messages needed to
develop an SMS Notifications microservice for an Online Grocery application.

You can check out the full code [in the fluvio-smartmodule-examples repository].

[in the fluvio-smartmodule-examples repository]: https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/grocery-notifications/src/lib.rs

### Scenario: SMS Notifications for Online Groceries

Let's say that our microservice is in charge of tracking the status of online grocery orders.
Customers create accounts, put items into their cart, and checkout in the
online store - and these events are all captured in a Fluvio topic as records.
Suppose we would like to add a feature where customers can receive SMS notifications
as their grocery order is being processed. We might want to provide notifications when
the courier starts collecting the groceries, whether they discover any items are out of
stock, or when the order is ready to pick up.

In this system, there would be multiple types of events flowing through the topic,
but only some of them are relevant to SMS notifications. Suppose we had the following
types of events:

- `create_account`: A customer created an account
- `add_to_cart`: The customer added an item to their cart
- `add_billing`: The customer added a credit card or payment method to their account
- `checkout`: The customer confirmed the items in their cart and checked out
- `order_begun`: The courier at the grocery store has started collecting groceries
- `item_status`: The courier physically collected an item, or discovered it was out of stock
- `order_ready`: The order has been collected and is ready for curbside pickup

For the SMS Notifications system, we are only interested in the last three event types,
`order_begun`, `item_status`, and `order_ready` - the other events happen while the user
is navigating the site, so there is no need to notify them! When building our notification
service, we would like to have a stream of just the events that are relevant to our subsystem,
and formatted in a way that makes it easy to fill our use-case.

Ultimately, we'd like to be able to take an input stream of records like this
(where each line is one record):

```json
{"type":"account_created","account_id":"1","username":"bill9876","preferred_name":"Bill","phone_number":"1-800-234-5678"}
{"type":"add_to_cart","item_id":"1001","item_name":"Milk"}
{"type":"add_to_cart","item_id":"1002","item_name":"Eggs"}
{"type":"add_billing","account_id":"1","card_holder":"Bill Billardson","card_number":"1234-5678-2468-1357","expiration":"01/99","security_code":"999"}
{"type":"checkout","account_id":"1"}
{"type":"order_begun","account_id":"1","sms_number":"1-800-234-5678","sms_name":"Billy"}
{"type":"item_status","account_id":"1","item_name":"Milk","status":"Collected","sms_number":"1-800-234-5678","sms_name":"Bill"}
{"type":"item_status","account_id":"1","item_name":"Eggs","status":"Out of stock, refunded","sms_number":"1-800-234-5678","sms_name":"Bill"}
{"type":"order_ready","account_id":"1","sms_number":"1-800-234-5678","sms_name":"Bill"}
```

and turn it into a new stream that looks like this:

```json
{"number":"1-800-234-5678","message":"Hello Bill, your groceries are being collected!"}
{"number":"1-800-234-5678","message":"Hello Bill, we have an update on your Milk: Collected"}
{"number":"1-800-234-5678","message":"Hello Bill, we have an update on your Eggs: Out of stock, refunded"}
{"number":"1-800-234-5678","message":"Hello Bill, your groceries have been collected and are ready to pick up!"}
```

Let's look at how we can use a FilterMap to select our three event types from our input
stream, and prepare the event data to be most easily consumed and used by our SMS notification
system.

### Create a new project

We can use the amazing `cargo-generate` tool to help us get started quickly with a
FilterMap template project. If you don't already have it installed, you can get it
with this command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

After you have `cargo-generate` installed, you can create a FilterMap project template
using the following command:

%copy first-line%
```bash
$ cargo generate --git=https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : filter-map
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · filter-map
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `filter-map`...
✨   Done! New project created filter-map
```

Let's navigate into our project directory and take a look at the sample code
we were given:

%copy first-line%
```bash
$ cd filter-map && cat src/lib.rs
```

We should see the following code:

```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};

#[smartmodule(filter_map)]
pub fn filter_map(record: &Record) -> Result<Option<(Option<RecordData>, RecordData)>> {
    let key = record.key.clone();
    let string = String::from_utf8_lossy(record.value.as_ref()).to_string();
    let int: i32 = string.parse()?;

    if int % 2 == 0 {
        let output = int / 2;
        Ok(Some((key.clone(), RecordData::from(output.to_string()))))
    } else {
        Ok(None)
    }
}
```

This template code is one of the smallest possible FilterMaps. It takes each input
record as an integer, then filters it out if it's odd, or divides it in half if it's even.

The important thing to notice about a FilterMap is that it returns an `Option` of a record.
If we decide to return `None`, then the input record gets filtered out and will not appear
in the output stream. If we return `Some` record, then the record we return _will_ continue
downstream.

For our purposes, we'll want to define a data structure that represents the different types
of events that appear in our stream. We can use the `serde` and `serde_json` crates to help us
deserialize this data structure from JSON, then examine it to see whether we should keep it or not.
If you're following along with the template, you should already have `serde` and `serde_json`
as dependencies, so let's look at how to write the code we need.

Since we're talking about distinct event types, we can use a Rust `enum` to represent this data type.
Below is the full code for the example. Look at the `GroceryEvent` enum that represents the
input data, and the `SmsMessage` struct that represents the output data we generate.

Paste the following code into `src/lib.rs`:

%copy%
```rust
use serde::{Serialize, Deserialize};
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};

/// Events that may take place in an online grocery service
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum GroceryEvent {
    AccountCreated {
        account_id: String,
        username: String,
        preferred_name: String,
        phone_number: String,
    },
    AddToCart { item_id: String, item_name: String },
    AddBilling {
        account_id: String,
        card_holder: String,
        card_number: String,
        expiration: String,
        security_code: String,
    },
    Checkout { account_id: String },
    OrderBegun {
        account_id: String,
        sms_number: String,
        sms_name: String,
    },
    ItemStatus {
        account_id: String,
        item_name: String,
        status: String,
        sms_number: String,
        sms_name: String,
    },
    OrderReady {
        account_id: String,
        sms_number: String,
        sms_name: String,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct SmsMessage {
    number: String,
    message: String,
}

#[smartmodule(filter_map)]
fn filter_map(record: &Record) -> Result<Option<(Option<RecordData>, RecordData)>> {
    let event: GroceryEvent = match serde_json::from_slice(record.value.as_ref()) {
        Ok(event) => event,
        Err(_) => return Ok(None), // Skip if we fail to parse JSON
    };

    let sms_message = match event {
        GroceryEvent::OrderBegun {
            sms_name,
            sms_number,
            ..
        } => SmsMessage {
            number: sms_number,
            message: format!("Hello {}, your groceries are being collected!", sms_name),
        },
        GroceryEvent::ItemStatus {
            sms_name,
            sms_number,
            item_name,
            status,
            ..
        } => SmsMessage {
            number: sms_number,
            message: format!(
                "Hello {}, we have an update on your {}: {}",
                sms_name, item_name, status
            ),
        },
        GroceryEvent::OrderReady {
            sms_name,
            sms_number,
            ..
        } => SmsMessage {
            number: sms_number,
            message: format!(
                "Hello {}, your groceries have been collected and are ready to pick up!",
                sms_name
            ),
        },
        _ => return Ok(None),
    };

    let message_json = serde_json::to_string(&sms_message)?;
    Ok(Some((record.key.clone(), message_json.into())))
}
```

Let's quickly look at what's happening with our data structures:

- Since we're working with different event types, each enum variant represents one event type and its data
- We're using `#[serde(tag = "type")]` to add a "type" field to each event with the name of the variant
- We're using `#[serde(rename_all = "snake_case")]` to rename the variants from e.g. `AccountCreated` to `account_created`

Now, let's look at what's going on inside the `filter_map` function itself:

- First, we read the input as a JSON GroceryEvent called `event`
- Then, we use Rust's `match` statement to choose what to do based on the type of event
  - We have cases for `OrderBegun`, `ItemStatus`, and `OrderReady`, which are the events we are interested in
  - For all other events, we return `Ok(None)`, which filters them out of the stream
- In each `match` case, we transform the input event into an `SmsMessage`, which we use as our output
- Finally, we serialize our `SmsMessage` into JSON and return it

Let's get set up on Fluvio and see our new FilterMap in action!

### Testing the FilterMap on Fluvio

In order to follow along, make sure you [have Fluvio installed] and are up and running
with a Fluvio cluster. The first thing we'll need to do is to create a new Fluvio topic
for us to stream our events.

%copy first-line%
```bash
$ fluvio topic create groceries
```

Next, we'll want to produce some sample records to this topic, these will act as the input to
our FilterMap. Create a new file called `groceries.txt` with the following contents:

%copy%
```json
{"type":"account_created","account_id":"1","username":"bill9876","preferred_name":"Bill","phone_number":"1-800-234-5678"}
{"type":"add_to_cart","item_id":"1001","item_name":"Milk"}
{"type":"add_to_cart","item_id":"1002","item_name":"Eggs"}
{"type":"add_billing","account_id":"1","card_holder":"Bill Billardson","card_number":"1234-5678-2468-1357","expiration":"01/99","security_code":"999"}
{"type":"checkout","account_id":"1"}
{"type":"order_begun","account_id":"1","sms_number":"1-800-234-5678","sms_name":"Billy"}
{"type":"item_status","account_id":"1","item_name":"Milk","status":"Collected","sms_number":"1-800-234-5678","sms_name":"Bill"}
{"type":"item_status","account_id":"1","item_name":"Eggs","status":"Out of stock, refunded","sms_number":"1-800-234-5678","sms_name":"Bill"}
{"type":"order_ready","account_id":"1","sms_number":"1-800-234-5678","sms_name":"Bill"}
```

Then, produce these events line-by-line to Fluvio using the following command:

%copy first-line%
```bash
$ fluvio produce groceries -f ./groceries.txt
```

At this point, we're ready to get to work with FilterMap. 

If you've never compiled for WASM before, you'll need to install the proper `rustup` target.
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

Now, we can use our FilterMap while we consume records from our topic using the following
command:

%copy first-line%
```bash
$ fluvio consume groceries -B --filter-map=./target/wasm32-unknown-unknown/release/filter_map.wasm
Consuming records from the beginning of topic 'groceries'
{"number":"1-800-234-5678","message":"Hello Bill, your groceries are being collected!"}
{"number":"1-800-234-5678","message":"Hello Bill, we have an update on your Milk: Collected"}
{"number":"1-800-234-5678","message":"Hello Bill, we have an update on your Eggs: Out of stock, refunded"}
{"number":"1-800-234-5678","message":"Hello Bill, your groceries have been collected and are ready to pick up!"}
```

We can see that the output stream only contains the three event types we care about, and that
they have been formatted to be quickly and easily used by our SMS notification system.
Overall, using FilterMap in this scenario has provided us with several advantages:

- Events containing sensitive or irrelevant information are being filtered in advance
  - This can help to avoid accidental disclosure by the SMS system, e.g. by a bug - if it
    never has access to sensitive information, it can't leak it!
- Events are preprocessed to be minimal and directly useful to our downstream
  application. A simple SMS notification system just needs the number and message to send.

## Conclusion

That's it for this post, be sure to join [our Discord server]
if you want to talk to us or have any questions. Until next time!

[Fluvio]: https://fluvio.io/
[have Fluvio installed]: https://fluvio.io/download
[our Discord server]: https://discordapp.com/invite/bBG2dTz

### Further reading

- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)
- [Aggregate streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-aggregates/)

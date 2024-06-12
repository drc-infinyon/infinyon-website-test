---
title: "Write a WASM-based filter for application logs"
author:
    name: "Nick Mosher"
    github: "nicholastmosher"
    title: "Engineer"
description: How to write custom filtering code to run inline over your streaming data.
date: 2021-06-29
metadata:
    - TECH
    - WASM
slug: smartmodule-filters
url: /blog/2021/06/smartmodule-filters
img: blog/images/smartmodule-filter/filter.png
twitter-card: summary_large_image
code:
    height: 9000
---

[Fluvio] is a high-performance, distributed streaming platform for real-time data.
Lately, we've been working hard on our most exciting feature yet: the ability to
write custom code that operates inline on your streaming data.
[We call this feature SmartModules], and it's powered by [WASM] to be as lightweight
and high-performance as possible.
In this blog, I want to dive in and talk about how to get started writing your own
SmartModule, and how to install it into Fluvio to process your streaming data.

[Fluvio]: https://www.fluvio.io/docs/
[We call this feature SmartModules]: {{<ref "2021-06-introducing-fluvio#smartmodules-programmable-stream-processing" >}}
[WASM]: https://webassembly.org/

Here's a sneak peek at what we'll be doing with SmartModules in this blog: filtering
server logs by log-level!

<video controls width="860px">
  <source src="/blog/images/smartmodule-filter/fluvio-filter-json.mov">
</video>

You can check out the full code for this blog [in the SmartModule examples repo]!

[in the SmartModule examples repo]: https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/log-level/src/lib.rs

## Filters

The simplest type of SmartModule is a [filter], which can examine each record in
a stream and decide whether to accept or reject it. All records that are accepted
by a filter will be delivered down the pipeline to the consumer, but records that
are rejected will be discarded from the stream.

[filter]: https://www.fluvio.io/smartmodules/transform/filter/

<img src="/blog/images/smartmodule-filter/ss-filter.svg"
     alt="Filter Example"
     style="margin: auto; max-width: 700px" />

> Note that this does not mean that records are deleted from the partition they are
> persisted in, it simply means that those records are not delivered to the consumer.

Some good use-cases for filters include:

- Filtering application logs based on log-level (explored in this blog),
- Detecting and filtering out records containing Social Security numbers,
- Selecting a subset of records based on a user or group ID.

### Example use-case: Filter Records by JSON fields

For this example, we're going to work with streams of JSON data, and we're going to filter
our records based on the contents of specific JSON fields. SmartModules are written
using arbitrary Rust code, so we can also pull in other crates as dependencies. We're
going to use `serde` and `serde_json` to help us work with our JSON data.
If you want to jump ahead and see the finished code,
<a href="https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/log-level/src/lib.rs" target="_blank">
check out our JSON filter example
</a>.

#### Create a new Project

SmartModules require some special build configurations, so to make it easy to get
started we created a [`cargo-generate`] template with all the setup already done.
You can install `cargo-generate` using `cargo install`:

[`cargo-generate`]: https://github.com/cargo-generate/cargo-generate

%copy first-line%
```bash
$ cargo install cargo-generate
```

Now let's use `cargo-generate` to set up our new SmartModule project. We'll want
to give the project a name and choose the "filter" option.

%copy first-line%
```bash
$ cargo generate --git https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : log-level
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · filter
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `log-level`...
✨   Done! New project created log-level
```

Alright, now that we have our setup all ready, let's talk about what we're going to
be filtering.

#### The Data: Server Logs

Suppose we have a web server that accepts HTTP requests from clients, does some
stuff, and then returns a response. It is common for such servers to have an
application logging system where they report various events taking place within the
server so that it may be monitored. We can imagine that this web server is exporting
logs to Fluvio via a producer, and that the logs are formatted as JSON describing
the event that occurred.

For the purposes of this exercise, let's say we have a file that we've stored our logs
into, so that we can manually produce them to a Fluvio topic and consume them back
using our JSON SmartModule. Create a file called `server.log` with the following
contents:

```bash
$ cat server.log
{"level":"info","message":"Server listening on 0.0.0.0:8000"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"debug","message":"Deserializing request from client"}
{"level":"debug","message":"Client request deserialized"}
{"level":"debug","message":"Connecting to database"}
{"level":"warn","message":"Client dropped connection"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"debug","message":"Deserializing request from client"}
{"level":"debug","message":"Client request deserialized"}
{"level":"debug","message":"Connecting to database"}
{"level":"error","message":"Unable to connect to database"}
```

Each line in this file represents one event that occurred in our server. We can
see that each event is tagged with a "level" describing the significance of the
event, and a "message" with a description about what happened. This style of rating
logs with different levels is a common pattern in application logging, and we're
going to use it as the basis of our filter. Specifically, we're going to write a
filter that excludes all "debug" log, but accepts any "info", "warn", or "error"
logs. In a real-world scenario, this could dramatically help reduce the traffic
and noise in the logs if we were to consume these records into an analytics
platform for inspection.

#### The Code: Writing our Filter

Let's look at the starter code crated by the Filter generator:

%copy first-line%
```bash
$ cd log-level && cat src/lib.rs
```

We should see the following code:

```rust
// src/lib.rs
use fluvio_smartmodule::{smartmodule, Result, Record};

#[smartmodule(filter)]
pub fn filter(record: &Record) -> Result<bool> {
    let string = std::str::from_utf8(record.value.as_ref())?;
    Ok(string.contains('a'))
}
```

The `Record` type contains the binary data for a single event in our topic. In our
case, this will be a UTF-8 encoded string that is also a valid JSON value. The
first step we'll need to take is to parse our Record as JSON so that we can
inspect it and determine what level the log is. We can use `serde`'s derive feature
to define types that represents our log data.

%copy%
```rust
#[derive(PartialEq, Eq, PartialOrd, Ord, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
enum LogLevel {
    Debug,
    Info,
    Warn,
    Error
}

#[derive(serde::Deserialize)]
struct StructuredLog {
    level: LogLevel,
    #[serde(rename = "message")]
    _message: String,
}
```

We're using `#[derive(serde::Deserialize)]` to implement Deserialize for our types,
which will allow us to convert our raw data into instances of `StructuredLog`.
We have also defined a `LogLevel` enum that implements `Deserialize` as well as
`Ord`, or "Ordering". When deriving `Ord` for an enum, the variants may be compared
to one another using `<` and `>`, where later-defined variants are "greater than"
earlier-defined variants. In other words, we have `LogLevel::Error > LogLevel::Debug`
and so on for each pair of LogLevels. Notice also that we have defined a field for
our logs' messages, but it is unused (which is why it is named `_message`). This
is because our filter will not care about the message in the log, just the level.
However, by including it in our `StructuredLog` definition, we can be sure that
all logs that we pass through the filter do indeed have a "message" field. In this
way, our filter is also acting as a sort of schema validator, only accepting records
that properly conform to the shape that we expect.

Now, let's write the logic for our filter. We'll start by parsing our raw data into
instances of `StructuredLog`.

%copy%
```rust
use fluvio_smartmodule::{smartmodule, Record, Result};

#[smartmodule(filter)]
fn filter(record: &Record) -> Result<bool> {
    let log: StructuredLog = serde_json::from_slice(record.value.as_ref())?;

    todo!()
}
```

Here, we're parsing our input data from JSON into an instance of our `StructuredLog`
struct that we defined earlier. If the parsing fails, the `?` after `serde_json::from_slice`
says that we'll return the `Err`, sort of like throwing an exception. When parsing
succeeds, we receive an instance of our `StructuredLog` struct.

Now for the final step, we want our filter to accept all records except for "debug" logs.
In other words, we actually want to keep the records that are "more important" or
"greater than" `LogLevel::Debug`. Since we have implemented `Ord` for `LogLevel`, this
will be a piece of cake! Let's look at all the code for the finished filter.

%copy%
```rust
use fluvio_smartmodule::{smartmodule, Record, Result};

#[derive(PartialEq, Eq, PartialOrd, Ord, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
enum LogLevel {
    Debug,
    Info,
    Warn,
    Error
}

#[derive(serde::Deserialize)]
struct StructuredLog {
    level: LogLevel,
    #[serde(rename = "message")]
    _message: String,
}

#[smartmodule(filter)]
fn filter(record: &Record) -> Result<bool> {
    let log: StructuredLog = serde_json::from_slice(record.value.as_ref())?;

    // We keep records that are "greater than" debug
    Ok(log.level > LogLevel::Debug)
}
```

Let's make sure our code compiles.

If you've never compiled for WASM before, you'll need to install the proper `rustup` target.
You should only need to do this once.

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
```

We'll use release mode in order to get the smallest and fastest binary possible. We should be able to see the `.wasm` file appear in the target directory.

%copy first-line%
```bash
$ cargo build --release
   Compiling log-level v0.1.0 (/home/user/log-level)
    Finished release [optimized] target(s) in 2.33s
```

%copy first-line%
```bash
$ ls -la target/wasm32-unknown-unknown/release
.rwxr-xr-x  135Ki user 19 May 13:29   log_level.wasm
```

#### Test Drive: Producing and Consuming the Data

Now that we've written our filter, let's play with some data and make sure we
get the results we expect! If you haven't installed Fluvio yet, head on over
and [download the Fluvio CLI] and then follow the getting started guide for
your OS, or [sign up for Infinyon Cloud] for a free account and a hosted cluster.

[download the Fluvio CLI]: https://www.fluvio.io/download/
[sign up for Infinyon Cloud]: https://infinyon.cloud/signup

Once we have our CLI and cluster all set up, we'll start by creating a new
topic where we'll produce our data.

%copy first-line%
```bash
$ fluvio topic create server-logs
topic "server-logs" created
```

In order to see the impact of our SmartModule filter, let's open two terminals,
with each running a consumer that watches our `server-logs` topic. One of these
will be a plain consumer that consumes _all_ the records, and the other one will
use our filter, so we should only see non-debug logs.

To run the plain consumer, use the following command:

%copy first-line%
```bash
$ fluvio consume server-logs -B
```

In the other terminal, run a consumer with the SmartModule filter using this command:

%copy first-line%
```bash
$ fluvio consume server-logs -B --filter="target/wasm32-unknown-unknown/release/log_level.wasm"
```

Finally, we can take our `server.log` file and use `fluvio produce` to send each
line of the file as one record to our topic. In a third terminal, run the following
command to produce the server logs to our topic:

%copy first-line%
```bash
$ fluvio produce server-logs -f server.log
```

In the plain consumer, we should see all the records get passed through:

%copy first-line%
```bash
$ fluvio consume server-logs -B
{"level":"info","message":"Server listening on 0.0.0.0:8000"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"debug","message":"Deserializing request from client"}
{"level":"debug","message":"Client request deserialized"}
{"level":"debug","message":"Connecting to database"}
{"level":"warn","message":"Client dropped connection"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"debug","message":"Deserializing request from client"}
{"level":"debug","message":"Client request deserialized"}
{"level":"debug","message":"Connecting to database"}
{"level":"error","message":"Unable to connect to database"}
```

But in the consumer with our SmartModule, we'll no longer see any of the records
whose log level was debug!

%copy first-line%
```bash
$ fluvio consume server-logs -B --filter="target/wasm32-unknown-unknown/release/log_level.wasm"
{"level":"info","message":"Server listening on 0.0.0.0:8000"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"warn","message":"Client dropped connection"}
{"level":"info","message":"Accepted incoming connection"}
{"level":"error","message":"Unable to connect to database"}
```

At this point, feel free to play around with the filtering logic and try
out SmartModule on your own sample data!

# Conclusion

We hope this blog was able to give you a good hands-on feeling for what SmartModules
are all about. We have a lot of exciting plans for the future, such as SmartModules
that can transform data (mapping) in addition to filtering. Be sure to stay tuned
for future posts as we roll out these features in upcoming releases!

_**Update**: SmartModules were originally called SmartStreams. The blog was updated to
reflect the new naming convention_

## Further reading

- [Read about Fluvio: the Programmable Data Platform]({{<ref "2021-06-introducing-fluvio" >}})
- [Learn more about Fluvio's SmartModules](https://www.fluvio.io/smartmodules/)
- [Create a free Infinyon Cloud account](https://infinyon.cloud/signup)

---
title: "Transform streaming data in real-time with WebAssembly"
author:
    name: "Nick Mosher"
    github: "nicholastmosher"
    title: "Engineer"
description: "Exploring use-cases and examples for real-time stream processing"
date: 2021-08-11
metadata: 
    - TECH
    - WASM
slug: smartmodule-map-use-cases
url: /blog/2021/08/smartmodule-map-use-cases
img: blog/images/smartmodule-map/map.png
twitter-card: summary_large_image
---

[Fluvio] is a high-performance, distributed, programmable streaming platform
for real-time data. We've been hard at work building new capabilities for inline
data processing, a family of features that we call [SmartModules], and with our
latest major release [we announced the arrival of our new SmartModule Map functionality].
This feature allows users to write custom code to inspect and transform each
record or data in a stream. Users write SmartModule modules in Rust and compile
them to WebAssembly, and they are ultimately executed in the Fluvio cluster on
a Streaming Processing Unit (SPU).

You can check out the full code for this blog [in the SmartModule examples repo]!

[Fluvio]: https://fluvio.io
[SmartModules]: https://www.fluvio.io/smartmodules/
[we announced the arrival of our new SmartModule Map functionality]: https://www.fluvio.io/news/this-week-in-fluvio-0001
[in the SmartModule examples repo]: https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/regex-scrubbing/src/lib.rs

## Thinking about Mapping capabilities and use-cases

When we're thinking about Mapping, we're thinking about a function that takes one record
as input and gives another record as output. With SmartModule Map, we are writing functions
that run inside a WebAssembly sandbox, so these functions do not have access to the outside
world, and cannot do certain things such as make network requests or write data to disk.
In essence, reading and manipulating the input record is the _only_ thing that a Map function
can do.

This helps to set the stage for what types of operations we can perform using SmartModule Maps.
I tend to think of these operations in the following broad categories (though there are certainly
more):

- Scrubbing sensitive fields of data to hide from downstream consumers
- Narrowing large records into a smaller subset of important fields
- Computing rich, derived fields from simple raw data
- Parsing unstructured (e.g. textual) data into a structured form (e.g. JSON)

Let's narrow in and explore how we can use SmartModules to solve a "scrubbing sensitive fields" use-case.

## Concrete use-case: Scrubbing Social Security Numbers from account records

Let's imagine that we're working with a banking account system, and we have a stream of data
that represents account activity. Events in this stream might represent new accounts being
created, passwords being changed, or personal info being updated. Suppose we want to write
an application which sends a welcome email to new account owners after they sign up. We can
structure our email application to consume from the `accounts` topic and send an email
each time an `account-created` event appears.

So far so good, but let's add a twist. Since we're talking about bank accounts, the events
contain some private information, such as the account holder's Social Security Number. We
would like to edit the records in our `accounts` stream and scrub out SSNs so that the
email application never even has access to that data. That way, there's no chance
that a bug or a compromise in the email application could lead to disclosing this private 
information.

Alright, so let's get concrete. We'll set up our event schema so that records in our stream
look something like this:

```json
{
  "social_security_number": "123-45-6789",
  "event_type": "account-created",
  "account_id": "1509aaf8-5863-4b41-bfe2-b081691d7a6e",
  "first_name": "Daniel",
  "last_name": "Mahoney",
  "email": "daniel_mahoney@example.com",
  "password_hash": "db6b535bc9909ecfb7c2ee4550ed7b350a61785e"
}
```

After we're done scrubbing, we want our records to look more like this:

```json
{
  "social_security_number": "***-**-****",
  "event_type": "account-created",
  "account_id": "1509aaf8-5863-4b41-bfe2-b081691d7a6e",
  "first_name": "Daniel",
  "last_name": "Mahoney",
  "email": "daniel_mahoney@example.com",
  "password_hash": "db6b535bc9909ecfb7c2ee4550ed7b350a61785e"
}
```

{{<idea>}}
For this example, I'm oversimplifying things to make it easy to follow, so I want to
say up front that this is a toy example, and real-world privacy protection should
take many more precautions than I'm doing here.
{{</idea>}}

Let's create a new SmartModule project to follow along with the code we're about to
see. We can use a `cargo-generate` template to get the project set up easily. To install
cargo-generate, run the following command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

Then to create a new Map project, run the following:

%copy first-line%
```bash
$ cargo generate --git https://github.com/infinyon/fluvio-smartmodule-template
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : regex-scrubbing
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · map
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `regex-scrubbing`...
✨   Done! New project created regex-scrubbing
```

For this example, we'll need to add dependencies on the `regex` and `once_cell` crates Let's navigate into our project directory and take a look at `Cargo.toml`:

%copy first-line%
```bash
$ cd regex-scrubbing && cat Cargo.toml
```

Add the following lines to the `Cargo.toml` file:

{{< highlight bash "hl_lines=5-6" >}}
[dependencies]
fluvio-smartmodule = { version = "0.1" }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
regex = "1"
once_cell = "1"
{{</ highlight >}}

Now that we have a project skeleton set up, let's look at the code we can use to
solve our use-case. Paste the following code into the `src/lib.rs` file.

%copy%
```rust
use regex::Regex;
use once_cell::sync::Lazy;
use fluvio_smartmodule::{smartmodule, Result, Record, RecordData};

// A compiled Regex for detecting SSNs that look like XXX-XX-XXXX
static SSN_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d{3}-\d{2}-\d{4}").unwrap());

#[smartmodule(map)]
pub fn map(record: &Record) -> Result<(Option<RecordData>, RecordData)> {
    let key = record.key.clone();

    let string = std::str::from_utf8(record.value.as_ref())?;
    let output = SSN_RE.replace_all(string, "***-**-****").to_string();

    Ok((key, output.into()))
}
```

We are ready to build our SmartModule. 

If you've never compiled for WASM before, you'll need to install the proper `rustup` target.
You should only need to do this once.

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
```

Let's go ahead and compile using `--release` mode to get the smallest WASM binary possible:

%copy first-line%
```bash
$ cargo build --release
```

That's it. [That's the whole SmartModule].

[That's the whole SmartModule]: https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/regex-scrubbing/src/lib.rs

Of course, this is an over-simplified solution to a toy problem, but it illustrates how
we can quickly manipulate the data in our stream with relatively little effort. In this
SmartModule, we're using a Regex to detect any string that has digits in the typical
SSN layout, and replace them with a meaningless substitute string `***-**-****`. Another
potential solution to this problem would be to parse the JSON and delete the
`social_security_number` field, but for our purposes this strategy was simpler.

For completeness on this first example, here is an example session showing some data
being processed by this SmartModule:

1. First, create a new topic for us to produce and consume our data

%copy first-line%
```bash
$ fluvio topic create accounts
topic "accounts" created
```

2. Generate some sample data in a file named `accounts.json`:

%copy first-line%
```bash
$ echo '{"social_security_number":"123-45-6789","event_type":"account-created","account_id":"1509aaf8-5863-4b41-bfe2-b081691d7a6e","first_name":"Daniel","last_name":"Mahoney","email":"daniel_mahoney@example.com","password_hash":"db6b535bc9909ecfb7c2ee4550ed7b350a61785e"}' > account.json
```

3. Produce the sample input data to our topic

%copy first-line%
```bash
$ fluvio produce accounts < account.json
```

4. Consume from our topic after applying our SmartModule Map

%copy first-line%
```bash
$ fluvio consume accounts -B --map=target/wasm32-unknown-unknown/release/regex_scrubbing.wasm
Consuming records from the beginning of topic 'accounts'
{"social_security_number":"***-**-****","event_type":"account-created","account_id":"1509aaf8-5863-4b41-bfe2-b081691d7a6e","first_name":"Daniel","last_name":"Mahoney","email":"daniel_mahoney@example.com","password_hash":"db6b535bc9909ecfb7c2ee4550ed7b350a61785e"}
```

If we were trying to deploy this to production we would obviously want a much more intelligent
function for detecting sensitive data in order to scrub it out, but it's clear to see that
even with this simplified example, the consumer never witnesses any of the SSN information.

That's an important point, so I want to restate it:

> *The consumer never witnesses any of the SSN information*

That's because SmartModule code is executed in the Fluvio cluster, before it even touches
the network on the way to the consumer. Having this ability to perform server-side data
processing opens up a whole new world of interesting possible applications, and we're
excited to see what new use-cases the community discovers.

## Conclusion

That's it for this post, be sure to hop into [our Discord server]
if you want to talk to us or have any questions. Until next time!

[our Discord server]: https://discordapp.com/invite/bBG2dTz

_**Update**: SmartModules were originally called SmartStreams. The blog was updated to
reflect the new naming convention_

### Further reading

- [SmartModule Map documentation](https://fluvio.io/smartmodules/transform/map/)
- [About Fluvio: the Programmable Streaming Platform](/blog/2021/06/introducing-fluvio/)
- [Fluvio SmartModules: Writing a WASM-based filter for application logs](/blog/2021/06/smartmodule-filters/)

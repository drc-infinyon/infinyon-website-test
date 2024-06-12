---
title: "Streaming the Reddit API using Fluvio's WASM ArrayMap"
author:
    name: "Nick Mosher"
    github: "nicholastmosher"
    title: "Engineer"
description: "How to convert a paginated API into a streaming API using Fluvio's WASM ArrayMap."
date: 2021-10-28
metadata: 
    - TECH
    - WASM    
slug: smartmodule-array-map-reddit
url: /blog/2021/10/smartmodule-array-map-reddit
img: blog/images/smartmodule-array-map/array-map.png
twitter-card: summary_large_image
code:
    height: 9000
---

[Fluvio] is a high-performance, distributed, programmable streaming platform
for real-time data. In our latest release, we introduced [SmartModules ArrayMap],
a new kind of programmable API that allows you to break apart large records into
smaller records. The key thing to know about the ArrayMap pattern is
that it **converts one input into zero or many outputs**.

One of the primary motivations for ArrayMap is to control the granularity of your
data stream. Sometimes, your stream’s records represent more than one data point,
and you need to manipulate just a sub-piece of that record. ArrayMap takes each
composite data record and breaks the large object into smaller pieces that can be
worked on or analyzed individually. For example, you may want to analyze addresses
in customer records, items purchased in a transaction, withdrawals in a bank account, etc.

In this post, I will show a practical use-case for SmartModules ArrayMap: breaking apart
paginated API responses into a stream of content. As an example, I'll be using
real data from [Reddit's API], so feel free to follow along! If you decide to do so,
you'll need to get set up with Fluvio either via [a free InfinyOn Cloud account] or by
setting up your own [open-source Fluvio cluster]. In addition, here's a list of tools
that we'll be using throughout the blog:

- [The Fluvio CLI](https://www.fluvio.io/download/)
- [Rust, Cargo, and Rustup](https://rustup.rs)
- [`jq`](https://stedolan.github.io/jq/download/)
- [`curl`](https://curl.se/download.html) (installed by default on some systems)
- [`cargo-generate`](https://github.com/cargo-generate/cargo-generate)

You can also [check out the finished code on GitHub]!

## Getting some data

The first thing we need to do is get some sample data so we know what we're working
with. We can use the following `curl` command to do just that:

%copy first-line%
```bash
$ curl -H "User-agent:ExampleBot" "https://www.reddit.com/r/rust.json?count=10" | tee reddit.json
```

-> **Note**: When writing a real application, you'll want to choose your own special `User-agent`

This command will print a big body of JSON to the screen and also save it in a file
called `reddit.json`, so we can use it later. Let's pretty-print it now so we can take
a good look at it. Make sure you [have jq installed], then run:

%copy first-line%
```bash
$ jq < reddit.json
{
  "kind": "Listing",
  "data": {
    "after": "t3_qc1h1j",
    "dist": 27,
    "modhash": "",
    "geo_filter": null,
    "children": [
      {
        "data": {
          "id": "...",
          "title": "...",
          "url": "...",
          "selftext": "...",
          "ups": x,
          "upvote_ratio": x.yz
          ... many more fields
        },
        ...
      },
      { ... },
      { ... },
    ],
    "before": "t3_qahjqp"
  }
}
```

I've collapsed most of the fields in the `children` objects, there is a lot of information in
there. The important thing to see is that the `children` field contains the "page" of 10 requests
that we asked for in the request (recall the `?count=10` parameter).

What we want to do is create a Fluvio Topic that contains requests like this as its Records,
then create a SmartModules ArrayMap to create an output stream of the individual child elements
(the posts themselves). When we're done, each element in our stream should look like this:

```bash
{
  "id": "...",
  "title": "...",
  "url": "...",
  "selftext": "...",
  "ups": x,
  "upvote_ratio": x.yz
}
```

## Writing a SmartModules ArrayMap

To get started with our ArrayMap, we can use `cargo-generate` to get up and running with a
template of a ArrayMap SmartModule. If you don't already have it, install `cargo-generate`
with the following command:

%copy first-line%
```bash
$ cargo install cargo-generate
```

Then, use it to create a new project from the ArrayMap template:

%copy first-line%
```bash
$ cargo generate --git="https://github.com/infinyon/fluvio-smartmodule-template"
⚠️   Unable to load config file: ~/.cargo/cargo-generate.toml
🤷   Project Name : reddit-array-map
🔧   Generating template ...
✔ 🤷   Which type of SmartModule would you like? · array-map
[1/7]   Done: .cargo/config.toml
[2/7]   Done: .cargo
[3/7]   Done: .gitignore
[4/7]   Done: Cargo.toml
[5/7]   Done: README.md
[6/7]   Done: src/lib.rs
[7/7]   Done: src
🔧   Moving generated files into: `reddit-array-map`...
✨   Done! New project created reddit-array-map
```

Let's move our `reddit.json` into the project directory and change our directory
so we can work with the project.

%copy first-line%
```bash
$ mv ./reddit.json ./reddit-array-map/
```

%copy first-line%
```bash
$ cd reddit-array-map
```

While we're setting up, make sure you have the `wasm32-unknown-unknown` target installed
by running this rustup command:

%copy first-line%
```bash
$ rustup target add wasm32-unknown-unknown
```

Now let's take a look at the code that was generated for us:

%copy first-line%
```bash
$ cat src/lib.rs
```

```rust
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};

#[smartmodule(array_map)]
pub fn array_map(record: &Record) -> Result<Vec<(Option<RecordData>, RecordData)>> {
    // Deserialize a JSON array with any kind of values inside
    let array = serde_json::from_slice::<Vec<serde_json::Value>>(record.value.as_ref())?;

    // Convert each JSON value from the array back into a JSON string
    let strings: Vec<String> = array
        .into_iter()
        .map(|value| serde_json::to_string(&value))
        .collect::<core::result::Result<_, _>>()?;

    // Create one record from each JSON string to send
    let records: Vec<(Option<RecordData>, RecordData)> = strings
        .into_iter()
        .map(|s| (None, RecordData::from(s)))
        .collect();
    Ok(records)
}
```

The starter code for SmartModules ArrayMap is built to take JSON arrays as input,
and return a stream of the _contents_ of those arrays as output. This is pretty similar
to what we want to accomplish with the Reddit posts, but the array we want to retrieve
is nested inside a larger response object.

To help us work with Reddit's response data, let's write some structs that mirror
the JSON response structure and derive `serde`'s `Serialize` and `Deserialize` traits
for them. If you're following along and used the `cargo-generate` template, then
`serde` and `serde_json` are already in your project dependencies.

Now let's add our structs and update our function. We need to make sure the field names
correspond exactly to the fields in the JSON response. Any fields that we don't name will
simply be ignored. You can overwrite the existing code in `src/lib.rs` file with the following:

%copy%
```rust
use fluvio_smartmodule::{smartmodule, Record, RecordData, Result};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct RedditListing {
    data: RedditPage,
}

#[derive(Debug, Serialize, Deserialize)]
struct RedditPage {
    children: Vec<RedditPost>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RedditPost {
    data: RedditPostData,
}

#[derive(Debug, Serialize, Deserialize)]
struct RedditPostData {
    id: String,
    title: String,
    url: String,
    selftext: String,
    ups: i32,
    upvote_ratio: f32,
}

#[smartmodule(array_map)]
pub fn array_map(record: &Record) -> Result<Vec<(Option<RecordData>, RecordData)>> {
    // Step 1: Deserialize a RedditListing from JSON
    let listing = serde_json::from_slice::<RedditListing>(record.value.as_ref())?;

    // Step 2: Create a list of RedditPostData converted back into JSON strings
    let posts: Vec<(String, String)> = listing
        .data
        .children
        .into_iter()
        .map(|post: RedditPost| {
            // Convert each post into (ID, Post JSON)
            serde_json::to_string(&post.data).map(|json| (post.data.id, json))
        })
        .collect::<core::result::Result<_, _>>()?;

    // Step 3: Convert each Post into a Record whose key is the Post's ID
    let records = posts
        .into_iter()
        .map(|(id, post)| (Some(RecordData::from(id)), RecordData::from(post)))
        .collect();
    Ok(records)
}
```

Looking at the structure of the data this way, we can see that we will eventually want
to turn the list of `RedditPostData` into a list of Records that we can return for our
output stream. Let's dive in and take at the code to make that happen.

This ArrayMap function essentially has 3 steps that it takes. They are:

1) Deserialize the original reddit request
2) Extract the list of posts as a list of (Post ID, Post JSON)
3) Convert that list into a list of Key/Value Records

## Running the SmartModules ArrayMap

Let's take this for a test drive and see if it works as expected! For the following
steps you'll need to make sure you [have Fluvio downloaded] and a cluster running.

First, let's compile our ArrayMap. We'll compile using release mode to make the WASM module
as small as possible.

%copy first-line%
```bash
$ cargo build --release
```

Then, let's create a Fluvio Topic where we'll send our Reddit API responses. Later,
we'll consume from this Topic using the ArrayMap we just wrote.

%copy first-line%
```bash
$ fluvio topic create reddit
```

Now, let's produce our Reddit data into the topic. If you still have the `reddit.json`
file, you can send it using this command:

%copy first-line%
```bash
$ fluvio produce reddit -f ./reddit.json
```

Or, if you want to be fancy and produce fresh data directly from Reddit, you can pipe
your data straight from `curl`:

%copy first-line%
```bash
$ curl -H "User-agent:ExampleBot" "https://www.reddit.com/r/rust.json?count=10" | fluvio produce reddit
```

Now, let's apply our SmartModules ArrayMap and see how we did!

%copy first-line%
```bash
$ fluvio consume reddit --tail --key-value --array-map=target/wasm32-unknown-unknown/release/reddit_array_map.wasm
...
[qccbjz] {"id":"qccbjz","title":"Can you compile in parallel?","url":"https://www.reddit.com/r/rust/comments/qccbjz/can_you_compile_in_parallel/","selftext":"Often I'll have a project that automatically pulls in 150+ dependencies that might not depend on each other.\n\nIt'd be great if I could somehow compile 8 of them in parallel instead of only one, but I'm not sure how to make that happen.\n\nIt would make sense that this should work, given that as long as you aren't compiling something before its dependencies are finished, there shouldn't be any conflicts. But looking online I haven't found anything.","ups":7,"upvote_ratio":0.71}
[qc3wc2] {"id":"qc3wc2","title":"sqlx: Exist a problem if pick \"runtime-actix\" vs \"runtime-tokio\"?","url":"https://www.reddit.com/r/rust/comments/qc3wc2/sqlx_exist_a_problem_if_pick_runtimeactix_vs/","selftext":"Is unclear to me why in sqlx exist this 2 runtimes, if actix is based on tokio.\n\nI'm building a utility crate that could later interact with actix or not (depending on the project), so I don't know if is best to depend from the start on actix even if later chose one with rocket, for example. \n\nThe most logical option is to use tokio, but if later put actix, it will conflict??","ups":13,"upvote_ratio":0.72}
[qbngmu] {"id":"qbngmu","title":"Announcing Lingua 1.3 - The most accurate natural language detection library for Rust","url":"https://www.reddit.com/r/rust/comments/qbngmu/announcing_lingua_13_the_most_accurate_natural/","selftext":"Hi, folks!\n\nI've just released the new major version 1.3 of Lingua, the most accurate natural language detection library for Rust. It is especially well-suited for the classification of short text where other language detectors have problems.\n\n[https://github.com/pemistahl/lingua-rs](https://github.com/pemistahl/lingua-rs)\n\nThis release introduces each of the so far 75 supported languages as separate Cargo features. If you don't want to download all statistical language models, you are now able to specify which languages you want to download and detect with the library. This results in much smaller binaries.\n\nI hope you find the library useful. I'm looking forward to your feedback. Thanks. :)\n\n&amp;#x200B;\n\nhttps://preview.redd.it/l2gwwejbohu71.png?width=960&amp;format=png&amp;auto=webp&amp;s=d46eeeabe6cbd72584c20d43a14f49150004b1e4","ups":231,"upvote_ratio":0.98}
```

Great! We can see that each of our Records represents a Post, and that they contain just the fields that we
selected for. Since we used the `--key-value` option, we can also see that we correctly extracted the `id`
field and applied it to be used as our record Keys.

## Conclusion

That's it for this post, be sure to join the discussion on Reddit or hop into [our Discord server]
if you want to talk to us or have any questions. Until next time!

_**Update**: SmartModules were originally called SmartStreams. The blog was updated to
reflect the new naming convention_

[Fluvio]: https://fluvio.io/
[SmartModules ArrayMap]: https://fluvio.io/smartmodules/transform/array-map/
[Reddit's API]: https://www.reddit.com/dev/api
[a free InfinyOn Cloud account]: https://fluvio.io/docs/get-started/cloud/
[open-source Fluvio cluster]: https://fluvio.io/download/
[check out the finished code on GitHub]: https://github.com/infinyon/fluvio-smartmodule-examples/blob/master/reddit-pagination/src/lib.rs
[have jq installed]: https://stedolan.github.io/jq/download/
[have Fluvio downloaded]: https://www.fluvio.io/download/
[our Discord server]: https://discordapp.com/invite/bBG2dTz

### Further reading

- [About Fluvio: the Programmable Streaming Platform](/blog/2021/06/introducing-fluvio/)
- [Fluvio SmartModules: Writing a WASM-based filter for application logs](/blog/2021/06/smartmodule-filters/)

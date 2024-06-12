---
title: "Flexible JSON transformations in Rust"
author:
    name: "Alexander Galibey"
    github: "galibey"
    title: "Engineer"
description: "How to use Fluvio Jolt to transform JSON data in a flexible way"
date: 2022-08-09
metadata: 
    - TECH
    - JSON    
slug: fluvio-jolt
url: /blog/2022/08/fluvio-jolt-intro
img: blog/images/fluvio-jolt-intro/fluvio-jolt-intro.png
twitter-card: summary_large_image
code:
    height: 9000
---

The JSON format remains one of the most popular text data formats for Data-in-Transition. You can encounter JSON data on 
every stack level of your application: from the database to UI, from IoT sensors data to the mobile app's payload.
And it is not a coincidence; the format has a good balance between being convenient for developers and decent payload density.
In Rust ecosystem, the de-facto standard for dealing with JSON is [Serde]. Although it is the best choice for most cases,
there can be alternative approaches that can work best for your application. One of these approaches we are going to cover in this article.

This blog is intended for Rust beginners.

[Fluvio]: https://fluvio.io/
[Serde]: https://serde.rs/
[Rust]: https://www.rust-lang.org/


### Pre-conditions

In order to properly follow this blog, you need to be familiar with [Serde] crate and JSON data format.

### Scenario: Processing JSON in Rust. The format changes often.

Imagine you are developing a new application that processes a stream of records in JSON format. You are not quite sure 
what records will look like in the future, but for now, you are currently working with this input:

%copy%
```json
{
  "id": "0000000001",
  "key": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
  "value": "42883098-74A2-4353-A534-26F533665B67"
}
```
As part of your application's pipeline, you need to transform the input into the following output:

%copy%
```json
{
  "key_id": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
  "value_id": "42883098-74A2-4353-A534-26F533665B67",
  "source": "source_connector_12"
}
```
So the change is that we remove the `id` field, we rename `key` to `key_id`, `value` to `value_id`, and we add the new 
`source` field with fixed value `source_connector_12`.

Let's set up a Rust project and see what the code would look like with [Serde] crate:

%copy first-line%
```bash
$ cargo new json-to-json-serde --lib
```
Ensure that `Cargo.toml` has the `serde` (with the derive feature) and `serde_json` crates:

%copy%
```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Sample code:

%copy%
```rust
// src/lib.rs
use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize)]
struct InputRecord {
    id: String,
    key: String,
    value: String,
}

#[derive(Serialize)]
struct OutputRecord {
    key_id: String,
    value_id: String,
    source: String,
}

impl From<InputRecord> for OutputRecord {
    fn from(input: InputRecord) -> Self {
        let InputRecord { key, value, .. } = input;
        Self {
            key_id: key,
            value_id: value,
            source: "source_connector_12".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn it_works() {
        let input = json!({
          "id": "0000000001",
          "key": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
          "value": "42883098-74A2-4353-A534-26F533665B67"
        });
        
        let input: InputRecord = serde_json::from_value(input).expect("valid input");
        let output = OutputRecord::from(input);

        assert_eq!(
            serde_json::to_value(&output).expect("valid output"),
            json!({
                "key_id": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
                "value_id": "42883098-74A2-4353-A534-26F533665B67",
                "source": "source_connector_12"
            })
        )
    }
}
```

There can also be a solution with an untyped `Value` type, but it is less convenient for development, hence less popular,
and is not that important for the sake of this scenario.

What is the disadvantage of such a solution? As I said before, you are developing a new application that often implies
changes in input and output formats. So, for every change you want to make to your transformation, you must re-compile
your code. In real life, it is not just re-compile. The whole new process of CD and CI might need to be passed until 
the app gets the new flow.
Therefore, as a developer of such an application, you might want to have the transformation flexible, meaning that you
don't need to change the code if the structure of the input JSON or output one changes in time.

### Fluvio Jolt
[Fluvio Jolt]: https://github.com/infinyon/fluvio-jolt

We, in [Fluvio], decided to port to Rust a Java library [Jolt](https://github.com/bazaarvoice/jolt) that does exactly 
what we want here. </br>
Meet [Fluvio Jolt]: JSON to JSON transformation where the "specification" for the transform is itself a JSON document.
Since the transformation is dynamic, flexible, and defined by another input, you don't need to re-compile your application
if the structure of your records changes. 
As we said, the "specification" for the transformation is a JSON document also. Let's take a look at the specification 
needed for our case:

%copy%
```json
[
  {
    "operation": "shift",
    "spec": {
      "key": "key_id",
      "value": "value_id"
    }
  },
  {
    "operation": "default",
    "spec": {
      "source": "source_connector_12"
    }
  }
]
```
We can see there are two operations here. The first one is `shift`. We say which fields we want to move to and where. 
The second operation is `default`. We define a new value for the field if it is not present. The `delete` operation is 
also available, but these two operations cover all we need.
Once we have the spec, we are ready to transform.

Let's set up another Rust project with [Fluvio Jolt]:

%copy first-line%
```bash
$ cargo new json-to-json-jolt --lib
```

Add `fluvio-jolt` crate to `Cargo.toml`:

%copy%
```toml
fluvio-jolt = "0.1"
serde_json = "1"
```
The code will be similar to this (notice that we don't need to define new types): 

%copy%
```rust
// src/lib.rs
#[cfg(test)]
mod tests {
    use fluvio_jolt::TransformSpec;
    use serde_json::json;

    #[test]
    fn it_works() {
        let spec: TransformSpec = serde_json::from_str(
            r#"
                [
                    {
                      "operation": "shift",
                      "spec": {
                        "key": "key_id",
                        "value": "value_id"
                      }
                    },
                    {
                      "operation": "default",
                      "spec": {
                        "source": "source_connector_12"
                      }
                    }
                ]
            "#,
        ).expect("parsed spec");
        
        let input = json!({
            "id": "0000000001",
            "key": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
            "value": "42883098-74A2-4353-A534-26F533665B67"
        });
        let output = fluvio_jolt::transform(input, &spec);

        assert_eq!(
            serde_json::to_value(&output).expect("valid output"),
            json!({
                "key_id": "09B5C373-CB7F-4E45-9F38-50C1F8F69C5D",
                "value_id": "42883098-74A2-4353-A534-26F533665B67",
                "source": "source_connector_12"
            })
        )
    }
}

```
Codewise, we only need to parse a string containing all the transformation logic we want, and we are ready to process records.

## Conclusion
What does it give you? Now, you have an option to modify the specification in runtime or load it during the startup of 
your application. You can pass it along with your records or read it from another source. Usecases are limited only by your imagination.

If you find this library helpful, we encourage you to [contribute](https://github.com/infinyon/fluvio-jolt)! 
It is still in the early stage of development, 
and there are a lot of missing features that can and should be ported from Java's [Jolt](https://github.com/bazaarvoice/jolt).


Please, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions. 

Have a happy coding, and stay tuned!

### Further reading

- [Handling JSON data in Fluvio SmartModules](/blog/2022/06/smartmodule-json/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)
- [The InfinyOn Continuous Intelligence Platform](/blog/2021/10/infinyon-continuous-intelligence/)

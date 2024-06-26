---
title: Inline Dependencies
description: Stateful Services Inline Dependencies
weight: 90
---

For inline operators, you can add `dependencies` section to include external language specific libraries.  The dependencies are defined in the `dependencies` section of the operator definition.  The dependencies are resolved by the Fluvio engine and made available to the operator at runtime.

For Rust based operators, the dependencies are based on Rust Cargo package manager similar to `dependencies` section in [Cargo](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html). 

For example, following variations are possible:

Adding a crate with version:

```yaml
 - operator: map
   dependencies:
     - name: regex
       version: "1.10.0"
```

It is also possible to add a git repository directly:

```yaml
 - operator: map
   dependencies:
     - name: regex
       git: "https://github.com/rust-lang/regex"
       tag: "1.10.0"
```

Multiple dependencies can be added:

```yaml
 - operator: map
   dependencies:
     - name: regex
       version: "1.10.0"
     - name: iter_tools
       version: "0.15.0"
```

Once the dependencies are added, inline operator can use the dependencies in the `run` section as in the typical Rust code as example below which tries to validate the year format.

```yaml 
- operator: filter
  dependencies:
      - name: regex
        version: "1.10.0"
  run: |
    fn validate_year(input: String) -> Result<bool, String> {
        use std::sync::OnceLock;
        use regex::Regex;

        static REGEX: OnceLock<Regex> = OnceLock::new();

        let re = REGEX.get_or_init(|| Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap());
        Ok(re.is_match(&input))
    }
```


# Stateful Services Rust Dependencies

Stateful Service has list of following dependencies that can be used in calling HTTP call out and other operations.


## HTTP Callout

The http callout make it easy to make HTTP requests from your operator. It is based on the `reqwest` library.  To use the http callout, add as git dependency in your operator definition since this is not published in crates.io.

```yaml
- operator: map
  dependencies:
      - name: ssdk-http
        git: "https://github.com/infinyon/ssdk-guest-http"
        tag: "v0.3.0"
```

Following snippet takes a sentence and translate english to spanish using external API.   The [Request](https://docs.rs/reqwest/0.11.24/reqwest/struct.Request.html) is part of `reqwest` library and `ssdk_http::blocking::send` is used to send the request. 


```yaml
- operator: map
  dependencies:
      - name: ssdk-http
        git: "https://github.com/infinyon/ssdk-guest-http"
        tag: "v0.3.0"
  run: |
    fn english_to_spanish(sentence: String) -> Result<String, String> {
        use  ssdk_http::http::Request;

        let url = format!("https://acme.com/translate?text={}", sentence);
        let request = Request::builder().uri(url).body("").map_err(|e| e.to_string())?;
        let response = ssdk_http::blocking::send(request).map_err(|e| e.to_string())?;
        Ok(response.into_body())
    }
```

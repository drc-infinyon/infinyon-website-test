---
title: Environment Variables
description: Stateful Services environment variables support
weight: 100
---

Environment variables can be used to pass configuration information to the operators.  The environment variables are defined in the operator definition and can be accessed in the operator code.

They are useful for passing configuration information such as API keys, database connection strings, and other configuration information.

## Defining Environment Variables

You can define environment variables in the `run` command similar to Docker.  The `-e` flag is used to define environment variables.

```bash
ssdk run --e VAR1=value1 -e VAR2=value2
```

## Accessing Environment Variables in operator code

Once the environment variables are defined thru CLI, they are available in every operator user code.  In the Rust code, you can access the environment variables using the[`std::env`](https://doc.rust-lang.org/std/env/index.html) module.

Follow code snippet illustration filter that reject a word startes with prefix defined in environment variable.
%copy%
```yaml
- operator: filter-map
  run: |
    fn filter(input: word) -> Result<Option<String>, String> {
      let block_word = std::env::var("BLOCKED_PREFIX").map_err(|e| e.to_string())?;
      if input.starts_with(&block_word) {
        Ok(None)
      } else {
        Ok(Some(input))
      }
    }
```

They are also useful for passing configuration information such as API keys.  For example, following show how to encode bearer token in environment variable and access it in the operator code.

```bash
%copy%
```yaml
- operator: map
  adaptors:
    - http
  run: |
    fn filter(input: sentence) -> Result<Option<String>, String> {
      let auth_key = std::env::var("MY_API_KEY").map_err(|e| e.to_string())?;
      let auth_bearer = format!("Bearer {}", auth_key);
      let request = ssdk_http::http::Request::builder()
            .uri("https://myapi.com/api/v1/sentences")
            .method("POST")
            .header("Content-Type", "application/json")
            .header("Authorization", auth_bearer)
            .body(body)
            .map_err(|e| e.to_string())?;
      let response = ssdk_http::blocking::send(request).map_err(|e| e.to_string())?;
      let body: Vec<u8> = response.into_body();
      Ok(String::from_utf8(body).map_err(|e| e.to_string())?);
    }
```

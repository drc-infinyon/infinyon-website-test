---
title: "Cloud Secrets Basics"
menu: "Secrets Basics"
description: "A short tutorial for using Secret"
---

Manage sensitive data like passwords and API keys securely in Fluvio Cloud using the `fluvio cloud secret` command. For more details, see the [Cloud documentation]({{<ref "/docs/cli/secret.md">}}).

## Secret names

For the sake of portability, secret names must
* Consist solely of letters, digits, and the underscore (`_`)
* Must not begin with a digit.

## Set secret values on Cloud

%copy first-line%
```shell
$ fluvio cloud secret set my_secret my-secret-value
Secret "my_secret" set successfully
```

## Using secrets with connectors

Cloud Connectors support secrets. The secrets can be referenced in the connector configuration file.

In order to use secrets, first, they need to be defined in the metadata section of the connector configuration file. The secrets are defined as a list of names. The names are used to reference the secret in the connector configuration file.

%copy%
```yaml
# http-source-connector-with-secrets.yml
apiVersion: 0.1.0
meta:
  version: 0.2.1
  name: my-http-source-connector
  type: http-source
  topic: my-topic
  secrets:
    - name: MY_TOKEN

http:
  endpoint: https://my.secure.api/
  interval: 10s
  headers:
    - "AUTHORIZATION: token ${{ secrets.MY_TOKEN }}"
```

In that config, it is defined a `MY_TOKEN` secret and it is used in the `headers` configuration of the http-source connector.

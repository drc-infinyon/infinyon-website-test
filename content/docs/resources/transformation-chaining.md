---
title: Transformation Chaining
weight: 95
---

In Fluvio, data modification is done using SmartModules, user-defined functions converted to WebAssembly (WASM). Several SmartModules can form a Transformation Chain, working in sequence—each one modifies the data and passes it to the next. Both the sending (Producer) and receiving (Consumer) ends can use these chains; for the Producer, modification happens before the data is saved to the topic, while for the Consumer, it occurs before sending the data.

**Transformation Chaining** is available for:
1. Fluvio Client
2. Fluvio CLI
3. SmartConnectors

### Setting It Up
Each transformation in the chain is a SmartModule, paired with some specific instructions. Typically, you'd set this up in a `yaml` file.

Here’s a basic example:

```yaml
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: default
          spec:
            source: "http"
```

In this example, there's one transformation done by a SmartModule named [`infinyon/jolt@0.3.0`]({{<ref "/docs/smartmodules/jolt.md">}}). Ensure this SmartModule is available in your cluster:

```bash
fluvio sm list
  SMARTMODULE              SIZE
  infinyon/jolt@0.3.0      608.4 KB
```

The section under `with` in the config is the special note to the SmartModule on how to modify the data. In this case, it receives this bit of info:

```json
"spec" : "[{\"operation\":\"default\",\"spec\":{\"source\":\"http\"}}]"
```

### Lining Up More SmartModules

You can arrange multiple SmartModules to work in sequence. The output from one SmartModule is used as the input for the next, so their order is important.

```yaml
transforms:
  - uses: infinyon/jolt@0.3.0
    with:
      spec:
        - operation: shift
          spec:
            fact: "animal.fact"
            length: "length"
  - uses: infinyon/regex-filter@0.1.0
    with:
      regex: "[Cc]at"
```

In this setup, the `jolt` transformation takes place first, then its output is used as the input for `regex-filter`.
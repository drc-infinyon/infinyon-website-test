---
title: SSDK Command Line Interface
menu: SSDK (ssdk)
description: Stateful Services Developer Kit (ssdk) command definitions.
weight: 60
---

Stateful Services Developer Kit (ssdk) is a binary, shipped with fluvio, that helps developers build, test, and deploy stateful services. The first version works with Rust, and upcoming versions will enable Python and Javascript. 

**Commands**

* [ssdk setup](#ssdk-setup)
* [ssdk generate](#ssdk-generate)
* [ssdk build](#ssdk-build)
* [ssdk update](#ssdk-update)
* [ssdk clean](#ssdk-clean)
* [ssdk log](#ssdk-log)
* [ssdk version](#ssdk-version)
* [ssdk run](#ssdk-run)
  * [>> show state](#-show-state)
  * [>> exit](#-exit)


### Download FVM and Install SSDK

Download [fluvio version manager (fvm)], the package manager for fluvio and ssdk:

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

This command will download the Fluvio Version Manager (fvm), Fluvio CLI (fluvio) and config files into `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`. To complete the installation, you will need to add the executables to your shell `$PATH`.

Install the preview release:

%copy first-line%
```bash
$ fvm install ssdk-preview6
```

SSDK has the following comamand hierarchy:

{{<code file="embeds/cli/ssdk/ssdk.sh" lang="bash" copyFirstLine="true" >}}


### `ssdk setup`

Command line syntax for `ssdk setup`:

{{<code file="embeds/cli/ssdk/ssdk-setup.sh" lang="bash" copyFirstLine="true" >}}


Run `ssdk setup` to configure your local environment. 

%copy first-line%
```bash
$ ssdk setup
```


### `ssdk generate`

Command line syntax for `ssdk generate`:

{{<code file="embeds/cli/ssdk/ssdk-generate.sh" lang="bash" copyFirstLine="true" >}}


##### Example

SSDK generate requires a `data-pipeline.yaml` the current directory:

%copy first-line%
```bash
$ ssdk generate
```

The command parses the file and creates a Rust project in a subdirectory called `project`. For additional information, check out [Data Pipeline File].


### `ssdk build`

Command line syntax for `ssdk build`:

{{<code file="embeds/cli/ssdk/ssdk-build.sh" lang="bash" copyFirstLine="true" >}}


##### Example

The command builds the Rust project and generates all WASM Components.

%copy first-line%
```bash
$ ssdk build
```

Checkout the `project` directory to see the project hierarchy and the target components.

### `ssdk update`

Command line syntax for `ssdk update`:

{{<code file="embeds/cli/ssdk/ssdk-update.sh" lang="bash" copyFirstLine="true" >}}

This command is used to update the project based on updated in the `data-pipeline.yaml` file.

The update command makes code changes that cannot be reversed. As a safety measure, the command generates a `diff` and asks for confirmation before proceeding. If you want to bypass the confirmation prompt, use the `-f` and `-d` flags.



### `ssdk clean`

Command line syntax for `ssdk clean`:

{{<code file="embeds/cli/ssdk/ssdk-clean.sh" lang="bash" copyFirstLine="true" >}}

This command is used to clean-up the project directory and start again.


##### Example

Let's say we made major changes to the `data-pipeline.yaml` file and the previous version is no longer relevant. We can use `clean` to remove the project and start over:

%copy first-line%
```bash
$ ssdk clean
```


### `ssdk log`

Use `ssdk log` to view you print statements:

{{<code file="embeds/cli/ssdk/ssdk-log.sh" lang="bash" copyFirstLine="true" >}}

Use `--f --follow` option to watch the logs.


##### Example

The following code splits sentences into words and has a `println` statement:

```yaml
- operator: flat-map
  run: |
    fn split_sentence(sentence: String) -> Result<Vec<String>, String> {
      let result = sentence.split_whitespace().map(String::from).collect();
      println!("{:?}", result);

      Ok(result)
    }
```

For the sentence with `This is a test`, the output will be:

%copy first-line%
```bash
$ ssdk log
2024-01-06T02:08:09.735861+00:00 split-sentence INFO ["This", "is", "a", "test"]
```


### `ssdk version`

Command line syntax for `ssdk version`:

{{<code file="embeds/cli/ssdk/ssdk-version.sh" lang="bash" copyFirstLine="true" >}}


##### Example

Find out what version you are running:

%copy first-line%
```bash
$ ssdk version
```


### `ssdk run`

Run the project and open the command line in interactive mode with `ssdk run`:

{{<code file="embeds/cli/ssdk/ssdk-run.sh" lang="bash" copyFirstLine="true" >}}

Use `--ui` to view a graphical represetation of the project in a web browser. The default port is `8000`, and you may change it with the `--port` flag.


##### Example

Navigate to the project directory, ensure it's built, and `run` to start the project in interactive mode: 

%copy first-line%
```bash
$ ssdk run --ui
Please visit http://127.0.0.1:8000 to use SSDK Studio
...
```

### `>>` - interactive mode

SSDK `run` opens the command line in interactive mode:

{{<code file="embeds/cli/ssdk/run.sh" lang="bash" copyFirstLine="true" >}}



### `>> show state`

Use `show state` to peak into the internal state objects managed by the system:

Command line syntax for `show state`:

{{<code file="embeds/cli/ssdk/run-show-state.sh" lang="bash" copyFirstLine="true" >}}


##### Example

For example, to show all state objects:

%copy first-line%
```bash
>> show state
 Namespace                                     Keys  Type   
 word-processing-window/count-per-word/state   22    u32    
 word-processing-window/sentence/topic.offset  1     offset 
```

The states are organized by namespace where the first keyword is the service name `word-processing-window`, followed by the function name `count-per-word` or topic `sentence`. The `state` is the temporary result computed by the window function, whereas `topic.offset` is the offset of the last record read from the `sentence` topic. 

To further inspect the objects, use the `show state` command with the name of the namespace:

%copy first-line%
```bash
>> show state word-processing-window/count-per-word/state
 Key       Value  Window                                    
 book      1      2023-12-28T00:32:00Z:2023-12-28T00:32:20Z 
 but       1      2023-12-28T00:32:00Z:2023-12-28T00:32:20Z 
...
```

You also have the option to filter the state by key `(--key)`, or a regex `(--filter)` operation.


### `>> exit`

Exit interactive mode:

%copy first-line%
```bash
>> exit
bye!
```


### References
* [Data Pipeline File]


[Fluvio Version Manager (fvm)]: {{<relref "../tutorials/install" >}}
[Data Pipeline File]: {{<relref "./data-pipeline-file" >}}
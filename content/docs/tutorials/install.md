---
title: "Install Fluvio CLI toolchain"
menu: "Install CLI toolchain"
weight: 40
description: "A short tutorial for using fvm"
---

This is a short introduction to `fvm`, the Fluvio Version Manager, which allows you to use multiple versions of the Fluvio CLI toolchain.

The `fvm` CLI is the official package manager for Fluvio, managing various `fluvio` binaries and development tools -- enabling the selection from multiple versions or release channels.

## Install `fvm` 

The following command will install `fvm` and `fluvio` and other binaries in the development kit.

%copy first-line%
```shell
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

The installation script prints a command that adds the the `fluvio` binaries to your shell PATH environment variable. This is required to follow the following steps.

On macOS, run this command and then close and reopen your terminal.

%copy first-line%
```shell
$ echo 'export PATH="${HOME}/.fvm/bin:${HOME}/.fluvio/bin:${PATH}"' >> ~/.zshrc
```

{{<idea>}}
If you've got existing installation of Fluvio (version `0.10.15` or older), please head on to the next section for additional follow-up steps.
{{</idea>}}

### (Optional) For existing installation of Fluvio CLI

must run this command before continuing further. We will cover the usage later when we talk about release channels.

If you have an existing `fluvio` installation (version `0.10.15` or older), you can choose 1 of the following:

#### Option 1: Delete the fluvio directory
This will clear out your existing settings.

%copy first-line%
```shell
$ rm -ri $HOME/.fluvio
rm -ri $HOME/.fluvio
examine files in directory $HOME/.fluvio? y
remove $HOME/.fluvio? y
```
 After deleting this directory, you can re-run the [installation instructions](#install-fvm).


#### Option 2: Install the stable channel

New installs run this step as part of the [installation script](#install-fvm), but you can migrate your existing settings

%copy%
```shell
$ fvm install
info: Downloading (1/5): fluvio@0.10.16
info: Downloading (2/5): fluvio-run@0.10.16
info: Downloading (3/5): fluvio-cloud@0.2.15
info: Downloading (4/5): smdk@0.10.16
info: Downloading (5/5): cdk@0.10.16
done: Installed fluvio version stable
done: Now using fluvio version 0.10.16
```

### What version are you running? 

Running `fvm current` should display the most recent version of `fluvio` toolchain installed. (The most recent version is `0.10.16` for the purposes of this tutorial)

%copy first-line%
```shell
$ fvm current
0.10.16 (stable)
```

## Release channels

Also in the output of `fvm current` we see `stable`, which is the name of the default release channel, and the active channel in use. There are 2 channels: `stable`, `latest`.

Installing channels with `fvm install` will also make that channel active.

### The Active channel

Only one channel is active at a time. You can use [`fvm switch`](#switching-between-channels) to select one of your installed channels.

FVM updates the `fluvio`/`smdk`/`cdk` etc. binaries used with the active channel's binaries.

### Stable release channel

The `stable` channel is installed by default. It is the most recent supported release.

The following commands are equivalent for installing or updating the `stable` release channel.

%copy first-line%
```shell
$ fvm install 
$ fvm install stable
```

### Latest release channel

If you contact us for support in GitHub or Discord, we may request you to validate fixes from the `latest` channel.

This channel consists of most recent updates that have not yet been released, which may include experimental features or unexpected behavior.

The `latest` channel is not intended for typical usage.

%copy first-line%
```shell
$ fvm install latest
info: Downloading (1/5): fluvio@0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
info: Downloading (2/5): fluvio-run@0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
info: Downloading (3/5): fluvio-cloud@0.2.15
info: Downloading (4/5): smdk@0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
info: Downloading (5/5): cdk@0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
done: Installed fluvio version latest
done: Now using fluvio version 0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
```

### Install a specific version

Specific releases can also be installed when you provide the version.

```shell
$ fvm install 0.10.16 
info: Downloading (1/5): fluvio@0.10.16
info: Downloading (2/5): fluvio-run@0.10.16
info: Downloading (3/5): fluvio-cloud@0.2.15
info: Downloading (4/5): smdk@0.10.16
info: Downloading (5/5): cdk@0.10.16
done: Installed fluvio version 0.10.16
done: Now using fluvio version 0.10.16
```

### Listing installed channels

The `fvm show` command will list out the installed channels and their corresponding version. The row with the checkmark (`✓`) is the current active channel.

%copy first-line%
```shell
$ fvm show
    CHANNEL  VERSION
 ✓  0.10.16  0.10.16
    stable   0.10.16
    latest   0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
```

## Switching between channels

If you are on another channel, you can change between them by running `fvm switch` with the name of the channel.

For typical usage of InfinyOn Cloud, we suggest using `stable`.

%copy first-line%
```shell
$ fvm switch stable

done: Now using Fluvio version stable
```

And we verify with `fvm show` that we are now back on the `stable` release channel.

%copy first-line%
```shell
$ fvm show
    CHANNEL  VERSION
 ✓  stable   0.10.16
    latest   0.11.0-dev-1+bf4e86674ce546d6b853adbf36a97e8e3344bd17
    0.10.16  0.10.16
```

## Conclusion

This wraps up the fundamental usage of `fvm`. While this guide covers the basics, `fvm` has more under the hood to explore and adapt to your workflows, ensuring a frictionless experience as you delve into Fluvio's ecosystem. 

However, our expectation is that a majority of users will find the `stable` channel adequately meets their needs, making the transition to other channels unnecessary. For developers actively contributing through issues or code, and our design partners, `fvm` serves as a bridge for closer and smoother collaboration.

Hopefully this is just the beginning of your journey with `fvm`. We're excited to see how it enhances your interactions with our platform.


---
title: Use InfinyOn Cloud Cluster
menu: Use InfinyOn Cloud
weight: 10
description: "Step-by-step instructions on how to create an account and login to InfinyOn Cloud using the CLI."
weight: 1
---

InfinyOn Cloud is managed through the [`Fluvio CLI`] via the `fluvio-cloud` plugin distributed by default by the installation script.

Let's create an InfinyOn Cloud account and login using the Fluvio CLI:

#### 1. Create an InfinyOn Cloud account

SignUp for a free account here: [InfinyOn Cloud - Signup](https://infinyon.cloud/signup)

You need an InfinyOn Cloud account to:
* start a managed Fluvio cluster
* download SmartModules and Connectors from InfinyOn Hub
 

#### 2. Install Fluvio CLI

Use the following curl commad to download fluvio CLI:

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

The CLI and related tools and config files and placed in the `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`.
To complete the installation, you will need to add the executables to your shell `$PATH`.


#### 3. Provision a Cluster

Pick a region to create a cluster from the InfinyOn Cloud UI.

You can also use fluvio cli:

%copy first-line%
```bash
$ fluvio cloud cluster create
```


#### 4. Login to InfinyOn Cloud

Run this command to log into InfinyOn Cloud.

You log in with Oauth2 or email/password:


##### OAuth2

%copy first-line%
```bash
$ fluvio cloud login --use-oauth2
A web browser has been opened at https://<OAUTH2_SERVER_DOMAIN>/activate?user_code=<CODE>.
Please proceed with authentication.
```

##### Email and password

%copy first-line%
```bash
$ fluvio cloud login
InfinyOn Cloud email: example@infinyon.com
Password: <hidden>
```

:tada: Congratulations! You are now connected to InfinyOn Cloud.


[`Fluvio CLI`]: https://www.fluvio.io/cli/
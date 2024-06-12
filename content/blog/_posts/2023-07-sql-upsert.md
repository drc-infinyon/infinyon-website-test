---
title: "Deduplicate data streaming events with SQL Upsert"
author:
    name: "Ozgur Akkurt"
    github: "ozgrakkurt"
description: "Step-by-step guide on how to use SQL connector upsert operation for deduplication."
date: 2023-07-11
metadata:
    - TECH
    - SQL
slug: 
url: /blog/2023/07/sql-upsert
img: blog/images/sql-upsert/sql-upsert.jpg
twitter-card: summary_large_image
show-header-img: false
---

Streaming data from external data sources outside of the reader's control often produce undesirable duplicates in the data set. One common method for dealing with such a situation is to offload deduplication to the database using SQL upserts.

This blog will show how to use the `upsert` operation with the `sql-connector`. You will learn how to set up an environment to use the SQL connector and how to apply the new upsert functionality.

Let's get started.

## What is Upsert

In summary, upsert means to insert this record into the database if it doesn't already exist. And If it already exists, update the existing record using the given data.

It translates into an SQL statement like this for PostgreSQL:

```sql
INSERT INTO users (
  name,
  age
) VALUES (
  'John Doe',
  35
) ON CONFLICT (name) DO UPDATE;
```

So if we try to `upsert` a record with a name that already existed in the database, it would just update the age of the existing record instead of trying to
create another record with the same name.

## Required Environment

### Postgres Server Setup

We need a PostgreSQL instance to run this example. If you don't have it, I prepared a `docker-compose` file to set it up quickly:

%copy%
```yaml
version: '3.8'
services:
  db:
    image: postgres:14.1-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=sql-connector-test
    ports:
      - '15432:5432'
```

Just save this as `docker-compose.yaml` and then run `docker-compose up -d`:

%copy first-line%
```bash
$ docker-compose up -d
```

The db should be accessible on `localhost:15432` after running this.

### Running SQL queries

This section explains how to run the sql queries included in the blog, if you already have a setup, you might not need this.

We can use `psql` to run our queries from the command line. On MacOS, you can install it with this command:

%copy first-line%
```bash
$ brew install libpq
```

Note: `homebrew` is required to run this command.

Then we can connect to the postgres instance we created by running this command:

%copy first-line%
```bash
$ psql -h localhost -p 15432 -d sql-connector-test -U postgres
```

It should ask for password when connecting, the password is also `postgres`.

After this it should show the `psql` cli, it looks like this:

```bash
psql (15.3, server 14.1)
Type "help" for help.

sql-connector-test=# 
```

It can be closed by typing `exit` or `\q` and pressing enter.

<b>WARNING</b>: When running sql queries in `psql`, we have to terminate them using `;` or `psql` will keep waiting for input, this might be confusing.

### Creating the Table

In order to run the example, we need a table.

%copy%
```sql
CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
	name TEXT UNIQUE,
	age INT
);
```

Copy pasting this into `psql` and pressing enter should work.

### Setting up fluvio

We also need a local `fluvio` cluster to run this example, see the [getting started guide](https://fluvio.io/docs/get-started/mac/) if you don't have that already.

Create a test topic with:

%copy first-line%
```bash
$ fluvio topic create dedup-upsert-example
```

Might want to use a better name than `dedup-upsert-example` for the topic.

Setup sql-connector (saved as `sql-connector-dedup-example.yaml`):

```yaml
apiVersion: 0.1.0
meta:
  version: 0.3.3
  name: check-upsert-sql
  type: sql-sink
  topic: dedup-upsert-example
  create-topic: true
  secrets:
    - name: DB_USERNAME
    - name: DB_PASSWORD
  log_level: debug
sql:
  url: 'postgres://${{ secrets.DB_USERNAME }}:${{ secrets.DB_PASSWORD }}@localhost:15432/sql-connector-test'
```

Secrets file (saved as `secrets.txt`):

%copy%
```bash
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

Download ipkg file for the connector:

%copy first-line%
```bash
$ fluvio hub connector download infinyon/sql-sink@0.3.0
```

Install cdk

%copy first-line%
```bash
$ fluvio install cdk
```

Deploy connector

%copy first-line%
```bash
$ cdk deploy start --config sql-connector-dedup-example.yaml --ipkg infinyon-sql-sink-0.3.0.ipkg --secrets secrets.txt
```

Check that the connector is running

%copy first-line%
```bash
$ cdk deploy list 
```

Should print something like:

```bash
sql-connector-dedup-example  Running 
```

## Running upsert

Create a json file to produce records from (saved as produce.json):

%copy%
```json
{ "Insert": { "table": "users", "values": [ { "column": "name", "type": "Text", "raw_value": "John Michael" }, { "column": "age", "type": "Int", "raw_value": "66" } ] } }
{ "Insert": { "table": "users", "values": [ { "column": "name", "type": "Text", "raw_value": "Christian Jackson" }, { "column": "age", "type": "Int", "raw_value": "33" } ] } }
```

Run produce to create the records in the database:

%copy first-line%
```bash
$ fluvio produce -f produce.json dedup-upsert-example
```

We have the records in the db (can use `SELECT * FROM users;` in `psql` to see this):

```bash
2   "John Michael"      66
3   "Christian Jackson" 33
```

Now we can run upsert to update the existing records and create a new one (file saved as produce_upsert.json):

%copy%
```json
{ "Upsert": { "table": "users", "uniq_idx": "name", "values": [ { "column": "name", "type": "Text", "raw_value": "John Michael" }, { "column": "age", "type": "Int", "raw_value": "67" } ] } }
{ "Upsert": { "table": "users", "uniq_idx": "name", "values": [ { "column": "name", "type": "Text", "raw_value": "Christian Jackson" }, { "column": "age", "type": "Int", "raw_value": "34" } ] } }
{ "Upsert": { "table": "users", "uniq_idx": "name", "values": [ { "column": "name", "type": "Text", "raw_value": "Hillary Bonhart" }, { "column": "age", "type": "Int", "raw_value": "99" } ] } }
```

Run produce to create/update the records in the database:

%copy first-line%
```bash
$ fluvio produce -f produce_upsert.json dedup-upsert-example
```

Now we have the new record ("Hillary Bonhart") and the old records with the updated ages in our db:

```bash
2   "John Michael"      67
3   "Christian Jackson" 34
6   "Hillary Bonhart"   99
```

## Clean-Up

Shutdown the connector:

%copy first-line%
```bash
$ cdk deploy shutdown --name check-upsert-sql
```

Destroy the database (this will delete data as well since there is no persistent docker volume attached):

%copy first-line%
```bash
$ docker-compose down
```

---

[Fluvio]: https://www.fluvio.io/
[Fluvio CLI]: https://www.fluvio.io/download
[InfinyOn Cloud]: https://infinyon.cloud/signup
[connectors]: https://www.fluvio.io/connectors/
[smartmodules]: https://www.fluvio.io/smartmodules/
[http-source]: https://www.fluvio.io/connectors/inbound/http/
[WebAssembly]: https://webassembly.org/
[Smartmodule Hub]: https://infinyon.cloud/hub
[Smartmodule Development Kit (smdk)]:https://www.fluvio.io/smartmodules/smdk/overview/
[Hub]: https://infinyon.cloud/hub
[DSL]: https://en.wikipedia.org/wiki/Domain-specific_language
[Incoming Webhooks]: https://api.slack.com/messaging/webhooks
[Discord Webhooks]: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
[Access Tokens]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
[github]: https://github.com/infinyon/labs-stars-forks-changes-sm

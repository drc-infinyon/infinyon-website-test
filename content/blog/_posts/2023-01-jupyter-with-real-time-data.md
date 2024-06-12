---
title: "How to process streaming data using Google Colab or Jupyter Notebook"
author:
    name: "Dr Alexander Mikhalev"
    github: "AlexMikhalev"
    title: "Technologist"
description: "Learn how to integrate Jupyter notebooks with real-time data streams using Python and InfinyOn Cloud."
date: 2023-01-17
metadata:
    - TECH
    - PYTHON
slug: jupyter-with-real-time-data
url: /blog/2023/01/jupyter-with-real-time-data
img: blog/images/jupyter-or-google-colab/jupyter-or-google-colab-blog.png
twitter-card: summary_large_image
show-header-img: false
---

For the past few years, organizations have been adopting real-time streaming services but continue using [batch processing] for [machine learning ML] tools and analytics. Using databases and [ETL tools] as a bridge between real-time and ML adds unnecessary complexity and lengthens the time to resolution. This blog aims to demonstrate that ML tools can interact with real-time streams using Python without needing ETL. You will create an account in [InfinyOn Cloud], set up a Jupyter Notebook environment, and write a small script that joins the two. Let's begin the journey to real-time analytics.

<img src="/blog/images/jupyter-or-google-colab/data-streaming-jupyter-notebook-or-google-colab.png"
     alt="Data ingestion architecture"
     style="margin: auto; max-width: 100%" />

A running example:

{{< youtube id="NqaccWkHoH8" >}}

## Prerequisite

This blog assumes the following:
* An active **[InfinyOn Cloud Account]** - follow [this tutorial] to setup an account and provision a fluivo cluster.
* Familiarity with **[Google Colab]** or **[Jupyter Notebooks]**.
* An email account with **[OAuth 2.0]** support.

Let's get started.

## Provision Data Streaming topics in InfinyOn Cloud

Install fluvio CLI to manage your cluster in InfinyOn Cloud:

%copy first-line%
```bash
$ curl -fsS https://hub.infinyon.cloud/install/install.sh | bash
```

This command will download the Fluvio Version Manager (fvm), Fluvio CLI (fluvio) and config files into `$HOME/.fluvio`, with the executables in `$HOME/.fluvio/bin`. To complete the installation, you will need to add the executables to your shell `$PATH`.

Login into your InfinyOn cloud account:

%copy first-line%
```bash
$ fluvio cloud login --use-oauth2
```

Create a new topic for our streams:

%copy first-line%
```bash
$ fluvio topic create hello-python
```

Copy below data and save into a `data.json` file:

%copy%
```json
{"c":27.55,"d":0.41,"dp":1.5107,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709682}
{"c":27.55,"d":0.41,"dp":1.5107,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709682}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
{"c":27.56,"d":0.42,"dp":1.5475,"h":27.74,"l":26.15,"o":26.3,"pc":27.14,"t":1668709710}
```

Populate the topic with the records above. For simplicity, we are pre-populate the data stream, but this data could be populated in real-time by an event driven client or connector.

%copy first-line%
```bash
$ fluvio produce hello-python -f data.json
```

Create output topic using CLI:

%copy first-line%
```bash
$ fluvio topic create hello-python-out
```

## Run in Google Colab

Open <a href="https://colab.research.google.com/drive/1wxorsLAadst0mPvK28chx_5fDN4CZvS7?usp=sharing" target="_blank">Notebook in Google Colab</a>, and follow the instructions:

<img src="/blog/images/jupyter-or-google-colab/colab-jupyter.png"
     alt="Google Colab Notebook"
     style="margin: auto; max-width: 100%; border: 1px solid #e1e1e1" />

After running `list(lazy)` let's check the resulting stream:

%copy first-line%
```bash
$ fluvio consume hello-python-out -Bd
Consuming records from 'hello-python-out' starting from the beginning of log
{"c": 27.55, "d": 0.41, "dp": 1.5107, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709682, "median": 26.72}
{"c": 27.55, "d": 0.41, "dp": 1.5107, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709682, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
{"c": 27.56, "d": 0.42, "dp": 1.5475, "h": 27.74, "l": 26.15, "o": 26.3, "pc": 27.14, "t": 1668709710, "median": 26.72}
```

Congratulations, you are all set!
In the next section, we'll go over the setups required to run `Jupyter` locally.

## Run on Local Machine

There are a couple of prerequisites to run Jupyter on your local machine:
* <a href="https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html" target="_blank">Install Conda</a>

Use Conda to create a new environment:

%copy%
```bash 
conda create -n fluvio_env python=3.9
```

Activate the environment:

%copy%
```bash 
conda activate fluvio_env
```

Install jupyter and pandas:

%copy%
```bash
pip install jupyter
pip install pandas
conda install -y matplotlib
```

Start jupyter notebook:

%copy%
```bash
jupyter notebook
```

Create a new project:

<img src="/blog/images/jupyter-or-google-colab/local-jupyter.png"
     alt="Jupyter Notebook"
     style="margin: auto; max-width: 100%; border: 1px solid #e1e1e1" />

Next, run the same steps as in [Google Colab](#run-in-google-colab) example above:

%copy%
```bash
!pip install fluvio==0.14.2
```

Login to InfinyOn cloud, and login using OAuth2 process with Google:

%copy%
```python
from fluvio import cloud
cloud.login()
```
 
Import dependencies:

%copy%
```bash
import json
import itertools
from fluvio import Fluvio, Offset
```

Connect to `hello-python` topic in InfinyOn cloud, and create consumer:

%copy%
```python
TOPIC_NAME = "hello-python"
PARTITION = 0
fluvio = Fluvio.connect()
records=[]
consumer = fluvio.partition_consumer(TOPIC_NAME, PARTITION)
```

Read the first eight records from the beginning of the data stream:

%copy%
```python
records = (json.loads(record.value_string()) for record in itertools.islice(consumer.stream(Offset.beginning()), 8))
```

This line runs instantly because it creates a generator. Generaters are interepreted from right to left: 

1. Create a stream consumer
2. Take a slice of 8 records using `itertools.islice` 
3. Turn each record into `json` by `record.value_string()` string and `json.loads`

Let's turn the eight records into pandas dataframe using `json_normalize`:

%copy%
```python
import pandas
df = pandas.json_normalize(records)
df.plot()
```

Now you can apply any pandas data transformation or action to the streamed data. For example add column with median:

%copy%
```python
df['median'] = df.median(numeric_only=True, axis=1)
```

And if you set offset to read from the end of the stream via `Offset.end()`, the notebook cell will be locked until you start populating data into the stream. 

The next step is to write back data into the stream, and we can do it using lazy using python generators as well. Create output producer:

%copy%
```bash
OUTPUT_TOPIC="hello-python-out"
producer = fluvio.topic_producer(OUTPUT_TOPIC)
```

Create a lazy producer generator:

%copy%
```bash
lazy = (producer.send_string(json.dumps(i)) for i in df.to_dict("records"))
```

It runs instantly and it only returns iterable. Evaluate generator:

%copy%
```bash
list(lazy)
```


### Conclusion

In this blog post, we highlighted the significance of streams in contemporary development and emphasized that working with data streams in Python can be straightforward. The example showed how to read, process, and write streams via Python generators to make the process fast and efficient. The code used in the demonstration is available on Google Colab at <a href="https://colab.research.google.com/drive/1wxorsLAadst0mPvK28chx_5fDN4CZvS7?usp=sharing" target="_blank">this link</a>.

Machine learning developers can now bridge their Jupyter notebook experiments with real-time streaming capabilities with ease. So, be sure to join {{%link "https://discordapp.com/invite/bBG2dTz" "our Discord server" %}} if you want to talk to us or have any questions. Until next time!


### Further reading

- [Handling XML data in Fluvio SmartModules](/blog/2022/06/smartmodule-xml/)
- [Transform streaming data in real-time with WebAssembly](/blog/2021/08/smartmodule-map-use-cases/)
- [How to Write to Apache Kafka from a Fluvio topic](/blog/2022/09/write-to-kafka-from-fluvio/)


[batch processing]: https://en.wikipedia.org/wiki/Batch_processing
[machine learning ML]: https://en.wikipedia.org/wiki/Machine_learning
[ETL tools]: https://en.wikipedia.org/wiki/Extract,_transform,_load
[InfinyOn Cloud]: https://infinyon.cloud/signup?utm_campaign=mlops&utm_source=website&utm_medium=blog&utm_term=google%20collab%2C%20jupytr%20notebook&utm_content=cloud-registration
[InfinyOn Cloud Account]: https://infinyon.cloud/signup?utm_campaign=mlops&utm_source=website&utm_medium=blog&utm_term=google%20collab%2C%20jupytr%20notebook&utm_content=cloud-registration
[account here]: https://infinyon.cloud/signup?utm_campaign=mlops&utm_source=website&utm_medium=blog&utm_term=google%20collab%2C%20jupytr%20notebook&utm_content=cloud-registration
[Jupyter notebook]: https://colab.research.google.com/
[Jupyter Notebooks]: https://jupyter.org/
[Google Colab]: https://colab.research.google.com/
[this tutorial]: https://www.fluvio.io/docs/tutorials/cloud-setup/
[OAuth 2.0]: https://developers.google.com/identity/protocols/oauth2

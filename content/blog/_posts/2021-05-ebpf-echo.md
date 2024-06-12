---
title: Routing traffic in Rust using eBPF
author:
    name: "Nick Cardin"
    github: "nacardin"
    title: "Engineer"
description: "Writing a routing application in Rust using eBPF to minimize syscalls and copying memory"
date: 2021-05-25
slug: ebpf-routing-rust
url: /blog/2021/05/ebpf-routing-rust
img: blog/images/ebpf/ebpf-social.png
twitter-card: summary_large_image
---


At InfinyOn we are seeing an increasing amount of traffic in Infinyon Cloud. Given our current projections we anticipate over 1 million edges to connect our platform in the next 12-18 months. One of bottlenecks is the compute resources needed to process ingress traffic.

We have a couple of places in our cloud offering where we needed to intercept TCP network traffic, perform some analysis on the first packet and make a decision on where to route the rest of the TCP stream.

Infinyon Cloud provides a fully managed solution for running <a href="https://www.fluvio.io" target="_blank">Fluvio</a>, an open source streaming platform for real-time applications. Low-latency and high-thoughput is a key benefit of using Fluvio, therefore <a href="https://infinyon.cloud" target="_blank">Infinyon Cloud</a> needs to provide infrastructure that can keep up with the traffic that customers send and receive from their Fluvio Cluster. To remain compitetive we need to maximize the efficiency of how our software uses hardware resources. Simply throwing hardware at the problem is not acceptable for us at scale.

## Let's get started

In various cases, the first packet may contain metadata which determine the destination endpoint or authentication data which may determine whether to terminate the connection. We can approach this by building a reverse proxy but with custom logic. The constraints that we need to consider are that we run on Linux in a container and our application is written in Rust.

In general, this can be accomplished in 6 steps:

1. Create a TCP socket
2. Wait for a new connection
3. Buffer and read the first packet
4. Determine destination
5. Open a TCP connection to the destination
6. Forward traffic

The naive way to do step 6 would be to forward packets by simultaneously copying packet payloads from the receive buffer of each socket to the send buffer of the other until either side terminates the TCP stream.

#### Example code:

%copy%

```rust
let listener = TcpListener::bind("127.0.0.1:10000").unwrap();
let mut stream = listener.accept().await.unwrap();
let mut buf = [0u8; 16];
loop {
    let bytes_read = stream.read(&mut buf).await.unwrap();
    if bytes_read == 0 {
        break;
    } else {
        stream.write(&buf).await.unwrap();
        println!("Echoed from userspace: {}", String::from_utf8_lossy(&buf));
    }
}
```

## Why is this not good enough?

The naive approach concerns us since we need to handle large amounts of traffic. Let's take a deeper look at what happens when we receive data that needs to be forwarded. The application, in a loop, will perform a `read` syscall to the linux kernel to read data that was received on the socket. This will copy the data from the read buffer in kernel-space to a buffer in user-space. Then, once again the application will perform a `write` syscall to copy data from the previously filled user-space buffer to the kernel-space write buffer of the other socket. By the way, none of this is affected by whether blocking or non-blocking IO is used.

The copying of data from kernel-space to user-space and back is wasteful usage of memory bandwidth, however just the cost of performing the two syscalls is a significant cause for concern. Syscalls add latency due to the switch between user mode and kernel mode which saves and restores CPU register values to and from the stack in memory.

The copying of data between TCP sockets is not a new problem, applications such as proxies and load balancers have had this need for a long time. Some of them have used techniques such as using the `splice` syscall to pipe data between sockets without copying to a user-space buffer. However this only solves the problem of copying memory, as this still requires two syscalls to forward a packet.

## A novel approach

The good news is that there is a solution to this problem which avoids both of the costs mentioned above. The solution is to use an <a href="https://ebpf.io/what-is-ebpf" target="_blank">eBPF</a> program to handle the forwarding of packets between sockets. eBPF is a framework for userspace applications to run sandboxed programs inside kernel space without modifying the kernel or loading kernel modules. These programs can be attached to various kernel resources waiting to be triggered by events such as a socket receiving data.

## eBPF Stream Parser and Sockmap

One way to leverage eBPF for our use case is to create a <a href="https://lwn.net/Articles/731133/" target="_blank">BPF Sockmap</a> and attach a program to it which will redirect packets to the proper destination socket. The Sockmap functions as a list of sockets, the mapping of source to destination sockets will need to be defined as a separate BPF map. The attached program will be executed when any socket in the map receives data.

Our application just needs to create a BPF Sockmap and a BPF generic map, which we will refer to as the destination map. Then we attach a program to the Sockmap to route packets according to the destination map. Once our application determines the destination for the incoming connection, it adds the socket file descriptor to the Sockmap along with an entry in the destination map. At this point all incoming packets will be processed and forwarded by the eBPF program and our application in user-space is not involved in handling any of the data for the lifetime of this connection. The only thing left is to remove the map entries once the socket is disconnected.

## Does it really work?

At this point we want to demonstrate that we can write an application in Rust that uses the eBPF functionality described above. To do this we wrote a simple TCP echo server where the user-space application only handles the initial connection and uses the techniques mentioned above to echo all packets back to the source.

There is a series of crates under the <a href="https://github.com/foniod/redbpf" target="_blank">RedBPF</a> project that handle the grunt work of compiling the eBPF program and provide an API for us to load and attach the eBPF program in our application. Typically eBPF programs are written in C and loaded with the <a href="https://github.com/iovisor/bcc" target="_blank">BCC toolchain</a>. With RedBPF we write our eBPF code in Rust and use the safe Rust API provided by RedBPF to load and attach the eBPF program.


### Example eBPF Program and Map:

We will put the part of our application that run in eBPF in one crate which we will name `echo-probe`. RedBPF refers to all eBPF programs as probes, so we shall follow this convention for now.

%copy%

```rust
#![no_std]
#![no_main]
use core::mem;
use core::ptr;
use redbpf_probes::sockmap::prelude::*;

program!(0xFFFFFFFE, "GPL");

#[map(link_section = "maps/sockmap")]
static mut SOCK_MAP: SockMap = SockMap::with_max_entries(1);

#[stream_parser]
fn parse_message_boundary(sk_buff_wrapper: SkBuff) -> StreamParserResult {
    let len: u32 = unsafe {
        (*sk_buff_wrapper.skb).len
    };
    Ok(StreamParserAction::MessageLength(len))
}

#[stream_verdict]
fn verdict(sk_buff_wrapper: SkBuff) -> SkAction {

    let index = 0;
    match unsafe { SOCK_MAP.redirect(sk_buff_wrapper.skb as *mut _, index) } {
        Ok(_) => SkAction::Pass,
        Err(_) => SkAction::Drop,
    }
}
```

In the above example we are using a Stream Verdict program to redirect the packet back out throught the same socket. This is easy since the only socket FD in the sockmap is the one of the incoming connection, so we use an index of `0`.

In order to attach the Stream Verdict program we must also attach a Stream Parser program, this is a requirment of the API. In this example we do not need to inspect or modify the socket buffer, so we just need to return back the length of the buffer in the Stream Parser program.


### Example User-Space Application:

We will put our application in a separate crate names `echo`. In this crate we need to include custom build login in `build.rs`. This uses the `cargo-bpf` <a href="https://lib.rs/crates/cargo-bpf">crate</a> to compile our `echo-probe` crate to eBPF code. Internally `cargo-bpf` uses `rustc` but with specific flags. The output is emitted to the output dir of this crate.

##### build.rs:

%copy%

```rust
use std::env;
use std::path::{Path, PathBuf};

use cargo_bpf_lib as cargo_bpf;

fn main() {
    let cargo = PathBuf::from(env::var("CARGO").unwrap());
    let target = PathBuf::from(env::var("OUT_DIR").unwrap());
    let probes = Path::new("../echo-probe");

    cargo_bpf::build(&cargo, &probes, &target.join("target"), Vec::new())
        .expect("couldn't compile probes");

    cargo_bpf::probe_files(&probes)
        .expect("couldn't list probe files")
        .iter()
        .for_each(|file| {
            println!("cargo:rerun-if-changed={}", file);
        });
    println!("cargo:rerun-if-changed=../echo-probe/Cargo.toml");
}
```

In the main loop we embed the compiled eBPF bytecode as data into our userspace application using `include_bytes!`. Then we load the eBPF resources, attach the sockmap, and we are ready to populate the sockmap with the incomming connection.

##### main.rs:

%copy%

```rust
use std::os::unix::io::AsRawFd;
use futures_lite::{AsyncReadExt, AsyncWriteExt};
use glommio::net::{TcpListener};
use glommio::prelude::*;

use redbpf::load::Loader;
use redbpf::SockMap;


fn main() {
   let server_handle = LocalExecutorBuilder::new().spawn(|| async move {

        let loaded = Loader::load(probe_code()).expect("error loading BPF program");

        let bpf_map = loaded.map("sockmap").unwrap();

        // Reference to the sockmap, which we can add and remove sockets from
        let mut sockmap = SockMap::new(bpf_map).unwrap();

        // Attach the sockmap to the stream parser program
        loaded
            .stream_parsers()
            .next()
            .unwrap()
            .attach_sockmap(&sockmap)
            .expect("error attaching sockmap to stream parser");

        // Attach the sockmap to the stream verdict program
        loaded
            .stream_verdicts()
            .next()
            .unwrap()
            .attach_sockmap(&sockmap)
            .expect("error attaching sockmap to stream verdict");

        let listener = TcpListener::bind("127.0.0.1:10000").unwrap();
        println!(
            "Server Listening on {}",
            listener.local_addr().unwrap()
        );

        let mut stream = listener.accept().await.unwrap();

        // Add the socket of the new connection to the sockmap
        // This is where the magic happens
        sockmap.set(0, stream.as_raw_fd()).unwrap();
        println!(
            "Sockmap set fd {}",
            stream.as_raw_fd()
        );

        loop {
            let mut buf = [0u8; 16];
            let b = stream.read(&mut buf).await.unwrap();
            if b == 0 {
                break;
            } else {
                stream.write(&buf).await.unwrap();
                println!("Echoed from userspace: {}", String::from_utf8_lossy(&buf));
            }
        }
    }).unwrap();

    server_handle.join().unwrap();
}

fn probe_code() -> &'static [u8] {
    include_bytes!(concat!(
        std::env!("OUT_DIR"),
        "/target/bpf/programs/echo/echo.elf"
    ))
}
```

Unfortunately, the RedBPF crates require us to write a couple parts of our eBPF code in `unsafe` blocks. We are happy to see that since we initially prototyped this echo server (February 2021), RedBPF has added better support for Sockmap and Stream Parser program types, which allowed us to remove many instances of `unsafe` code blocks from our example echo server. However, there is still room for improvment since we are forced to use `unsafe` due to the lack of safe abstractions provided by RedBPF.

Full example source code is available at <a href="https://github.com/nacardin/ebpf-proxy" target="_blank">github.com/nacardin/ebpf-proxy</a>

## Now what?

An important fact to note is that the user-space application must be run as `root` in order to load and attach eBPF programs. The alternative is to set the `unprivileged_bpf_disabled` systl option to `0`, this is a system-wide change and requires security consideration.

There are other ways to leverage eBPF, such as with XDP, which may even have better performance as it is triggered before a kernel socket buffer is allocated. However this requires the NIC driver to support this feature set. Also we would lose the ability to take action based on the contents of the packet. This may be an acceptable solution for us and requires further consideration.

So it seems we still have some research to do, so stay tuned...

More about BPF Sockmap (<a href="https://lwn.net/Articles/731133/" target="_blank">lwn.net/Articles/731133</a>)

More about performance of BPF Sockmap (<a href="https://blog.cloudflare.com/sockmap-tcp-splicing-of-the-future/" target="_blank">blog.cloudflare.com/sockmap-tcp-splicing-of-the-future</a>)

### Infinyon Cloud

Infinyon Cloud is currently in alpha stage, and you can create a free account using the link below:

<div class="button text-center">
    <a class="btn btn-purple" href="https://infinyon.cloud/signup" target="_blank" role="button">Try Infinyon Cloud</a>
</div>

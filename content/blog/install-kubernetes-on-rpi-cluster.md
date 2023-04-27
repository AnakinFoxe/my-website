---
title: "Install Kubernetes on Raspberry Pi Cluster"
summary: "This HOW-TO shows you how to install Kubernetes (k3s) on a Raspberry Pi 4 cluster with k3sup."
date: 2023-04-22T18:14:59-07:00
tags: ["Kubernetes","Raspberry Pi", "Ubuntu"]
---

First of all, I’m going to use [k3s](https://k3s.io/) which is the lightweight version k8s.

## Prerequisite

To run k3s, memory and CPUset cgroup need to be enabled. 
In my case, because I’m using Ubuntu, I have to add following to `/boot/firmware/nobtcmd.txt`, for Raspbian, use `/boot/cmdline.txt`.

```ini
cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory
```

Note:
- Append to the same line instead of adding a new line
- Do this to every Pi

Then, reboot.

## Install k3s using k3sup

On your laptop, [install k3sup](https://github.com/alexellis/k3sup#download-k3sup-tldr) and then use it to install k3s.

```bash
k3sup install --ip <RPi-Server-IP> --user <RPi-user>
```

Note:
- the `<RPi-user>` needs to be able to `sudo` without having to type password. 
Follow [this guide](https://github.com/alexellis/k3sup#pre-requisites-for-k3sup-servers-and-agents) to config.
- k3sup uses ssh-key to remote login, if you don’t have key generated yet, follow 
[this guide](https://www.adamdehaven.com/blog/how-to-generate-an-ssh-key-and-add-your-public-key-to-the-server-for-authentication/).


## Join other Pi (nodes) to the cluster

This can be easily done with k3sup

```bash
k3sup join --ip <RPi-IP> --server-ip <RPi-Server-IP> --user <RPi-user>
```

Do this to every Pi you’d like to add to the cluster.

That’s it.

## Upgrade Kubernetes master and nodes

Very simple, just rerun the `install` and `join` command with the same arguments/flags.

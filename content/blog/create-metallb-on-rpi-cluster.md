---
title: "Create Metallb on Raspberry Pi Cluster"
summary: "Provision load balancers for the bare metal Kubernetes cluster that is running on a Raspberry Pi cluster."
date: 2023-04-24T23:09:57-07:00
tags: ["Kubernetes", "Raspberry Pi", "Network"]
---

## Why?

My motivation for using Kubernetes to manage [Pi-hole](https://pi-hole.net/) and other services is to enable Pi-hole to run on any node within the cluster, which could result in IP changes. Additionally, I may want to create multiple instances of Pi-hole in the future to enhance redundancy. To achieve this, I need to place Pi-hole behind a load balancer.

By default, Kubernetes does not include load balancer provisioners. Therefore, when operating a Kubernetes cluster on my Raspberry Pi setup, I must provide a provisioner. Although [k3s](../install-kubernetes-on-rpi-cluster) comes with [klipper-lb](https://github.com/k3s-io/klipper-lb) pre-installed, its downside is that the load balancer IP is tied to the node.

[Metallb](https://metallb.universe.tf/) offers a solution by allowing me to designate a reserved IP range for load balancers. It is simple and efficient, making it suitable for home use.

## Prerequisite

Disable klipper-lb with `--disable servicelb` flag

```bash
k3sup install --ip <RPi-Server-IP> --user <RPi-user> \
     --k3s-extra-args '--disable servicelb'
```

## Installation

```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.9/config/manifests/metallb-native.yaml
```

Reference: the [official guide](https://metallb.org/installation/)

## IP Address Pool

At here I defined an IP address pool `local-pool` with address range `192.168.10.240` to `192.168.10.250`.

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: local-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.10.240-192.168.10.250
```

Then advertise the pool with the simplest layer 2 mode (corresponding to layer 3 in OSI model).

```yaml
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: local
  namespace: metallb-system
spec:
  ipAddressPools:
  - local-pool
```

That's it. 

## Example

Here's an example of creating a TCP and a UDP load balancers sharing the same IP:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: pihole-tcp
  namespace: pihole
  annotations:
    metallb.universe.tf/allow-shared-ip: pihole
spec:
  type: LoadBalancer
  loadBalancerIP: 192.168.10.250
  ports:
    - name: piholetcp
      protocol: TCP
      port: 53
      targetPort: 53
  selector:
    app: pihole
---
apiVersion: v1
kind: Service
metadata:
  name: pihole-udp
  namespace: pihole
  annotations:
    metallb.universe.tf/allow-shared-ip: pihole
spec:
  type: LoadBalancer
  loadBalancerIP: 192.168.10.250
  ports:
    - name: piholeudp
      protocol: UDP
      port: 53
      targetPort: 53
  selector:
    app: pihole
```

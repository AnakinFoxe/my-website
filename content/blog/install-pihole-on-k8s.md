---
title: "Install Pi-hole on Kubernetes"
summary: "This HOW-TO shows you how to install Pi-hole on a Kubernetes cluster running on Raspberry Pi cluster"
date: 2023-04-25T14:45:06-07:00
tags: ["Kubernetes", "Raspberry Pi", "Network"]
---

[Pi-hole](https://pi-hole.net/) is arguably the number one essential tool for any home lab. I want to use it to block ads and possible malware for every device at home.

## Installation

Create the namespace so it is properly isolated from other services:

```bash
kubectl create namespace pihole
```

Create the secret `pihole-admin` which contains admin password for the Pi-hole:

```bash
kubectl -n pihole create secret generic pihole-admin \
	--from-literal='password=<admin-pwd>'
```

Use the Helm chart [mojo2600/pihole](https://mojo2600.github.io/pihole-kubernetes/) to deploy Pi-hole to a Kubernetes cluster:

```bash
helm repo add mojo2600 https://mojo2600.github.io/pihole-kubernetes/

# show customizable values
helm show values mojo2600/pihole
```

Prepare the `values.yaml` for my use case:

```yaml
# might increase replica in the future
replicaCount: 1
maxUnavailable: 0

image:
  # fixiate the version to use
  # https://hub.docker.com/r/pihole/pihole
  tag: "2023.03.1"

# I use Edge Router for DHCP
serviceDhcp:
  enabled: false

serviceDns:
  type: LoadBalancer
  # assign the preferred IP from the pool
  loadBalancerIP: 192.168.10.250
  annotations:
    # this annotation make sure we can use the same IP for the two services
    metallb.universe.tf/allow-shared-ip: pihole

serviceWeb:
  type: LoadBalancer
  loadBalancerIP: 192.168.10.250
  annotations:
    metallb.universe.tf/allow-shared-ip: pihole

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

persistentVolumeClaim:
  enabled: true

admin:
  # use the secret we just created
  existingSecret: "pihole-admin"

extraEnvVars:
  TZ: America/Los_Angeles
```

Install the helm chart:

```bash
helm install pihole mojo2600/pihole -f values.yaml --namespace pihole
```

That's it.

Now, go to the router and set the DNS server IP address to be `192.168.10.250` for the DHCP service , and remove all other DNS servers.

If you made any changes and want to update the existing deployment, use `upgrade` command:

```bash
helm upgrade pihole mojo2600/pihole -f values.yaml --namespace pihole
```

## Future Work

- Pi-hole utilizes PersistentVolumeClaim (PVC) and PersistentVolume (PV) to store its configuration and data on the node's local disk. This means that if the pod moves to another node, all data will be lost. We need to ensure that no matter which node the Pi-hole pod is running on, it can always access the same files.
- [Maybe] Currently, Pi-hole handles all DNS requests at my home, so if it goes down, my internet is essentially nonfunctional. It might be a good idea to have multiple replicas running to increase the redundancy of the service. However, at this point, it doesn't seem necessary.

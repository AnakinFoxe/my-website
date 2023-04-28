---
title: "Setup NFS for Pi-hole"
summary: "A simple solution for persisting Pi-hole data on a Kubernetes cluster"
date: 2023-04-27T16:42:57-07:00
tags: ["NFS", "Kubernetes", "Raspberry Pi"]
---

## Why

As [previously mentioned](../install-pihole-on-k8s), I have successfully deployed Pi-hole on my Kubernetes cluster, which operates on a 3-node Raspberry Pi cluster. One concern I have is that the Pi-hole pod can be created on any node, so it needs to be able to access the same storage from any node in the cluster.

I explored [Rook](https://rook.io/) combined with [Ceph](https://rook.io/docs/rook/v1.11/Getting-Started/intro/), which offers a cloud-native distributed storage system. However, after spending a few hours researching and attempting to set it up on my cluster, I discovered that it demands a considerable amount of CPU/memory resources. While it could be a viable solution for transforming a Raspberry Pi cluster into a distributed storage system, I have other plans for my cluster and don't intend to use it solely for storage.

Thus, my other option is NFS, which is supposedly slower but simpler to implement.

## Prerequisite

- Setup a NFS server. For me, I plan to move it to a NAS in the future, but since I don't have one right now, I followed [this guide](https://pimylifeup.com/raspberry-pi-nfs/) to setup a NFS server on a Pi node.

In the end, there should be a path (say `/nfs/export`) that's readable/writable for the `<RPi-user>` on the NFS server.

## PersistentVolume and PersistentVolumeClaim

Now let's create a PersistentVolume (PV) on the path and use it for the Pi-hole

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv-pihole
spec:
  capacity:
    storage: 5Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: slow
  mountOptions:
    - hard
    - nfsvers=4.1
  nfs:
    path: /nfs/export/pihole
    server: <NFS-server-IP>
```

Create a PersistentVolumeClaim (PVC) for Pi-hole pod (in the same `pihole` namespace)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pihole-pvc
  namespace: pihole
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 500Mi
  storageClassName: slow
```

Update the `values.yaml` used for installing Pi-hole Helm chart with

```yaml
persistentVolumeClaim:
  enabled: true
  existingClaim: pihole-pvc
```

And finally upgrade the Helm installation

```bash
helm upgrade pihole mojo2600/pihole -f values.yaml --namespace pihole
```

That's it.

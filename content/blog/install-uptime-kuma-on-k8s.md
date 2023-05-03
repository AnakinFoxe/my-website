---
title: "Install Uptime Kuma on Kubernetes"
summary: "A fancy and easy to use self-hosted monitoring tool on my Kubernetes Pi cluster"
date: 2023-05-03T00:01:05-07:00
tags: ["Monitoring", "Kubernetes"]
cover:
    image: "/blog/uptime-kuma/post-cover.png"
    alt: "Uptime Kuma"
---

The minute I saw the UI, I told myself: **I want this**. [Uptime Kuma](https://github.com/louislam/uptime-kuma) is "a fancy self-hosted monitoring tool", and yes it's fancy. On top of that, it also supports a long list of notification types to send you alert if the target is down.

It's pretty easy to set up with docker, but I want to deploy it to my "Kubernetes Pi cluster", so a little bit of extra work is needed.

## Installation

It's always a good idea to create a separate namespace for the service

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: uptime-kuma
```

Since it has a Web UI we'd like to create a load balancer with fixed IP for it, so we can visit it at `http://<LB-IP>:3001`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: uptime-kuma-tcp
  namespace: uptime-kuma
spec:
  type: LoadBalancer
  loadBalancerIP: <LB-IP>
  ports:
  - name: web-ui
    protocol: TCP
    port: 3001
    targetPort: 3001
  selector:
    app: uptime-kuma
```

Create a PersistentVolume (PV) on the [NFS server](../setup-nfs-for-pihole)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv-uptime-kuma
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: slow
  mountOptions:
    - hard
    - nfsvers=4.1
  nfs:
    path: /nfs/export/uptime-kuma
    server: <NFS-server-IP>
```

Create a PersistentVolumeClaim (PVC) for the Uptime Kuma pod

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uptime-kuma-pvc
  namespace: uptime-kuma
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
  storageClassName: slow
```

Finally, create the deployment for Uptime Kuma

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uptime-kuma
  namespace: uptime-kuma
spec:
  selector:
    matchLabels:
      app: uptime-kuma
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: uptime-kuma
    spec:
      containers:
      - name: uptime-kuma
        image: louislam/uptime-kuma:1
        imagePullPolicy: IfNotPresent
        env:
        # only need to set PUID and PGUI because of NFS server
        - name: PUID
          value: "1000"
        - name: PGID
          value: "1000"
        ports:
        - containerPort: 3001
          name: web-ui
        resources:
          limits:
            cpu: 200m
            memory: 512Mi
          requests:
            cpu: 50m
            memory: 128Mi
        livenessProbe:
          tcpSocket:
            port: web-ui
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            scheme: HTTP
            path: /
            port: web-ui
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: uptime-kuma-pvc
```

That's it.

## Monitor

It can even be used to monitor things outside of the home network, for example, my website.

![Dashboard](/blog/uptime-kuma/dashboard.png)

## Notification

You'd be amazed on how many tools can used by Uptime Kuma to send notifications, such as Telegram, Slack, Email etc.. For me the best option is sending notifications to my Discord server:

![Discord Notification](/blog/uptime-kuma/discord-notification.png#center)

---
title: "Install Unifi Controller on Kubernetes"
summary: "A Unifi Controller that's always on at home, without requiring a Unifi Cloud Key"
date: 2023-04-29T01:43:18-07:00
tags: ["Unifi", "Kubernetes"]
---

There are two popular docker containers for Unifi Controller (now called Unifi Network Application): [linuxserver/unifi-controller](https://hub.docker.com/r/linuxserver/unifi-controller) and [jacobalberty/unifi](https://hub.docker.com/r/jacobalberty/unifi). I don't know which one is better but picked the one managed by [linuxserver.io](https://www.linuxserver.io/).

## Installation

First, create a namespace for Unifi stuffs.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: unifi
```

Then, create a TCP load balancer and an UDP load balancer. Natually, I use the same IP address for both of them. WIth [Metallb](../create-metallb-on-rpi-cluster), just add the `allow-share-ip` annotation.

For the ports that you want to expose, check [this list](https://github.com/linuxserver/docker-unifi-controller#parameters).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: unifi-tcp
  namespace: unifi
  annotations:
    metallb.universe.tf/allow-shared-ip: unifi
spec:
  type: LoadBalancer
  loadBalancerIP: <LB-IP>
  ports:
  - name: web-ui
    protocol: TCP
    port: 8443
    targetPort: 8443
  - name: device-inform
    protocol: TCP
    port: 8080
    targetPort: 8080
  - name: mob-speedtest
    protocol: TCP
    port: 6789
    targetPort: 6789
  selector:
    app: unifi
---
apiVersion: v1
kind: Service
metadata:
  name: unifi-udp
  namespace: unifi
  annotations:
    metallb.universe.tf/allow-shared-ip: unifi
spec:
  type: LoadBalancer
  loadBalancerIP: <LB-IP>
  ports:
    - name: stun
      protocol: UDP
      port: 3478
      targetPort: 3478
    - name: ap-discovery
      protocol: UDP
      port: 10001
      targetPort: 10001
    - name: ssdp
      protocol: UDP
      port: 1900
      targetPort: 1900
  selector:
    app: unifi
```

Create a PersistentVolume (PV) on the [NFS server](../setup-nfs-for-pihole) I previously setup.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv-unifi
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
    path: /nfs/export/unifi
    server: <NFS-server-IP>
```

Create a PersistentVolumeClaim (PVC) for the Unifi pod.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: unifi-pvc
  namespace: unifi
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
  storageClassName: slow
```

Finally, create the deployment for the Unifi Controller.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unifi
  namespace: unifi
spec:
  selector:
    matchLabels:
      app: unifi
  # it appears unifi-controller will deadlock on the files
  # if there's another instance running. therefore, set both replicas
  # and maxUnavailable to 1 so there's always one and only one running.
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: unifi
    spec:
      containers:
      - name: unifi-controller
        image: lscr.io/linuxserver/unifi-controller:7.3.83
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8443
          name: web-ui
        - containerPort: 3478
          protocol: UDP
          name: stun
        - containerPort: 10001
          protocol: UDP
          name: ap-discovery
        - containerPort: 8080
          name: device-inform
        - containerPort: 1900
          protocol: UDP
          name: ssdp
        - containerPort: 6789
          name: mob-speedtest
        env:
        # the user with this PUID and GUID should have
        # read/write permission to access the storage
        - name: PUID
          value: "1000"
        - name: PGID
          value: "1000"
        - name: TZ
          value: America/Los_Angeles
        resources:
          limits:
            cpu: 2
            memory: 1Gi
          requests:
            cpu: 200m
            memory: 256Mi
        livenessProbe:
          tcpSocket:
            port: device-inform
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            scheme: HTTPS
            path: /
            port: web-ui
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: config
          mountPath: /config
      volumes:
      - name: config
        persistentVolumeClaim:
          claimName: unifi-pvc
```

That's it.

## Report to the New Controller

If the Unifi Controller is not newly set up -- meaning there's an existing one that manages all the Unifi devices already. After restoring or migrating the config over, all the Unifi devices will be shown as "Offline" status on the new Controller. This is because these devices are still trying to communicate with the old Controller.

In this case, you need to ssh into each Unifi device and ask them to report to the new Controller.

```bash
set-inform http://<new-controller-ip>:8080/inform
```

Note, the username and password could have been changed in "System" -> "Advanced":

![Unifi Device Authentication](/blog/unifi-device-auth.png#center)

## Future Work

- [unpoller](https://unpoller.com/) seems to be a pretty cool addon to gain more observability in the Unifi Controller.

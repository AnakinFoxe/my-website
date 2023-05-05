---
title: "Install Cloudflared on Kubernetes"
summary: "The Cloudflare Tunnel Client to let you access services at home without exposing your home network"
date: 2023-05-05T15:16:32-07:00
tags: ["Cloudflare", "VPN", "Kubernetes"]
---

Bumpped into [this video](https://www.youtube.com/watch?v=ZvIdFs3M5ic) by Crosstalk and [another one](https://www.youtube.com/watch?v=ey4u7OUAF3c) by NetworkChuck about exposing your local (home) service to internet through Cloudflare Tunnel, without exposing your home network. Super cool!

## Prerequisite

You will need a domain name. I got one from [Cloudflare](https://www.cloudflare.com/products/registrar/) which is super cheap (at-cost).

## Installation on Kubernetes

The videos from Crosstalk and NetworkChuck have provided pretty detailed instructions on how to setup Cloudflared Tunnel for the home network. Here I will only cover the part to run the `cloudflared` container on the Kubernetes cluster.

First, create a namespace for cloudflare

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cloudflare
```

Create a secret for the token

```bash
k -n cloudflare create secret generic cloudflared-token \
	--from-literal='token=<TOKEN-STRING>'
```

Finally, create the deployment for `cloudflared`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflare
  namespace: cloudflare
spec:
  selector:
    matchLabels:
      app: cloudflare
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: cloudflare
    spec:
      containers:
      - name: cloudflared
        image: cloudflare/cloudflared:2023.4.2
        imagePullPolicy: IfNotPresent
        env:
        - name: CLOUDFLARED_TOKEN
          valueFrom:
            secretKeyRef:
              name: cloudflared-token
              key: token
        args:
        - "tunnel"
        - "--no-autoupdate"
        - "run"
        - "--token"
        - "$(CLOUDFLARED_TOKEN)"
```

That's it.

## Reference

- [You Need to Learn This! Cloudflare Tunnel Easy Tutorial](https://www.youtube.com/watch?v=ZvIdFs3M5ic)
- [EXPOSE your home network to the INTERNET!! (it's safe)](https://www.youtube.com/watch?v=ey4u7OUAF3c)

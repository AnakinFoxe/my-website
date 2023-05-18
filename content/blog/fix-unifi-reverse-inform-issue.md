---
title: "Unifi devices keep reverting inform address"
summary: "Here is a HOW-TO to solve this issue."
date: 2023-05-18T12:21:06-07:00
tags: ["Unifi"]
---

I've been grappling with a persistent issue for a while now, and unfortunately, I've had no success with the solutions provided online or by ChatGPT.

Here's what's been happening: occasionally, some of my Unifi devices (AP, Switch, etc.) would show as "Offline" in the Unifi Controller (`v7.3.83`). Whenever I'd `ssh` into a device and use the `info` command, I'd notice an incorrect inform address. For example:

```ini
Model:       UAP-AC-Lite
Version:     6.5.28.14491
MAC Address: <MAC>
IP Address:  <IP>
Hostname:    AP-Lite
Uptime:      584333 seconds
NTP:         Synchronized

Status:      Timeout (http://192.168.1.89:8080/inform)
```

This inform address, `192.168.1.89`, does not match my Unifi Controller's address.

There are suggestions online saying that repeating `set-inform` several times to clear the backup configuration should stop the system from reverting to an incorrect address, but this approach has been unsuccessful for me.

## The Solution

I happened upon a `/etc/persistent/cfg/mgmt` file on the Unifi device, which seemed to handle the device's configuration:

```ini
mgmt.is_default=false
mgmt.led_enabled=true
mgmt.cfgversion=3d76e600b230b191
mgmt.authkey=
mgmt.selfrun_guest_mode=pass
mgmt.capability=notif,notif-assoc-stat
mgmt.use_aes_gcm=true
mgmt.report_crash=true
mgmt.is_setup_completed=false
mgmt.servers.1.url=http://192.168.1.89:8080/inform
stun_url=stun://<Unifi-Controller-IP>
mgmt_url=https://<Unifi-Controller-IP>:8443/manage/site/default
```

I noticed that at `mgmt.servers.1.url`, the incorrect address was being utilized. I changed this to match the IP address of the Unifi Controller and saved the change. Since then, the issue hasn't resurfaced (as of yet).

That's it.

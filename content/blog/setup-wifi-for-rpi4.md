---
title: "Setup Wi-Fi for Raspberry Pi 4"
Summary: "This HOW-TO shows you how to setup wireless connection with Raspberry Pi 4 built-in Wi-Fi."
date: 2023-04-24T13:39:58-07:00
tags: ["Raspberry Pi", "Ubuntu"]
---

This instruction should work for other Pi with built-in WiFi.

## Step 1: Change default DNS

Edit `/etc/systemd/resolved.conf`

```ini
# Use Google DNS as default DNS
DNS=8.8.8.8
# Fallback to local DNS
FallbackDNS=192.168.1.1
```

## Step 2: Connect to Wi-Fi temporarily

Generate a WPA PSK from an ASCII passphrase for your WiFi

```bash
sudo wpa_passphrase [SSID] [passphrase] | sudo tee /etc/wpa_supplicant/wpa_supplicant.conf

# example
sudo wpa_passphrase "Xing's WiFi" pass1234 | sudo tee /etc/wpa_supplicant/wpa_supplicant.conf
```

You should see the file `/etc/wpa_supplicant/wpa_supplicant.conf` generated with content 
like following. It is highly recommended to delete the plain text password in the comment.

```ini
network={
    ssid="Xing's WiFi"
    #psk="pass1234"
    psk=e851df315f1663055025c04c796ca377bc96240bf0bb82e417ce47051490bf8c
}
```

Start WPA supplicant (Raspberry Pi’s built-in WiFi should have network interface name `wlan0`, 
if not, change following accordingly)

```bash
sudo wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf
```

Obtain IP through DHCP (assuming DHCP is enabled on your router)

```bash
sudo dhclient -r
sudo dhclient wlan0
```

Now if you use ifconfig you should see internal IP allocated to `wlan0` 
and you should be able to access internet.

## Step 3: Connect to Wi-Fi persistently

There are many ways, but I prefer to manage it manually with ifup and `/etc/network/interfaces`.

Edit `/etc/network/interfaces`. Feel free to use DHCP instead of static IP.

```ini
auto lo
iface lo inet loopback

# wlan0
auto wlan0
iface wlan0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    wpa-driver nl80211
    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
```

Then install `ifupdown` and use it to bring up `wlan0`

```bash
sudo apt install ifupdown
sudo ifup wlan0
```

That's it.




---
layout: page
title: BluePi
date:  2016-04-26 14:33:53 +0200
permalink: /projects/bluepi
sitemap:
  lastmod: 2016-05-05
  priority: 0.6
  changefreq: 'yearly'
---

During my experiments with network I often wanted to have a quick way to create an access point to connect multiple devices to one RJ45 socket or to connect to a Wi-Fi network and connect it to an Ethernet network. When the RaspberryPi came out I took the opportunity and ordered one.

A RaspberryPi is a nice nano-computer with (in its version 1B) Ethernet and a few USB ports. I plugged a Wi-Fi dongle and a Bluetooth one so my RasPi is now capable of becoming an access point as I wished or a Wi-Fi client.

It is nice to have this setup, but switching between modes requires me to either edit the configuration on the SD card with my computer or booting the RasPi, edit its config and restart services.

So I tought of a system to control my RasPi and set it in the different modes I need using my smartphone and bluetooth.

Look at the repo : [BluePi](https://git.rousse.me/mrousse/BluePi)

The modes I want to have :

- Ethernet to Wi-Fi // With routing capabilities
- Wi-Fi to Ethernet // With routing capabilities
- Router (DHCP, routing, with a webinterface or displays leases on the smartphone)
- PXE Boot server

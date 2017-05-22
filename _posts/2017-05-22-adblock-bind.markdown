---
layout: post
title:  "AdBlock on mobile without root"
date:   2017-05-22 15:11:09 +0200
categories: sysadmin
excerpt: How to use AdBlock on my android phone without rooting it.
---

My smartphone is under android and used to be rooted. Many applications refuse to start if they detect that the phone has been rooted (either via scanning running processes or simply by looking for a `su` executable).

On the other hand, I do not like advertisements and find more and more of them in the applications I use every day.

<!---excerpt-break-->

The first solution I chose was [AdAway](https://adaway.org/), which needed root permissions, but was quite efficient. It adds to the `/etc/hosts` file entries to redirect the domain names used by advertisements companies to `localhost` (which does not run any webserver). It worked great until I wanted to use an application enemy of rooted phones.

So the second solution I came up with was to set up a DNS server that would resolve the domain names of advertisements companies to `localhost`, and to set my phone to use this DNS server instead.

> I will not describe how to set up a DNS server nor how to configure the phone to use the DNS server (it could be an internet accessible server, LAN only or even through a VPN).

First I made a script to fetch the blacklisted domains used by AdAway and generate a zone file usable by Bind.

{% gist m-rousse/e126f628f3f8994ef515079d8426965a %}

It generates a big `blacklisted.zones` file with for each domain an entry like so : 

```
...
zone "ad.domain.com" {type master; allow-update{ key "rdnc-key"; }; file "/var/named/sinkhole.zone";};
...
```

You can include directely this file in Bind :

```
check-names master ignore;
check-names slave  ignore;

include "/path/to/blacklisted.zones";
```

To finish, you need the `sinkhole.zone` file that resolves the domain to `localhost`.

```
$TTL 86400
@       IN SOA server.domain.name. hostmaster.domain.name. (2016121219 86400 3600 3600000 300)
@       IN NS     domain.name.
@               A       127.0.0.1
*       IN      A       127.0.0.1
@               AAAA    ::1
*       IN      AAAA    ::1
```

That's it ! Now, advertisements do not load and I can peacefully look at kittens online without most ads !

Note : Another project already addressed this issue (using DNSMasq, LightHTTPd and a Raspberry Pi) : [Pi-Hole](https://pi-hole.net/)

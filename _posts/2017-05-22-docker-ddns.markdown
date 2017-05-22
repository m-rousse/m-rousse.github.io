---
layout: post
title:  "Dynamic DNS with docker"
date:   2017-05-22 21:32:32 +0200
categories: sysadmin
excerpt: Dynamically update DNS zone to give domain name to new Dockers.
---

I've been fiddling with dockers lately and have become a little lazy about the IP addresses of the containers. As lazy as the programmer that I am, I decided to configure DDNS with Bind.

This way, I could simply reach out `container.sea` instead of `172.17.0.22`.

<!---excerpt-break-->

To make it work I used the [docker Python bindings](https://docker-py.readthedocs.io/en/stable/). The script listens to events and when a container is started, it adds its address to the DNS server using the `dnspython` module.

First thing first, we need to install the docker and dns python modules :

```
pip install docker dnspython
```

Then we can listen on docker events using this snippet :

```
import docker
client = docker.DockerClient(base_url='unix://var/run/docker.sock')
for event in client.events():
    print(event)
```

If you start/stop a container you should see events appear !

To dynamically update a DNS zone, you have to configure Bind to allow DDNS, Julien Valroff wrote a good article about this on [his blog](https://www.kirya.net/articles/running-a-secure-ddns-service-with-bind/).

Then you can use this snippet to update a zone :

<div><pre class="language-python line-numbers">
<code class="language-python">
import dns.query
import dns.tsigkeyring
import dns.update
import sys

keyring = dns.tsigkeyring.from_text({
    'sea.' : 'XXXXXXXXXXXXXXXXXXXXXX=='
})

update = dns.update.Update('container.sea', keyring=keyring)
update.replace('container', 300, 'a', "172.17.0.22")

response = dns.query.tcp(update, '10.0.0.1')
</code></pre></div>

With this code, I put together this little script that creates my domain names as I start/stop my containers :

{% gist m-rousse/b98363fd3370e33a253d11a64e4de92a %}

Feel free to contact me if you want any more explanations or have a suggestion :)

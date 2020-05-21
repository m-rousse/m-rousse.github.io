---
layout: post
title:  "Install a wireguard pod on kubernetes"
date:   2020-05-21 11:27:32 +0200
categories: sysadmin
excerpt: How to build a docker image compatible with kubernetes CoreOS to host a wireguard service.
---

I used to have an OpenVPN network to connect to machines I could not/did not want to expose to internet, each new computer I wanted to connect was a matter of generating new RSA keys/certs, it was efficient and usable but a bit tedious to configure at times (the documentation is pretty well built so I found the answers to all my questions pretty often). I discovered [wireguard](https://www.wireguard.com/) and decided to give it a try. This post is mostly to store the commands and configuration I used to get it working in a kubernetes environment.

<!---excerpt-break-->
# Wireguard image for Kubernetes running under CoreOS

## Preface

I wanted to make this post for a long time and have been using OVH K8S + wireguard for about a year now. The process I used to compile the module might not be absolutely up to date, for starters, it does not seem OVH uses CoreOS for its kubernetes services anymore, but an image based off Ubuntu. 
Do not hesitate to reach out if you have questions!

## Context

I host my services using a [managed Kubernetes cluster provided by OVH](https://www.ovhcloud.com/en-gb/public-cloud/kubernetes/). As wireguard works as a kernel module, it is necessary to have both the module and the permission to insert it in the runnign kernel.

## The module

OVH uses coreOS to run their kubernetes clusters, so we need to build the module for this particular CoreOS version (ie. with the correct kernel version). Hopefully [a coreos dev container](https://github.com/BugRoger/coreos-developer-docker) exists.

### Get kernel version and configuration

I used the following configuration to get a pod up and running with an access to the host, allowing us to get both the kernel version used and its configuration:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: toolbox-temporary-pod
  labels:
    app: toolbox
spec:
  containers:
  - name: toolbox
    image: debian:buster
    command: ['sh', '-c', '(while true; do sleep 1000; done)']
```

Apply this configuration and get a shell to the container:

```bash
kubectl apply -f temporary-pod.yml
kubectl exec -it toolbox-temporary-pod -- uname -a
kubectl cp toolbox-temporary-pod:/proc/config.gz config.gz
```

From this command we got the version of the kernel (`4.14.96`) and the `config.gz` file of this kernel.

Then this pod can be destroyed: `kubectl delete pod toolbox-temporary-pod`.

### Build the module

From the kernel version it is possible to deduct the CoreOS version by searching for it in the [release page](https://coreos.com/releases/). In my case it is version `1967.6.0`.

I used [the dockerfile](https://github.com/BugRoger/coreos-developer-docker#usage-in-docker) provided by BugRoger in the repo and adapted it a bit to fit with wireguard module..

```dockerfile
ARG COREOS_VERSION=1967.6.0
FROM bugroger/coreos-developer:${COREOS_VERSION} as BUILD

ENV WIREGUARD_VERSION=0.0.20180918

RUN emerge-gitclone
RUN emerge -gKv coreos-sources
COPY config.gz /root/config.gz
RUN gzip -cd /root/config.gz > /usr/src/linux/.config
RUN make -C /usr/src/linux modules_prepare

RUN export filename=WireGuard-${WIREGUARD_VERSION} && \
  wget https://git.zx2c4.com/WireGuard/snapshot/$filename.tar.xz && \
  tar xf $filename.tar.xz && \
  KERNELDIR=/lib/modules/4.14.96-coreos-r1/build make -C /$filename/src && \
  mkdir /build && \
  cp /$filename/src/wireguard.ko /build && \
  cp /$filename/src/tools/wg /build

FROM debian:buster-slim
RUN mkdir -p /opt/wireguard && \
  apt update && \
  apt install -yq iproute2 kmod
COPY --from=BUILD /build /opt/wireguard
COPY entrypoint.sh /entrypoint.sh
EXPOSE 5555
ENTRYPOINT /entrypoint.sh
CMD ['/bin/sh']
```

When building this image, the module gets built and passed to the wireguard image which is then ready to be started.

## The wireguard container

As you can see the the previous dockerfile definition, I added an `entrypoint.sh` file to start the wireguard container properly.

This script will load the kernel module if it is not already loaded and configure the firewall/networking:

```bash
#!/bin/sh

if lsmod | grep "wireguard" &> /dev/null ; then
  echo "Module already loaded"
else
  insmod /opt/wireguard/wireguard.ko
fi

apt install -yq procps iptables
ip link add dev wg0 type wireguard
ip address add dev wg0 10.0.0.1/24
/opt/wireguard/wg setconf wg0 /etc/wireguard.conf
ip l set dev wg0 up
sysctl net.ipv4.ip_forward=1
iptables -A FORWARD -i wg0 -j ACCEPT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
```

Last but not least, the kubernetes deployment to run this server. As the container must be able to load a module in the kernel the `SYS_MODULE` capability is needed and to be able to set a firewall up using iptables, the `NET_ADMIN` capability is needed.

At the time of this post, OVH does not support UDP load balancers so I had to use a NodePort to expose this service (to ease configuration of clients, I used a domain name to redirect to the host, so when rotating the Node I only needed to update the DNS).

The configmap was used to ease updating the config to add more clients, instead of having it a temporary file in the container or a file built in the image.

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wireguard
  labels:
    app: wireguard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wireguard
  template:
    metadata:
      labels:
        app: wireguard
    spec:
      containers:
      - name: wireguard
        image: my-custom-registry/wireguard:latest
        securityContext:
          capabilities:
            add:
              - NET_ADMIN
              - SYS_MODULE
          privileged: true
        volumeMounts:
          - name: configuration
            mountPath: /etc/wireguard.conf
            subPath: wireguard.conf
        ports:
        - containerPort: 5555
          protocol: UDP
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
      imagePullSecrets:
      - name: regcred
      volumes:
        - name: configuration
          configMap:
            name: wireguard-config
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: wireguard
  name: wireguard
  namespace: default
spec:
  type: NodePort
  ports:
  - port: 5555
    nodePort: 32766
    protocol: UDP
    targetPort: 5555
  selector:
    app: wireguard
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
  name: wireguard-config
  namespace: default
data:
  wireguard.conf: |
    [Interface]
    PrivateKey = PrIvAtE/KeY+SeRvEr==
    ListenPort = 5555

    [Peer]
    PublicKey = PuBlIc/KeY+ClIeNt1==
    AllowedIPs = 10.0.0.2/32

    [Peer]
    PublicKey = PuBlIc/KeY+ClIeNt2==
    AllowedIPs = 10.0.0.3/32

```

---
layout: post
title:  "Server custom archlinux systems over PXE with a Mac OS"
date:   2020-05-21 22:24:32 +0200
categories: sysadmin
excerpt: Build custom Archlinux systems and boot them over PXE without DHCP nor NFS using a Mac OS X host.
---

I already wrote on the subject of booting an archlinux system over PXE (in [this post](https://math.rousse.me/sysadmin/2016/05/08/linux-on-ram-via-pxe.html)) but wanted to have a slightly more flexible setup. With this previous solution, I used a ISC-DHCP server, a NFS server and a TFTP server. This supposes I have control over the DHCP server of the network and a machine I could start a DHCP, NFS and a TFTP server.
Unfortunately, today I could not host a NFS server on the machine I wanted to use as a server (a Macbook). Also I wished to host most of this setup with Docker - unfortunately (bis) not all of it could fit on Docker.

<!---excerpt-break-->
# Build Archlinux image

https://github.com/m-rousse/arch-pxe
https://github.com/m-rousse/archiso from https://git.archlinux.org/archiso.git

```bash
echo 'Server = http://paccache:8080/$repo/os/$arch' > /etc/pacman.d/mirrorlist
make -C /build/ install
/usr/share/archiso/configs/mrousse/build.sh -V mrousse-build -v
mkdir /archiso_dump
mount out/archlinux-mrousse-build-x86_64.iso /archiso_dump
cp /archiso_dump/ /out/ -r
```

In docker compose, privileged needed to be allowed to mount ISO.

Custom packages: https://github.com/m-rousse/archiso/blob/b4c5b566d26b2171ebc9143c11c9c0f8a01f7fee/configs/mrousse/packages.x86_64

# DHCP + TFTP

[Pixiecore](https://github.com/danderson/netboot/tree/master/pixiecore)

```bash
go get go.universe.tf/netboot/cmd/pixiecore
```

Does not work in docker as networking in docker is bridged, even if `host` it has the IP/network of the VM, DHCP packets do not contain the right informations (we would need a "smart" NAT).

```bash
sudo pixiecore boot out/archiso_dump/arch/boot/x86_64/vmlinuz out/archiso_dump/arch/boot/x86_64/archiso.img -d --cmdline "ip=dhcp archiso_http_srv=http://192.168.0.52:8000/ copytoram cow_spacesize=2G"
```

# HTTP server

```bash
cd out/archiso_dump
python -m SimpleHTTPServer
```

# Bonus: AUR packages

```bash
cd archiso/work/custompkgs
docker run --rm -it --name aurbuilder -v `pwd`:/custom archlinux bash

# In the container
cd /root
echo 'Server = http://cache:8080/$repo/os/$arch' > /etc/pacman.d/mirrorlist
pacman -Sy
pacman --noconfirm -S base-devel sudo vim git
# Also add user to sudoers
useradd -m -G wheel build

su build
cd /tmp
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
exit

cd /custom
repo-add custom.db.tar.gz yay-9.4.7-1-x86_64.pkg.tar.xz
```

# Bonus: Pacman Cache

https://github.com/okamidash/paccache/pull/2

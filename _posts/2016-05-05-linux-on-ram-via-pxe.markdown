---
layout: post
title:  "Archlinux on RAM via PXE"
date:   2016-05-08 16:11:09 +0200
categories: sysadmin
excerpt: How to set up a server to deliver PXE boot and a full RAM client to automate actions on a network.
---

Having a room filled with computers able to boot over PXE, either a classroom or a LAN Party during sleeptime, or having a computer bios locked but with PXE before the hard drive, gave me the desire to design a computer to quickly boot on a system and perform all kind of operations I needed.

So came the idea of setting up a server to boot on an already installed OS, and this OS to be a Archlinux easily updateable (so not a liveCD).

This could be useful in order to boot quickly a cluster, automate tasks (retrieve the SAM/shadow file of a computer, install an OS, ...) and/or for trolling.

<!---excerpt-break-->
The work has been divided in three steps :

- Install a server with DHCP-PXE/TFTP/NFS
- Install the guest system and adapt it to run from RAM
- Optionally setting up a iPXE usb stick for computers without PXE support

## The server

At first, I installed a server with Archlinux using the basic install.txt you find when using the install CD. (You can find more instructions on the Wiki : [Installation Guide](https://wiki.archlinux.org/index.php/Installation_guide).

We need a TFTP server to deliver the bootfiles, I used [tftp-hpa](https://www.archlinux.org/packages/?name=tftp-hpa). The configuration is at `/etc/conf.d/tftpd` where you can set the root, which I set to `/` in order to test between different OSes without having to reboot `tftp-hpa` (It would having smarter to create a `/srv/pxe` folder with all my OSes inside).

I tried using [Dnsmasq](https://wiki.archlinux.org/index.php/dnsmasq) but as I am more used to [dhcpd](https://wiki.archlinux.org/index.php/Dhcpd) I switched back to dhcpd.

We would like dhcpd to offer IP that are not in the current subnet, I chose 10.239.0.0/24 as it was not used in my network.

<div><pre class="command-line" data-user="mr" data-host="server" data-output="">
<code class="language-bash">pacman -S dhcp
vim /etc/dhcpd.conf</code></pre></div>

The config file looks like this in my case :

<div><pre class="language-julia"><code class="language-julia">option domain-name "pxe";
option domain-name-servers 8.8.8.8, 8.8.4.4;
default-lease-time 600;
max-lease-time 7200;
log-facility local7;
authoritative;

subnet 10.239.0.0 netmask 255.255.255.0 {
}
host raminux {
   hardware ethernet 00:11:22:33:44:55;
   fixed-address 10.239.0.3;
   filename "/pxeroot/boot/grub/i386-pc/core.0";
   option routers 10.239.0.1;
}
host raminuxnopxe {
   hardware ethernet 00:11:d8:c8:6e:d0;
   fixed-address 10.239.0.2;
   filename "http://10.239.0.1/pxeroot32/bootNFS.ipxe";
   option routers 10.239.0.1;
}
</code></pre></div>

The 10.239.0.0/24 subnet is empty so it does not provide IP to any computer of the network and then the hosts are there so I can specify for which mac address I wish to deliver PXE boot.

For Raminux I provide the core.0 file that I built with grub later on this article. For RaminuxNoPXE I provide a script file that iPXE will interpret.

At this point computers can boot, request an IP and download the bootfile.

My goal is to transfer the whole system file by file (so not compressed), TFTP is not really suited for this so I chose to install a NFS server.

<div><pre class="command-line" data-user="mr" data-host="server" data-output="">
<code class="language-bash">pacman -S nfs-utils
echo "/pxeroot   *(rw,fsid=0,no_root_squash,no_subtree_check)" > /etc/exports
echo "/pxeroot32 *(rw,fsid=1,no_root_squash,no_subtree_check)" >> /etc/exports
exportfs -arv
systemctl start nfs-idmapd
systemctl start nfs-mountd</code></pre></div><!--*-->

The OS folders are `/pxeroot` for the 64-bits version and `/pxeroot32` for the 32-bits version of the OS.

## The guests

Archlinux offers some scripts (like `pacstrap` and `arch-chroot`) to install a new Arch, so we need to install those scripts then we can install Archlinux to `/pxeroot32` for the 32-bits version.

**BEWARE : You can install a 32-bits Archlinux only from a 32-bits host and same for 64-bits. If you want to install the 64-bits package from a 32-bits host a solution is to boot from an Archlinux live CD and choose the x86_64 kernel then mount the drive where /pxeroot resides and install the OS in it.**

<div><pre class="command-line" data-user="mr" data-host="server" data-output="">
<code class="language-bash">pacman -S arch-install-scripts
mkdir /pxeroot32
pacstrap -d /pxeroot32 base vim openssh mkinitcpio-nfs-utils nfs-utils</code></pre></div>

Now that we have the base of a working system, we will generate its Initial RAM File System (initramfs).

*The initial ramdisk is in essence a very small environment (early userspace) which loads various kernel modules and sets up necessary things before handing over control to init. This makes it possible to have, for example, encrypted root file systems and root file systems on a software RAID array.*

Archlinux uses `mkinitcpio`, a script to forge the `initramfs.img` according to a configuration file which allows us to easily add modules or scripts.

The initramfs will execute a script named `init`, which mounts the root filesystem and make it the new root of the system before executing the init process (which then starts the system).

We want the system to be stored in RAM so we have to change the init script. It is located at `/usr/lib/initcpio/init`.

Here is the diff of the changes I made. Most of the modifications here are inspired from [this thread](https://bbs.archlinux.org/viewtopic.php?pid=1215085) of the Archlinux Forum with a few adjustments.

<div><pre class="language-bash">
<code class="language-bash">49a50,55
> echo -e "Moving nfs root to /pxe_root"
> mkdir /pxe_root
> mount --move /new_root /pxe_root
> echo -e "Switching / to tmpfs..."
> mount -t tmpfs tmpfs /new_root -o size=80%
>
51a58,85
>
> # Stop udevd if is running
> if [ "${udevd_running}" -eq 1 ]; then
>     udevadm control --exit
>     udevadm info --cleanup-db
> fi
>
> if [ "${break}" = "precopy" ]; then
>     echo ":: Pre-copy break requested, type 'exit' to resume operation"
>     launch_interactive_shell
> fi
>
> # Copy root
> echo -e "Copying root..."
> for i in $(ls -a /pxe_root); do
>       echo "Current copy : $i"
>       case "$i" in
>       .|..)   ;;
>       mnt)    mkdir /new_root/mnt;;
>       proc)   mkdir /new_root/proc;;
>       sys)    mkdir /new_root/sys;;
>       dev)    mkdir /new_root/dev;;
>       run)    mkdir /new_root/run;;
>       boot)   mkdir /new-root/boot;;
>       new_root)       ;;
>       *)              cp -a /pxe_root/$i /new_root
>       esac
> done</code></pre></div><!--*-->

Then we have to load the `net` module so we can connect to NFS share. We just need to add the module to the `MODULE="..."` variable of `/etc/mkinitcpio.conf`. Here is what my mkinitcpio conf looks like :

<div><pre class="language-bash">
<code class="language-bash">MODULES=""
BINARIES=""
FILES=""
HOOKS="base udev net autodetect modconf block filesystems keyboard fsck"</code></pre></div>

We simply need to build the init RAM filesystem and configure grub and our system should work.

<div><pre class="command-line" data-user="mr" data-host="server" data-output="">
<code class="language-bash">arch-chroot /pxeroot32 mkinitcpio -p linux
arch-chroot /pxeroot32 pacman -Sy grub
arch-chroot /pxeroot32 grub-mknetdir --net-directory=/boot --subdir=grub</code></pre></div>

We built the initramfs and the grub image, we configured our DHCP to load the correct grub `core.0` file. Our system is ready to rock !

## Optional : iPXE

Once I finished this setup and successfully tested it in virtual environment, I tried it on an old computer which turned out to not have PXE support. [iPXE](http://ipxe.org/) is a solution for that kind of problems and allows us to create a bootable usb stick capable of loading a PXE configuration and boot from it.

To use iPXE, we have to download the sources and build them :

<div><pre class="command-line" data-user="mr" data-host="server" data-output="">
<code class="language-bash">git clone git://git.ipxe.org/ipxe.git
cd ipxe/src
echo "#!ipxe" > chooseServer.ipxe
echo "set dhcp-server 10.239.0.1" >> chooseServer.ipxe
echo "autoboot" >> chooseServer.ipxe
make bin/ipxe.usb EMBED=chooseServer.ipxe
dd if=bin/ipxe.usb of=/dev/sdX</code></pre></div>

I created a [script](http://ipxe.org/scripting) in order to force the dhcp-server used (they are multiple DHCP servers on this subnet). You could here specify an IP configuration or a script to fetch via HTTP (this way you can change easily the script iPXE executes at boot).

## Resources

Useful resources I used to achieve this project :

- <http://spblinux.de/2.0/doc/cp.html>
- <https://wiki.archlinux.org/index.php/mkinitcpio#Using_net>
- <http://www.vidarholen.net/contents/blog/?tag=initramfs>
- <https://bbs.archlinux.org/viewtopic.php?pid=1397136#p1397136>
- <https://bbs.archlinux.org/viewtopic.php?pid=1215085>
- <https://github.com/openSUSE/kiwi/wiki/Setup-PXE-boot-with-EFI-Using-GRUB2>

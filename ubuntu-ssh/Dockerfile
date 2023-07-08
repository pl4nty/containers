FROM ubuntu:22.04

RUN apt-get update 
RUN apt-get -y install openssh-server iputils-ping traceroute iproute2

RUN useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1001 ubuntu -p "$(openssl passwd -6 ubuntu)"
RUN service ssh restart

USER ubuntu
RUN ssh-keygen -A

USER root

CMD ["/usr/sbin/sshd","-D","-p 2222"]
EXPOSE 2222

FROM ubuntu:26.04@sha256:c098726dd9b9733f3e885f8de0ef375206a311b0a317eadc40d347b1115fb944

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    openssh-server \
    iputils-ping \
    traceroute \
    iproute2

RUN service ssh restart

USER ubuntu
RUN ssh-keygen -A

USER root

CMD ["/usr/sbin/sshd","-D","-p 2222"]
EXPOSE 2222

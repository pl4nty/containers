FROM ubuntu:24.04@sha256:534baea6a22c03a63003dbc8dbe78fe34bc0d7e595d9a9dc9834884ff530eb55

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

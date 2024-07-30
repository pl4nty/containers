FROM kasmweb/kali-rolling-desktop:1.15.0-rolling as base

USER root
# RUN sed -ie 's/kali-rolling/kali-last-snapshot/g' /etc/apt/sources.list
# remove desktop background, might improve performance# /tmp/dbus-KA37XaRP1n
# RUN xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/image-style -s 0
# RUN sed -ie 's/(image-style.*)5/\\10/' /etc/xdg/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml
RUN echo 'kasm-user ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

FROM base as linux-amd64

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    sudo \
    kali-linux-default \
    torbrowser-launcher \
    # RSACTFTool
    libgmp3-dev libmpc-dev \
    # pwntools
    python3 python3-pip python3-dev git libssl-dev libffi-dev build-essential \
    autopsy \
    ghidra \
    burpsuite \
    steghide \
    radare2 \
    hashcat \
    binwalk \
    wireshark \
    gdb gdb-peda \
    libimage-exiftool-perl \
    ltrace \
    gimp \
    audacity \
    qsstv \
    strace \
    gfortran \
    qemu-system-x86 \
    jq

RUN wget https://github.com/pwndbg/pwndbg/releases/download/2024.02.14/pwndbg_2024.02.14_amd64.deb && \
    apt-get install -y ./pwndbg_2024.02.14_amd64.deb && \
    rm pwndbg_2024.02.14_amd64.deb

RUN gem install zsteg

USER kasm-user

RUN git clone https://github.com/RsaCtfTool/RsaCtfTool.git && \
    cd RsaCtfTool && \
    pip3 install -r requirements.txt

RUN python3 -m pip install --upgrade pwntools pypykatz

RUN wget http://www.caesum.com/handbook/Stegsolve.jar -O stegsolve.jar && \
    chmod +x stegsolve.jar

RUN wget https://github.com/volatilityfoundation/volatility/releases/download/2.6.1/volatility_2.6_lin64_standalone.zip && \
    unzip volatility_2.6_lin64_standalone.zip volatility_2.6_lin64_standalone/volatility_2.6_lin64_standalone && \
    mv volatility_2.6_lin64_standalone/volatility_2.6_lin64_standalone vol.py && \
    chmod +x vol.py && \
    rm -r volatility_2.6_lin64_standalone && rm volatility_2.6_lin64_standalone.zip

# RUN wget https://github.com/volatilityfoundation/volatility3/releases/download/v2.5.0/volatility3-2.5.0-py3-none-any.whl && \
#     pip install volatility3-2.5.0-py3-none-any.whl

RUN wget https://github.com/icsharpcode/AvaloniaILSpy/releases/download/v7.2-rc/Linux.x64.Release.zip && \
    unzip Linux.x64.Release.zip && unzip ILSpy-linux-x64-Release.zip -d AvaloniaILSpy && \
    rm Linux.x64.Release.zip ILSpy-linux-x64-Release.zip

FROM base as linux-arm64

RUN wget https://github.com/icsharpcode/AvaloniaILSpy/releases/download/v7.2-rc/Linux.arm64.Release.zip && \
    unzip Linux.arm64.Release.zip && unzip ILSpy-linux-arm64-Release.zip -d AvaloniaILSpy && \
    rm Linux.arm64.Release.zip ILSpy-linux-arm64-Release.zip

ARG TARGETOS TARGETARCH
FROM ${TARGETOS}-${TARGETARCH}

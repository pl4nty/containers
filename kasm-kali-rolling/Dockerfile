FROM kasmweb/kali-rolling-desktop:1.13.1
USER root

RUN sed -ie 's/kali-rolling/kali-last-snapshot/g' /etc/apt/sources.list

# remove desktop background, might improve performance# /tmp/dbus-KA37XaRP1n
# RUN xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/image-style -s 0
RUN sed -ie 's/(image-style.*)5/\\10/' /etc/xdg/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    torbrowser-launcher=0.3.6-2

USER kasm-user

RUN wget https://github.com/volatilityfoundation/volatility3/releases/download/v2.4.1/volatility3-2.4.1-py3-none-any.whl && \
    pip install volatility3-2.4.1-py3-none-any.whl

RUN wget https://github.com/icsharpcode/AvaloniaILSpy/releases/download/v7.2-rc/Linux.x64.Release.zip && \
    unzip Linux.x64.Release.zip && unzip ILSpy-linux-x64-Release.zip -d AvaloniaILSpy && \
    rm Linux.x64.Release.zip ILSpy-linux-x64-Release.zip

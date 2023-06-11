# mount mdm.xml to /var/lib/cloudflare-warp/mdm.xml
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y wget libdbus-1-3 nftables gnupg2 desktop-file-utils libcap2-bin libnss3-tools lsof
RUN wget https://pkg.cloudflareclient.com/uploads/cloudflare_warp_2023_3_398_1_amd64_ddd2a223f7.deb \
&& dpkg -i cloudflare_warp_2023_3_398_1_amd64_ddd2a223f7.deb && rm cloudflare_warp_2023_3_398_1_amd64_ddd2a223f7.deb

ENTRYPOINT [ "/bin/warp-svc" ]

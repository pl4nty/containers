FROM quay.io/curl/curl:8.10.0 AS plugins

RUN mkdir /tmp/plugins
RUN curl -L https://github.com/CTFd/public_challenges/archive/36667c9f0dffc37e42a1cd3df874daf762425d1e.tar.gz | tar xz -C /tmp/plugins
RUN curl -L https://github.com/SunshineCTF/CTFd-scores-ctftime/archive/4b9eaf8f96041980b27625e1deb0725281d9d864.tar.gz | tar xz -C /tmp/plugins
# requires DISCORD_WEBHOOK_URL: https://github.com/sigpwny/ctfd-discord-webhook-plugin/blob/master/config.py
RUN curl -L https://github.com/sigpwny/ctfd-discord-webhook-plugin/archive/c8fac3f999c3028e178de0b376e1981dea7db370.tar.gz | tar xz -C /tmp/plugins
# TODO implement users mode and fix any bugs with latest CTFd version
# RUN curl -L https://github.com/pl4nty/CTFd_Split_Scoreboard/archive/master.tar.gz | tar xz -C /tmp/plugins

FROM ghcr.io/ctfd/ctfd:3.7.3

COPY --from=plugins /tmp/plugins CTFd/plugins
RUN for d in CTFd/plugins/*; do \
  if [ -f "$d/requirements.txt" ]; then \
    pip install --no-cache-dir -r "$d/requirements.txt";\
  fi; \
done;

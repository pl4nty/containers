FROM python:3.9.18-slim

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y git git-lfs

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install git+https://github.com/josegonzalez/python-github-backup.git#egg=github-backup

ENTRYPOINT [ "github-backup" ]

#!/bin/bash

crontab /root/certwatch/jobs/crontab
/usr/local/bin/docker-entrypoint.sh postgres

#!/bin/bash

# create file: /etc/systemd/system/gateio.service
# with content:

# [Unit]
# Description=Gate.io - Node.js Express Http WebSocket Socket.io Server
#
# [Service]
# PIDFile=/tmp/gate-io-99.pid
# User=root
# Group=root
# Restart=always
# KillSignal=SIGQUIT
# WorkingDirectory=/srv/gate.io/
# ExecStart=/srv/gate.io/start.sh
#
# [Install]
# WantedBy=multi-user.target

# sudo systemctl enable gateio.service

# For real time logs
# sudo journalctl -fu gateio.service

# sudo systemctl start gateio.service
# sudo systemctl stop gateio.service
# sudo systemctl restart gateio.service

npm start >> gate.io.log

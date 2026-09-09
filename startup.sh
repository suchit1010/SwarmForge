#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &

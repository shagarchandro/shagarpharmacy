#!/bin/sh
cd "$(dirname "$0")" && exec node --no-warnings --experimental-sqlite server/server.js

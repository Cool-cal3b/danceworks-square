#!/bin/sh
set -e

echo "Running item-refresher test..."
node dist/test-runner.js

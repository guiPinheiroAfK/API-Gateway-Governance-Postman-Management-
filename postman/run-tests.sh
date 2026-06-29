#!/usr/bin/env bash
set -euo pipefail
mkdir -p postman/reports
newman run postman/collection.json -e postman/environment.json --reporters cli,json --reporter-json-export "postman/reports/results-$(date +%Y%m%dT%H%M%S).json" --color on --timeout-request 10000 --delay-request 150

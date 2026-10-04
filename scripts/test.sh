#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/../backend"
[ -d ../.venv ] && . ../.venv/bin/activate
python -m unittest discover -s tests -t . -v

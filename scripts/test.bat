@echo off
cd /d "%~dp0\..\backend"
if exist ..\.venv call ..\.venv\Scripts\activate
python -m unittest discover -s tests -t . -v

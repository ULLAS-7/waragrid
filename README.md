# WaraGrid prototype (Team OUT OF BOUNDS)

Local, free demo of the loop on slide 3: need, turn, call, flatten, verify.
Stack: Python 3.10+, Flask, NumPy, SciPy; plain HTML, CSS and ES modules for the dashboard. No database, no keys, no build step.

## Run (about two minutes)
1. Open this folder in VS Code and open a terminal.
2. Windows: `scripts\start.bat`   macOS/Linux: `sh scripts/start.sh`
3. Open http://127.0.0.1:8000. F5 in VS Code debugs `backend/run.py`.
Tests: `scripts\test.bat` or `sh scripts/test.sh` (also in VS Code's Testing panel).

## Tree
```
waragrid/
├── backend/
│   ├── run.py
│   ├── requirements.txt
│   ├── waragrid/
│   │   ├── config.py, scenarios.py
│   │   ├── api/        routes.py, validation.py
│   │   ├── core/       pumps, need, scheduler, compliance, kpi, metering, impact, simulator, montecarlo, verify, sensitivity, swaps
│   │   └── services/   voice.py
│   └── tests/          test_core.py, test_api.py
├── frontend/
│   ├── index.html
│   ├── css/            tokens.css, app.css, shell.css
│   └── js/             main, api, state, router, charts, charts_extra, panels, views, voice
├── docs/               ARCHITECTURE.md, ASSUMPTIONS.md
├── scripts/            start / test for Windows and macOS/Linux
└── .vscode/            launch.json, settings.json
```

## 60-second demo
Let the morning play. Drag "Farmers who follow their turn" to 50% and watch the decoder error rise. Tick the solar option. Pick Punjabi or Hindi and press "Hear it". Change head and efficiency and read the water figure.

## v0.3 tour
Overview: presets (Heatwave, Low compliance, Solar-aligned), hover any load chart, 90% ranges from 24 simulated mornings, CSV export, Print brief. Farmers: the call in four languages and "Press 2 to swap". Verify: a control feeder recovers a planted saving that before/after misses, and a tornado shows which assumption matters. Assumptions: the live register. Space replays the morning; links are shareable.

## Real vs mocked
Real: scheduler, compliance model, decoder, impact maths. Mocked: telephony and WhatsApp (browser speech), feeder and weather data (synthetic), farmer behaviour (a probability). The decoder is validated at transformer scale only. Take slide 8 numbers from your own runs and keep the "simulation" footer. The hi/pa/mr scripts need a native speaker's proofread.

## Before you submit code
The hackathon T&C require original work and ban unauthorized AI-generated code. This scaffold was drafted with an AI assistant: read it, rewrite it in your own style, and ask the organizers (YuvaYodhaTechHackathon@se.com) in writing what AI help is allowed.

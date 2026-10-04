"""JSON API. See docs/ARCHITECTURE.md for the endpoint table."""
import csv
import io
import time
from functools import lru_cache

from flask import Blueprint, Response, g, jsonify, request

from .. import FRONTEND, __version__
from ..config import BOUNDS, DEFAULTS, LANGS, hm
from ..core import montecarlo, sensitivity, verify
from ..core.simulator import plan, run
from ..core.swaps import partners, swap
from ..scenarios import PRESETS, WEATHER
from .validation import number, pair, parse

bp = Blueprint("api", __name__, url_prefix="/api")
BOOT = time.time()
RUN_KEYS = ("n", "q", "capf", "solar", "dt", "save", "head", "eff", "rs", "ef", "seed", "weather")
MC_KEYS = ("n", "q", "capf", "solar", "weather", "head", "eff", "seed")
PLAN_KEYS = ("seed", "n", "q", "capf", "solar", "weather", "head", "eff")
IMPACT_KEYS = ("n", "save", "head", "eff", "rs", "ef")
METRICS = ("saved_mwh", "water_m3", "co2_t", "payout_rs")


def pick(p, names):
    return tuple((k, p[k]) for k in names)


@lru_cache(maxsize=256)
def cached_run(key):          # identical scenarios are answered instantly
    return run(**dict(key))


@lru_cache(maxsize=256)
def cached_mc(key):
    return montecarlo.intervals(**dict(key))


@bp.before_request
def start_timer():
    g.t0 = time.perf_counter()


@bp.after_request
def timing(resp):
    resp.headers["Server-Timing"] = f"app;dur={(time.perf_counter() - g.t0) * 1000:.1f}"
    return resp


@bp.get("/health")
def health():
    return jsonify(status="ok", version=__version__, uptime_s=round(time.time() - BOOT), cached_runs=cached_run.cache_info().currsize)


@bp.get("/meta")
def meta():
    """Defaults, bounds, languages, weather days and presets, so the UI never hard-codes them."""
    return jsonify(defaults={**DEFAULTS, "weather": "normal"}, bounds={k: v[:2] for k, v in BOUNDS.items()},
                   languages=LANGS, weather=WEATHER, presets=PRESETS)


@bp.get("/run")
def simulate():
    return jsonify(cached_run(pick(parse(request.args), RUN_KEYS)))


@bp.get("/montecarlo")
def monte_carlo():
    return jsonify(cached_mc(pick(parse(request.args), MC_KEYS)))


@bp.get("/verify")
def verification():
    p = parse(request.args)
    return jsonify(verify.did(p["n"], p["save"] / 100, number(request.args, "heat", 0, 20, 8) / 100, p["seed"]))


@bp.get("/sensitivity")
def tornado():
    p, metric = parse(request.args), request.args.get("metric", "water_m3")
    if metric not in METRICS:
        raise ValueError("metric must be one of " + ", ".join(METRICS))
    return jsonify(sensitivity.tornado(metric, **{k: p[k] for k in IMPACT_KEYS}))


@bp.get("/swap")
def swap_turns():
    p = parse(request.args)
    a, b = pair(request.args)
    day = plan(**{k: p[k] for k in PLAN_KEYS})
    return jsonify({**swap(day, a, b), "partners": partners(day, a)})


@bp.get("/export.csv")
def export_csv():
    out = cached_run(pick(parse(request.args), RUN_KEYS))
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["time", "today_kw", "waragrid_kw", "cap_kw", "today_pumps_running", "waragrid_pumps_running"])
    for i in range(40):
        writer.writerow([hm(i), out["base"]["load"][i], out["wara"]["load"][i], out["limit"][i],
                         out["base"]["running"][i], out["wara"]["running"][i]])
    return Response(buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=waragrid-feeder.csv"})


@bp.get("/assumptions")
def assumptions():
    """The assumption register as JSON; docs/ASSUMPTIONS.md stays the single source."""
    lines = (FRONTEND.parent / "docs" / "ASSUMPTIONS.md").read_text(encoding="utf-8").splitlines()
    rows = [[c.strip() for c in line.strip().strip("|").split("|")] for line in lines if line.startswith("|")]
    return jsonify(header=rows[0], rows=rows[2:])


@bp.route("/<path:rest>")
def unknown(rest):
    return jsonify(error=f"no such endpoint: /api/{rest}"), 404


@bp.errorhandler(ValueError)
def bad_request(err):
    return jsonify(error=str(err)), 400

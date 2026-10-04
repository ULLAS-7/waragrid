"""One simulated morning plus a few days of statistics, for a feeder under both regimes."""
import numpy as np

from ..config import W, hm
from ..scenarios import WEATHER
from ..services.voice import MockIVR, all_scripts, script
from .compliance import comply
from .impact import impact
from .kpi import kpi
from .metering import decode
from .need import pump_blocks
from .pumps import pumps, solar_shape
from .scheduler import baseline_starts, schedule, wara_starts

BANDS = [(0, 8), (8, 16), (16, 24), (24, 32), (32, 40)]  # two-hour bands from 08:00, for the fairness view


def start_bands(starts):
    return [int(((starts >= a) & (starts < b)).sum()) for a, b in BANDS]


def fleet(seed, n):
    rng = np.random.default_rng(seed)
    return rng, pumps(rng, n)


def one_day(rng, p, q, capf, solar, weather, head, eff):
    """NEED -> TURN -> CALL -> FLATTEN for one morning, under both regimes (same pumps, same hours)."""
    d = pump_blocks(rng, p, weather, head, eff)
    pd = p * (1 + 0.04 * rng.standard_normal(len(p)))        # day-to-day drift in each pump's draw
    cap = capf * (p * d).sum() / W * (solar_shape() if solar else np.ones(W))
    assigned = wara_starts(rng, d, p, cap)
    actual = {"base": baseline_starts(rng, d), "wara": comply(rng, assigned, d, q)}
    regimes = {}
    for name, s in actual.items():
        S = schedule(s, d)
        regimes[name] = dict(load=S @ pd, running=S.sum(1), starts=s, kpi=kpi(S @ pd, s, cap))
    return dict(p=p, d=d, assigned=assigned, actual=actual["wara"], cap=cap, regimes=regimes)


def plan(seed, n, q, capf, solar, weather, head, eff):
    """The first morning of run(), recomputed deterministically (used by the swap tool)."""
    rng, p = fleet(seed, n)
    return one_day(rng, p, q, capf, solar, weather, head, eff)


def run(n, q, capf, solar, dt, save, head, eff, rs, ef, seed, weather="normal", days=8):
    rng, p = fleet(seed, n)
    rows, first = {"base": [], "wara": []}, None
    for _ in range(days):
        day = one_day(rng, p, q, capf, solar, weather, head, eff)
        for name in rows:
            rows[name].append(day["regimes"][name]["kpi"])
        first = first or day
    mean = lambda items: {key: float(np.mean([r[key] for r in items])) for key in items[0]}
    out = {name: dict(kpi=mean(rows[name]), load=first["regimes"][name]["load"].round(1).tolist(),
                      running=first["regimes"][name]["running"].astype(int).tolist(),
                      bands=start_bands(first["regimes"][name]["starts"])) for name in rows}
    a, d = first["assigned"], first["d"]
    ivr = MockIVR()
    for i in range(n):                                       # queue one Hindi call per farmer (mock)
        ivr.send(f"farmer-{i + 1:03d}", script("hi", hm(a[i]), hm(a[i] + d[i])), "hi")
    out.update(
        n=n, weather=WEATHER[weather]["label"], pump_hours=float(d.mean() / 4),
        limit=first["cap"].round(1).tolist(), calls_queued=len(ivr.outbox),
        compliance=float(np.mean(a == first["actual"])),
        turns=[dict(id=f"F{i + 1:03d}", kw=round(float(p[i]), 1), start=hm(a[i]), end=hm(a[i] + d[i]),
                    msg=all_scripts(hm(a[i]), hm(a[i] + d[i]))) for i in range(12)],
        decode=decode(np.random.default_rng(seed + 1), dt, q, capf, 45),
        impact=impact(n, save, head, eff, rs, ef))
    return out

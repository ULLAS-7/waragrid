"""Monte Carlo: many mornings with different seeds, reported as 90% intervals for each headline KPI."""
import numpy as np

from .simulator import fleet, one_day


def intervals(n, q, capf, solar, weather, head, eff, seed, reps=24):
    rows = []
    for r in range(reps):
        rng, p = fleet(seed * 1000 + r, n)
        reg = one_day(rng, p, q, capf, solar, weather, head, eff)["regimes"]
        b, w = reg["base"]["kpi"], reg["wara"]["kpi"]
        rows.append(dict(peak=1 - w["peak"] / b["peak"], starts=1 - w["starts"] / b["starts"],
                         ramp=1 - w["ramp"] / b["ramp"], solar=w["solar"] - b["solar"]))
    out = {}
    for key in rows[0]:
        v = np.array([r[key] for r in rows]) * 100
        out[key] = dict(p5=float(np.percentile(v, 5)), p50=float(np.median(v)), p95=float(np.percentile(v, 95)))
    return dict(reps=reps, kpi=out)

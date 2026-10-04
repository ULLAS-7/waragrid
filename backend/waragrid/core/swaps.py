"""Press 2 to swap: two farmers exchange start times if the feeder stays under its cap."""
import numpy as np

from ..config import W, hm
from .scheduler import schedule


def partners(day, a, limit=12):
    """Farmers (of the first `limit`) that farmer a could swap with today."""
    return [f"F{j + 1:03d}" for j in range(limit) if j != a and swap(day, a, j)["ok"]]


def swap(day, a, b):
    s, d, p = day["assigned"], day["d"], day["p"]
    if a == b:
        raise ValueError("pick two different farmers")
    if not (0 <= a < len(s) and 0 <= b < len(s)):
        raise ValueError("farmer out of range")
    t = s.copy()
    t[a], t[b] = s[b], s[a]
    who = lambda i: dict(id=f"F{i + 1:03d}", start=hm(t[i]), end=hm(t[i] + d[i]))
    out = dict(a=who(a), b=who(b))
    if t[a] + d[a] > W or t[b] + d[b] > W:
        return dict(ok=False, reason="a turn would run past 18:00", **out)
    before, after = schedule(s, d) @ p, schedule(t, d) @ p
    worse = np.flatnonzero((after > day["cap"] + 1e-6) & (after > before + 1e-6))
    if len(worse):
        i = worse[0]
        return dict(ok=False, reason=f"feeder would exceed its cap at {hm(i)} by {after[i] - day['cap'][i]:.0f} kW", **out)
    return dict(ok=True, reason="feeder stays under its cap", peak_before=float(before.max()), peak_after=float(after.max()), **out)

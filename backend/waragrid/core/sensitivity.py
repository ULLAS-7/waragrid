"""One-at-a-time sensitivity: which assumption moves an impact number the most?"""
from .impact import impact

SWING = dict(save=0.35, head=0.30, eff=0.25, ef=0.08, rs=0.25)   # each input is varied alone by this fraction
LABELS = dict(save="Energy saved %", head="Pumping head m", eff="Pump efficiency", ef="Emission factor", rs="Payout Rs/kWh")


def tornado(metric, n, save, head, eff, rs, ef):
    now = dict(n=n, save=save, head=head, eff=eff, rs=rs, ef=ef)
    mid, rows = impact(**now)[metric], []
    for key, frac in SWING.items():
        lo, hi = now[key] * (1 - frac), now[key] * (1 + frac)
        a, b = impact(**{**now, key: lo})[metric], impact(**{**now, key: hi})[metric]
        if abs(b - a) > 1e-9:                                  # drop inputs this metric does not depend on
            rows.append(dict(key=key, label=f"{LABELS[key]} {lo:.3g}-{hi:.3g}", a=a, b=b))
    rows.sort(key=lambda r: -abs(r["b"] - r["a"]))
    return dict(metric=metric, mid=mid, rows=rows)

"""Feeder KPIs for one simulated day."""
import numpy as np
from ..config import W


def kpi(load, s, cap):
    return dict(peak=float(load.max()), ratio=float(load.max() / load.mean()),
                starts=float(np.bincount(s, minlength=W).max()), ramp=float(np.diff(np.r_[0, load]).max()),
                solar=float(load[8:28].sum() / load.sum()), over=float((load > cap + 1e-9).sum()))

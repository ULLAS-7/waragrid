"""Pooled metering: decode per-pump kW from a single transformer meter (stretch goal on slide 3)."""
import numpy as np
from scipy.optimize import nnls
from ..config import W
from .pumps import pumps
from .scheduler import wara_starts, schedule
from .compliance import comply


def decode(rng, m, q, capf, days):
    """Pooled metering: the randomised turns are a known signal, so one transformer meter can be unmixed into per-pump kW."""
    p, A, L = pumps(rng, m), [], []
    for _ in range(days):
        d = rng.integers(8, 17, m)
        pd = p * (1 + 0.04 * rng.standard_normal(m))
        sa = wara_starts(rng, d, p, capf * (p * d).sum() / W)
        true = schedule(comply(rng, sa, d, q), d) @ pd
        L.append(true * (1 + 0.02 * rng.standard_normal(W)) + 8 * m / 300 + 1.5 * np.sqrt(m / 300) * rng.standard_normal(W))
        A.append(schedule(sa, d))  # the decoder only knows the ASSIGNED turns
    A = np.vstack(A)
    est = nnls(np.hstack([A, np.ones((len(A), 1))]), np.concatenate(L), maxiter=20000)[0][:m]
    err = np.abs(est - p) / p
    return dict(true=p.round(2).tolist(), est=est.round(2).tolist(), median_err=float(np.median(err) * 100),
                dt_err=float(abs(est.sum() - p.sum()) / p.sum() * 100), pumps=m, days=days)

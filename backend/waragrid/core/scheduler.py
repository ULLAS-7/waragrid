"""Turn schedulers: uncoordinated baseline vs randomised, capacity-capped WaraGrid turns."""
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view as swv
from ..config import W


def baseline_starts(rng, d):  # most farmers switch on as soon as supply returns
    mx = W - d
    early = np.minimum(rng.exponential(2.0, len(d)).astype(int), mx)
    anywhere = (rng.random(len(d)) * (mx + 1)).astype(int)
    return np.where(rng.random(len(d)) < 0.6, early, anywhere)

def wara_starts(rng, d, p, cap):  # random start among the slots that keep the feeder under its cap
    load, s = np.zeros(W), np.empty(len(d), int)
    for i in rng.permutation(len(d)):
        room = swv(load - cap, d[i]).max(axis=1) + p[i]
        ok = np.flatnonzero(room <= 0)
        s[i] = rng.choice(ok) if len(ok) else int(np.argmin(room))
        load[s[i]:s[i] + d[i]] += p[i]
    return s

def schedule(s, d):
    S = np.zeros((W, len(d)))
    for i in range(len(d)):
        S[s[i]:s[i] + d[i], i] = 1
    return S

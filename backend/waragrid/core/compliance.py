"""Farmer compliance model: who follows the call and who drifts."""
import numpy as np
from ..config import W


def comply(rng, s, d, q):  # farmers who ignore the call drift up to 2.5 h from their turn
    off = rng.integers(-10, 11, len(d))
    return np.where(rng.random(len(d)) <= q, s, np.clip(s + off, 0, W - d))

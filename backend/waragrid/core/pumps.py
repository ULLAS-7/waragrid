"""Pump fleet and the solar-availability profile."""
import numpy as np
from ..config import W


def pumps(rng, n):  # rated draw in kW, median about 5 HP
    return np.clip(rng.lognormal(np.log(3.7), 0.35, n), 1.5, 11.0)

def solar_shape():  # relative solar availability across the window, mean 1
    x = 0.45 + 1.1 * np.sin(np.pi * (np.arange(W) + 0.5) / W) ** 1.5
    return x / x.mean()

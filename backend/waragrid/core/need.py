"""NEED engine (slide 3, step 1): crop water demand -> pump blocks. FAO-56 style, deliberately simple."""
import numpy as np

from ..scenarios import WEATHER

CROPS = {"paddy": 1.15, "wheat": 1.10, "maize": 1.20, "cotton": 1.15, "sugarcane": 1.25}  # mid-season crop coefficients (Kc)


def pump_blocks(rng, p, weather, head, eff):
    """15-minute pump blocks each farm needs today, clipped to 1-4 hours."""
    day, n = WEATHER[weather], len(p)
    kc = np.array([CROPS[c] for c in rng.choice(list(CROPS), n)])
    area = rng.lognormal(np.log(0.55), 0.4, n)                                   # hectares irrigated today
    need_mm = np.maximum(0.0, kc * day["et0"] * (1 + 0.1 * rng.standard_normal(n)) - day["rain"])
    flow = 367 * p * eff / head                                                   # m3 per hour at the pump
    hours = 10 * area * need_mm / flow                                            # 1 mm over 1 ha is 10 m3
    return np.clip(np.rint(hours * 4), 4, 16).astype(int)

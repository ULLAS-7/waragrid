"""VERIFY (slide 3): can a stepped rollout with a control feeder recover a planted saving
when the post period is hotter? Synthetic: it demonstrates the method, not that the saving exists."""
import numpy as np

from ..config import NATIONAL_KWH, NATIONAL_PUMPS


def did(n, effect, heat_shift, seed, pre=30, post=30, boot=400):
    rng = np.random.default_rng(seed)
    base = n * NATIONAL_KWH / NATIONAL_PUMPS / 365              # kWh per feeder-day
    weather = 0.06 * rng.standard_normal(pre + post)            # shared by both feeders
    weather[pre:] += heat_shift                                 # the post period is hotter

    def feeder(treated):
        e = base * (1 + 0.9 * weather) * (1 + 0.03 * rng.standard_normal(pre + post))
        if treated:
            e[pre:] *= 1 - effect
        return e

    t, c = feeder(True), feeder(False)

    def estimate(i, j):
        ratio = t[j].mean() / t[i].mean()
        return (1 - ratio) * 100, (1 - ratio / (c[j].mean() / c[i].mean())) * 100   # before/after, with control

    i0, j0 = np.arange(pre), np.arange(pre, pre + post)
    naive, with_control = estimate(i0, j0)
    draws = [estimate(rng.choice(i0, pre), rng.choice(j0, post))[1] for _ in range(boot)]
    lo, hi = np.percentile(draws, [5, 95])
    return dict(true=effect * 100, naive=float(naive), did=float(with_control), lo=float(lo), hi=float(hi),
                heat=heat_shift * 100, days=[pre, post])

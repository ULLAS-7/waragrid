import unittest

import numpy as np

from waragrid.config import DEFAULTS, W
from waragrid.core.pumps import pumps
from waragrid.core.scheduler import wara_starts
from waragrid.core.simulator import run
from waragrid.services.voice import script


class CoreTests(unittest.TestCase):
    def test_turns_stay_inside_the_supply_window(self):
        rng = np.random.default_rng(1)
        d, p = rng.integers(8, 17, 120), pumps(rng, 120)
        s = wara_starts(rng, d, p, np.full(W, 1.25 * (p * d).sum() / W))
        self.assertTrue(((s >= 0) & (s + d <= W)).all())

    def test_waragrid_flattens_the_feeder(self):
        r = run(**DEFAULTS)
        b, w = r["base"]["kpi"], r["wara"]["kpi"]
        self.assertLess(w["peak"], 0.8 * b["peak"])
        self.assertLess(w["starts"], 0.5 * b["starts"])

    def test_scheduling_moves_energy_but_never_creates_savings(self):
        r = run(**DEFAULTS)  # savings come from the stated assumption in impact(), not from the scheduler
        self.assertAlmostEqual(sum(r["base"]["load"]), sum(r["wara"]["load"]), delta=1e-3 * sum(r["base"]["load"]))  # the payload rounds each block to 0.1 kW

    def test_decoder_recovers_per_pump_load_at_transformer_scale(self):
        self.assertLess(run(**DEFAULTS)["decode"]["median_err"], 15)

    def test_call_script_contains_the_turn(self):
        self.assertIn("10:40", script("en", "10:40", "12:10"))
        self.assertIn("12:10", script("hi", "10:40", "12:10"))


if __name__ == "__main__":
    unittest.main()

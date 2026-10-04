import unittest

import numpy as np

from waragrid import create_app
from waragrid.api.routes import cached_run
from waragrid.core import montecarlo, verify
from waragrid.core.need import pump_blocks
from waragrid.core.pumps import pumps


class V3Tests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def blocks(self, weather):
        rng = np.random.default_rng(3)
        return pump_blocks(rng, pumps(rng, 300), weather, 30.0, 0.28)

    def test_need_engine_follows_the_weather(self):
        normal, heat, showers = (self.blocks(w).sum() for w in ("normal", "heatwave", "showers"))
        self.assertGreater(heat, normal)
        self.assertGreater(normal, showers)

    def test_need_blocks_stay_between_one_and_four_hours(self):
        b = self.blocks("heatwave")
        self.assertTrue(((b >= 4) & (b <= 16)).all())

    def test_control_feeder_recovers_the_planted_saving(self):
        r = verify.did(300, 0.12, 0.08, seed=5)
        self.assertLess(abs(r["did"] - 12), 3)
        self.assertLess(r["naive"], r["did"] - 3)       # before/after alone is fooled by the hotter post period
        self.assertTrue(r["lo"] < r["did"] < r["hi"])

    def test_monte_carlo_intervals_are_ordered(self):
        mc = montecarlo.intervals(300, 0.8, 1.25, False, "normal", 30.0, 0.28, seed=1, reps=8)
        for m in mc["kpi"].values():
            self.assertTrue(m["p5"] <= m["p50"] <= m["p95"])

    def test_swap_is_decided_and_bad_pairs_are_rejected(self):
        r = self.client.get("/api/swap?a=0&b=1").get_json()
        self.assertIn(r["ok"], (True, False))
        self.assertTrue(r["reason"])
        self.assertIsInstance(r["partners"], list)
        self.assertEqual(self.client.get("/api/swap?a=2&b=2").status_code, 400)

    def test_new_endpoints(self):
        with self.client.get("/api/export.csv") as r:
            self.assertIn("text/csv", r.content_type)
            self.assertTrue(r.get_data(as_text=True).startswith("time,today_kw"))
        self.assertGreater(len(self.client.get("/api/assumptions").get_json()["rows"]), 5)
        self.assertEqual(self.client.get("/api/sensitivity?metric=co2_t").get_json()["metric"], "co2_t")
        self.assertEqual(self.client.get("/api/nope").status_code, 404)
        self.assertEqual(self.client.get("/api/run?weather=hail").status_code, 400)
        self.assertIn("Server-Timing", self.client.get("/api/health").headers)

    def test_repeat_scenarios_hit_the_cache(self):
        self.client.get("/api/run?n=140&seed=99")
        before = cached_run.cache_info().hits
        self.client.get("/api/run?n=140&seed=99")
        self.assertEqual(cached_run.cache_info().hits, before + 1)


if __name__ == "__main__":
    unittest.main()

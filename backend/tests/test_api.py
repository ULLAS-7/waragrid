import unittest

from waragrid import create_app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_health(self):
        self.assertEqual(self.client.get("/api/health").get_json()["status"], "ok")

    def test_run_contract(self):
        body = self.client.get("/api/run?n=120&q=0.9").get_json()
        for key in ("base", "wara", "limit", "turns", "decode", "impact", "calls_queued"):
            self.assertIn(key, body)
        self.assertEqual(set(body["turns"][0]["msg"]), {"en", "hi", "pa", "mr"})

    def test_bad_input_is_a_clear_400(self):
        r = self.client.get("/api/run?n=5")
        self.assertEqual(r.status_code, 400)
        self.assertIn("between", r.get_json()["error"])

    def test_frontend_is_served_with_a_javascript_mime_type(self):
        with self.client.get("/") as page, self.client.get("/js/main.js") as script:
            self.assertEqual(page.status_code, 200)
            self.assertIn("javascript", script.content_type)

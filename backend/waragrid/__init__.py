"""WaraGrid prototype: a digital, adaptive warabandi for farm power and groundwater."""
import mimetypes
from pathlib import Path

__version__ = "0.3.0"
FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


def create_app():
    """Application factory: JSON API under /api, static dashboard at /."""
    from flask import Flask, send_from_directory
    from .api.routes import bp

    # Windows registries sometimes map .js to text/plain, which breaks ES modules in the browser.
    mimetypes.add_type("text/javascript", ".js")
    app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
    app.register_blueprint(bp)

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND, "index.html")

    return app

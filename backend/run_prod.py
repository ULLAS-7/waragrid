"""Production entry point: reads PORT from env (Render sets it automatically)."""
import os
from waragrid import create_app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"WaraGrid running on port {port}")
    create_app().run(host="0.0.0.0", port=port, debug=False)

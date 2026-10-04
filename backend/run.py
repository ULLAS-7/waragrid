"""Start the WaraGrid server:  python backend/run.py"""
from waragrid import create_app

if __name__ == "__main__":
    print("WaraGrid running at http://127.0.0.1:8000  (Ctrl+C to stop)")
    create_app().run(host="127.0.0.1", port=8000, debug=False)

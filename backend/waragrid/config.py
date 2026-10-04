"""Single source of truth: constants, defaults and input bounds. Every assumption is listed in docs/ASSUMPTIONS.md."""
W = 40                       # 15-minute blocks in the 10-hour supply window, 08:00-18:00
START_HOUR, BLOCK_MIN = 8, 15
NATIONAL_KWH = 187e9         # kWh a year used by farm pumps (PeerJ citing CEA; verify before quoting)
NATIONAL_PUMPS = 21e6        # grid-connected pump sets

DEFAULTS = dict(n=300, q=0.8, capf=1.25, solar=False, dt=12, save=12.0, head=30.0, eff=0.28, rs=4.0, ef=0.7, seed=7)
BOUNDS = dict(                # key: (min, max, type)
    n=(60, 600, int), q=(0.4, 1.0, float), capf=(1.1, 1.8, float), dt=(6, 40, int), save=(0, 30, float),
    head=(5, 150, float), eff=(0.15, 0.6, float), rs=(0, 20, float), ef=(0.4, 1.0, float), seed=(0, 999999, int))
LANGS = {                     # language code -> label and browser speech locale
    "en": {"label": "English", "speech": "en-IN"}, "hi": {"label": "हिन्दी", "speech": "hi-IN"},
    "pa": {"label": "ਪੰਜਾਬੀ", "speech": "pa-IN"}, "mr": {"label": "मराठी", "speech": "mr-IN"}}


def hm(block):
    """Block index -> 'HH:MM' on the 08:00 supply-window clock."""
    minutes = int(block) * BLOCK_MIN
    return f"{START_HOUR + minutes // 60:02d}:{minutes % 60:02d}"

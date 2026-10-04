"""Query-string validation: clear 400 messages instead of stack traces."""
from ..config import BOUNDS, DEFAULTS
from ..scenarios import WEATHER


def number(args, key, lo, hi, default, cast=float):
    if key not in args:
        return default
    try:
        value = cast(float(args[key]))
    except (ValueError, OverflowError):
        raise ValueError(f"{key} must be a number")
    if not lo <= value <= hi:
        raise ValueError(f"{key} must be between {lo} and {hi}")
    return value


def parse(args):
    out = {k: number(args, k, lo, hi, DEFAULTS[k], cast) for k, (lo, hi, cast) in BOUNDS.items()}
    out["solar"] = args.get("solar") in ("1", "true", "True")
    out["weather"] = args.get("weather", "normal")
    if out["weather"] not in WEATHER:
        raise ValueError("weather must be one of " + ", ".join(WEATHER))
    return out


def pair(args):
    """Two farmer indexes (0-11) for the swap tool."""
    return number(args, "a", 0, 11, 0, int), number(args, "b", 0, 11, 1, int)

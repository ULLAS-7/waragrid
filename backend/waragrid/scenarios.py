"""Weather days and one-click scenario presets (served to the UI through /api/meta)."""
WEATHER = {  # reference evapotranspiration and effective rain, mm per day
    "normal": {"label": "Normal day", "et0": 5.0, "rain": 0.0},
    "heatwave": {"label": "Heatwave", "et0": 7.5, "rain": 0.0},
    "showers": {"label": "Showers", "et0": 3.5, "rain": 2.5},
}
PRESETS = {
    "typical": {"label": "Typical day", "q": 0.8, "capf": 1.25, "weather": "normal", "solar": False},
    "heatwave": {"label": "Heatwave", "q": 0.8, "capf": 1.4, "weather": "heatwave", "solar": False},
    "lowcomp": {"label": "Low compliance", "q": 0.5, "capf": 1.25, "weather": "normal", "solar": False},
    "solar": {"label": "Solar-aligned", "q": 0.9, "capf": 1.25, "weather": "normal", "solar": True},
    "showers": {"label": "Showers", "q": 0.85, "capf": 1.25, "weather": "showers", "solar": False},
}

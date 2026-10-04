"""Impact arithmetic: energy, groundwater, CO2 and community payout."""
from ..config import NATIONAL_KWH, NATIONAL_PUMPS


def impact(n, save, head, eff, rs, ef):
    kwh = NATIONAL_KWH / NATIONAL_PUMPS * n * save / 100  # national average per pump, scaled to this feeder
    m3k = 367 * eff / head               # m3 of groundwater not lifted per kWh avoided
    return dict(saved_mwh=kwh / 1e3, water_m3=kwh * m3k, co2_t=kwh / 1e3 * ef, payout_rs=kwh * rs, m3_per_kwh=m3k, rs=rs, ef=ef)

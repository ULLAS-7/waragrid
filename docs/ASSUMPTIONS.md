# Assumption register

Keep this in sync with the deck. Everything here is a simulation input, not a field result.

| Assumption | Value | Status | Where |
|---|---|---|---|
| Farm pumping energy and pump count | 187 billion kWh, 21 million pumps | Published figure (PeerJ citing CEA); verify | `config.py` |
| Energy per pump | about 8,905 kWh a year | Derived from the line above | `core/impact.py` |
| Energy saving | 12% (slider 4-20%) | Assumption, not evidence; needs a pilot | UI, `impact` |
| Pump efficiency, head | 28%, 30 m | Illustrative; the deck says 25-30% | UI, `impact` |
| Water per kWh | 367 x efficiency / head m3 | Physics | `core/impact.py` |
| Payout | Rs 4 per kWh saved | Matches the Punjab scheme's rate; confirm | `config.py` |
| Grid emission factor | 0.7 t CO2 per MWh | Placeholder; use the latest CEA value | `config.py` |
| Supply window | 08:00-18:00, 15-minute blocks | Assumption | `config.py` |
| Pumping per farm per day | 1-4 h from crop demand | FAO-56 style: Kc x ET0 minus rain, area, pump flow (367 x efficiency x kW / head, m3 per hour) | `core/need.py` |
| Baseline behaviour | 60% switch on within the first hour | Assumption; the biggest driver of the peak reduction | `core/scheduler.py` |
| Compliance | 80% follow the call; others drift up to 2.5 h | Assumption | `core/compliance.py` |
| Meter noise | 2% plus a small background load | Assumption | `core/metering.py` |
| Decoder scope | 6-40 pumps per transformer | Tested only at this scale | `core/metering.py` |
| Scheduling | Moves energy in time and never reduces it | Enforced by a test | `tests/test_core.py` |
| Weather days | ET0 5.0, 7.5, 3.5 mm a day; rain 0, 0, 2.5 mm | Illustrative presets | `scenarios.py` |
| Crop mix and area | Five crops, Kc 1.10-1.25, median 0.55 ha | Illustrative | `core/need.py` |
| Verification model | 3% daily noise, 6% shared weather shock, post-period heat shift (slider) | Synthetic: shows the method, is not evidence of a saving | `core/verify.py` |
| Monte Carlo | 24 mornings per run, 90% interval | Method | `core/montecarlo.py` |
| Sensitivity | Each input varied alone by 8% to 35% | Method | `core/sensitivity.py` |

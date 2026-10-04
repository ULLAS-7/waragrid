/** Scenario state with persistence: localStorage for the last session, the URL hash for shareable links. */
export const DEFAULTS = { n: 300, q: 80, capf: 1.25, dt: 12, save: 12, head: 30, eff: 28, solar: 0, weather: 'normal', seed: 7 };
export const state = { ...DEFAULTS };
const KEY = 'waragrid.scenario.v3';

/** Merge defaults, then the last session, then any values in the link; unknown keys and non-numbers are ignored. */
export function restore(query) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* storage blocked: start fresh */ }
  Object.assign(state, DEFAULTS, saved);
  for (const [key, value] of query) {
    if (!(key in DEFAULTS)) continue;
    const v = typeof DEFAULTS[key] === 'number' ? Number(value) : value;
    if (typeof v !== 'number' || Number.isFinite(v)) state[key] = v;
  }
}

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked: nothing to do */ }
}

/** The state in the shape /api expects: percentages as fractions. */
export const apiQuery = () => ({ ...state, q: state.q / 100, eff: state.eff / 100 });

export function applyPreset(p) {
  Object.assign(state, { q: Math.round(p.q * 100), capf: p.capf, weather: p.weather, solar: p.solar ? 1 : 0 });
}

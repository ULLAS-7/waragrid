/** Thin client for the Flask API. A new request in a slot cancels the previous one, so slow answers never overwrite fresh ones. */
const inflight = {};

async function request(url, slot) {
  inflight[slot]?.abort();
  const controller = (inflight[slot] = new AbortController());
  const res = await fetch(url, { signal: controller.signal });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body;
}

const qs = (params) => new URLSearchParams(params);
export const meta = () => request('/api/meta', 'meta');
export const assumptions = () => request('/api/assumptions', 'assumptions');
export const run = (p) => request('/api/run?' + qs(p), 'run');
export const monteCarlo = (p) => request('/api/montecarlo?' + qs(p), 'mc');
export const verify = (p, heat) => request('/api/verify?' + qs({ ...p, heat }), 'verify');
export const sensitivity = (p, metric) => request('/api/sensitivity?' + qs({ ...p, metric }), 'tornado');
export const swap = (p, a, b) => request('/api/swap?' + qs({ ...p, a, b }), 'swap');

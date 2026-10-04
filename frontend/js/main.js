/** WaraGrid dashboard: wires scenario state, the hash router, the API and the views together. */
import * as api from './api.js';
import { drawBands, drawLoad, drawScatter, token } from './charts.js';
import { drawDid, drawTornado } from './charts_extra.js';
import { fillFarmers, renderCaption, renderCommittee, renderDecoder, renderHero, renderImpact, renderKpis, showMessage } from './panels.js';
import { VIEWS, current, onRoute, sync } from './router.js';
import { DEFAULTS, apiQuery, applyPreset, persist, restore, state } from './state.js';
import { attachTooltip, fillSwap, renderAssumptions, renderMonteCarlo, renderSwap, renderVerify, toast } from './views.js';
import { speak } from './voice.js';

// ── Demo walkthrough ────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { title: '1 / 8 · Morning Simulation', view: 'overview',
    desc: 'WaraGrid schedules each farm a dedicated turn window. Watch the feeder load flatten from a dangerous spike into a smooth curve — the same total energy, spread across the morning.',
    action: '→ Press "Play the morning" to watch it animate in real time.' },
  { title: '2 / 8 · KPI Panel', view: 'overview',
    desc: 'Peak load, simultaneous starts and steepest ramp all drop by 50–70%. The 90% intervals (below the charts) show this holds across 24 simulated mornings — not a lucky seed.',
    action: '→ Scroll down to the KPI rows under each chart.' },
  { title: '3 / 8 · Scenario Presets', view: 'overview',
    desc: 'Click "Heatwave" — crop demand rises 50%, the feeder cap tightens, and WaraGrid still keeps the load flat. Click "Low compliance" to see what happens when 50% of farmers ignore their turn.',
    action: '→ Click the Heatwave or Low compliance button in the header.', presetKey: 'heatwave' },
  { title: '4 / 8 · Farmer IVR Call', view: 'farmers',
    desc: 'Every farmer gets a 6 AM automated call in their language. The mock IVR queues 300 calls instantly. Switch to Hindi or Punjabi and press "Hear it" to hear the browser speak the turn.',
    action: '→ Select "हिन्दी" in the language dropdown, then press Hear it.' },
  { title: '5 / 8 · Press 2 to Swap', view: 'farmers',
    desc: 'A farmer can swap their turn with a neighbour — but only if the feeder stays under its cap. The system checks the full load curve in real time and approves or declines instantly.',
    action: '→ Pick F001 and F002, press "Try the swap". Read the approval reason.' },
  { title: '6 / 8 · Verification (DiD)', view: 'verify',
    desc: 'A simple before/after comparison is fooled by a hotter post-period. With a control feeder (Difference-in-Differences), we recover the planted 12% saving even through the heat confound.',
    action: '→ Drag the "Post-period heat shift" slider up to 15% and watch naive vs DiD diverge.' },
  { title: '7 / 8 · Sensitivity Tornado', view: 'verify',
    desc: 'Which assumption moves the impact number the most? The tornado shows pumping head and energy saving dominate; emission factor barely matters. Change the metric dropdown to see CO₂.',
    action: '→ Switch the metric dropdown to "CO₂ avoided".' },
  { title: '8 / 8 · Assumption Register', view: 'about',
    desc: 'Every number in the deck is traceable to a row in this table, with its source file and status. The register is served live from docs/ASSUMPTIONS.md — one file, no duplication.',
    action: '→ Check the Status column — every assumption is honestly labelled.' },
];

let demoIdx = 0, demoAuto = null;

function demoRender(idx) {
  const step = DEMO_STEPS[idx];
  $('#demoTitle').textContent = step.title;
  $('#demoDesc').textContent = step.desc;
  $('#demoAction').textContent = step.action;
  $('#demoBar').style.width = (((idx + 1) / DEMO_STEPS.length) * 100) + '%';
  show(step.view);
  if (step.presetKey && live.presets[step.presetKey]) {
    applyPreset(live.presets[step.presetKey]); syncControls(); refresh(false);
  }
}

function demoStart() {
  demoIdx = 0;
  $('#demoStage').style.display = 'block';
  $('#demoStop').style.display = 'inline-block';
  $('#demoStart').textContent = '↺ Restart';
  demoRender(demoIdx);
  clearInterval(demoAuto);
  demoAuto = setInterval(() => {
    if (demoIdx < DEMO_STEPS.length - 1) { demoIdx++; demoRender(demoIdx); }
    else { clearInterval(demoAuto); }
  }, 9000);
}

function demoStop() {
  clearInterval(demoAuto);
  $('#demoStop').style.display = 'none';
}

function bindDemo() {
  $('#demoStart').addEventListener('click', demoStart);
  $('#demoStop').addEventListener('click', demoStop);
  $('#demoNext').addEventListener('click', () => {
    if (demoIdx < DEMO_STEPS.length - 1) { demoIdx++; demoRender(demoIdx); }
  });
  $('#demoPrev').addEventListener('click', () => {
    if (demoIdx > 0) { demoIdx--; demoRender(demoIdx); }
  });
}

const $ = (s) => document.querySelector(s);
const SECONDS = 7;                                                   // length of the morning animation
const live = { data: null, verify: null, tornado: null, languages: {}, presets: {}, raf: 0, timer: 0, t: 40, pending: 0 };
const view = () => current().view;
const fail = (err) => { if (err.name !== 'AbortError') toast(err.message); };
const busy = (on) => { live.pending += on ? 1 : -1; document.body.classList.toggle('busy', live.pending > 0); };

function labelFor(input) {
  const out = $('#o_' + input.id);
  if (out) out.textContent = input.value + (input.dataset.u || '');
}

/** Push the scenario state into the controls (after a preset, a shared link or a restore). */
function syncControls() {
  Object.keys(DEFAULTS).forEach((key) => {
    const el = $('#' + key);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!state[key]; else el.value = state[key];
    if (el.type === 'range') labelFor(el);
  });
}

function bindControls() {
  document.querySelectorAll('.side input[type=range]').forEach((input) => {
    input.addEventListener('input', () => {                          // debounce: re-run 250 ms after the last move
      state[input.id] = Number(input.value);
      labelFor(input);
      clearTimeout(live.timer);
      live.timer = setTimeout(() => refresh(false), 250);
    });
  });
  $('#solar').addEventListener('change', (e) => { state.solar = e.target.checked ? 1 : 0; refresh(false); });
  $('#weather').addEventListener('change', (e) => { state.weather = e.target.value; refresh(false); });
  $('#play').addEventListener('click', play);
  $('#again').addEventListener('click', () => { state.seed = Math.floor(Math.random() * 1e4); refresh(true); });
  $('#presets').addEventListener('click', (e) => {
    const preset = live.presets[e.target.dataset.p];
    if (preset) { applyPreset(preset); syncControls(); refresh(true); }
  });
  $('#farmer').addEventListener('change', showCall);
  $('#lang').addEventListener('change', showCall);
  $('#speak').addEventListener('click', () => speak(showCall(), live.languages[$('#lang').value].speech));
  $('#swapBtn').addEventListener('click', async () => {
    try { renderSwap(await api.swap(apiQuery(), $('#swapA').value, $('#swapB').value)); } catch (err) { fail(err); }
  });
  $('#heat').addEventListener('input', () => { labelFor($('#heat')); loadVerify(); });
  $('#metric').addEventListener('change', loadVerify);
  $('#print').addEventListener('click', () => window.print());
  window.addEventListener('resize', () => draw());
  window.addEventListener('keydown', (e) => {                        // space replays the morning
    if (e.code === 'Space' && !/INPUT|SELECT|BUTTON/.test(document.activeElement?.tagName || '')) { e.preventDefault(); play(); }
  });
  attachTooltip($('#cv1'), () => live.data && live.data.base, () => live.data.limit);
  attachTooltip($('#cv2'), () => live.data && live.data.wara, () => live.data.limit);
}

const showCall = () => showMessage(live.data, $('#farmer').value || 0, $('#lang').value);

/** Draw both load charts up to time t (0-40 blocks). */
function paint(t) {
  live.t = t;
  const D = live.data;
  const ymax = 1.1 * Math.max(...D.base.load, ...D.wara.load, ...D.limit);
  [['1', 'base', '--coral'], ['2', 'wara', '--teal']].forEach(([id, key, color]) => {
    const shown = drawLoad($('#cv' + id), D[key].load, D.limit, token(color), t, ymax);
    renderCaption(id, D[key], Math.min(39, Math.max(0, shown - 1)));
  });
}

/** Canvases only draw correctly while visible, so each view draws its own charts when it is shown. */
function draw(v = view()) {
  const D = live.data;
  if (!D) return;
  if (v === 'overview') paint(live.t);
  if (v === 'farmers') drawBands($('#cv4'), D.base.bands, D.wara.bands);
  if (v === 'verify') {
    drawScatter($('#cv3'), D.decode);
    if (live.verify) drawDid($('#cv5'), live.verify);
    if (live.tornado) drawTornado($('#cv6'), live.tornado);
  }
}

function play() {
  cancelAnimationFrame(live.raf);
  if (view() !== 'overview' || matchMedia('(prefers-reduced-motion: reduce)').matches) { live.t = 40; return draw(); }
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(40, ((now - start) / (SECONDS * 1000)) * 40);
    paint(t);
    if (t < 40) live.raf = requestAnimationFrame(frame);
  };
  live.raf = requestAnimationFrame(frame);
}

async function loadVerify() {
  const q = apiQuery();
  try {
    [live.verify, live.tornado] = await Promise.all([api.verify(q, $('#heat').value), api.sensitivity(q, $('#metric').value)]);
    renderVerify(live.verify);
    draw();
  } catch (err) { fail(err); }
}

async function refresh(animate) {
  busy(true);
  try { live.data = await api.run(apiQuery()); } catch (err) { return fail(err); } finally { busy(false); }
  const D = live.data;
  renderHero(D); renderKpis(D); renderDecoder(D); renderCommittee(D); renderImpact(D, apiQuery());
  fillFarmers(D); fillSwap(D); showCall();
  $('#csv').href = '/api/export.csv?' + new URLSearchParams(apiQuery());
  live.verify = live.tornado = null;
  api.monteCarlo(apiQuery()).then(renderMonteCarlo).catch(fail);
  if (view() === 'verify') loadVerify();
  persist(); sync(view(), state);
  if (animate) play(); else draw();
}

function show(v) {
  VIEWS.forEach((name) => $('#view-' + name).classList.toggle('active', name === v));
  document.querySelectorAll('nav a').forEach((a) => a.setAttribute('aria-current', a.dataset.view === v ? 'page' : 'false'));
  if (v === 'verify' && !live.verify) loadVerify();
  if (v !== 'demo') { sync(v, state); draw(v); }
}

async function init() {
  const { view: v, query } = current();
  restore(query);
  bindControls();
  try {
    const meta = await api.meta();
    live.languages = meta.languages;
    live.presets = meta.presets;
    const options = (map, label) => Object.entries(map).map(([k, x]) => `<option value="${k}">${label(x)}</option>`).join('');
    $('#lang').innerHTML = options(meta.languages, (l) => l.label);
    $('#weather').innerHTML = options(meta.weather, (w) => w.label);
    $('#presets').innerHTML = Object.entries(meta.presets).map(([k, p]) => `<button class="chip" data-p="${k}">${p.label}</button>`).join('');
    api.assumptions().then(renderAssumptions).catch(fail);
  } catch (err) {
    $('#hero').textContent = 'Server not reachable: start it with scripts/start (see README). ' + err.message;
    return;
  }
  $('#lang').value = 'hi';
  syncControls();
  bindDemo();
  onRoute(show);
  show(v);
  await refresh(true);
}

init();

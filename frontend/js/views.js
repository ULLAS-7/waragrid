/** Renderers and helpers for the Overview extras, Farmers swap tool, Verify and Assumptions views; plus toast and tooltips. */
import { clock } from './panels.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const band = (m) => `${Math.round(m.p5)}–${Math.round(m.p95)}`;

export function renderMonteCarlo(mc) {
  const k = mc.kpi;
  $('#mc').textContent = `90% range over ${mc.reps} simulated mornings: peak load falls ${band(k.peak)}%, simultaneous starts ${band(k.starts)}%, ` +
    `steepest ramp ${band(k.ramp)}%; pumping in solar hours rises ${band(k.solar)} points.`;
}

export function renderVerify(v) {
  $('#did').textContent = `Planted saving ${v.true.toFixed(1)}%, post period ${v.heat.toFixed(0)}% hotter. Before/after alone reads ${v.naive.toFixed(1)}%; ` +
    `with a control feeder it reads ${v.did.toFixed(1)}% (90% interval ${v.lo.toFixed(1)} to ${v.hi.toFixed(1)}%). ${v.days[0]} days before, ${v.days[1]} after.`;
}

export function fillSwap(D) {
  const options = D.turns.map((f, i) => `<option value="${i}">${f.id}, ${f.start}–${f.end}</option>`).join('');
  $('#swapA').innerHTML = options;
  $('#swapB').innerHTML = options;
  $('#swapB').value = 1;
}

export function renderSwap(r) {
  const moved = `${r.a.id} ${r.a.start}–${r.a.end}, ${r.b.id} ${r.b.start}–${r.b.end}`;
  const more = r.partners.length ? ` ${r.a.id} can swap with: ${r.partners.join(', ')}.` : ` ${r.a.id} has no swap partner today.`;
  $('#swapOut').textContent = r.ok
    ? `Approved (${r.reason}): ${moved}. Feeder peak ${Math.round(r.peak_before)} → ${Math.round(r.peak_after)} kW.`
    : `Declined: ${r.reason}.${more}`;
}

export function renderAssumptions({ header, rows }) {
  const cell = (tag, text) => `<${tag}>${esc(text.replace(/`/g, ''))}</${tag}>`;
  $('#assume').innerHTML = `<table><thead><tr>${header.map((h) => cell('th', h)).join('')}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${r.map((c) => cell('td', c)).join('')}</tr>`).join('') + '</tbody></table>';
}

let toastTimer = 0;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

/** Hover readout on a load chart: time, pumps running, kW and the cap at that block. */
export function attachTooltip(canvas, regime, limit) {
  const tip = $('#tip');
  canvas.addEventListener('mousemove', (e) => {
    const r = regime();
    if (!r) return;
    const block = Math.floor(((e.offsetX - 38) / (canvas.clientWidth - 46)) * 40);
    if (block < 0 || block > 39) { tip.style.display = 'none'; return; }
    tip.textContent = `${clock(block)} · ${r.running[block]} pumps · ${Math.round(r.load[block])} kW · cap ${Math.round(limit()[block])} kW`;
    tip.style.display = 'block';
    tip.style.left = e.clientX + 14 + 'px';
    tip.style.top = e.clientY + 14 + 'px';
  });
  canvas.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
}

/** Canvas charts. Colours come from the CSS tokens so the palette lives in one place.
 *  All canvases are rendered on solid white for readability (token --chart-grid / --chart-axis). */
export const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Fill the canvas with white before drawing so no page background shows through. */
function clearWhite(g, w, h) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
}

/** Size the canvas for the screen's pixel ratio and return a 2D context in CSS pixels. */
export function prepare(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const g = canvas.getContext('2d');
  g.scale(ratio, ratio);
  g.font = '11px Inter, system-ui, sans-serif';
  return { g, w, h };
}

/** Feeder load as a stepped area drawn up to time t (in 15-minute blocks), with the dashed feeder cap. Returns blocks drawn. */
export function drawLoad(canvas, curve, limit, color, t, ymax) {
  const { g, w, h } = prepare(canvas);
  clearWhite(g, w, h);
  const left = 38, bottom = 24, top = 8, pw = w - left - 8, ph = h - bottom - top;
  const x = (i) => left + pw * i / 40, y = (v) => top + ph * (1 - v / ymax);
  g.fillStyle = token('--chart-axis') || '#3E5B52';
  g.strokeStyle = token('--chart-grid') || '#D6E6DC';
  g.lineWidth = 1;
  for (let k = 0; k <= 4; k++) {                                   // horizontal grid and kW labels
    const gy = y(ymax * k / 4);
    g.beginPath(); g.moveTo(left, gy); g.lineTo(w - 8, gy); g.stroke();
    g.fillText(Math.round(ymax * k / 4) + (k === 4 ? ' kW' : ''), 2, gy + 4);
  }
  for (let k = 0; k <= 5; k++) g.fillText(String(8 + 2 * k).padStart(2, '0') + ':00', x(8 * k) - 14, h - 7);
  const shown = Math.min(40, Math.floor(t));
  const steps = () => { for (let i = 0; i < shown; i++) { g.lineTo(x(i), y(curve[i])); g.lineTo(x(i + 1), y(curve[i])); } };
  g.beginPath(); g.moveTo(x(0), y(0)); steps(); g.lineTo(x(shown), y(0)); g.closePath();
  g.fillStyle = color + '44'; g.fill();
  g.beginPath(); steps(); g.strokeStyle = color; g.lineWidth = 2; g.stroke();
  g.setLineDash([6, 4]); g.strokeStyle = token('--amber'); g.lineWidth = 1.5; g.beginPath();   // feeder cap
  limit.forEach((v, i) => { i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v)); g.lineTo(x(i + 1), y(v)); });
  g.stroke(); g.setLineDash([]);
  if (t < 40) { g.strokeStyle = token('--ink'); g.beginPath(); g.moveTo(x(t), top); g.lineTo(x(t), top + ph); g.stroke(); }
  return shown;
}

/** True vs decoded kW per pump; the dashed diagonal is perfect decoding. */
export function drawScatter(canvas, decode) {
  const { g, w, h } = prepare(canvas);
  clearWhite(g, w, h);
  const max = Math.max(...decode.true, ...decode.est) * 1.1;
  const x = (v) => 34 + (w - 44) * v / max, y = (v) => h - 26 - (h - 36) * v / max;
  g.strokeStyle = token('--chart-grid') || '#D6E6DC'; g.strokeRect(34, 10, w - 44, h - 36);
  g.setLineDash([5, 4]); g.strokeStyle = token('--amber');
  g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(max), y(max)); g.stroke(); g.setLineDash([]);
  g.fillStyle = token('--teal');
  decode.true.forEach((v, i) => { g.beginPath(); g.arc(x(v), y(decode.est[i]), 4.5, 0, 2 * Math.PI); g.fill(); });
  g.fillStyle = token('--chart-axis') || '#3E5B52';
  g.fillText('true kW per pump', w / 2 - 40, h - 8);
  g.save(); g.translate(12, h / 2 + 60); g.rotate(-Math.PI / 2); g.fillText('decoded from the transformer meter', 0, 0); g.restore();
}

/** Farmers starting in each two-hour band: coral = today, teal = WaraGrid. */
export function drawBands(canvas, base, wara) {
  const { g, w, h } = prepare(canvas);
  clearWhite(g, w, h);
  const top = 10, bottom = 24, slot = (w - 20) / base.length, bar = slot * 0.36;
  const max = Math.max(...base, ...wara) * 1.1;
  const bars = (values, color, dx) => values.forEach((v, i) => {
    const bh = (h - top - bottom) * v / max;
    g.fillStyle = color; g.fillRect(10 + slot * i + dx, h - bottom - bh, bar, bh);
  });
  bars(base, token('--coral'), slot * 0.1);
  bars(wara, token('--teal'), slot * 0.1 + bar + 2);
  g.fillStyle = token('--chart-axis') || '#3E5B52';
  ['08–10', '10–12', '12–14', '14–16', '16–18'].forEach((label, i) => g.fillText(label, 10 + slot * i + slot * 0.2, h - 8));
}

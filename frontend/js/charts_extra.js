/** Charts for the Verify view: the stepped-rollout estimate and the sensitivity tornado. */
import { prepare, token } from './charts.js';

const axisColor = () => token('--chart-axis') || '#3E5B52';

function clearWhite(g, w, h) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); }

/** Planted saving vs before/after only vs with a control feeder (whisker = 90% interval). */
export function drawDid(canvas, v) {
  const { g, w, h } = prepare(canvas);
  clearWhite(g, w, h);
  const rows = [['Planted saving', v.true, token('--amber')], ['Before/after only', v.naive, token('--coral')], ['With control feeder', v.did, token('--teal')]];
  const left = 130, max = Math.max(v.true, v.naive, v.hi) * 1.25 || 1, row = (h - 30) / rows.length;
  const x = (val) => left + (w - left - 50) * val / max;
  rows.forEach(([label, val, color], i) => {
    const y = 12 + i * row, bar = row * 0.5;
    g.fillStyle = axisColor(); g.fillText(label, 6, y + bar * 0.7);
    g.fillStyle = color; g.fillRect(left, y, Math.max(1, x(val) - left), bar);
    g.fillStyle = token('--ink'); g.fillText(val.toFixed(1) + '%', x(val) + 6, y + bar * 0.7);
  });
  const y = 12 + 2 * row + row * 0.25;
  g.strokeStyle = token('--ink'); g.lineWidth = 2; g.beginPath();
  g.moveTo(x(v.lo), y); g.lineTo(x(v.hi), y);
  g.moveTo(x(v.lo), y - 5); g.lineTo(x(v.lo), y + 5); g.moveTo(x(v.hi), y - 5); g.lineTo(x(v.hi), y + 5);
  g.stroke();
}

/** How far each assumption swings the chosen impact number; the dashed line is today's value. */
export function drawTornado(canvas, tor) {
  const { g, w, h } = prepare(canvas);
  clearWhite(g, w, h);
  const left = 150, all = tor.rows.flatMap((r) => [r.a, r.b]).concat(tor.mid);
  const lo = Math.min(...all), span = Math.max(...all) - lo || 1, row = (h - 24) / Math.max(tor.rows.length, 1);
  const x = (val) => left + (w - left - 70) * (val - lo) / span;
  const f = (val) => Math.round(val).toLocaleString('en-IN');
  tor.rows.forEach((r, i) => {
    const y = 8 + i * row, a = Math.min(r.a, r.b), b = Math.max(r.a, r.b);
    g.fillStyle = axisColor(); g.fillText(r.label, 6, y + row * 0.4);
    g.fillStyle = token('--teal'); g.fillRect(x(a), y, Math.max(2, x(b) - x(a)), row * 0.5);
    g.fillStyle = token('--ink'); g.fillText(f(a), x(a) - 6 - g.measureText(f(a)).width, y + row * 0.4); g.fillText(f(b), x(b) + 6, y + row * 0.4);
  });
  g.strokeStyle = token('--amber'); g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x(tor.mid), 4); g.lineTo(x(tor.mid), h - 16); g.stroke(); g.setLineDash([]);
  g.fillStyle = token('--amber'); g.fillText('now: ' + f(tor.mid), Math.max(4, x(tor.mid) - 24), h - 3);
}

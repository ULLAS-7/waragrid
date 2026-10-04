/** DOM renderers: each takes the API payload and fills one part of the page. */
const $ = (s) => document.querySelector(s);
const inr = (x) => Math.round(x).toLocaleString('en-IN');
const cut = (before, after) => Math.round(100 * (1 - after / before));
export const clock = (block) => String(8 + (block >> 2)).padStart(2, '0') + ':' + String(15 * (block % 4)).padStart(2, '0');

/** Headline strip: how much each stress metric falls. */
export function renderHero(D) {
  const b = D.base.kpi, w = D.wara.kpi;
  const rows = [['Peak load', b.peak, w.peak], ['Simultaneous starts', b.starts, w.starts], ['Steepest ramp', b.ramp, w.ramp]];
  $('#hero').innerHTML = rows.map(([label, before, after]) => `<span>${label} <b>−${cut(before, after)}%</b></span>`).join('');
}

const kpiRow = (k) =>
  `<span>Peak ÷ average <b>${k.ratio.toFixed(2)}</b></span><span>Most starts in 15 min <b>${Math.round(k.starts)}</b></span>` +
  `<span>Steepest ramp <b>${Math.round(k.ramp)} kW</b></span><span>Pumping 10:00–15:00 <b>${Math.round(k.solar * 100)}%</b></span>` +
  `<span>Blocks over the cap <b>${k.over.toFixed(1)}</b></span>`;

export function renderKpis(D) {
  $('#k1').innerHTML = kpiRow(D.base.kpi);
  $('#k2').innerHTML = kpiRow(D.wara.kpi);
}

/** Caption under each load chart for the block the clock has reached. */
export function renderCaption(id, regime, block) {
  $('#c' + id).textContent = `${clock(block)}: ${regime.running[block]} pumps running, ${Math.round(regime.load[block])} kW. Dashed line is the feeder cap.`;
}

export function renderDecoder(D) {
  const d = D.decode;
  $('#dec').textContent = `Median error ${d.median_err.toFixed(1)}% per pump and ${d.dt_err.toFixed(1)}% for the whole transformer ` +
    `(${d.pumps} pumps, ${d.days} days of 15-minute meter data). Validated at transformer scale only.`;
}

export function renderCommittee(D) {
  const early = (regime) => Math.round(100 * regime.bands[0] / D.n);
  $('#fair').textContent = `${early(D.base)}% of farmers start in the first two hours today; with WaraGrid ${early(D.wara)}% do. ` +
    'Coral is today, teal is WaraGrid.';
}

/** Impact arithmetic with every assumption printed; p holds the control values used for the run. */
export function renderImpact(D, p) {
  const I = D.impact;
  $('#imp').innerHTML = `<p class="big">${inr(I.saved_mwh)} MWh a year</p><p>${inr(I.water_m3)} m³ of groundwater not lifted</p>` +
    `<p>${inr(I.co2_t)} t CO₂ avoided</p><p>₹${inr(I.payout_rs)} paid to the community at ₹${I.rs}/kWh saved</p>` +
    `<small>Assumes ${D.n} pumps at 8,905 kWh a year each, ${p.save}% saving, ${p.head} m head, ${Math.round(p.eff * 100)}% efficiency ` +
    `(${I.m3_per_kwh.toFixed(1)} m³ per kWh) and ${I.ef} t CO₂ per MWh, a placeholder: use the latest CEA value.</small>`;
}

export function fillFarmers(D) {
  $('#farmer').innerHTML = D.turns.map((f, i) => `<option value="${i}">Farmer ${f.id}, ${f.kw} kW pump</option>`).join('');
}

/** Show one farmer's call script in the chosen language and return the text (so it can be spoken). */
export function showMessage(D, index, lang) {
  const turn = D.turns[index], text = turn.msg[lang];
  $('#msg').textContent = text;
  $('#calls').textContent = `${D.calls_queued} calls queued (mock IVR). Farmers on their turn today: ${Math.round(D.compliance * 100)}%.`;
  return text;
}

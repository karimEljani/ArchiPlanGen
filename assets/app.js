'use strict';
/* PlanGen v2 – plans d'architecte (maçonnerie, façade, coupe, masse, vue 3D) à partir de dimensions. Unités internes : mètres */
const $ = s => document.querySelector(s);
const f2 = n => (+n).toFixed(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPES = { entree: 'Entrée', salon: 'Salon', sejour: 'Séjour', cuisine: 'Cuisine', chambre: 'Chambre', sdb: 'Salle de bain', wc: 'WC', bureau: 'Bureau', garage: 'Garage', escalier: 'Escalier', couloir: 'Couloir', autre: 'Autre' };
const SIDE = { entree: 'f', salon: 'f', sejour: 'f', cuisine: 'f', garage: 'f', bureau: 'f', autre: 'f', escalier: 'f', couloir: 'f', chambre: 'b', sdb: 'b', wc: 'b' };
const uv = v => S.unit === 'cm' ? String(Math.round(v * 100)) : f2(v);          // valeur de cote
const uu = v => uv(v) + (S.unit === 'cm' ? ' cm' : ' m');
const DEF = () => ({
  name: 'Villa exemple', client: '', author: '', mode: 'auto', unit: 'cm', poteaux: true,
  terrainW: 20, terrainD: 25, setback: 3, W: 12, D: 10, floors: 1, h: 2.8, tExt: 0.2, tInt: 0.1, corr: 1.2, roof: 'terrasse', price: 1200,
  rooms: [
    { t: 'entree', n: 'Entrée', s: 'f', w: 2, l: 3 }, { t: 'salon', n: 'Salon', s: 'f', w: 5.5, l: 5 },
    { t: 'cuisine', n: 'Cuisine', s: 'f', w: 3.5, l: 4 }, { t: 'chambre', n: 'Chambre 1', s: 'b', w: 4, l: 3.8 },
    { t: 'chambre', n: 'Chambre 2', s: 'b', w: 3.5, l: 3.8 }, { t: 'sdb', n: 'S.D.E', s: 'b', w: 2.2, l: 2.5 },
    { t: 'wc', n: 'WC', s: 'b', w: 1.2, l: 2 }]
});
/* Exemple en mode manuel inspiré d'un plan de maçonnerie de villa (x, y = angle haut-gauche de la pièce, d = portes, wn = fenêtres) */
const EXAMPLE = () => ({
  ...DEF(), mode: 'manual', name: 'Villa RDC – plan maçonnerie', floors: 2, terrainW: 18, terrainD: 22,
  rooms: [
    { t: 'chambre', n: 'Chambre d’amie', x: .2, y: .2, w: 3.4, l: 4.3, d: 'E', wn: 'NW' },
    { t: 'cuisine', n: 'Cuisine', x: 3.6, y: .2, w: 3.5, l: 4.3, d: 'E', wn: 'N' },
    { t: 'salon', n: 'Salon', x: 7.1, y: .2, w: 4.46, l: 4.3, d: 'S', dp: .07, wn: 'NE' },
    { t: 'garage', n: 'Garage', x: .2, y: 4.5, w: 3.4, l: 5.58, d: 'ES', wn: 'W' },
    { t: 'sdb', n: 'S.D.E', x: 3.6, y: 4.5, w: 2.3, l: 2.4, d: 'S', wn: '-' },
    { t: 'entree', n: 'Entrée', x: 3.6, y: 6.9, w: 2.3, l: 3.18, d: 'SE', wn: '-' },
    { t: 'escalier', n: 'Escalier', x: 5.9, y: 4.5, w: 1.8, l: 5.58, d: '', wn: '-' },
    { t: 'autre', n: 'Chambre de prière', x: 7.7, y: 4.5, w: 3.86, l: 5.58, d: 'W', wn: 'SE' }]
});
let S = DEF(), sheet = 'plan', floor = 0, curId = null;

/* ---------- 1. Pièces, murs extérieurs/intérieurs, ouvertures ---------- */
const sum = L => L.reduce((s, r) => s + r.a, 0);
function rooms() {
  if (S.mode === 'manual') return S.rooms.map(r => ({ ...r, h: +r.l, x: +r.x, y: +r.y, w: +r.w, d: (r.d || '').toUpperCase(), wn: (r.wn || '').toUpperCase() }));
  let R = S.rooms.map(r => ({ ...r, a: Math.max(.5, r.w * r.l) }));
  let F = R.filter(r => r.s === 'f'), B = R.filter(r => r.s === 'b');
  if (!F.length || !B.length) { const m = Math.ceil(R.length / 2); F = R.slice(0, m); B = R.slice(m); }
  const t = S.tExt, Wi = S.W - 2 * t, Di = S.D - 2 * t, c = S.corr, H = Di - c, aF = sum(F), aB = sum(B), hB = H * aB / (aF + aB), hF = H - hB, out = [];
  const row = (L, y, h, side) => { let x = t; const tot = sum(L); L.forEach(r => { const w = Wi * r.a / tot; out.push({ ...r, x, y, w, h, d: '', wn: '', side }); x += w; }); };
  row(B, t, hB, 'b'); row(F, t + hB + c, hF, 'f');
  const fr = out.filter(r => r.side === 'f'), er = fr.find(r => r.t === 'entree') || fr.find(r => r.t === 'salon' || r.t === 'sejour') || fr[0];
  out.forEach(r => { r.d = r.side === 'b' ? 'S' : 'N'; if (r.t === 'garage' || r.t === 'entree') r.d = 'NS'; if (r === er && r.d === 'N') r.d = 'NS'; });
  out.push({ t: 'couloir', n: 'Couloir', x: t, y: t + hB, w: Wi, h: c, d: '', wn: '-', side: 'f' });
  return out;
}
function openings(r) {
  const e = r.ext, doors = [], wins = [];
  for (const s of r.d) {
    const len = s === 'N' || s === 'S' ? r.w : r.h, ex = e[s];
    let dw = r.t === 'garage' && ex ? 2.6 : r.t === 'sdb' || r.t === 'wc' ? .8 : ex ? .95 : .9;
    if (len < dw + .3) continue;
    let p = r.dp !== undefined && r.dp !== '' && r.dp !== null ? +r.dp : (s === 'S' && ex && r.t !== 'entree' && r.t !== 'garage' ? .25 : .5);
    p = Math.min(Math.max(p, (dw / 2 + .1) / len), 1 - (dw / 2 + .1) / len);
    doors.push({ s, p, w: dw, ext: ex });
  }
  let wn = r.wn;
  if (wn === '') wn = ['N', 'S', 'E', 'W'].filter(s => e[s] && !r.d.includes(s) && !['entree', 'garage', 'couloir', 'escalier'].includes(r.t) && !(r.t === 'wc' && (s === 'E' || s === 'W'))).join('');
  if (wn === '-') wn = '';
  for (const s of wn) if (e[s]) {
    const len = s === 'N' || s === 'S' ? r.w : r.h, small = r.t === 'sdb' || r.t === 'wc', hasD = doors.some(d => d.s === s && d.ext);
    wins.push({ s, p: hasD ? .72 : .5, w: small ? .7 : Math.min(1.5, len * (hasD ? .35 : .5)) });
  }
  return { doors, wins };
}
function model() {
  const R = rooms(), t = S.tExt, off = S.tInt + .05;
  const inside = (px, py) => R.some(o => px > o.x && px < o.x + o.w && py > o.y && py < o.y + o.h);
  R.forEach(r => { r.ext = { N: !inside(r.x + r.w / 2, r.y - off), S: !inside(r.x + r.w / 2, r.y + r.h + off), W: !inside(r.x - off, r.y + r.h / 2), E: !inside(r.x + r.w + off, r.y + r.h / 2) }; Object.assign(r, openings(r)); r.top = (r.d[0] || 'S') !== 'N'; });
  const W = Math.max(...R.map(r => r.x + r.w)) + t, D = Math.max(...R.map(r => r.y + r.h)) + t;
  const fdoor = R.flatMap(r => r.doors.filter(d => d.s === 'S' && d.ext && r.t !== 'garage').map(d => ({ r, d, cx: r.x + d.p * r.w })))[0];
  return { R, W, D, fdoor };
}
const levels = () => S.floors * (S.h + .25);

/* ---------- 2. Primitives ---------- */
function dim(x1, y1, x2, y2, txt) {
  const v = x1 === x2, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, k = .1;
  const tk = (x, y) => `<line x1="${x - k}" y1="${y + k}" x2="${x + k}" y2="${y - k}"/>`;
  return `<g stroke="#222" stroke-width=".015" fill="none"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${tk(x1, y1)}${tk(x2, y2)}</g>` +
    `<text x="${mx}" y="${my}" dy="-.07" text-anchor="middle" font-size=".2" fill="#111" ${v ? `transform="rotate(-90 ${mx} ${my})"` : ''}>${txt}</text>`;
}
const north = (x, y) => `<g transform="translate(${x} ${y})"><circle r=".6" fill="#fff" stroke="#222" stroke-width=".03"/><path d="M0 -.55L.22 .3L0 .15L-.22 .3Z" fill="#222"/><text y="-.75" text-anchor="middle" font-size=".3" font-weight="700">N</text></g>`;
function scaleBar(x, y) {
  let o = ''; for (let i = 0; i < 5; i++) o += `<rect x="${x + i}" y="${y}" width="1" height=".15" fill="${i % 2 ? '#fff' : '#222'}" stroke="#222" stroke-width=".02"/><text x="${x + i}" y="${y + .45}" font-size=".2" text-anchor="middle">${i}</text>`;
  return o + `<text x="${x + 5}" y="${y + .45}" font-size=".2" text-anchor="middle">5 m</text>`;
}
const winH = (x, y0, w, t) => `<rect x="${x}" y="${y0}" width="${w}" height="${t}" fill="#fff" stroke="#111" stroke-width=".03"/><path d="M${x} ${y0 + t / 3}H${x + w}M${x} ${y0 + 2 * t / 3}H${x + w}" stroke="#222" stroke-width=".015"/>`;
const winV = (x0, y, t, h) => `<rect x="${x0}" y="${y}" width="${t}" height="${h}" fill="#fff" stroke="#111" stroke-width=".03"/><path d="M${x0 + t / 3} ${y}V${y + h}M${x0 + 2 * t / 3} ${y}V${y + h}" stroke="#222" stroke-width=".015"/>`;
function doorSVG(r, d, t, ti) {
  const th = (d.ext ? t : ti) + .02, dw = d.w; let X, Y, tf;
  if (d.s === 'N' || d.s === 'S') { X = r.x + d.p * r.w; const n = d.s === 'N'; Y = n ? (d.ext ? r.y - t / 2 : r.y) : (d.ext ? r.y + r.h + t / 2 : r.y + r.h); tf = `translate(${X} ${Y})${n ? '' : ' scale(1 -1)'}`; }
  else { Y = r.y + d.p * r.h; const w = d.s === 'W'; X = w ? (d.ext ? r.x - t / 2 : r.x) : (d.ext ? r.x + r.w + t / 2 : r.x + r.w); tf = `matrix(0 1 ${w ? 1 : -1} 0 ${X} ${Y})`; }
  if (r.t === 'garage' && d.ext) return `<g transform="${tf}"><rect x="${-dw / 2}" y="${-th / 2}" width="${dw}" height="${th}" fill="#fff"/><line x1="${-dw / 2}" x2="${dw / 2}" stroke="#c0392b" stroke-width=".04" stroke-dasharray=".15 .1"/></g>`;
  return `<g transform="${tf}"><rect x="${-dw / 2}" y="${-th / 2}" width="${dw}" height="${th}" fill="#fff"/><path d="M${-dw / 2} 0V${dw}M${dw / 2} 0A${dw} ${dw} 0 0 1 ${-dw / 2} ${dw}" fill="none" stroke="#c0392b" stroke-width=".03"/></g>`;
}
function furniture(r) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, b = r.top;
  const fy = len => b ? r.y + .25 : r.y + r.h - .25 - len, st = 'fill="#fff" stroke="#777" stroke-width=".02"';
  const rc = (x, y, w, h, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${st}/>`, ci = (x, y, rr) => `<circle cx="${x}" cy="${y}" r="${rr}" ${st}/>`;
  let o = '';
  if (r.t === 'chambre' && r.w >= 2.6 && r.h >= 2.6) { const y = fy(2); o += rc(cx - .8, y, 1.6, 2, .05) + rc(cx - .7, b ? y + .08 : y + 1.62, .55, .3, .05) + rc(cx + .15, b ? y + .08 : y + 1.62, .55, .3, .05); }
  if ((r.t === 'salon' || r.t === 'sejour') && r.w >= 3 && r.h >= 2.6) { const y = fy(.9); o += rc(cx - 1.1, y, 2.2, .9, .1) + rc(cx - .5, b ? y + 1.3 : y - 1, 1, .6, .05); }
  if (r.t === 'cuisine' && r.w >= 2) { const y = fy(.6); o += rc(r.x + .2, y, r.w - .4, .6) + ci(r.x + r.w * .3, y + .3, .17); [[.65, .15], [.65, .45], [.78, .15], [.78, .45]].forEach(p => o += ci(r.x + r.w * p[0], y + p[1] + .02, .08)); }
  if (r.t === 'sdb' && r.w >= 1.8) { const y = fy(.75); o += rc(r.x + .2, y, Math.min(1.7, r.w - .4), .75, .1); if (r.w >= 2.2) o += ci(r.x + r.w - .5, b ? r.y + r.h - .5 : r.y + .5, .2); }
  if (r.t === 'wc') o += rc(cx - .2, b ? r.y + .2 : r.y + r.h - .75, .4, .25, .03) + `<ellipse cx="${cx}" cy="${b ? r.y + .65 : r.y + r.h - .3}" rx=".2" ry=".27" ${st}/>`;
  if (r.t === 'bureau' && r.w >= 2) { const y = fy(.7); o += rc(cx - .7, y, 1.4, .7) + ci(cx, b ? y + 1 : y - .3, .22); }
  if (r.t === 'garage') o += r.h >= 4.6 ? rc(cx - .9, cy - 2.2, 1.8, 4.4, .3) : r.w >= 4.6 ? rc(cx - 2.2, cy - .9, 4.4, 1.8, .3) : '';
  const stair = (x, y, w, h, vert) => { let s = rc(x, y, w, h); const n = Math.floor((vert ? h : w) / .27); for (let i = 1; i < n; i++) s += vert ? `<line x1="${x}" x2="${x + w}" y1="${y + i * .27}" y2="${y + i * .27}" stroke="#555" stroke-width=".015"/>` : `<line y1="${y}" y2="${y + h}" x1="${x + i * .27}" x2="${x + i * .27}" stroke="#555" stroke-width=".015"/>`; return s; };
  if (r.t === 'escalier') o += r.h >= r.w ? stair(r.x + .15, r.y + .15, r.w - .3, r.h - .3, true) : stair(r.x + .15, r.y + .15, r.w - .3, r.h - .3, false);
  if (r.t === 'couloir' && S.floors > 1 && S.mode !== 'manual') o += stair(r.x + r.w - 3.2, r.y + .1, 3, r.h - .2, false) + `<text x="${r.x + r.w - 1.7}" y="${r.y + r.h / 2 + .07}" font-size=".18" text-anchor="middle">Escalier</text>`;
  return o;
}

/* ---------- 3. Cadre de feuille (double bordure + cartouche) ---------- */
function wrap(inner, bb, title, num, tot, surf) {
  const sc = Math.min(1290 / bb.w, 770 / bb.h), ox = 55 + (1290 - bb.w * sc) / 2 - bb.x * sc, oy = 55 + (775 - bb.h * sc) / 2 - bb.y * sc;
  const ratio = Math.round(1000 / (sc * .3) / 5) * 5;
  const T = (x, y, t, sz = 14, b = 0, a = 'start') => `<text x="${x}" y="${y}" font-size="${sz}" ${b ? 'font-weight="700"' : ''} text-anchor="${a}" fill="#111">${t}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 990" font-family="Arial,Helvetica,sans-serif"><rect width="1400" height="990" fill="#fff"/>` +
    `<rect x="15" y="15" width="1370" height="960" fill="none" stroke="#2b3a8c" stroke-width="3"/><rect x="22" y="22" width="1356" height="946" fill="none" stroke="#2b3a8c" stroke-width="1.2"/>` +
    `<g transform="translate(${ox} ${oy}) scale(${sc})">${inner}</g>` +
    `<path d="M22 845H1378M860 845V968M1090 845V968" stroke="#111" fill="none"/>` +
    T(40, 895, esc(title) + ' . ' + esc(S.client || S.name), 30, 1) + T(40, 935, 'Projet : ' + esc(S.name) + (surf ? '   ·   S = ' + f2(surf) + ' m²' : ''), 16) +
    T(875, 875, 'Dessiné par : ' + esc(S.author || '—'), 13) + T(875, 905, 'Date : ' + new Date().toLocaleDateString('fr-FR'), 13) + T(875, 935, 'ECH : 1/' + ratio + ' (A3)', 13) +
    T(1235, 880, 'تفاصيل', 34, 1, 'middle') + T(1235, 915, 'Feuille ' + num + ' / ' + tot, 15, 0, 'middle') + `</svg>`;
}

/* ---------- 4. Plan de maçonnerie ---------- */
function planInner(fl) {
  const { R, W, D } = model(), t = S.tExt, ti = S.tInt; let o = '';
  const wr = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b1b1b"/>`;
  R.forEach(r => o += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.t === 'couloir' ? '#f3efe6' : r.t === 'garage' ? '#ececec' : '#fff'}"/>`);
  R.forEach(r => {
    const { x, y, w, h, ext: e } = r;
    o += e.N ? wr(x - t, y - t, w + 2 * t, t) : wr(x - ti / 2, y - ti / 2, w + ti, ti);
    o += e.S ? wr(x - t, y + h, w + 2 * t, t) : wr(x - ti / 2, y + h - ti / 2, w + ti, ti);
    o += e.W ? wr(x - t, y - t, t, h + 2 * t) : wr(x - ti / 2, y - ti / 2, ti, h + ti);
    o += e.E ? wr(x + w, y - t, t, h + 2 * t) : wr(x + w - ti / 2, y - ti / 2, ti, h + ti);
  });
  R.forEach(r => {
    r.wins.forEach(wi => {
      const cx = r.x + wi.p * r.w, cy = r.y + wi.p * r.h;
      if (wi.s === 'N') o += winH(cx - wi.w / 2, r.y - t, wi.w, t); if (wi.s === 'S') o += winH(cx - wi.w / 2, r.y + r.h, wi.w, t);
      if (wi.s === 'W') o += winV(r.x - t, cy - wi.w / 2, t, wi.w); if (wi.s === 'E') o += winV(r.x + r.w, cy - wi.w / 2, t, wi.w);
    });
    r.doors.forEach(d => { if (fl > 0 && d.ext) return; o += doorSVG(r, d, t, ti); });
  });
  R.forEach(r => o += furniture(r));
  R.forEach(r => {
    if (r.t === 'couloir' && r.h < 1.6 && S.mode !== 'manual') return;
    const ly = r.y + r.h / 2 + (r.h > 3.4 ? (r.top ? .7 : -.7) : 0), fs = Math.max(.14, Math.min(.3, r.w / (r.n.length * .6)));
    o += `<text x="${r.x + r.w / 2}" y="${ly}" text-anchor="middle" font-size="${fs}" font-style="italic" font-family="Georgia,serif" font-weight="600" fill="#111">${esc(r.n)}</text>` +
      (r.w > 1.5 ? `<text x="${r.x + r.w / 2}" y="${ly + .24}" text-anchor="middle" font-size=".17" fill="#444">${f2(r.w * r.h)} m²</text>` : '');
  });
  if (S.poteaux) { const seen = {}; R.forEach(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(p => { const k = Math.round(p[0] * 10) + '_' + Math.round(p[1] * 10); if (!seen[k]) { seen[k] = 1; o += `<rect x="${p[0] - .1}" y="${p[1] - .1}" width=".2" height=".2" fill="#e00000"/>`; } })); }
  o += `<path d="M${W / 2} -.7V${D + .7}" stroke="#c0392b" stroke-width=".03" stroke-dasharray=".5 .12 .1 .12"/><text x="${W / 2}" y="-.8" font-size=".3" text-anchor="middle" fill="#c0392b" font-weight="700">A</text><text x="${W / 2}" y="${D + 1.9}" font-size=".3" text-anchor="middle" fill="#c0392b" font-weight="700">A</text>`;
  const uq = a => [...new Set(a.map(v => Math.round(v * 100) / 100))].sort((p, q) => p - q);
  const xs = uq(R.flatMap(r => [r.x, r.x + r.w])), ys = uq(R.flatMap(r => [r.y, r.y + r.h]));
  const cx = [0, ...xs.filter(v => v > t + .01 && v < W - t - .01), W], cy = [0, ...ys.filter(v => v > t + .01 && v < D - t - .01), D];
  for (let i = 0; i < cx.length - 1; i++) o += dim(cx[i], D + .8, cx[i + 1], D + .8, uv(cx[i + 1] - cx[i]));
  for (let i = 0; i < cy.length - 1; i++) o += dim(W + .8, cy[i], W + .8, cy[i + 1], uv(cy[i + 1] - cy[i]));
  o += dim(0, D + 1.5, W, D + 1.5, uv(W)) + dim(W + 1.5, 0, W + 1.5, D, uv(D));
  o += north(W + 3, 1) + scaleBar(0, D + 2.6);
  o += `<text x="0" y="-1.1" font-size=".45" font-weight="700">${fl === 0 ? 'PLAN DU REZ-DE-CHAUSSÉE' : 'PLAN DE L’ÉTAGE ' + fl} <tspan font-size=".25" font-weight="400">(cotes en ${S.unit})</tspan></text>`;
  return o;
}
const planBB = M => ({ x: -.5, y: -1.6, w: M.W + 5, h: M.D + 5 });

/* ---------- 5. Façade, coupe, masse, vue 3D ---------- */
function facadeInner(M) {
  const { R, W } = M, h = S.h, n = S.floors, sl = .25, H = levels(), rh = S.roof === 'tuiles' ? W * .18 : .5; let o = '';
  o += `<rect x="0" y="${-H}" width="${W}" height="${H}" fill="#f4efe6" stroke="#222" stroke-width=".05"/>`;
  for (let f = 0; f < n; f++) {
    const base = f * (h + sl); if (f) o += `<line x1="0" x2="${W}" y1="${-base}" y2="${-base}" stroke="#222" stroke-width=".03"/>`;
    R.forEach(r => r.wins.filter(w => w.s === 'S').forEach(w => { const cx = r.x + w.p * r.w, wh = r.t === 'wc' || r.t === 'sdb' ? .6 : 1.2; o += `<rect x="${cx - w.w / 2}" y="${-(base + .9 + wh)}" width="${w.w}" height="${wh}" fill="#cfe6f5" stroke="#222" stroke-width=".03"/><line x1="${cx}" x2="${cx}" y1="${-(base + .9 + wh)}" y2="${-(base + .9)}" stroke="#222" stroke-width=".02"/>`; }));
  }
  R.forEach(r => r.doors.filter(d => d.s === 'S' && d.ext).forEach(d => { const cx = r.x + d.p * r.w; o += r.t === 'garage' ? `<rect x="${cx - d.w / 2}" y="-2.2" width="${d.w}" height="2.2" fill="#ccd" stroke="#222" stroke-width=".03"/>` : `<rect x="${cx - d.w / 2}" y="-2.1" width="${d.w}" height="2.1" fill="#8a5a2b" stroke="#222" stroke-width=".03"/>`; }));
  o += S.roof === 'tuiles' ? `<polygon points="-.5,${-H} ${W / 2},${-H - rh} ${W + .5},${-H}" fill="#b5651d" stroke="#222" stroke-width=".04"/>` : `<rect x="-.1" y="${-H - rh}" width="${W + .2}" height=".5" fill="#ddd" stroke="#222" stroke-width=".04"/>`;
  o += `<line x1="-2" x2="${W + 2}" y1="0" y2="0" stroke="#222" stroke-width=".08"/>`;
  for (let x = -2; x < W + 2; x += .4) o += `<line x1="${x}" y1="0" x2="${x - .25}" y2=".25" stroke="#555" stroke-width=".02"/>`;
  for (let f = 0; f < n; f++) o += dim(W + .8, -f * (h + sl), W + .8, -(f * (h + sl) + h + sl), uv(h + sl));
  o += dim(W + 1.6, 0, W + 1.6, -H, uu(H)) + dim(0, 1.2, W, 1.2, uu(W));
  return o + `<text x="0" y="${-H - rh - .8}" font-size=".45" font-weight="700">FAÇADE PRINCIPALE</text>` + north(W + 3, -H - rh - .5) + scaleBar(0, 2.2);
}
const facadeBB = M => { const rh = S.roof === 'tuiles' ? M.W * .18 : .5; return { x: -2, y: -(levels() + rh + 1.4), w: M.W + 6.5, h: levels() + rh + 4.5 }; };
function coupeInner(M) {
  const { R, W } = M, t = S.tExt, ti = S.tInt, h = S.h, n = S.floors, sl = .25, H = levels(), cx = W / 2;
  const hit = R.filter(r => r.x < cx && cx < r.x + r.w).sort((a, b) => a.y - b.y);
  const ys = [...new Set(hit.flatMap(r => [r.y, r.y + r.h]).map(v => Math.round(v * 100) / 100))].sort((a, b) => a - b), y0 = ys[0] - t, y1 = ys[ys.length - 1] + t, X = v => v - y0, L = y1 - y0; let o = '';
  const bk = (x, y, w, hh) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#222"/>`;
  o += `<rect x="${t}" y="${-H}" width="${L - 2 * t}" height="${H}" fill="#faf7f0"/>`;
  o += bk(0, -H, t, H + .6) + bk(L - t, -H, t, H + .6) + bk(-.3, 0, t + .6, .6) + bk(L - t - .3, 0, t + .6, .6);
  ys.slice(1, -1).forEach(v => o += bk(X(v) - ti / 2, -H, ti, H));
  for (let f = 0; f < n; f++) o += bk(0, -((f + 1) * (h + sl)), L, sl);
  o += bk(0, -.15, L, .15) + `<line x1="-2" x2="${L + 2}" y1=".6" y2=".6" stroke="#222" stroke-width=".05"/>`;
  for (let x = -2; x < L + 2; x += .4) o += `<line x1="${x}" y1=".6" x2="${x - .25}" y2=".85" stroke="#555" stroke-width=".02"/>`;
  o += bk(-.1, -H - .5, t + .2, .5) + bk(L - t - .1, -H - .5, t + .2, .5);
  hit.forEach(r => o += `<text x="${X(r.y + r.h / 2)}" y="${-h / 2}" font-size=".2" text-anchor="middle" fill="#666" font-style="italic">${esc(r.n)}</text>`);
  for (let f = 0; f < n; f++) o += dim(L + .8, -f * (h + sl), L + .8, -(f * (h + sl) + h + sl), uv(h) + ' + ' + uv(sl));
  o += dim(L + 1.6, 0, L + 1.6, -H, uu(H)) + dim(0, 1.6, L, 1.6, uu(L));
  for (let i = 0; i < ys.length - 1; i++) o += dim(X(ys[i]), 1.1, X(ys[i + 1]), 1.1, uv(ys[i + 1] - ys[i]));
  return { o: o + `<text x="0" y="${-H - 1.2}" font-size=".45" font-weight="700">COUPE A-A</text>` + scaleBar(0, 2.6), L };
}
function masseInner(M) {
  const TW = S.terrainW, TD = S.terrainD, { W, D } = M, sb = S.setback, bx = (TW - W) / 2, by = TD - sb - D; let o = '';
  o += `<rect width="${TW}" height="${TD}" fill="#e8efdc" stroke="#222" stroke-width=".08"/><rect x="${sb}" y="${sb}" width="${TW - 2 * sb}" height="${TD - 2 * sb}" fill="none" stroke="#c0392b" stroke-width=".04" stroke-dasharray=".4 .2"/>`;
  o += `<rect x="-2" y="${TD}" width="${TW + 4}" height="4" fill="#9a9a9a"/><text x="${TW / 2}" y="${TD + 2.2}" font-size=".5" text-anchor="middle" fill="#fff">RUE</text>`;
  if (M.fdoor) o += `<rect x="${bx + M.fdoor.cx - .6}" y="${by + D}" width="1.2" height="${sb}" fill="#cfcfcf"/>`;
  o += `<rect x="${bx}" y="${by}" width="${W}" height="${D}" fill="#d9cfc0" stroke="#222" stroke-width=".08"/><text x="${bx + W / 2}" y="${by + D / 2}" font-size=".45" text-anchor="middle" font-weight="700">Bâtiment ${uv(W)} × ${uv(D)}</text>`;
  [[1, 1], [TW - 1, 1], [1, TD - 1], [TW - 1, TD - 1]].forEach(p => o += `<circle cx="${p[0]}" cy="${p[1]}" r=".6" fill="#7aa35a" stroke="#4d7a36" stroke-width=".04"/>`);
  const ok = by >= sb && bx >= sb, em = W * D;
  o += dim(0, TD + 4.8, TW, TD + 4.8, uu(TW)) + dim(-1.2, 0, -1.2, TD, uu(TD)) + dim(bx + (M.fdoor ? M.fdoor.cx : W / 2) + 1.3, by + D, bx + (M.fdoor ? M.fdoor.cx : W / 2) + 1.3, TD, 'retrait ' + uv(sb));
  o += `<text x="0" y="-1.6" font-size=".6" font-weight="700">PLAN DE MASSE</text><text x="0" y="-.7" font-size=".38" fill="${ok ? '#333' : '#c0392b'}">Terrain ${f2(TW * TD)} m² · Emprise ${f2(em)} m² (${(100 * em / (TW * TD)).toFixed(1)} %)${ok ? '' : ' — ⚠ bâtiment hors zone constructible'}</text>`;
  return o + north(TW + 2.5, 1.5) + scaleBar(0, TD + 6);
}
const masseBB = () => ({ x: -3, y: -2.2, w: S.terrainW + 7, h: S.terrainD + 9.5 });
function isoInner(M) {
  const { R, W, D } = M, t = S.tExt, H = levels(), h = S.h, sl = .25, TW = Math.max(S.terrainW, W + 2), TD = Math.max(S.terrainD, D + 2), bx = (TW - W) / 2, by = Math.max(0, TD - S.setback - D);
  const P = (X, Y, Z) => [(X - Y) * .866, (X + Y) * .5 - Z];
  const pl = (pts, fill, st = '#666') => `<polygon points="${pts.map(p => P(...p).map(v => v.toFixed(2)).join(',')).join(' ')}" fill="${fill}" stroke="${st}" stroke-width=".03" stroke-linejoin="round"/>`;
  const box = (x0, y0, x1, y1, z0, z1, a, b, c) => pl([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], a) + pl([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], b) + pl([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c, c);
  const tree = (x, y) => { const a = P(x, y, 0), b = P(x, y, 2.4); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#7a5a35" stroke-width=".2"/><circle cx="${b[0]}" cy="${b[1] - .5}" r="1.1" fill="#5f9a46" stroke="#3d6e2c" stroke-width=".04"/>`; };
  let o = pl([[0, 0, 0], [TW, 0, 0], [TW, TD, 0], [0, TD, 0]], '#eadfc8', '#b9a77f');
  const fd = M.fdoor, dx = bx + (fd ? fd.cx : W / 2);
  o += pl([[dx - .7, by + D, 0], [dx + .7, by + D, 0], [dx + .7, TD, 0], [dx - .7, TD, 0]], '#d6d6d6', '#aaa') + tree(1.2, 1.2) + tree(TW - 1.2, 1.2);
  const B = R.map(r => ({ r, x0: bx + r.x - (r.ext.W ? t : 0), x1: bx + r.x + r.w + (r.ext.E ? t : 0), y0: by + r.y - (r.ext.N ? t : 0), y1: by + r.y + r.h + (r.ext.S ? t : 0) }));
  const done = [], order = []; let left = B.slice();
  while (left.length) {
    const pick = left.find(a => !left.some(b => b !== a && (b.x1 <= a.x0 + .01 || b.y1 <= a.y0 + .01) && !(a.x1 <= b.x0 + .01 || a.y1 <= b.y0 + .01))) || left.sort((a, b) => (a.x0 + a.x1 + a.y0 + a.y1) - (b.x0 + b.x1 + b.y0 + b.y1))[0];
    order.push(pick); left = left.filter(b => b !== pick);
  }
  const gl = (pts, c) => pl(pts, c, '#2d4a63');
  order.forEach(({ r, x0, x1, y0, y1 }) => {
    o += box(x0, y0, x1, y1, 0, H, '#f3efe7', '#d9d3c7', '#ffffff');
    for (let f = 0; f < S.floors; f++) {
      const z = f * (h + sl);
      r.wins.forEach(w => {
        if (w.s === 'S') { const c = bx + r.x + w.p * r.w; o += gl([[c - w.w / 2, y1, z + .9], [c + w.w / 2, y1, z + .9], [c + w.w / 2, y1, z + 2.1], [c - w.w / 2, y1, z + 2.1]], '#7fa6c4'); }
        if (w.s === 'E') { const c = by + r.y + w.p * r.h; o += gl([[x1, c - w.w / 2, z + .9], [x1, c + w.w / 2, z + .9], [x1, c + w.w / 2, z + 2.1], [x1, c - w.w / 2, z + 2.1]], '#6c93b3'); }
      });
      if (!f) r.doors.filter(d => d.ext).forEach(d => {
        if (d.s === 'S') { const c = bx + r.x + d.p * r.w; o += pl([[c - d.w / 2, y1, 0], [c + d.w / 2, y1, 0], [c + d.w / 2, y1, r.t === 'garage' ? 2.2 : 2.1], [c - d.w / 2, y1, r.t === 'garage' ? 2.2 : 2.1]], r.t === 'garage' ? '#b9bcc4' : '#8a5a2b'); }
        if (d.s === 'E') { const c = by + r.y + d.p * r.h; o += pl([[x1, c - d.w / 2, 0], [x1, c + d.w / 2, 0], [x1, c + d.w / 2, 2.1], [x1, c - d.w / 2, 2.1]], '#8a5a2b'); }
      });
    }
  });
  if (S.roof === 'tuiles') o += pl([[bx - .4, by - .4, H], [bx + W + .4, by - .4, H], [bx + W + .4, by + D + .4, H], [bx - .4, by + D + .4, H]], '#c47a3a');
  const g = 1; o += box(0, TD - .2, dx - g, TD, 0, 1.6, '#f3efe7', '#d9d3c7', '#fff') + box(dx + g, TD - .2, TW, TD, 0, 1.6, '#f3efe7', '#d9d3c7', '#fff') + tree(TW - 1.5, TD - 2.5);
  const bb = { x: -TD * .866 - 1, y: -H - 4, w: (TW + TD) * .866 + 2, h: (TW + TD) * .5 + H + 7 };
  return { o: o + `<text x="${bb.x + .5}" y="${bb.y + 1.2}" font-size=".9" font-weight="700">VUE 3D</text>`, bb };
}
function metre() {
  const M = model(), R = M.R, net = R.reduce((s, r) => s + r.w * r.h, 0), bati = M.W * M.D, tot = bati * S.floors;
  return `<div class="table"><h2>Tableau des surfaces et métré – ${esc(S.name)}</h2><table><tr><th>#</th><th>Pièce</th><th>Type</th><th class="n">Largeur (${S.unit})</th><th class="n">Longueur (${S.unit})</th><th class="n">Surface (m²)</th></tr>` +
    R.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.n)}</td><td>${TYPES[r.t] || r.t}</td><td class="n">${uv(r.w)}</td><td class="n">${uv(r.h)}</td><td class="n">${f2(r.w * r.h)}</td></tr>`).join('') +
    `<tr><th colspan="5">Total surface nette par niveau</th><th class="n">${f2(net)}</th></tr></table><table>` +
    [['Emprise au sol', f2(bati) + ' m²'], ['Nombre de niveaux', S.floors], ['Surface bâtie totale', f2(tot) + ' m²'], ['Murs extérieurs (périmètre)', f2(2 * (M.W + M.D)) + ' ml par niveau'],
    ['Nombre de poteaux (approx.)', new Set(R.flatMap(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].map(p => Math.round(p[0] * 10) + '_' + Math.round(p[1] * 10)))).size + ' par niveau'],
    ['Hauteur totale', f2(levels()) + ' m'], ['Volume bâti', f2(bati * levels()) + ' m³'], ['Surface terrain', f2(S.terrainW * S.terrainD) + ' m²'],
    ['Estimation du coût (' + S.price + ' / m²)', Math.round(tot * S.price).toLocaleString('fr-FR')]].map(r => `<tr><td>${r[0]}</td><td class="n">${r[1]}</td></tr>`).join('') + `</table></div>`;
}
function sheets() {
  const M = model(), arr = [], bati = M.W * M.D;
  for (let f = 0; f < S.floors; f++) arr.push({ id: 'plan', fl: f, title: f ? 'PLAN maçonnerie ÉTAGE ' + f : 'PLAN maçonnerie RDC', i: planInner(f), bb: planBB(M), s: bati });
  arr.push({ id: 'facade', title: 'FAÇADE', i: facadeInner(M), bb: facadeBB(M) });
  const c = coupeInner(M); arr.push({ id: 'coupe', title: 'COUPE A-A', i: c.o, bb: { x: -2, y: -(levels() + 2), w: c.L + 5.5, h: levels() + 5.5 } });
  arr.push({ id: 'masse', title: 'PLAN DE MASSE', i: masseInner(M), bb: masseBB() });
  const iso = isoInner(M); arr.push({ id: 'iso', title: 'VUE 3D', i: iso.o, bb: iso.bb });
  return arr.map((s, k) => ({ ...s, svg: wrap(s.i, s.bb, s.title, k + 1, arr.length, s.s) }));
}

/* ---------- 6. Interface ---------- */
function render() {
  if (!$('#sheet')) return;
  const all = sheets(), cur = all.find(s => s.id === sheet && (s.fl || 0) === (sheet === 'plan' ? Math.min(floor, S.floors - 1) : 0));
  const tabs = [['plan', 'Plan'], ['facade', 'Façade'], ['coupe', 'Coupe'], ['masse', 'Plan de masse'], ['iso', 'Vue 3D'], ['metre', 'Métré']];
  $('#tabs').innerHTML = tabs.map(t => `<button class="${t[0] === sheet ? 'on' : 'ghost'}" data-tab="${t[0]}">${t[1]}</button>`).join('') +
    (S.floors > 1 && sheet === 'plan' ? `<select id="fl">${Array.from({ length: S.floors }, (_, i) => `<option value="${i}" ${i === floor ? 'selected' : ''}>${i ? 'Étage ' + i : 'RDC'}</option>`).join('')}</select>` : '');
  $('#sheet').innerHTML = sheet === 'metre' ? metre() : (cur || all[0]).svg;
}
function buildRooms() {
  const man = S.mode === 'manual', o = (m, v) => Object.entries(m).map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('');
  const inp = (i, f, lab, v, extra = '') => `<label>${lab}<input data-i="${i}" data-f="${f}" value="${esc(v ?? '')}" ${extra}></label>`;
  const num = (i, f, lab, v) => inp(i, f, lab, v, 'type="number" step=".1"');
  $('#rooms').innerHTML = S.rooms.map((r, i) => `<div class="rc"><div class="r1"><select data-i="${i}" data-f="t">${o(TYPES, r.t)}</select><input data-i="${i}" data-f="n" value="${esc(r.n)}"><button data-del="${i}">×</button></div><div class="r2">` +
    (man ? num(i, 'x', 'x (m)', r.x) + num(i, 'y', 'y (m)', r.y) + num(i, 'w', 'Larg.', r.w) + num(i, 'l', 'Long.', r.l) + inp(i, 'd', 'Portes NSEW', r.d, 'maxlength="4"') + inp(i, 'wn', 'Fen. (-=aucune)', r.wn, 'maxlength="4"') + num(i, 'dp', 'Pos. porte 0-1', r.dp)
      : `<label>Côté<select data-i="${i}" data-f="s">${o({ f: 'Avant', b: 'Arrière' }, r.s)}</select></label>` + num(i, 'w', 'Larg.', r.w) + num(i, 'l', 'Long.', r.l)) + `</div></div>`).join('');
}
function fillForm() {
  document.querySelectorAll('[data-k]').forEach(e => { if (e.type === 'checkbox') e.checked = !!S[e.dataset.k]; else e.value = S[e.dataset.k]; });
  document.body.classList.toggle('manual', S.mode === 'manual'); buildRooms(); render();
}
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
const curSVG = () => { const all = sheets(); return (all.find(s => s.id === sheet && (s.fl || 0) === (sheet === 'plan' ? floor : 0)) || all[0]).svg; };
function setMode(m) {
  if (m === S.mode) return;
  if (m === 'manual') { S.rooms = rooms().map(r => ({ t: r.t, n: r.n, x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.w.toFixed(2), l: +r.h.toFixed(2), d: r.d, wn: r.wn })); }
  else { const M = model(); S.W = +M.W.toFixed(2); S.D = +M.D.toFixed(2); S.rooms = S.rooms.filter(r => r.t !== 'couloir').map(r => ({ t: r.t, n: r.n, s: SIDE[r.t] || 'f', w: r.w, l: r.l })); }
  S.mode = m;
}

/* ---------- 7. Stockage : MySQL via api.php, sinon localStorage ---------- */
async function api(a, body) {
  const r = await fetch('api.php?action=' + a, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error('api'); return r.json();
}
const LS = () => JSON.parse(localStorage.getItem('plangen') || '[]');
const store = {
  async list() { try { return await api('list'); } catch (e) { return LS().map(p => ({ id: p.id, name: p.name })); } },
  async get(id) { try { return await api('get&id=' + id); } catch (e) { return LS().find(p => p.id == id); } },
  async save(p) { try { return await api('save', p); } catch (e) { const a = LS(); p.id = p.id || Date.now(); const i = a.findIndex(x => x.id == p.id); i < 0 ? a.push(p) : a[i] = p; localStorage.setItem('plangen', JSON.stringify(a)); return { id: p.id }; } },
  async del(id) { try { await api('delete', { id }); } catch (e) { localStorage.setItem('plangen', JSON.stringify(LS().filter(p => p.id != id))); } }
};
async function refreshList() { const l = await store.list(); $('#saved').innerHTML = l.map(p => `<option value="${p.id}" ${p.id == curId ? 'selected' : ''}>${esc(p.name)}</option>`).join('') || '<option value="">(aucun projet)</option>'; }

function init() {
  fillForm(); refreshList();
  document.addEventListener('input', e => {
    const k = e.target.dataset.k, i = e.target.dataset.i;
    if (k) {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (+e.target.value || 0) : e.target.value;
      if (k === 'mode') { setMode(v); fillForm(); return; } S[k] = v;
    } else if (i !== undefined) {
      const r = S.rooms[i], f = e.target.dataset.f, v = e.target.value;
      if (f === 't') { if (r.n === TYPES[r.t]) r.n = TYPES[v]; r.t = v; if (S.mode !== 'manual') r.s = SIDE[v]; buildRooms(); }
      else if (['w', 'l'].includes(f)) r[f] = Math.max(.8, +v || .8);
      else if (['x', 'y'].includes(f)) r[f] = Math.max(0, +v || 0);
      else if (f === 'dp') r.dp = v === '' ? undefined : Math.min(1, Math.max(0, +v));
      else r[f] = v;
    } else if (e.target.id === 'fl') floor = +e.target.value;
    render();
  });
  document.addEventListener('click', e => {
    const b = e.target;
    if (b.dataset.tab) { sheet = b.dataset.tab; render(); }
    if (b.dataset.del !== undefined) { S.rooms.splice(+b.dataset.del, 1); buildRooms(); render(); }
  });
  $('#bAdd').onclick = () => { const n = S.rooms.filter(r => r.t === 'chambre').length + 1; const mx = S.mode === 'manual' ? { x: 0.2, y: 0.2, d: 'S', wn: '' } : { s: 'b' }; S.rooms.push({ t: 'chambre', n: 'Chambre ' + n, w: 3.5, l: 3.5, ...mx }); buildRooms(); render(); };
  $('#bEx').onclick = () => { S = EXAMPLE(); curId = null; floor = 0; fillForm(); };
  $('#bSave').onclick = async () => { const r = await store.save({ id: curId, name: S.name, data: S }); curId = r.id; await refreshList(); alert('Projet enregistré'); };
  $('#bLoad').onclick = async () => { const id = $('#saved').value; if (!id) return; const p = await store.get(id); S = { ...DEF(), ...p.data }; curId = p.id; floor = 0; fillForm(); };
  $('#bDel').onclick = async () => { const id = $('#saved').value; if (id && confirm('Supprimer ce projet ?')) { await store.del(id); if (curId == id) curId = null; refreshList(); } };
  $('#bNew').onclick = () => { S = DEF(); curId = null; floor = 0; fillForm(); refreshList(); };
  $('#bSvg').onclick = () => { if (sheet !== 'metre') download(S.name + '-' + sheet + '.svg', new Blob([curSVG()], { type: 'image/svg+xml' })); };
  $('#bPng').onclick = () => {
    if (sheet === 'metre') return;
    const img = new Image(), url = URL.createObjectURL(new Blob([curSVG()], { type: 'image/svg+xml' }));
    img.onload = () => { const c = document.createElement('canvas'); c.width = 2800; c.height = 1980; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 2800, 1980); x.drawImage(img, 0, 0, 2800, 1980); c.toBlob(b => download(S.name + '-' + sheet + '.png', b)); URL.revokeObjectURL(url); };
    img.src = url;
  };
  $('#bPrint').onclick = () => { $('#printArea').innerHTML = sheets().map(s => `<div class="pg">${s.svg}</div>`).join('') + `<div class="pg">${metre()}</div>`; window.print(); };
}
if (typeof window !== 'undefined' && window.document && window.document.addEventListener && !window.__PLANGEN_TEST) init();

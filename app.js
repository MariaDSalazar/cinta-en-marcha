/* Cinta en Marcha: cinco zonas de lógica. Cada paso es una máquina de estados sellada: el navegador solo abre la respuesta de la
   acción que la persona hizo en el estado en que está (ver cifra.js). Los resultados son los que dio SQL Server. */
(() => {
  'use strict';
  const D = window.DATOS, C = window.Cifra, ST = window.STICKERS, IC = window.ICONOS, MAL = window.MALETA, app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'cinta-en-marcha-v1', KN = 'cinta-en-marcha-partidas';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norma = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" fill="${c.includes('fill') ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
  const suma = a => a.reduce((x, y) => x + y, 0), COLORES = ['#EAAA00', '#002C71', '#910048', '#002C38', '#CBD5E8'];

  let E = null, NOCHE = null, U = null, DM = null, busy = false, fx = {}, turno = 0, noche = 0, llegada = 0, ultimaSalida = 0, avisar = false, descargando = false;
  window.__jg = { ocupado: () => busy, estado: () => E, ui: () => U, demo: () => !!DM };                          // para el robot de pruebas
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(E)); } catch { /* sin almacenamiento: sigue en memoria */ } };
  const pasos = r => NOCHE.ui[r].length, estrellas = () => suma(E.st), TOT = () => D.rondas.length * 3;
  const zona = () => D.rondas[E.r];
  const abrirUI = async () => C.abrir(await C.llave(D.sal, E.v, 'ui', E.r, E.p, E.tok), NOCHE.ui[E.r][E.p]);
  async function resolver(a) {
    const k = (await C.huella(D.sal, E.te, a)).slice(0, 12);
    return C.abrir(await C.llave(D.sal, E.v, E.r, E.p, E.te, a), NOCHE.tr[E.r][E.p][k]);
  }
  function traer(v) {
    return new Promise((bien, mal) => { const s = document.createElement('script'); s.src = `d/${v}.js?v=${D.ver}`; s.onload = () => bien(window.NOCHE); s.onerror = () => mal(new Error('datos')); document.head.appendChild(s); });
  }
  async function cargar() { NOCHE = await traer(E.v); if (!E.t1) U = await abrirUI(); }

  // ---------- piezas comunes
  const estrellasHtml = (n, g = '') => `<span class="ests ${g}" role="img" aria-label="${n} de 3 estrellas">${[0, 1, 2].map(i => ic('estrella', i < n ? 'fill on' : 'off')).join('')}</span>`;
  function top() {
    const hechas = E.st.length, n = D.rondas.length, pct = Math.round(hechas / n * 100);
    return `<header class="top no-imp"><div class="l1"><span class="marca">Cinta en Marcha</span><span class="stat" aria-label="Estrellas">${ic('estrella', 'fill')}<b id="pts">${estrellas()}</b><small>de ${TOT()}</small></span></div>
      <div class="ruta" role="progressbar" aria-label="Rondas terminadas" aria-valuenow="${hechas}" aria-valuemin="0" aria-valuemax="${n}"><span class="via" aria-hidden="true"></span>${Array.from({ length: n + 1 }, (_, k) => `<u class="${k <= hechas ? 'on' : ''}" style="left:${k / n * 100}%"></u>`).join('')}<span class="viaja" style="left:${pct}%">${MAL(0)}</span></div></header>`;
  }
  function franja(f) {
    if (!f) return '';
    return `<div class="franja ${f.k || f.c ? 'bien' : 'mal'}" role="status"><span class="stk">${ST[f.st]}</span><div><b>${esc(f.dice)}</b><p>${esc(f.pq)}</p></div></div>`;
  }
  function toast(t) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.className = 'toast no-imp'; el.textContent = t; void el.offsetWidth; el.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('ver'), 4000);
  }
  function fiesta(n) {
    if (QUIETO) return;
    const c = document.createElement('div'); c.className = 'fiesta no-imp';
    c.innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${COLORES[i % 5]};animation-delay:${(Math.random() * .4).toFixed(2)}s"></i>`).join('');
    document.body.appendChild(c); setTimeout(() => c.remove(), 2600);
  }
  const preg = t => `<h2 class="preg">${ic('toque')}<span>${esc(t)}</span></h2>`;

  // ---------- las mecánicas: html(u, v, o) dibuja; o = { fijo: ya resuelto, fx: efectos de una vez }
  const listaEst = (a, g = '') => a === null ? `<div class="estante ${g} nada">sin estante</div>` : `<div class="estante ${g}">${a.length ? a.map(n => `<span class="mm" data-n="${n}">${MAL(n % 5, n)}</span>`).join('') : '<em>vacío</em>'}</div>`;
  const pista = t => `<p class="pista">${ic('pista')}<span>${esc(t)}</span></p>`;
  const evento = ([i, t], k, on) => `<li class="${on ? 'on' : ''}" data-ev="${k}">${ic(i)}<span>${esc(t)}</span></li>`;
  const MEC = {
    reja(u, v, o) {
      const w = v.w || [], s = o.fx.sale, et = u.campos[0][1];
      return `${u.tab.length ? `<div class="tablero"><span>Tablero de vuelos</span>${u.tab.map(c => `<b class="${o.fx.nuevo && u.ev && u.ev.mas === c ? 'nuevo' : ''}">${esc(c)}</b>`).join('')}</div>` : ''}
        ${u.ev ? `<p class="aviso-ev ${o.fx.nuevo ? 'entra' : ''}">${ic('mega')}<span>${esc(u.ev.t)}</span></p>` : ''}
        <div class="escena"><div class="cintam"></div>${s ? `<div class="vj sale ${s.entra ? 'dentro' : 'fuera'}">${MAL(s.col)}</div>` : ''}<div class="vj ${o.fx.nuevo ? 'llega' : 'quieta'} ${o.fx.mal ? 'tiembla' : ''}">${MAL(u.col)}</div><div class="arco ${o.fx.mal ? 'rojo' : ''}"><i></i></div></div>
        <div class="ficha">${u.campos.map(([c, x, vac]) => `<div><small>${esc(c)}</small><b class="${vac ? 'vac' : ''}">${esc(x)}</b></div>`).join('')}</div>
        ${preg('¿Entra o rompe una regla?')}<div class="reglas">${u.reglas.map(([id, i, t]) => `<button class="regla ${w.includes(id) ? 'mal' : ''}" data-a="${id}"${w.includes(id) || o.fijo ? ' disabled' : ''}>${ic(i)}<span>${esc(t)}</span></button>`).join('')}</div>
        <button class="btn oro" data-a="${u.entra}"${w.includes(u.entra) || o.fijo ? ' disabled' : ''}>${ic('entra')}Entra</button>
        <p class="den"><span>Dentro:</span>${u.den.length ? u.den.map(x => `<b>${esc(x)}</b>`).join('') : '<em>ninguna</em>'}<span class="dv">Devueltas: ${u.dev}</span></p>`;
    },
    desarme(u, v, o) {
      const q = new Set(v.q || []), d = u.d, tap = new Set(u.toca), bl = new Set(o.fx.bl || []), ult = o.fx.ult, no = o.fx.no;
      const at = id => id && tap.has(id) && !o.fijo ? ` data-a="${id}" role="button" tabindex="0"` : '';
      const cl = id => `pz ${id && tap.has(id) ? 'tap' : ''} ${bl.has(id) ? 'estorba' : ''} ${no === id ? 'sacude' : ''}`;
      const pto = (id, x, y) => id && tap.has(id) ? `<circle class="pto" cx="${x}" cy="${y}" r="5"/>` : '';
      const vive = (id, de) => !(q.has(id) || (de && q.has(de))), cae = (id, de) => ult && (ult === id || ult === de);
      const ver = (id, de, g) => vive(id, de) ? g : cae(id, de) ? g.replace('class="pz', 'class="cae pz').replace(/ data-a="\w+"/g, '') : '';
      let g = '';
      d.fks.forEach(f => {
        const iz = f.lado === 'i', x = iz ? d.x0 : d.x1, k = iz ? 26 : 304, s = iz ? -1 : 1, my = (f.y1 + f.y2) / 2;
        g += ver(f.id, f.de, `<g class="${cl(f.id)} fk"${at(f.id)} aria-label="Enlace FK"><path d="M${x} ${f.y1}H${k}V${f.y2}H${x + s * 12}"/><polygon points="${x},${f.y2} ${x + s * 14},${f.y2 - 8} ${x + s * 14},${f.y2 + 8}"/><circle class="hit" cx="${k}" cy="${my}" r="26"/><circle class="nudo" cx="${k}" cy="${my}" r="21"/><text x="${k}" y="${my + 6}" text-anchor="middle">FK</text></g>`);
      });
      d.tablas.forEach(t => {
        const filas = t.filas.map(([id, tx], i) => { const y = t.y + t.hh + t.fh * i; return ver(id || t.id + i, null, `<g class="${cl(id)} fila"${at(id)} aria-label="Columna ${esc(tx)}"><rect x="${t.x}" y="${y}" width="${t.w}" height="${t.fh}"/><text x="${t.x + 22}" y="${y + t.fh / 2 + 6}">${esc(tx)}</text>${pto(id, t.x + 11, y + t.fh / 2)}</g>`); }).join('');
        const n = t.filas.length;
        g += ver(t.id, null, `<g class="pz tabla">${filas}<g class="${cl(t.id)} cab"${at(t.id)} aria-label="Tabla ${esc(t.n)}"><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.hh}"/><text x="${t.x + 22}" y="${t.y + t.hh / 2 + 7}">${esc(t.n)}</text>${pto(t.id, t.x + 11, t.y + t.hh / 2)}</g><rect class="borde" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.hh + t.fh * n}"/></g>`);
      });
      d.chips.forEach(c => {
        const L = c.t.split('|'), h = 22 * L.length + 16, x = d.x1 + 10, yy = c.y - h / 2;
        g += ver(c.id, c.de, `<g class="${cl(c.id)} chip"${at(c.id)} aria-label="${esc(L.join(' '))}">${c.ys.map(y => `<path d="M${d.x1} ${y}H${x}"/>`).join('')}<rect x="${x}" y="${yy}" width="104" height="${h}" rx="12"/>${L.map((l, i) => `<text x="${x + 52}" y="${yy + 25 + i * 22}" text-anchor="middle">${esc(l)}</text>`).join('')}</g>`);
      });
      return `<p class="meta">${ic('meta')}<span>${esc(u.meta)}</span></p><div class="diag"><svg viewBox="0 0 360 ${d.h}">${g}</svg></div>${o.fijo ? '' : `<p class="ayuda">Toque una pieza con punto dorado, un enlace FK o una etiqueta para quitarla.</p>`}`;
    },
    texto(u, v, o) {
      const n = v.n ?? u.ini, max = u.rango[1];
      return `${pista(u.pista)}<div class="molde" style="--n:${max}"><div class="marco"><div class="fm">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'si' : ''}">${i + 1}</i>`).join('')}</div>
        ${u.vals.map(x => `<div class="fl">${Array.from({ length: max }, (_, i) => `<b class="${i < x.length ? (i < n ? 'ok' : 'pasa') : i < n ? 'libre' : ''}">${esc(x[i] || '')}</b>`).join('')}</div>`).join('')}</div></div>
        ${preg('¿De cuántos lugares debe ser el molde de la etiqueta?')}<div class="pasador"><button data-s="-1" aria-label="Menos"${o.fijo || n <= u.rango[0] ? ' disabled' : ''}>−</button><output>VARCHAR(${n})</output><button data-s="1" aria-label="Más"${o.fijo || n >= max ? ' disabled' : ''}>+</button></div>${v.msj ? `<p class="msj">${esc(v.msj)}</p>` : ''}${o.fijo ? '' : `<button class="btn" data-go="1">${ic('corre', 'fill')}Probar el molde</button>`}`;
    },
    numero(u, v, o) {
      const [p, s] = v.ps || u.ini, en = p - s, I = 6, F = 4;
      const fila = x => { const [a, b = ''] = x.split('.'); return `<div class="fl num">${Array.from({ length: I }, (_, i) => { const k = I - i, ch = k <= a.length ? a[a.length - k] : ''; return `<b class="${ch ? (k <= en ? 'ok' : 'pasa') : k <= en ? 'libre' : ''}">${ch}</b>`; }).join('')}<u>.</u>${Array.from({ length: F }, (_, i) => { const ch = b[i] || ''; return `<b class="${ch ? (i < s ? 'ok' : 'pasa') : i < s ? 'libre' : ''}">${ch}</b>`; }).join('')}</div>`; };
      const g = v.g || [];
      return `${pista(u.pista)}<div class="molde num">${u.vals.map(fila).join('')}</div>${g.length ? `<table class="guard"><tr><th>Llegó</th><th>Quedó guardado</th></tr>${g.map(([a, b, k]) => `<tr class="${k ? '' : 'm'}"><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>` : ''}${v.msj ? `<p class="msj">${esc(v.msj)}</p>` : ''}
        ${preg('¿Cuántas cifras en total y cuántas son decimales?')}<div class="dos"><div class="pasador"><small>Total de cifras</small><button data-s="-1" data-e="0" aria-label="Menos cifras"${o.fijo || p <= 2 ? ' disabled' : ''}>−</button><output>${p}</output><button data-s="1" data-e="0" aria-label="Más cifras"${o.fijo || p >= 9 ? ' disabled' : ''}>+</button></div>
        <div class="pasador"><small>Decimales</small><button data-s="-1" data-e="1" aria-label="Menos decimales"${o.fijo || s <= 0 ? ' disabled' : ''}>−</button><output>${s}</output><button data-s="1" data-e="1" aria-label="Más decimales"${o.fijo || s >= 4 ? ' disabled' : ''}>+</button></div></div><p class="tipo">DECIMAL(${p},${s})</p>${o.fijo ? '' : `<button class="btn" data-go="1">${ic('corre', 'fill')}Probar el molde</button>`}`;
    },
    pareja(u, v, o) {
      const a = v.as || {}, sel = v.sel, us = Object.values(a), nom = Object.fromEntries(u.moldes), R = Object.fromEntries((v.res || []).map(([c, k, t]) => [c, [k, t]]));
      return `${preg('Toque una columna y luego su molde. Cada molde se usa una vez.')}<div class="cols">${u.cols.map(([id, n, t]) => `<button class="col ${sel === id ? 'sel' : ''} ${R[id] ? (R[id][0] ? 'si' : 'no') : ''}" data-col="${id}"${o.fijo ? ' disabled' : ''}><span><b>${esc(n)}</b>${esc(t)}${R[id] ? `<em>${ic(R[id][0] ? 'check' : 'cruz')}${esc(R[id][1])}</em>` : ''}</span><i class="${a[id] ? 'on' : ''}">${a[id] ? esc(nom[a[id]]) : 'molde'}</i></button>`).join('')}</div>
        <div class="moldes">${u.moldes.map(([id, t]) => `<button class="mol ${us.includes(id) ? 'usado' : ''}" data-mol="${id}"${o.fijo || !sel ? ' disabled' : ''}>${esc(t)}</button>`).join('')}</div>${o.fijo ? '' : `<button class="btn" data-go="1"${us.length < u.cols.length ? ' disabled' : ''}>${ic('corre', 'fill')}Probar los moldes</button>`}`;
    },
    noche(u, v, o) {
      const w = v.w || [];
      return `<div class="vivo" id="vivo"><small>Estante al empezar la noche</small>${listaEst(u.ini)}</div><ol class="evs">${u.evs.map((e, k) => evento(e, k, false)).join('')}</ol>
        ${o.fijo ? '' : preg('¿Cómo queda el estante al final?') + `<div class="opc">${u.ops.map(([id, a]) => `<button class="${w.includes(id) ? 'mal' : ''}" data-a="${id}"${w.includes(id) ? ' disabled' : ''}>${listaEst(a, 'chico')}</button>`).join('')}</div>`}`;
    },
    plan(u, v, o) {
      const s = v.seq || [], C2 = Object.fromEntries(u.cartas.map(c => [c[0], c]));
      return `<p class="meta">${ic('meta')}<span>${esc(u.texto)}</span></p><div class="pares"><div class="vivo" id="vivo"><small>Estante al empezar</small>${listaEst(u.ini)}</div><div class="vivo quiere"><small>Así lo piden</small>${listaEst(u.meta)}</div></div>
        ${s.length ? `<ol class="evs mia">${s.map((id, k) => evento(C2[id].slice(1), k, false)).join('')}</ol>` : ''}${v.msj ? `<p class="msj">${esc(v.msj)}</p>` : ''}
        ${o.fijo ? '' : preg(`Toque, en orden, lo que haría (hasta ${u.largo}). No hace falta usarlo todo.`) + `<div class="cartas">${u.cartas.map(([id, i, t]) => { const k = s.indexOf(id); return `<button class="carta ${k >= 0 ? 'sel' : ''}" data-carta="${id}"${k < 0 && s.length >= u.largo ? ' disabled' : ''}><i>${k >= 0 ? k + 1 : ''}</i>${ic(i)}<span>${esc(t)}</span></button>`; }).join('')}</div><button class="btn" data-go="1"${s.length ? '' : ' disabled'}>${ic('corre', 'fill')}Correr la noche</button>`}`;
    },
    caso(u, v, o) {
      const pr = v.pr || [], R = Object.fromEntries(pr.map(([id, t, k]) => [id, [t, k]])), de = v.de || [], w = v.w || [], quedan = u.libres - pr.length;
      return `<p class="meta">${ic('lupa')}<span>${esc(u.pide)}</span></p><p class="ayuda fuerte">${o.fijo ? `Pruebas usadas: ${pr.length}` : quedan > 0 ? `Pruebas que le quedan: ${quedan}` : 'Ya usó sus pruebas: otra cuesta una estrella.'}</p>
        <div class="prus">${u.pru.map(([id, t]) => `<button class="pru ${R[id] ? 'hecha' : ''}" data-p="${id}"${R[id] || o.fijo ? ' disabled' : ''}>${ic('corre', 'fill')}<span>${esc(t)}${R[id] ? `<em class="${o.fx.pr === id ? 'sello' : ''} ${R[id][1] ? '' : 'no'}">${esc(R[id][0])}</em>` : ''}</span></button>`).join('')}</div>
        ${preg('¿Cuál versión explica todo?')}<div class="sosp">${u.sosp.map(([id, t]) => `<div class="sp ${de.includes(id) ? 'desc' : ''} ${w.includes(id) ? 'mal' : ''} ${v.si === id ? 'si' : ''}"><p>${esc(t)}</p>${o.fijo || w.includes(id) ? '' : `<div><button class="ch" data-de="${id}">${de.includes(id) ? 'Recuperar' : 'Descartar'}</button><button class="ch az" data-a="${id}">Fue esta</button></div>`}</div>`).join('')}</div>`;
    },
  };
  // qué recuerda la pantalla después de cada acción
  function aplica(u, v, a, x) {
    const f = {};
    if (u.mec === 'reja') { if (!x.k) { v.w = [...(v.w || []), a]; f.mal = 1; } }
    else if (u.mec === 'desarme') { if (x.quita) { v.q = [...(v.q || []), x.quita]; f.ult = x.quita; } else { f.bl = x.bl; f.no = a; } }
    else if (u.mec === 'texto' || u.mec === 'numero') { v.msj = x.msj; if (x.g) v.g = x.g; }
    else if (u.mec === 'pareja') { v.res = x.res; v.sel = null; }
    else if (u.mec === 'noche') { if (x.k) { v.est = x.est; f.est = x.est; } else v.w = [...(v.w || []), a]; }
    else if (u.mec === 'plan') { f.est = x.est; f.falla = x.falla; v.msj = x.falla ? x.pq : ''; }
    else if (u.mec === 'caso') { if (x.prueba) { v.pr = [...(v.pr || []), [a, ...x.prueba]]; f.pr = a; } else if (x.k) v.si = a; else v.w = [...(v.w || []), a]; }
    return f;
  }
  const accion = (u, v) => u.mec === 'texto' ? u.ids[v.n ?? u.ini] : u.mec === 'numero' ? u.ids[(v.ps || u.ini).join(',')] : u.mec === 'pareja' ? u.cols.map(c => v.as[c[0]]).join('-') : (v.seq || []).join('-');
  function local(b, u, v) {                                                      // toques que no responden nada todavía: ajustar, elegir, descartar
    const d = b.dataset;
    if (d.s) { if (u.mec === 'texto') v.n = (v.n ?? u.ini) + +d.s; else { const q = [...(v.ps || u.ini)]; q[+d.e] += +d.s; v.ps = q; v.g = null; } v.msj = ''; return true; }
    if (d.col) { v.sel = v.sel === d.col ? null : d.col; return true; }
    if (d.mol) { const a = { ...(v.as || {}) }; const ya = Object.keys(a).find(k => a[k] === d.mol), antes = a[v.sel]; if (ya && ya !== v.sel) { if (antes) a[ya] = antes; else delete a[ya]; } a[v.sel] = d.mol; v.as = a; v.sel = null; v.res = null; return true; }
    if (d.carta) { const s = v.seq || []; v.seq = s.includes(d.carta) ? s.filter(z => z !== d.carta) : [...s, d.carta]; v.msj = ''; return true; }
    if (d.de) { const s = v.de || []; v.de = s.includes(d.de) ? s.filter(z => z !== d.de) : [...s, d.de]; return true; }
    return false;
  }
  function animaNoche(est, ini, raiz) {                                          // repite la noche evento por evento; nunca bloquea los botones
    const yo = ++noche, cont = $('#vivo', raiz); if (!cont || !est) return;
    const evs = $$('.evs li', raiz), pinta = k => { cont.innerHTML = `<small>${k < 0 ? 'Estante al empezar la noche' : k === est.length - 1 ? 'Estante al final' : 'Estante ahora'}</small>${listaEst(k < 0 ? ini : est[k])}`; cont.classList.remove('late'); void cont.offsetWidth; if (k >= 0) cont.classList.add('late'); evs.forEach((e, j) => { e.classList.toggle('on', j === k); e.classList.toggle('ya', j < k); }); };
    if (QUIETO) return pinta(est.length - 1);
    let k = -1; pinta(k);
    (function sig() { setTimeout(() => { if (yo !== noche || !cont.isConnected) return; k++; pinta(k); if (k < est.length - 1) sig(); }, k < 0 ? 450 : 800); })();
  }

  // ---------- inicio
  function inicio() {
    app.innerHTML = `<section class="pant"><div class="heroe"><div class="cintam"></div>${[0, 1, 2].map(i => `<span class="hm h${i}">${MAL(i)}</span>`).join('')}<span class="cara">${ST.bien}</span></div><h1 class="banda">Cinta en Marcha</h1>
      <p class="ayuda">Es la noche en el aeropuerto de Valle Alto. Cada maleta es una fila, cada cinta es una tabla y cada reja es una regla. Son cinco zonas de lógica: piense antes de tocar.</p>
      <div class="tarj como"><p>${ic('ojo')}<span>Cada zona empieza con un ejemplo resuelto que se mueve solo.</span></p><p>${ic('toque')}<span>Después juega usted, tocando la pantalla.</span></p><p>${ic('estrella')}<span>Cada ronda da hasta 3 estrellas. Cada error quita una, pero siempre puede seguir.</span></p></div>
      <form id="f" autocomplete="off"><label for="nom">Escriba su nombre y apellido</label><input id="nom" type="text" maxlength="60" autocapitalize="words" enterkeyhint="go"><p class="aviso" id="aviso"></p><button class="btn oro" id="empezar" style="margin-top:14px">Empezar ${ic('flecha')}</button></form></section>`;
  }
  async function empezar() {
    const nom = $('#nom').value.trim().replace(/\s+/g, ' '), nn = norma(nom);
    if (nn.split(' ').length < 2 || nn.length < 5) { $('#aviso').textContent = 'Escriba su nombre y su apellido.'; return; }
    let n = 1; try { n = +(localStorage.getItem(KN) || 0) + 1; localStorage.setItem(KN, n); } catch { /* sin almacenamiento */ }
    const v = parseInt((await C.huella(D.sal, 'nombre', nn)).slice(0, 8), 16) % D.n;                               // la variante sale del nombre
    E = { nom, nn, v, n, t0: Date.now(), t1: 0, r: 0, p: 0, tok: 'ini', te: 'ini', vis: {}, err: 0, st: [], er: [], fin: [], sal: 0, vistas: [], sig: null, fb: null, modo: 'juego' };
    await cargar(); guardar(); pintar(); window.scrollTo(0, 0);
  }

  // ---------- el ejemplo resuelto de cada zona: se juega solo con el mismo dibujo del juego
  async function pantallaDemo() {
    const z = zona(), yo = ++turno;
    if (!DM || DM.z !== z) { const d = await C.abrir(await C.llave(D.sal, 'demo', z), D.demo[z]); DM = { z, d }; }
    if (yo !== turno) return;
    Object.assign(DM, { i: 0, te: '0', vis: {}, k: 0, fb: null, fx: { nuevo: 1 } });
    const Z = D.zonas[z];
    app.innerHTML = top() + `<section class="pant"><div class="etq"><span>Zona ${z + 1} de ${D.zonas.length}</span><span class="cont">Ejemplo</span></div><h1 class="banda chica">${esc(Z.t)}</h1><p class="que">${esc(Z.q)}</p>
      <div class="demo" id="demo"><p class="mire">${ic('ojo')}Mire cómo se hace</p><div id="dcuerpo"></div><span class="mano" id="mano" aria-hidden="true"></span></div><p class="paso-txt" id="ptx" aria-live="polite"></p>
      <div class="dock no-imp"><button class="btn sec chico" id="otravez">${ic('repetir')}Ver otra vez</button><button class="btn oro" id="listo">Entendido, probar yo ${ic('flecha')}</button></div></section>`;
    correDemo(yo);
  }
  function pintaDemo(fijo) { const u = DM.d.pasos[DM.i].ui; $('#dcuerpo').innerHTML = `<div class="mec ${u.mec}" inert>${MEC[u.mec](u, DM.vis, { fijo, fx: DM.fx || {} })}</div>${franja(DM.fb)}`; }
  async function correDemo(yo) {
    const pausa = ms => new Promise(r => setTimeout(r, QUIETO ? 400 : ms)), vale = () => yo === turno && $('#dcuerpo');
    const guion = DM.d.guion; pintaDemo(); await pausa(900);
    for (const [txt, a] of guion) {
      if (!vale()) return;
      const P = DM.d.pasos[DM.i], u = P.ui; $('#ptx').textContent = txt;
      await pausa(1300 + txt.length * 28); if (!vale()) return;
      const va = async sel => { const e = $(sel, $('#dcuerpo')), m = $('#mano'), b = $('#demo').getBoundingClientRect(); if (e) { const q = (e.querySelector('.nudo') || e).getBoundingClientRect(); m.style.left = q.left - b.left + q.width / 2 + 'px'; m.style.top = q.top - b.top + q.height / 2 + 'px'; m.classList.add('ve'); await pausa(750); m.classList.add('toca'); await pausa(260); m.classList.remove('toca'); } };
      if (Array.isArray(a)) { for (let k = 0; k < a[1]; k++) { await va('[data-s="1"]'); if (!vale()) return; DM.vis.n = (DM.vis.n ?? u.ini) + 1; pintaDemo(); await pausa(350); } continue; }
      const id = a === 0 ? P.sol[0] : a === 'probar' ? accion(u, DM.vis) : a;
      await va(a === 'probar' ? '[data-go]' : `[data-a="${id}"],[data-p="${id}"]`); if (!vale()) return;
      const x = P.tr[DM.te + '|' + id]; DM.fx = aplica(u, DM.vis, id, x); if (x.e) DM.te = x.e;
      DM.fb = x.dice ? x : null; pintaDemo(!!x.k);
      if (DM.fx.est) animaNoche(DM.fx.est, u.ini, $('#dcuerpo'));
      await pausa(1900); if (!vale()) return;
      if (x.k && DM.i + 1 < DM.d.pasos.length) { const s = { col: u.col, entra: x.entra }; DM.i++; DM.vis = {}; DM.fb = null; DM.fx = { nuevo: 1, sale: s }; pintaDemo(); await pausa(700); }
    }
    if (vale()) { $('#mano').classList.remove('ve'); $('#ptx').textContent = 'Así se juega. Cuando quiera, empiece.'; }
  }

  // ---------- la ronda
  function pintarJuego() {
    const R = E.r, z = zona(), Z = D.zonas[z], n = pasos(R), fijo = !!E.sig, nr = D.rondas.slice(0, R + 1).filter(x => x === z).length;
    const cont = U.mec === 'reja' ? `Maleta ${E.p + 1} de ${n}` : n > 1 ? `Reto ${E.p + 1} de ${n}` : '';
    app.innerHTML = top() + `<section class="pant jg" data-mec="${U.mec}"><div class="etq"><span>Zona ${z + 1}: ${esc(Z.t)}, ronda ${nr}</span>${cont ? `<span class="cont">${cont}</span>` : ''}</div>
      <div class="mec ${U.mec}" id="mec">${MEC[U.mec](U, E.vis, { fijo, fx })}</div><div class="dock no-imp">${franja(E.fb)}${fijo ? `<button class="btn oro" id="sig">${E.p + 1 < n ? 'Seguir' : 'Terminar la ronda'} ${ic('flecha')}</button>` : ''}<p class="vidas">Estrellas de esta ronda ${estrellasHtml(Math.max(0, 3 - E.err))}</p></div></section>`;
    if (fx.est) animaNoche(fx.est, U.ini, app);
    fx = {};
  }
  async function actuar(a) {
    if (E.sig || !NOCHE) return;
    const x = await resolver(a), err = !x.k && !x.c, extra = U.mec === 'caso' && x.prueba && (E.vis.pr || []).length >= U.libres;
    if (err || extra) E.err++;
    fx = aplica(U, E.vis, a, x);
    if (x.te) E.te = x.te;
    E.fb = x.dice ? { dice: x.dice, pq: x.pq, st: x.st, k: x.k, c: x.c } : extra ? { dice: 'Prueba extra.', pq: 'Costó una estrella.', st: 'duda', c: 0 } : null;
    if (x.k) {
      E.sig = x.tok;
      if (U.mec === 'reja') { const s = { col: U.col, entra: x.entra }; await avanzar(); fx = E.modo === 'juego' ? { nuevo: 1, sale: s } : {}; llegada = Date.now(); guardar(); pintar(); return; }
    }
    guardar(); pintarJuego();
    if (err && navigator.vibrate) navigator.vibrate(40);
    const f = $('.franja'); if (f) { f.classList.add('entra'); }
    if (err) { const z = $('.estorba, .tiembla'); if (z) z.scrollIntoView({ block: 'nearest' }); }
  }
  async function avanzar() {
    turno++;
    const tok = E.sig; E.sig = null; E.vis = {};
    if (E.p + 1 < pasos(E.r)) { E.p++; E.tok = E.te = tok; U = await abrirUI(); if (U.mec !== 'reja') E.fb = null; }
    else { E.st[E.r] = Math.max(0, 3 - E.err); E.er[E.r] = E.err; E.fin[E.r] = tok; E.modo = 'cierre'; }
  }
  function pintarCierre() {
    const n = E.st[E.r], ult = E.r + 1 >= D.rondas.length, t = ['Se complicó, pero lo resolvió.', 'Bien, con tropiezos.', 'Muy bien.', 'Ronda perfecta.'][n];
    app.innerHTML = top() + `<section class="pant cierre-r"><span class="gran">${ST[n === 3 ? 'bien' : n ? 'duda' : 'perdida']}</span>${estrellasHtml(n, 'grande')}<h1>${t}</h1>${franja(E.fb)}<button class="btn oro" id="otra">${ult ? 'Ver mi bitácora' : D.rondas[E.r + 1] !== zona() ? 'Ir a la zona ' + (D.rondas[E.r + 1] + 1) : 'Siguiente ronda'} ${ic('flecha')}</button></section>`;
  }
  async function otraRonda() {
    turno++;
    if (E.r + 1 >= D.rondas.length) { E.t1 = Date.now(); guardar(); fiesta(120); pintar(); window.scrollTo(0, 0); return; }
    const tok = E.fin[E.r]; E.r++; Object.assign(E, { p: 0, tok, te: tok, vis: {}, err: 0, fb: null, sig: null, modo: 'juego' });
    U = await abrirUI(); fx = { nuevo: 1 }; guardar(); pintar(); window.scrollTo(0, 0);
  }

  // ---------- bitácora
  const mascara = () => E.st.reduce((a, n, i) => a + n * 4 ** i, 0);
  async function codigo() {
    const sec = (await C.abrir(await C.llave(D.sal, 'sec', E.v, E.fin.join(';')), NOCHE.sec)).sec;
    return `V${E.v + 1}-P${E.n}-${estrellas()}-${mascara().toString(36).toUpperCase()}-${(await C.huella(sec, E.nn, E.v, E.n, mascara())).slice(0, 8).toUpperCase()}`;
  }
  async function informe() {
    const n = estrellas(), min = Math.max(1, Math.round((E.t1 - E.t0) / 60000)), nota = (n / TOT() * 10).toFixed(1).replace('.', ',');
    let linea = ''; try { linea = await codigo(); } catch { linea = 'No se pudo generar el código'; }
    const fecha = new Date(E.t1).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    const zonas = D.zonas.map((Z, z) => { const rs = D.rondas.map((x, i) => [x, i]).filter(([x]) => x === z).map(([, i]) => i); return `<li><b>${z + 1}. ${esc(Z.t)}</b>${rs.map(i => estrellasHtml(E.st[i])).join('')}</li>`; }).join('');
    const rep = D.zonas.map((Z, z) => { const s = D.rondas.reduce((a, x, i) => x === z ? a + (3 - E.st[i]) : a, 0); return s >= 2 ? `<li><b>${esc(Z.t)}.</b> ${esc(Z.rep)}</li>` : ''; }).join('');
    const frase = n / TOT() >= .9 ? 'Noche impecable.' : n / TOT() >= .65 ? 'Buena noche.' : 'La cinta llegó a su destino, con golpes.';
    app.innerHTML = `<section class="pant rep" id="informe"><p class="ceja">Bitácora de Cinta en Marcha</p><h1 id="quien">${esc(E.nom)}</h1>
      <dl class="datos"><dt>Fecha</dt><dd>${esc(fecha)}</dd><dt>Duración</dt><dd>${min} min</dd><dt>Variante</dt><dd>${E.v + 1} de ${D.n}</dd><dt>Partida número</dt><dd id="npart">${E.n}</dd><dt>Errores</dt><dd id="errs">${suma(E.er)}</dd><dt>Salidas de la página</dt><dd id="salidas">${E.sal}</dd></dl>
      <div class="total"><span class="num" id="total" data-pts="${n}">${n}</span><p>de ${TOT()} estrellas<br>${nota} sobre 10. ${frase}</p></div><div class="verif">Código de verificación<code id="linea">${esc(linea)}</code></div>
      <h3>Estrellas por zona</h3><ul class="zonas">${zonas}</ul><h3>Qué repasar</h3>${rep ? `<ul>${rep}</ul>` : '<p>Nada: razonó todo con acierto.</p>'}
      <div class="botones no-imp"><button class="btn" id="imprimir">${ic('imprimir')}Guardar como PDF</button><button class="btn sec" id="nuevo">Jugar otra vez</button></div></section>`;
  }

  // ---------- revisión de una bitácora: ...#revisar
  function revisar() {
    app.innerHTML = `<section class="pant"><h1 class="banda">Revisión</h1><p class="ayuda">Compruebe que una bitácora no fue alterada.</p><form id="f" autocomplete="off"><label for="cl">Clave de revisión</label><input id="cl" type="password" required><label for="no" style="margin-top:12px">Nombre, como aparece en la bitácora</label><input id="no" type="text" required>
      <label for="li" style="margin-top:12px">Código de verificación</label><input id="li" type="text" required><button class="btn" id="ver" style="margin-top:14px">Revisar</button></form><div id="res"></div></section>`;
  }
  async function verificar() {
    const r = $('#res'), nn = norma($('#no').value), m = $('#li').value.trim().toUpperCase().match(/^V(\d+)-P(\d+)-(\d+)-([0-9A-Z]+)-([0-9A-F]{8})$/);
    const dice = (c, t) => { r.className = 'res ' + c; r.textContent = t; };
    if (!m) return dice('mal', 'El código no tiene el formato de la bitácora.');
    let K; try { K = await C.abrir(await C.llaveClave($('#cl').value.trim(), D.sal), D.rev); } catch { return dice('mal', 'Clave de revisión incorrecta.'); }
    const v = +m[1] - 1, np = +m[2], mask = parseInt(m[4], 36), st = K.lab.map((_, i) => Math.floor(mask / 4 ** i) % 4), cod = (await C.huella(K.sec, nn, v, np, mask)).slice(0, 8).toUpperCase();
    if (cod !== m[5] || suma(st) !== +m[3] || mask >= 4 ** K.lab.length) return dice('mal', 'No coincide: la bitácora fue alterada, o el nombre o el código están mal copiados.');
    r.className = 'res bien'; r.innerHTML = `${ic('check')} Auténtica. Variante ${v + 1}, partida número ${np}, ${suma(st)} de ${K.lab.length * 3} estrellas.<br>${K.lab.map((t, i) => `${esc(t)}: ${st[i]}`).join('<br>')}`;
  }

  // ---------- salidas de la página: se cuentan y aparecen en la bitácora (no bloquean ni reinician)
  function salida() { if (!E || E.t1 || descargando) return; const a = Date.now(); if (a - ultimaSalida < 1500) return; ultimaSalida = a; E.sal++; avisar = true; guardar(); }
  function regreso() { if (avisar && E && !E.t1) { avisar = false; toast(`Salió de esta página. Queda anotado en la bitácora (${E.sal}).`); } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) salida(); else regreso(); });
  window.addEventListener('blur', () => setTimeout(() => { if (!document.hasFocus()) salida(); }, 250));
  window.addEventListener('focus', regreso);
  window.addEventListener('beforeunload', () => { descargando = true; });
  window.addEventListener('pagehide', () => { descargando = true; });

  // ---------- eventos
  async function tocar(b) {
    if (b.id === 'imprimir') return window.print();
    if (b.id === 'nuevo') { if (confirm('Se borrará esta bitácora de este dispositivo. ¿Ya la guardó?')) { try { localStorage.removeItem(KEY); } catch { /* nada */ } E = null; U = null; DM = null; pintar(); } return; }
    if (b.id === 'otravez') return pantallaDemo();
    if (b.id === 'listo') { turno++; DM = null; E.vistas.push(zona()); fx = { nuevo: 1 }; guardar(); pintar(); window.scrollTo(0, 0); return; }
    if (b.closest('#dcuerpo')) return;
    if (b.id === 'sig') { await avanzar(); fx = { nuevo: 1 }; if (E.modo === 'cierre') fiesta(E.st[E.r] * 14); guardar(); pintar(); window.scrollTo(0, 0); return; }
    if (b.id === 'otra') return otraRonda();
    if (!$('#mec') || E.sig || (U.mec === 'reja' && Date.now() - llegada < 280)) return;                        // un doble toque no cuenta para la maleta siguiente
    if (local(b, U, E.vis)) { guardar(); $('#mec').innerHTML = MEC[U.mec](U, E.vis, { fijo: false, fx: {} }); return; }
    const a = b.dataset.a || b.dataset.p || (b.dataset.go ? accion(U, E.vis) : null);
    if (a) await actuar(a);
  }
  app.addEventListener('click', async ev => {
    const b = ev.target.closest && ev.target.closest('button, [data-a]'); if (!b || busy || b.disabled || b.id === 'empezar' || b.id === 'ver') return;
    busy = true;
    try { await tocar(b); } catch (e) { console.error(e); toast('Algo no cargó bien. Recargue la página: su avance está guardado.'); } finally { busy = false; }
  });
  app.addEventListener('keydown', ev => { const g = ev.target.closest && ev.target.closest('g[data-a]'); if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  app.addEventListener('submit', async ev => {
    ev.preventDefault(); if (busy) return; busy = true;
    try { if ($('#nom')) await empezar(); else if ($('#li')) await verificar(); } catch (e) { console.error(e); toast('No se pudo abrir el juego. Revise su conexión y pruebe otra vez.'); } finally { busy = false; }
  });
  window.addEventListener('hashchange', () => { if (!busy) pintar(); });

  function pintar() {
    if (location.hash === '#revisar') return revisar();
    if (!E) return inicio();
    if (E.t1) return informe();
    if (E.modo === 'cierre') return pintarCierre();
    if (!E.vistas.includes(zona())) return pantallaDemo();
    pintarJuego();
  }
  (async () => {
    try {
      try { E = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { E = null; }
      if (E && (!Array.isArray(E.st) || !Array.isArray(E.fin) || typeof E.v !== 'number')) E = null;
      if (E && location.hash !== '#revisar') await cargar();
      pintar();
      if (E && !E.t1 && location.hash !== '#revisar' && (E.r || E.p)) toast('Retomamos donde quedó.');
    } catch (e) { console.error(e); app.innerHTML = '<p class="cargando">No se pudo abrir el juego. Recargue la página.</p>'; }
  })();
})();

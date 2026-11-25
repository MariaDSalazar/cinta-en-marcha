/* Dibujos propios (sin emojis): la maleta, sus caras y los iconos. */
(() => {
  'use strict';
  const PET = '#002C38', ORO = '#EAAA00', AZ = '#002C71', MAG = '#910048';
  const COL = [['#EAAA00', '#B98500'], ['#3E6FB5', '#002C71'], ['#B8447F', '#910048'], ['#4E7F8A', '#002C38'], ['#8FA3B8', '#5A6E82']];
  const t = (d, c = PET, w = 4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  window.MALETA = (c, num = '') => {
    const [a, b] = COL[c % 5];
    return `<svg viewBox="0 0 96 88" aria-hidden="true">${t('M34 18V7h28v11', b, 6)}<rect x="6" y="18" width="84" height="58" rx="11" fill="${a}" stroke="${b}" stroke-width="5"/><path d="M26 18v58M70 18v58" stroke="${b}" stroke-width="5"/><circle cx="22" cy="80" r="6" fill="${PET}"/><circle cx="74" cy="80" r="6" fill="${PET}"/>${num !== '' ? `<rect x="29" y="30" width="38" height="34" rx="5" fill="#fff"/><text x="48" y="56" text-anchor="middle" font-size="27" font-weight="800" fill="${PET}" font-family="system-ui,Arial,sans-serif">${num}</text>` : ''}</svg>`;
  };
  const cara = (ojos, extra = '', c = 0) => {
    const [a, b] = COL[c];
    return `<svg viewBox="0 0 120 120" aria-hidden="true">${t('M44 34V20h32v14', b, 7)}<rect x="10" y="34" width="100" height="70" rx="15" fill="${a}" stroke="${PET}" stroke-width="5"/><path d="M26 34v70M94 34v70" stroke="${b}" stroke-width="6"/><circle cx="28" cy="110" r="7" fill="${PET}"/><circle cx="92" cy="110" r="7" fill="${PET}"/>${ojos}${extra}</svg>`;
  };
  const pt = `<circle cx="47" cy="62" r="5.5" fill="${PET}"/><circle cx="73" cy="62" r="5.5" fill="${PET}"/>`;
  const cruz = (x, y) => t(`M${x - 6} ${y - 6}l12 12M${x + 6} ${y - 6}l-12 12`);
  window.STICKERS = {
    bien: cara(pt + t('M46 78q14 13 28 0'), t('M8 18l8 8M112 18l-8 8M60 4v8', ORO, 5)),
    error: cara(cruz(47, 62) + cruz(73, 62) + t('M46 86q7-7 14 0t14 0'), t('M100 10l8 16M110 22l-12 2', MAG, 5), 2),
    perdida: cara(t('M41 60q7-6 13 0M66 60q7-6 13 0') + t('M48 88q12-11 24 0'), `<path d="M80 66c6 9 6 15 0 15s-6-6 0-15z" fill="${AZ}" stroke="#fff" stroke-width="2"/><rect x="86" y="8" width="13" height="13" rx="2" fill="${MAG}" transform="rotate(14 92 14)"/><rect x="102" y="20" width="9" height="9" rx="2" fill="${MAG}"/>`, 4),
    duda: cara(`<circle cx="47" cy="63" r="5.5" fill="${PET}"/><circle cx="73" cy="60" r="5.5" fill="${PET}"/>` + t('M66 48q8-6 15-1') + t('M50 84h18'), `<text x="104" y="30" text-anchor="middle" font-size="34" font-weight="800" fill="${AZ}" font-family="system-ui,Arial,sans-serif">?</text>`, 1),
    alarma: cara(`<circle cx="47" cy="62" r="8" fill="#fff" stroke="${PET}" stroke-width="3"/><circle cx="73" cy="62" r="8" fill="#fff" stroke="${PET}" stroke-width="3"/><circle cx="47" cy="62" r="3" fill="${PET}"/><circle cx="73" cy="62" r="3" fill="${PET}"/><ellipse cx="60" cy="87" rx="8" ry="8" fill="${PET}"/>`, t('M60 4v10M34 10l5 8M86 10l-5 8', MAG, 5)),
  };
  window.ICONOS = {
    check: '<path d="M4.5 12.5l5 5L19.5 7"/>', cruz: '<path d="M6 6l12 12M18 6L6 18"/>', flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>', toque: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>', repetir: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>',
    imprimir: '<path d="M7 9V3.5h10V9M7 17.5H4V10h16v7.5h-3M7 14h10v6.5H7z"/>', mega: '<path d="M4 10v4h4l8 5V5L8 10zM19 9.5a4 4 0 0 1 0 5"/>',
    pista: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.6 10.8c-.7.6-1.1 1.2-1.1 2.2h-5c0-1-.4-1.6-1.1-2.2A6 6 0 0 1 12 3z"/>', meta: '<path d="M5 21V4M5 5h13l-3 4 3 4H5"/>',
    oblig: '<path d="M12 6v7M12 17v.4"/><circle cx="12" cy="12" r="10"/>', rango: '<path d="M3 12h18M7 7v10M17 7v10"/>',
    enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>', unico: '<circle cx="12" cy="12" r="10"/><path d="M10 9l2.5-2v10"/>',
    entra: '<path d="M4 12h11M10 7l5 5-5 5M19 4v16"/>', borra: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>', vacia: '<path d="M4 9l2 11h12l2-11M8 9c0-3 8-3 8 0M9 13l6 4M15 13l-6 4"/>',
    abre: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>', deshace: '<path d="M9 14L4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3"/>',
    guarda: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', tira: '<path d="M5 5l14 14M19 5L5 19"/>', lupa: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>', corre: '<path d="M7 4l13 8-13 8z"/>',
  };
})();

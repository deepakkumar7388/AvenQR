/* ================================================================
   QR Forge — Application Logic
   ================================================================ */
'use strict';

// ── State ────────────────────────────────────────────────────────
let activeType = 'url';
let lastQRData = '';
let activeLogoKey = 'none';
let customLogoURL = null;

const LOGO_ICONS = {
  globe: '🌐', mail: '✉️', phone: '📞',
  chat: '💬', wifi: '📶', star: '⭐', heart: '❤️',
};

const ECL_LABELS = { L: '7% ECL', M: '15% ECL', Q: '25% ECL', H: '30% ECL (Max)' };

const CARD_TITLES = {
  url: 'Enter Website URL',
  dynamic: '⚡ Dynamic Colorful QR Code (Editable Link & Analytics)',
  text: 'Enter Text Content',
  vcard: 'Enter Contact Details (vCard)',
  email: 'Enter Email Details',
  phone: 'Enter Phone Number',
  sms: 'Enter SMS Details',
  whatsapp: 'Enter WhatsApp Details',
  wifi: 'Enter Wi-Fi Network Details',
};

let isDynamicGlobalMode = false;

// ── Mode Toggle ───────────────────────────────────────────────────
function toggleGlobalDynamic(enabled) {
  isDynamicGlobalMode = enabled;
  const statusEl = document.getElementById('modeStatusText');
  if (statusEl) {
    statusEl.textContent = enabled ? '⚡ Dynamic Colorful QR' : 'Simple Static QR';
    statusEl.style.color = enabled ? '#d97706' : 'var(--text-muted)';
  }

  const gradSec = document.getElementById('dynamicGradientsSection');
  const solidSec = document.getElementById('solidColorPickers');

  // Set default colors based on mode
  if (!enabled) {
    activeGradientKey = 'solid';
    if (gradSec) gradSec.style.display = 'none';
    if (solidSec) solidSec.style.display = 'block';
    document.querySelectorAll('.gradient-chip').forEach(b => b.classList.remove('active'));
    document.querySelector('.gradient-chip[data-grad="solid"]')?.classList.add('active');
    setColor('c-fg', 'h-fg', 'colorPreviewFg', '#000000');
    setColor('c-bg', 'h-bg', 'colorPreviewBg', '#ffffff');
  } else {
    activeGradientKey = 'sunset';
    if (gradSec) gradSec.style.display = 'block';
    if (solidSec) solidSec.style.display = 'none';
    document.querySelectorAll('.gradient-chip').forEach(b => b.classList.remove('active'));
    document.querySelector('.gradient-chip[data-grad="sunset"]')?.classList.add('active');
  }

  generateQR();
}

function setColor(pickerId, hexId, previewId, color) {
  const p = document.getElementById(pickerId);
  const h = document.getElementById(hexId);
  const r = document.getElementById(previewId);
  if (p) p.value = color;
  if (h) h.value = color;
  if (r) r.style.background = color;
}

// ── Visual-only nav highlight (no form/scroll side-effects) ───────
function setNavActive(activeId) {
  ['navFreeGen', 'navDynamicGen', 'navSolutions', 'navDocs', 'navPricing'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === activeId);
  });
}

// ── Full mode switch (generator tabs only — Free / Dynamic) ────────
function switchNavMode(type) {
  if (type === 'dynamic') {
    setNavActive('navDynamicGen');
    toggleGlobalDynamic(true);

    // Switch to dynamic form directly (no .click() side-effects)
    document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('is-active'));
    document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
    const dynForm = document.getElementById('form-dynamic');
    if (dynForm) dynForm.classList.add('is-active');
    activeType = 'dynamic';
    const cardTitle = document.getElementById('cardTitle');
    if (cardTitle) cardTitle.textContent = CARD_TITLES['dynamic'];

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else {
    // Free Generator (url mode)
    setNavActive('navFreeGen');
    toggleGlobalDynamic(false);

    // Switch to URL form directly (no .click() to avoid double generateQR)
    document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('is-active'));
    document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
    const urlForm = document.getElementById('form-url');
    if (urlForm) urlForm.classList.add('is-active');
    const urlPill = document.querySelector('.type-pill[data-type="url"]');
    if (urlPill) urlPill.classList.add('active');
    activeType = 'url';
    const cardTitle = document.getElementById('cardTitle');
    if (cardTitle) cardTitle.textContent = CARD_TITLES['url'] || 'Enter Website URL';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── Scroll-to helpers (click handlers on navbar links) ─────────────
function scrollToSolutions(event) {
  if (event && event.preventDefault) event.preventDefault();
  setNavActive('navSolutions');
  const el = document.getElementById('solutionsSection');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToDocs(event) {
  if (event && event.preventDefault) event.preventDefault();
  setNavActive('navDocs');
  const el = document.getElementById('docsSection');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToPricing(event) {
  if (event && event.preventDefault) event.preventDefault();
  setNavActive('navPricing');
  const el = document.getElementById('pricingSection');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── ScrollSpy — visually highlights nav pill while scrolling ────────
// Uses setNavActive ONLY — zero form/scroll side-effects
(function initScrollSpy() {
  const SECTIONS = [
    { id: 'pricingSection', navId: 'navPricing' },
    { id: 'docsSection', navId: 'navDocs' },
    { id: 'solutionsSection', navId: 'navSolutions' },
  ];

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 220;

    // Check sections bottom-to-top so the highest visible wins
    for (const { id, navId } of SECTIONS) {
      const el = document.getElementById(id);
      if (el && scrollPos >= el.offsetTop) {
        setNavActive(navId);
        return;
      }
    }

    // Back at generator area — restore correct generator tab using state variable
    // (NOT classList check — that would be wrong after visiting Docs/Pricing)
    setNavActive(isDynamicGlobalMode ? 'navDynamicGen' : 'navFreeGen');
  }, { passive: true });
})();

// ── Theme ────────────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('dark');
  const sun = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  if (sun) sun.style.display = document.body.classList.contains('dark') ? '' : 'none';
  if (moon) moon.style.display = document.body.classList.contains('dark') ? 'none' : '';
}

// ── Type Tab Pills ────────────────────────────────────────────────
document.querySelectorAll('.type-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('is-active'));
    btn.classList.add('active');
    activeType = btn.dataset.type;
    document.getElementById('cardTitle').textContent = CARD_TITLES[activeType] || 'Enter Details';
    const form = document.getElementById(`form-${activeType}`);
    if (form) form.classList.add('is-active');
    generateQR();
  });
});

// ── Customize Tabs ────────────────────────────────────────────────
document.querySelectorAll('.ctab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ctab').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('.ctab-panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    const panel = document.getElementById(`ctab-${btn.dataset.ctab}`);
    if (panel) panel.classList.add('is-active');
  });
});

// ── Color Sync ────────────────────────────────────────────────────
function bindColorPair(pickerId, hexId, previewId) {
  const picker = document.getElementById(pickerId);
  const hex = document.getElementById(hexId);
  const prev = document.getElementById(previewId);

  picker.addEventListener('input', () => {
    hex.value = picker.value;
    if (prev) prev.style.background = picker.value;
    scheduleQR();
  });

  hex.addEventListener('input', () => {
    const v = hex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      picker.value = v;
      if (prev) prev.style.background = v;
      scheduleQR();
    }
  });
}

bindColorPair('c-fg', 'h-fg', 'colorPreviewFg');
bindColorPair('c-bg', 'h-bg', 'colorPreviewBg');

// ── Settings Triggers ─────────────────────────────────────────────
document.getElementById('q-size').addEventListener('change', generateQR);
document.getElementById('q-ecl').addEventListener('change', () => {
  document.getElementById('metaBadgeEcl').textContent = ECL_LABELS[document.getElementById('q-ecl').value] || 'ECL';
  generateQR();
});

// ── Logo Selection ────────────────────────────────────────────────
document.querySelectorAll('.logo-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.logo-chip').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeLogoKey = btn.dataset.logo;
    if (activeLogoKey !== 'custom') customLogoURL = null;
    generateQR();
  });
});

document.getElementById('f-logofile').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    customLogoURL = e.target.result;
    activeLogoKey = 'custom';
    document.getElementById('uploadHint').textContent = file.name;
    document.querySelectorAll('.logo-chip').forEach(b => b.classList.remove('is-active'));
    generateQR();
  };
  reader.readAsDataURL(file);
});

function updateLogoLayer() {
  const layer = document.getElementById('qrLogoLayer');
  if (activeLogoKey === 'none') {
    layer.style.display = 'none';
    layer.innerHTML = '';
  } else if (activeLogoKey === 'custom' && customLogoURL) {
    layer.style.display = 'flex';
    layer.innerHTML = `<img src="${customLogoURL}" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" />`;
  } else if (LOGO_ICONS[activeLogoKey]) {
    layer.style.display = 'flex';
    layer.textContent = LOGO_ICONS[activeLogoKey];
  }
}

// ── Build QR Data String ──────────────────────────────────────────
function buildData() {
  let rawStr = '';

  switch (activeType) {
    case 'url': {
      let u = val('f-url');
      if (!u) u = 'https://example.com';
      rawStr = /^https?:\/\//i.test(u) ? u : 'https://' + u;
      break;
    }
    case 'dynamic': {
      let u = val('f-dyn-url');
      if (!u) u = 'https://example.com/landing';
      rawStr = /^https?:\/\//i.test(u) ? u : 'https://' + u;
      break;
    }
    case 'text':
      rawStr = val('f-text') || 'Hello from QR Forge!';
      break;
    case 'vcard': {
      const fn = val('f-vfn'), ln = val('f-vln');
      let v = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}`;
      const o = val('f-vorg'), p = val('f-vphone'), e = val('f-vemail'), w = val('f-vweb');
      if (o) v += `\nORG:${o}`;
      if (p) v += `\nTEL;TYPE=CELL:${p}`;
      if (e) v += `\nEMAIL:${e}`;
      if (w) v += `\nURL:${w}`;
      rawStr = v + '\nEND:VCARD';
      break;
    }
    case 'email': {
      const to = val('f-eto');
      if (!to) { rawStr = 'mailto:info@example.com'; break; }
      const q = [];
      const s = val('f-esub'), b = val('f-ebody');
      if (s) q.push('subject=' + encodeURIComponent(s));
      if (b) q.push('body=' + encodeURIComponent(b));
      rawStr = 'mailto:' + to + (q.length ? '?' + q.join('&') : '');
      break;
    }
    case 'phone': {
      const p = val('f-phone');
      rawStr = p ? 'tel:' + p : 'tel:+1234567890';
      break;
    }
    case 'sms': {
      const p = val('f-sphone'), b = val('f-sbody');
      if (!p) { rawStr = 'sms:+1234567890'; break; }
      rawStr = b ? `sms:${p}?body=${encodeURIComponent(b)}` : `sms:${p}`;
      break;
    }
    case 'whatsapp': {
      const p = val('f-waphone').replace(/\D/g, ''), m = val('f-wamsg');
      if (!p) { rawStr = 'https://wa.me/1234567890'; break; }
      rawStr = m ? `https://wa.me/${p}?text=${encodeURIComponent(m)}` : `https://wa.me/${p}`;
      break;
    }
    case 'wifi': {
      const s = val('f-wssid') || 'MyNetwork';
      const p = val('f-wpass');
      const t = document.getElementById('f-wsec').value;
      const h = document.getElementById('f-whidden').checked ? 'true' : 'false';
      rawStr = `WIFI:T:${t};S:${s};P:${p};H:${h};;`;
      break;
    }
    default:
      rawStr = 'https://www.qrforge.app';
  }

  // If Dynamic Mode is active & type is dynamic, use shortlink wrapper
  if (isDynamicGlobalMode && activeType === 'dynamic') {
    const hash = Math.random().toString(36).substring(2, 7);
    return `https://qr.page/${hash}?target=${encodeURIComponent(rawStr)}`;
  }

  return rawStr;
}

let activeGradientKey = 'solid';

const GRADIENT_PRESETS = {
  // 1. Sunset Spectrum
  sunset: ['#00e5ff', '#2979ff', '#aa00ff', '#ff1744'],
  // 2. Cosmic Purple
  'purple-pink': ['#7c4dff', '#e040fb', '#ff4081', '#ff9100'],
  // 3. Cyber Neon
  'neon-cyan': ['#00e676', '#00b0ff', '#651fff', '#3d5afe'],
  // 4. Golden Blaze
  'golden-fire': ['#ffea00', '#ff9100', '#ff3d00', '#dd2c00'],
  // 5. Emerald Forest
  emerald: ['#aeea00', '#00e676', '#00bfa5', '#00838f'],
  // 6. Aurora Borealis
  aurora: ['#00f2fe', '#4facfe', '#00c6ff', '#0072ff'],
  // 7. Tropical Dusk
  tropical: ['#ff0844', '#ffb199', '#f12711', '#f5af19'],
  // 8. Berry Sorbet
  berry: ['#b92b27', '#1565c0', '#8e24aa', '#d81b60'],
  // 9. Ocean Deep
  ocean: ['#02aab0', '#00cdac', '#0072ff', '#00c6ff'],
  // 10. Flaming Phoenix
  phoenix: ['#f857a6', '#ff5858', '#ff9966', '#ff5e62'],
  // 11. Midnight Violet
  violet: ['#30cfd0', '#330867', '#7f00ff', '#e100ff'],
  // 12. Citrus Burst
  citrus: ['#f7971e', '#ffd200', '#85d700', '#12d800'],
  // 13. Electric Candy
  candy: ['#f107a3', '#7b2ff7', '#00c6ff', '#0072ff'],
  // 14. Mystic Haze
  mystic: ['#50cc7f', '#f5d100', '#ff007f', '#7f00ff'],
  // 15. Royal Gold
  gold: ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7'],
  // 16. Cyberpunk Neon
  cyberpunk: ['#ff007f', '#00f6ff', '#9b51e0', '#ff0055'],
  // 17. Peach Breeze
  peach: ['#ff9a9e', '#fecfef', '#a1c4fd', '#c2e9fb'],
  // 18. Volcano Lava
  lava: ['#eb3349', '#f45c43', '#eaafc8', '#654ea3'],
  // 19. Mint Chocolate
  mint: ['#00b4db', '#0083b0', '#11998e', '#38ef7d'],
  // 20. Ultra Violet
  ultraviolet: ['#654ea3', '#eaafc8', '#d53369', '#cbad6d'],
};

document.querySelectorAll('.gradient-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gradient-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeGradientKey = btn.dataset.grad;
    generateQR();
  });
});

// ── Generate QR Code ──────────────────────────────────────────────
function generateQR() {
  const data = buildData();
  const fg = document.getElementById('c-fg').value;
  const bg = document.getElementById('c-bg').value;
  const size = parseInt(document.getElementById('q-size').value) || 400;
  const eclKey = document.getElementById('q-ecl').value;

  const levelMap = {
    L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M,
    Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H,
  };

  lastQRData = data;

  // Render into #qrCanvas div
  const container = document.getElementById('qrCanvas');
  container.innerHTML = '';

  try {
    new QRCode(container, {
      text: data,
      width: size,
      height: size,
      colorDark: activeGradientKey !== 'solid' ? '#000000' : fg,
      colorLight: bg,
      correctLevel: levelMap[eclKey] || QRCode.CorrectLevel.H,
    });
  } catch (e) {
    console.error('QR error:', e);
    showToast('❌ Text is too long for QR code');
    return;
  }

  // If gradient mode is enabled, apply gradient fill to canvas
  setTimeout(async () => {
    await applyGradientToCanvas();
    drawEmbeddedLogoOnCanvas();
  }, 25);

  // Apply bg color to display wrapper
  document.getElementById('qrDisplay').style.background = bg;
}

function applyGradientToCanvas() {
  return new Promise((resolve) => {
    if (activeGradientKey === 'solid') return resolve();
    const container = document.getElementById('qrCanvas');
    let canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    const size = parseInt(document.getElementById('q-size').value) || 400;
    const gradColors = GRADIENT_PRESETS[activeGradientKey];
    if (!gradColors) return resolve();

    const processCanvas = (cvs) => {
      const ctx = cvs.getContext('2d');
      const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const data = imgData.data;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cvs.width;
      tempCanvas.height = cvs.height;
      const tCtx = tempCanvas.getContext('2d');
      const grad = tCtx.createLinearGradient(0, 0, cvs.width, cvs.height);

      const step = 1 / (gradColors.length - 1);
      gradColors.forEach((col, idx) => {
        grad.addColorStop(idx * step, col);
      });

      tCtx.fillStyle = grad;
      tCtx.fillRect(0, 0, cvs.width, cvs.height);
      const gradData = tCtx.getImageData(0, 0, cvs.width, cvs.height).data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Dark QR pixel check
        if (r < 120 && g < 120 && b < 120) {
          data[i] = gradData[i];     // Red
          data[i + 1] = gradData[i + 1];   // Green
          data[i + 2] = gradData[i + 2];   // Blue
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (img) {
        try {
          img.src = cvs.toDataURL();
        } catch (e) { }
      }
    };

    if (canvas) {
      processCanvas(canvas);
      resolve();
    } else if (img) {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      const imageObj = new Image();
      imageObj.onload = () => {
        ctx.drawImage(imageObj, 0, 0, size, size);
        processCanvas(cvs);
        container.appendChild(cvs);
        img.style.display = 'none';
        resolve();
      };
      imageObj.onerror = resolve;
      imageObj.src = img.src;
    } else {
      resolve();
    }
  });
}

// ── Native Canvas Embedded Logo Rendering ─────────────────────────
function drawEmbeddedLogoOnCanvas() {
  if (activeLogoKey === 'none') return;

  const container = document.getElementById('qrCanvas');
  const canvas = container.querySelector('canvas');
  const imgEl = container.querySelector('img');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  const lSize = Math.round(size * 0.28);
  const lx = (size - lSize) / 2;
  const ly = (size - lSize) / 2;
  const pad = 8;

  // Draw clean rounded white background badge on canvas
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, lx - pad, ly - pad, lSize + pad * 2, lSize + pad * 2, 14);

  // Reset shadow
  ctx.shadowColor = 'transparent';

  // Draw subtle inner border for badge
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if ((activeLogoKey === 'custom' && customLogoURL) || activeLogoKey === 'avenqr') {
    const src = activeLogoKey === 'avenqr' ? 'AvenQR.png' : customLogoURL;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, lx, ly, lSize, lSize);
      if (imgEl) {
        try { imgEl.src = canvas.toDataURL(); } catch (e) { }
      }
    };
    img.onerror = () => console.error("Failed to load logo image");
    img.src = src;
  } else if (LOGO_ICONS[activeLogoKey]) {
    ctx.font = `600 ${Math.round(lSize * 0.65)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LOGO_ICONS[activeLogoKey], size / 2, size / 2 + 1);
    if (imgEl) {
      try { imgEl.src = canvas.toDataURL(); } catch (e) { }
    }
  }
}

// ── Debounced live regen ─────────────────────────────────────────
let _t;
function scheduleQR() { clearTimeout(_t); _t = setTimeout(generateQR, 280); }

document.querySelectorAll('.field__input').forEach(el => {
  el.addEventListener('input', scheduleQR);
  el.addEventListener('change', scheduleQR);
});

// ── Get full composite image as DataURL ───────────────────────────
async function getFinalPNG() {
  const size = parseInt(document.getElementById('q-size').value) || 400;
  const bg = document.getElementById('c-bg').value;

  const container = document.getElementById('qrCanvas');
  const qrEl = container.querySelector('canvas') || container.querySelector('img');
  if (!qrEl) return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Draw QR
  await drawElement(ctx, qrEl, 0, 0, size, size);

  // Overlay logo if any
  if (activeLogoKey !== 'none') {
    const lSize = Math.round(size * 0.28);
    const lx = (size - lSize) / 2;
    const ly = (size - lSize) / 2;
    const pad = 8;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, lx - pad, ly - pad, lSize + pad * 2, lSize + pad * 2, 10);

    if ((activeLogoKey === 'custom' && customLogoURL) || activeLogoKey === 'avenqr') {
      const src = activeLogoKey === 'avenqr' ? 'AvenQR.png' : customLogoURL;
      await new Promise(res => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, lx, ly, lSize, lSize); res(); };
        img.onerror = res;
        img.src = src;
      });
    } else if (LOGO_ICONS[activeLogoKey]) {
      ctx.font = `${Math.round(lSize * 0.65)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LOGO_ICONS[activeLogoKey], size / 2, size / 2);
    }
  }

  try {
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error("Canvas toDataURL failed:", e);
    return null;
  }
}

function drawElement(ctx, el, x, y, w, h) {
  return new Promise(res => {
    if (el.tagName === 'CANVAS') {
      ctx.drawImage(el, x, y, w, h);
      res();
    } else {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, x, y, w, h); res(); };
      img.src = el.src;
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
  ctx.fill();
}

// ── Download PNG ──────────────────────────────────────────────────
async function downloadPNG() {
  setLoading('dlPngBtn', true);
  const dataUrl = await getFinalPNG();
  setLoading('dlPngBtn', false);
  if (!dataUrl) { showToast('❌ Generate a QR code first'); return; }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `qrforge-${activeType}-${Date.now()}.png`;
  a.click();
  showToast('⬇️ PNG downloaded!');
}

// ── Download PDF ──────────────────────────────────────────────────
async function downloadPDF() {
  setLoading('dlPdfBtn', true);
  const dataUrl = await getFinalPNG();
  setLoading('dlPdfBtn', false);
  if (!dataUrl) { showToast('❌ Generate a QR code first'); return; }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgW = 110, imgH = 110;
    const x = (210 - imgW) / 2;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(37, 99, 235);
    pdf.text('QR Forge Code', 105, 28, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Type: ${activeType.toUpperCase()}`, 105, 36, { align: 'center' });

    pdf.addImage(dataUrl, 'PNG', x, 44, imgW, imgH);

    pdf.setFontSize(9);
    const short = lastQRData.length > 75 ? lastQRData.slice(0, 75) + '...' : lastQRData;
    pdf.text(`Content: ${short}`, 105, 168, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated with QR Forge — Free & Instant', 105, 280, { align: 'center' });

    pdf.save(`qrforge-${activeType}-${Date.now()}.pdf`);
    showToast('📄 PDF downloaded!');
  } catch (e) {
    console.error(e);
    showToast('❌ PDF generation failed');
  }
}

// ── Copy QR Image ─────────────────────────────────────────────────
async function copyQRImage() {
  const dataUrl = await getFinalPNG();
  if (!dataUrl) { showToast('❌ No QR to copy'); return; }
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 QR image copied!');
    } else {
      await navigator.clipboard.writeText(lastQRData);
      showToast('📋 QR text copied!');
    }
  } catch {
    await navigator.clipboard.writeText(lastQRData);
    showToast('📋 QR text copied!');
  }
}

// ── Reset All ─────────────────────────────────────────────────────
function resetAll() {
  document.querySelectorAll('.field__input').forEach(el => el.value = '');
  activeLogoKey = 'none';
  customLogoURL = null;
  document.getElementById('uploadHint').textContent = 'PNG, JPG, SVG — max 2MB';
  document.querySelectorAll('.logo-chip').forEach(b => b.classList.remove('is-active'));
  document.querySelector('.logo-chip[data-logo="none"]')?.classList.add('is-active');
  updateLogoLayer();
  generateQR();
  showToast('🔄 Reset complete');
}

// ── Helpers ────────────────────────────────────────────────────────
function val(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.style.opacity = loading ? '0.65' : '1';
  btn.style.pointerEvents = loading ? 'none' : '';
}

// ── Smooth Scroll Handlers ─────────────────────────────────────────
function scrollToSolutions(e) {
  if (e) e.preventDefault();
  const target = document.getElementById('solutionsSection');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToDocs(e) {
  if (e) e.preventDefault();
  const target = document.getElementById('docsSection');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToPricing(e) {
  if (e) e.preventDefault();
  const target = document.getElementById('pricingSection');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToFaq(e) {
  if (e) e.preventDefault();
  const target = document.getElementById('faqSection');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Keyboard shortcuts ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') generateQR();
  if (e.key === 'Escape') closeMobileMenu();
});

// ── Mobile Menu ───────────────────────────────────────────────────
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  const btn = document.getElementById('mobileMenuBtn');
  const isOpen = drawer.classList.contains('is-open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    btn.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  const btn = document.getElementById('mobileMenuBtn');
  if (drawer) drawer.classList.remove('is-open');
  if (overlay) overlay.classList.remove('is-open');
  if (btn) btn.classList.remove('is-open');
  document.body.style.overflow = '';
}

// ── Initialize ────────────────────────────────────────────────────
switchNavMode('url');
generateQR();


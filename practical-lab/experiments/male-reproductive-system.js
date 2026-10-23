export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;">
        <i class="fa-solid fa-arrow-left" style="font-size:10px;"></i> Back
      </button>
      <div style="flex:1;text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Male Reproductive System</div>
        <div style="font-size:9px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Class 12 Bio - Ch 2</div>
      </div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <i class="fa-solid fa-rotate-left" style="font-size:12px;"></i>
      </button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
      <div id="waiting" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:700;pointer-events:none;">Initialising…</div>
      <div style="position:absolute;top:8px;left:8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:6px 8px;pointer-events:none;backdrop-filter:blur(12px);">
        <div style="font-size:8px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Selected</div>
        <div style="font-size:10px;font-weight:900;color:#6ee7b7;" id="rSel">Tap organ</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:12px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <div id="iColor" style="width:12px;height:12px;border-radius:999px;margin-top:6px;flex-shrink:0;background:#22c55e;"></div>
          <div style="flex:1;min-width:0;">
            <div id="iName" style="font-size:12px;font-weight:900;color:#f1f5f9;margin-bottom:4px;">Tap any organ to learn</div>
            <div id="iDesc" style="font-size:10px;color:#94a3b8;line-height:1.55;">Male reproductive system ke organs — testes, epididymis, vas deferens, seminal vesicles, prostate, Cowper's glands, penis.</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;">
        <button type="button" class="tog tog-labels" style="padding:8px 4px;border-radius:12px;font-size:9px;font-weight:700;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;cursor:pointer;">Labels</button>
        <button type="button" class="tog tog-flow" style="padding:8px 4px;border-radius:12px;font-size:9px;font-weight:700;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;cursor:pointer;">Sperm Flow</button>
        <button type="button" class="tog tog-realism" style="padding:8px 4px;border-radius:12px;font-size:9px;font-weight:700;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;cursor:pointer;">Realism</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const waiting = wrap.querySelector('#waiting');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let firstDrawDone = false;

  function resize() {
    let w = canvasHost.clientWidth;
    let h = canvasHost.clientHeight;

    // Fallbacks: multiple sources of truth
    if (w < 10) w = canvas.getBoundingClientRect().width;
    if (h < 10) h = canvas.getBoundingClientRect().height;
    if (w < 10) w = window.innerWidth;
    if (h < 10) h = Math.max(250, window.innerHeight * 0.5);

    // Last-resort minimum so we NEVER sit at 0
    if (w < 10) w = 320;
    if (h < 10) h = 400;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w;
    H = h;
    return true;
  }

  const ORGANS = [
    { id: 'testis', name: 'Testis (Testes)', color: '#fb923c', info: 'Primary male sex organ. Pair of oval structures in scrotum. Produces sperm (spermatogenesis) + testosterone. Contains 250+ lobules with seminiferous tubules.', x: 0.3, y: 0.75, r: 40 },
    { id: 'epididymis', name: 'Epididymis', color: '#f97316', info: 'Highly coiled tube on posterior side of testis. Sperm mature + acquire motility here. Highly vascular. Stores sperm up to several weeks.', x: 0.3, y: 0.62, r: 22 },
    { id: 'vas', name: 'Vas Deferens', color: '#dc2626', info: 'Long muscular tube (~40 cm). Carries sperm from epididymis to urethra. Loops over bladder. Vasectomy is done here.', x: 0.5, y: 0.4, r: 12 },
    { id: 'seminal', name: 'Seminal Vesicles', color: '#a855f7', info: 'Pair of glands posterior to bladder. Secrete ~60% of semen — fructose (energy), prostaglandins, clotting proteins. Alkaline to neutralize vaginal acid.', x: 0.42, y: 0.28, r: 20 },
    { id: 'prostate', name: 'Prostate Gland', color: '#8b5cf6', info: 'Walnut-sized gland below bladder. Secretes milky alkaline fluid (~30% of semen) — enzymes, citric acid, zinc. Enhances sperm motility.', x: 0.5, y: 0.5, r: 22 },
    { id: 'cowper', name: "Cowper's Glands", color: '#06b6d4', info: 'Small pea-sized glands below prostate. Secrete alkaline mucus + lubrication before ejaculation. Neutralizes urethra acid.', x: 0.5, y: 0.62, r: 14 },
    { id: 'penis', name: 'Penis', color: '#f43f5e', info: 'Copulatory organ. Contains 3 columns of erectile tissue (2 corpora cavernosa + 1 corpus spongiosum). Delivers sperm into female tract.', x: 0.5, y: 0.85, r: 25 },
    { id: 'scrotum', name: 'Scrotum', color: '#a16207', info: 'Pouch of skin holding testes. Maintains temperature 2-2.5°C below body temp — essential for spermatogenesis.', x: 0.3, y: 0.92, r: 35 }
  ];

  let selected = null, showLabels = true, showFlow = true, realism = true;
  let animId = null, phase = 0;
  const sperm = [];
  for (let i = 0; i < 8; i++) sperm.push({ t: i / 8, seed: Math.random() });

  const w2s = (x, y) => ({ x: x * W, y: y * H });

  function drawBody() {
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const bx = W * 0.15, by = H * 0.05, bw = W * 0.7, bh = H * 0.9;
    ctx.moveTo(bx + bw * 0.3, by);
    ctx.quadraticCurveTo(bx, by + bh * 0.15, bx + bw * 0.05, by + bh * 0.4);
    ctx.quadraticCurveTo(bx + bw * 0.05, by + bh * 0.75, bx + bw * 0.3, by + bh * 0.95);
    ctx.quadraticCurveTo(bx + bw * 0.5, by + bh, bx + bw * 0.7, by + bh * 0.95);
    ctx.quadraticCurveTo(bx + bw * 0.95, by + bh * 0.75, bx + bw * 0.95, by + bh * 0.4);
    ctx.quadraticCurveTo(bx + bw, by + bh * 0.15, bx + bw * 0.7, by);
    ctx.stroke();

    const bladder = w2s(0.5, 0.32);
    if (realism) {
      const bg = ctx.createRadialGradient(bladder.x - 5, bladder.y - 5, 2, bladder.x, bladder.y, 30);
      bg.addColorStop(0, 'rgba(251,191,36,0.5)');
      bg.addColorStop(1, 'rgba(180,130,30,0.25)');
      ctx.fillStyle = bg;
    } else {
      ctx.fillStyle = 'rgba(251,191,36,0.3)';
    }
    ctx.beginPath();
    ctx.ellipse(bladder.x, bladder.y, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,130,30,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (showLabels) {
      ctx.fillStyle = 'rgba(251,191,36,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Bladder', bladder.x, bladder.y - 34);
    }
  }

  function drawVas() {
    const path = [[0.3, 0.62], [0.28, 0.5], [0.32, 0.35], [0.42, 0.28], [0.5, 0.3], [0.55, 0.4], [0.5, 0.55]];
    ctx.strokeStyle = 'rgba(220,38,38,0.7)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    path.forEach((p, i) => {
      const s = w2s(p[0], p[1]);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    ctx.beginPath();
    path.forEach((p, i) => {
      const s = w2s(1 - p[0], p[1]);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
  }

  function drawTestis(organ) {
    const s = w2s(organ.x, organ.y);
    const r = organ.r;
    [s.x, W - s.x].forEach((x) => {
      const isSel = selected && selected.id === 'testis';
      const g = ctx.createRadialGradient(x - r * 0.3, s.y - r * 0.3, r * 0.1, x, s.y, r);
      g.addColorStop(0, '#fed7aa');
      g.addColorStop(0.5, '#fb923c');
      g.addColorStop(1, '#c2410c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, s.y, r * 0.75, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isSel ? '#f0abfc' : '#7c2d12';
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.stroke();
      if (realism) {
        ctx.strokeStyle = 'rgba(124,45,18,0.3)';
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 8; k++) {
          const angle = (k / 8) * Math.PI;
          ctx.beginPath();
          ctx.ellipse(x, s.y, r * 0.6 * Math.cos(angle * 0.5 + 0.5), r * 0.8 * Math.sin(angle * 0.5 + 0.5), angle, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + r * 0.5, s.y, r * 0.9, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    });
    if (showLabels) {
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Testis', s.x - organ.r - 30, s.y);
      ctx.fillText('Testis', W - s.x + organ.r + 30, s.y);
    }
  }

  function drawOrgan(organ) {
    if (organ.id === 'testis') return drawTestis(organ);
    const s = w2s(organ.x, organ.y);
    const r = organ.r;
    const isSel = selected && selected.id === organ.id;
    const g = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, r * 0.1, s.x, s.y, r);
    g.addColorStop(0, organ.color + 'dd');
    g.addColorStop(0.6, organ.color + 'aa');
    g.addColorStop(1, organ.color + '55');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#f0abfc' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = isSel ? 3 : 1.5;
    ctx.stroke();
    if (realism) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(s.x - r * 0.35, s.y - r * 0.4, r * 0.35, r * 0.22, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showLabels) {
      ctx.fillStyle = organ.color;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const labelY = s.y - r - 4;
      ctx.fillText(organ.name.split(' ')[0], s.x, labelY);
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(s.x, labelY + 2);
      ctx.lineTo(s.x, s.y - r);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawSpermFlow() {
    if (!showFlow) return;
    sperm.forEach(sp => {
      sp.t += 0.006;
      if (sp.t > 1) sp.t = 0;
      let px, py;
      if (sp.t < 0.35) {
        const tt = sp.t / 0.35;
        px = W * 0.3;
        py = H * 0.75 - tt * H * 0.13;
      } else if (sp.t < 0.7) {
        const tt = (sp.t - 0.35) / 0.35;
        px = W * (0.3 + tt * 0.2);
        py = H * (0.62 - tt * 0.32);
      } else {
        const tt = (sp.t - 0.7) / 0.3;
        px = W * (0.5 + Math.sin(tt * Math.PI) * 0.05);
        py = H * (0.3 + tt * 0.55);
      }
      ctx.fillStyle = 'rgba(250,204,21,0.9)';
      ctx.beginPath();
      ctx.ellipse(px, py, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2, py);
      ctx.lineTo(px + 6, py + Math.sin(phase * 5 + sp.seed * 10) * 2);
      ctx.stroke();
    });
  }

  function draw() {
    if (W < 10 || H < 10) return false;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    drawBody();
    drawVas();
    ORGANS.filter(o => o.id !== 'testis').forEach(drawOrgan);
    drawTestis(ORGANS.find(o => o.id === 'testis'));
    drawSpermFlow();
    return true;
  }

  function loop() {
    phase += 0.02;
    try {
      const ok = draw();
      if (ok && !firstDrawDone) {
        firstDrawDone = true;
        if (waiting) waiting.style.display = 'none';
      }
    } catch (err) {
      console.error('[male-reproductive-system] draw error:', err);
    }
    animId = requestAnimationFrame(loop);
  }

  function findOrgan(px, py) {
    for (let i = ORGANS.length - 1; i >= 0; i--) {
      const o = ORGANS[i];
      const s = w2s(o.x, o.y);
      if (o.id === 'testis') {
        if (Math.hypot(px - s.x, py - s.y) < o.r * 0.9 || Math.hypot(px - (W - s.x), py - s.y) < o.r * 0.9) return o;
      } else {
        if (Math.hypot(px - s.x, py - s.y) < o.r + 5) return o;
      }
    }
    return null;
  }

  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const px = t.clientX - rect.left;
    const py = t.clientY - rect.top;
    const o = findOrgan(px, py);
    if (o) {
      selected = o;
      wrap.querySelector('#rSel').textContent = o.name.split(' ')[0];
      wrap.querySelector('#iName').textContent = o.name;
      wrap.querySelector('#iDesc').textContent = o.info;
      wrap.querySelector('#iColor').style.background = o.color;
    }
  }
  canvas.addEventListener('pointerdown', onDown);

  function setTog(btn, on) {
    if (!btn) return;
    btn.style.background = on ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)';
    btn.style.borderColor = on ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)';
    btn.style.color = on ? '#6ee7b7' : '#cbd5e1';
  }
  const togLabels = wrap.querySelector('.tog-labels');
  const togFlow = wrap.querySelector('.tog-flow');
  const togRealism = wrap.querySelector('.tog-realism');
  togLabels.addEventListener('click', () => { showLabels = !showLabels; setTog(togLabels, showLabels); });
  togFlow.addEventListener('click', () => { showFlow = !showFlow; setTog(togFlow, showFlow); });
  togRealism.addEventListener('click', () => { realism = !realism; setTog(togRealism, realism); });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    selected = null;
    wrap.querySelector('#rSel').textContent = 'Tap organ';
    wrap.querySelector('#iName').textContent = 'Tap any organ to learn';
    wrap.querySelector('#iDesc').textContent = "Male reproductive system ke organs — testes, epididymis, vas deferens, seminal vesicles, prostate, Cowper's glands, penis.";
    wrap.querySelector('#iColor').style.background = '#22c55e';
  });

  wrap.querySelector('.back-btn').addEventListener('click', () => {
    if (typeof window.goBack === 'function') window.goBack();
  });

  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => { try { resize(); } catch(e){} });
    ro.observe(canvasHost);
  }
  const onWinResize = () => { try { resize(); } catch(e){} };
  window.addEventListener('resize', onWinResize);
  window.addEventListener('orientationchange', onWinResize);

  // Multiple resize attempts
  resize();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 30);
  setTimeout(() => resize(), 120);
  setTimeout(() => resize(), 300);
  setTimeout(() => resize(), 600);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) { try { ro.disconnect(); } catch(e){} }
    window.removeEventListener('resize', onWinResize);
    window.removeEventListener('orientationchange', onWinResize);
    canvas.removeEventListener('pointerdown', onDown);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
                  }

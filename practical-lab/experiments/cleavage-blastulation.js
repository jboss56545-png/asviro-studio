export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Cleavage & Blastulation</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Stage</div>
        <div class="text-[10px] font-black text-pink-300" id="stageText">Zygote</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Cells</div>
        <div class="text-[10px] font-black text-cyan-300" id="cellText">1</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-pink-400 uppercase">Stage</label><span class="text-[11px] font-black text-pink-400" id="sliderV">0%</span></div>
        <input type="range" id="stageSlider" min="0" max="100" step="1" value="0" class="w-full accent-pink-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-play py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-slate-950">▶ Play</button>
        <button type="button" class="btn-step py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">⏭ Step</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-pink-400">Cleavage:</b> Zygote → 2-cell → 4-cell → 8-cell → Morula (16-32 cells) → Blastocyst. Blastocyst has trophoblast (outer) + inner cell mass + blastocoel cavity.
      </div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width; H = rect.height;
  }

  let progress = 0, playing = false;
  let animId = null, lastT = 0, phase = 0;

  const STAGES = [
    { t: 0.00, label: 'Zygote', cells: 1 },
    { t: 0.15, label: '2-cell', cells: 2 },
    { t: 0.30, label: '4-cell', cells: 4 },
    { t: 0.45, label: '8-cell', cells: 8 },
    { t: 0.60, label: '16-cell', cells: 16 },
    { t: 0.75, label: 'Morula', cells: 32 },
    { t: 0.90, label: 'Blastocyst forming', cells: '100+' },
    { t: 1.00, label: 'Blastocyst', cells: '200+' }
  ];

  function stageInfo(p) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].t) return STAGES[i];
    return STAGES[0];
  }

  function drawCell(cx, cy, r, color) {
    const g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.4, color);
    g.addColorStop(1, shade(color, -60));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const info = stageInfo(progress);
    const baseR = Math.min(W, H) * 0.18;

    // Zona pellucida (outer shell) — visible until blastocyst
    if (progress < 0.9) {
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, baseR + 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(251,191,36,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, baseR + 28, 0, Math.PI * 2); ctx.stroke();
    }

    if (progress < 0.15) {
      // Zygote (single cell)
      drawCell(cx, cy, baseR, '#f472b6');
      // Pronuclei
      ctx.fillStyle = 'rgba(168,85,247,0.7)';
      ctx.beginPath(); ctx.arc(cx - 10, cy, baseR * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(244,114,182,0.9)';
      ctx.beginPath(); ctx.arc(cx + 10, cy, baseR * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (progress < 0.3) {
      // 2-cell
      drawCell(cx - baseR * 0.5, cy, baseR * 0.7, '#f472b6');
      drawCell(cx + baseR * 0.5, cy, baseR * 0.7, '#f472b6');
    } else if (progress < 0.45) {
      // 4-cell
      drawCell(cx - baseR * 0.5, cy - baseR * 0.5, baseR * 0.55, '#f472b6');
      drawCell(cx + baseR * 0.5, cy - baseR * 0.5, baseR * 0.55, '#f472b6');
      drawCell(cx - baseR * 0.5, cy + baseR * 0.5, baseR * 0.55, '#f472b6');
      drawCell(cx + baseR * 0.5, cy + baseR * 0.5, baseR * 0.55, '#f472b6');
    } else if (progress < 0.6) {
      // 8-cell
      const positions = [[-0.6, -0.6], [0, -0.7], [0.6, -0.6], [-0.7, 0], [0.7, 0], [-0.6, 0.6], [0, 0.7], [0.6, 0.6]];
      positions.forEach((p, i) => {
        const wobble = Math.sin(phase * 2 + i) * 2;
        drawCell(cx + p[0] * baseR + wobble, cy + p[1] * baseR + wobble, baseR * 0.42, '#ec4899');
      });
    } else if (progress < 0.75) {
      // 16-cell — more cells
      const positions = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = baseR * 0.75;
        positions.push([Math.cos(a) * rr * 0.7, Math.sin(a) * rr * 0.7]);
      }
      positions.forEach((p, i) => {
        const wobble = Math.sin(phase * 2 + i) * 1.5;
        drawCell(cx + p[0] + wobble, cy + p[1] + wobble, baseR * 0.28, '#db2777');
      });
      // Center cell
      drawCell(cx, cy, baseR * 0.35, '#be185d');
    } else if (progress < 0.9) {
      // Morula (mulberry) — tightly packed
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2 * 3;
        const rr = baseR * (0.3 + (i % 3) * 0.2);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        drawCell(x, y, baseR * 0.2, '#be185d');
      }
      // Zona pellucida still visible
    } else {
      // Blastocyst — trophoblast + inner cell mass + blastocoel
      const blastR = baseR + 15;
      // Zona disappearing
      const zonaAlpha = Math.max(0, 1 - (progress - 0.9) / 0.1);
      if (zonaAlpha > 0) {
        ctx.strokeStyle = `rgba(251,191,36,${0.5 * zonaAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, blastR + 10, 0, Math.PI * 2); ctx.stroke();
      }
      // Blastocoel cavity (fluid)
      const blastGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, blastR);
      blastGrad.addColorStop(0, 'rgba(59,130,246,0.35)');
      blastGrad.addColorStop(1, 'rgba(30,64,175,0.15)');
      ctx.fillStyle = blastGrad;
      ctx.beginPath(); ctx.arc(cx, cy, blastR, 0, Math.PI * 2); ctx.fill();

      // Trophoblast (outer single layer of cells)
      const numT = 24;
      for (let i = 0; i < numT; i++) {
        const a = (i / numT) * Math.PI * 2;
        const tr = blastR - 8;
        const tx = cx + Math.cos(a) * tr;
        const ty = cy + Math.sin(a) * tr;
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(tx, ty, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Inner cell mass (embryoblast) at one pole
      const icmAngle = -Math.PI * 0.5;
      const icmX = cx + Math.cos(icmAngle) * (blastR - 25);
      const icmY = cy + Math.sin(icmAngle) * (blastR - 25);
      for (let i = 0; i < 10; i++) {
        const ia = (i / 10) * Math.PI * 2;
        const ir = 6;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(icmX + Math.cos(ia) * 12, icmY + Math.sin(ia) * 8, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Trophoblast', cx + blastR + 12, cy - 10);
      ctx.strokeStyle = 'rgba(34,211,238,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx + blastR - 5, cy - 10);
      ctx.lineTo(cx + blastR + 8, cy - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#a855f7';
      ctx.fillText('Inner cell mass', cx - blastR - 100, cy - blastR + 20);
      ctx.strokeStyle = 'rgba(168,85,247,0.5)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx - blastR - 5, cy - blastR + 20);
      ctx.lineTo(icmX - 15, icmY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#3b82f6';
      ctx.fillText('Blastocoel', cx + 20, cy + 20);
    }

    // Stage label
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(info.label, cx, H - 15);
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    phase += 0.03;
    if (playing) {
      progress += dt * 0.14;
      if (progress >= 1) { progress = 1; playing = false; setPlay(false); }
      updateUI();
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function updateUI() {
    const info = stageInfo(progress);
    wrap.querySelector('#stageText').textContent = info.label;
    wrap.querySelector('#cellText').textContent = info.cells;
    wrap.querySelector('#sliderV').textContent = Math.round(progress * 100) + '%';
    wrap.querySelector('#stageSlider').value = Math.round(progress * 100);
  }

  function setPlay(on) {
    wrap.querySelector('.btn-play').textContent = on ? '⏸ Pause' : '▶ Play';
  }

  wrap.querySelector('.btn-play').addEventListener('click', () => {
    if (progress >= 1) progress = 0;
    playing = !playing; setPlay(playing); updateUI();
  });
  wrap.querySelector('.btn-step').addEventListener('click', () => {
    playing = false; setPlay(false);
    for (const s of STAGES) { if (s.t > progress + 0.001) { progress = s.t; break; } }
    if (progress >= 0.999) progress = 1;
    updateUI();
  });
  wrap.querySelector('#stageSlider').addEventListener('input', e => {
    progress = parseInt(e.target.value, 10) / 100;
    playing = false; setPlay(false); updateUI();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    progress = 0; playing = false; setPlay(false); updateUI();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); updateUI();
  lastT = performance.now();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

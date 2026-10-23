export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0">
        <div class="text-xs font-black text-slate-100 truncate">Henry's Law</div>
        <div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 1</div>
      </div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Pressure</div>
        <div class="text-[11px] font-black text-amber-300" id="rP">1.0 atm</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Solubility</div>
        <div class="text-[11px] font-black text-cyan-300" id="rS">1.0 g/L</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Partial pressure (atm)</label><span class="text-[11px] font-black text-amber-400" id="pVal">1.0</span></div>
        <input type="range" id="pSlider" min="0.1" max="5" step="0.1" value="1" class="w-full accent-amber-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">KH (Henry's constant)</label><span class="text-[11px] font-black text-cyan-400" id="khVal">1.0</span></div>
        <input type="range" id="khSlider" min="0.2" max="3" step="0.1" value="1" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="tog tog-bubbles py-2 rounded-xl text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Show Bubbles</button>
        <button type="button" class="tog tog-graph py-2 rounded-xl text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300">Show Graph</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-amber-400">Henry's Law:</b> Solubility ∝ Pressure. S = KH × P. Gas becomes more soluble as pressure increases — like soda bottle!
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

  let P = 1.0, KH = 1.0;
  let showBubbles = true, showGraph = false;
  let animId = null, phase = 0;
  let bubbles = [];

  function initBubbles() {
    bubbles = [];
    for (let i = 0; i < 25; i++) {
      bubbles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 2 + Math.random() * 4,
        vy: -0.3 - Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        life: 1
      });
    }
  }

  function drawBottle() {
    const bx = W / 2 - 80;
    const by = H * 0.1;
    const bw = 160;
    const bh = H * 0.75;

    // Bottle neck
    ctx.fillStyle = 'rgba(148,163,184,0.15)';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.35, by);
    ctx.lineTo(bx + bw * 0.65, by);
    ctx.lineTo(bx + bw * 0.8, by + 40);
    ctx.lineTo(bx + bw * 0.2, by + 40);
    ctx.closePath();
    ctx.fill();

    // Bottle body
    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bg.addColorStop(0, 'rgba(148,163,184,0.15)');
    bg.addColorStop(0.5, 'rgba(200,220,255,0.05)');
    bg.addColorStop(1, 'rgba(148,163,184,0.15)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by + 35, bw, bh - 35, 20);
    else ctx.rect(bx, by + 35, bw, bh - 35);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Liquid inside
    const liquidTop = by + 90;
    const liquidGrad = ctx.createLinearGradient(0, liquidTop, 0, by + bh - 5);
    const sat = Math.min(1, (P * KH) / 5);
    liquidGrad.addColorStop(0, `rgba(${Math.round(80 + sat * 80)}, ${Math.round(180 - sat * 60)}, 255, 0.6)`);
    liquidGrad.addColorStop(1, `rgba(${Math.round(30 + sat * 100)}, ${Math.round(120 - sat * 40)}, 220, 0.9)`);
    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx + 3, liquidTop, bw - 6, bh - liquidTop + by - 8, 15);
    else ctx.rect(bx + 3, liquidTop, bw - 6, bh - liquidTop + by - 8);
    ctx.fill();

    // Bottle cap
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx + bw * 0.32, by - 12, bw * 0.36, 18, 4);
    else ctx.rect(bx + bw * 0.32, by - 12, bw * 0.36, 18);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SODA', W / 2, by + bh * 0.6);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('CO₂ solution', W / 2, by + bh * 0.68);
  }

  function drawBubbles() {
    if (!showBubbles) return;
    const intensity = Math.min(1, (P * KH) / 5);
    const count = Math.round(25 * intensity);

    for (let i = 0; i < count; i++) {
      const b = bubbles[i];
      if (!b) continue;
      b.y += b.vy * (0.5 + intensity);
      b.x += b.vx;
      if (b.y < H * 0.15) {
        b.y = H * 0.85;
        b.x = W / 2 - 70 + Math.random() * 140;
      }
      // Bubble
      const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0.5, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,0.8)');
      g.addColorStop(0.7, 'rgba(200,220,255,0.4)');
      g.addColorStop(1, 'rgba(200,220,255,0.1)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  function drawGraph() {
    if (!showGraph) return;
    const gx = W - 110;
    const gy = 60;
    const gw = 90;
    const gh = 80;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx - 8, gy - 8, gw + 16, gh + 16, 8);
    else ctx.rect(gx - 8, gy - 8, gw + 16, gh + 16);
    ctx.fill();

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    // Line: S = KH * P
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh);
    const pMax = 5;
    const sMax = 5 * KH;
    for (let i = 0; i <= 20; i++) {
      const p = (i / 20) * pMax;
      const s = p * KH;
      const px = gx + (p / pMax) * gw;
      const py = gy + gh - (s / sMax) * gh;
      ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point
    const px = gx + (P / pMax) * gw;
    const py = gy + gh - ((P * KH) / sMax) * gh;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P →', gx + gw / 2, gy + gh + 12);
    ctx.save();
    ctx.translate(gx - 12, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('S →', 0, 0);
    ctx.restore();
  }

  function loop() {
    phase += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Bg
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W,H) * 0.8);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawBottle();
    drawBubbles();
    drawGraph();

    animId = requestAnimationFrame(loop);
  }

  function updateReadouts() {
    wrap.querySelector('#rP').textContent = P.toFixed(1) + ' atm';
    wrap.querySelector('#pVal').textContent = P.toFixed(1);
    wrap.querySelector('#rS').textContent = (P * KH).toFixed(2) + ' g/L';
    wrap.querySelector('#khVal').textContent = KH.toFixed(1);
  }

  const $p = wrap.querySelector('#pSlider');
  const $kh = wrap.querySelector('#khSlider');
  $p.addEventListener('input', () => { P = parseFloat($p.value); updateReadouts(); });
  $kh.addEventListener('input', () => { KH = parseFloat($kh.value); updateReadouts(); });

  function setTogUI(sel, on) {
    const b = wrap.querySelector(sel);
    b.classList.toggle('bg-emerald-500/20', on);
    b.classList.toggle('border-emerald-500/40', on);
    b.classList.toggle('text-emerald-300', on);
    b.classList.toggle('bg-slate-800', !on);
    b.classList.toggle('border-slate-700', !on);
    b.classList.toggle('text-slate-300', !on);
  }

  wrap.querySelector('.tog-bubbles').addEventListener('click', () => {
    showBubbles = !showBubbles;
    setTogUI('.tog-bubbles', showBubbles);
  });
  wrap.querySelector('.tog-graph').addEventListener('click', () => {
    showGraph = !showGraph;
    setTogUI('.tog-graph', showGraph);
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    P = 1; KH = 1;
    $p.value = 1; $kh.value = 1;
    updateReadouts();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { resize(); initBubbles(); }); ro.observe(canvas); }
  resize();
  initBubbles();
  updateReadouts();
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

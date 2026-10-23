export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Nernst Equation</div><div class="text-[9px] text-slate-500 truncate">Class 12 Chem - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E°cell</div>
        <div class="text-[10px] font-black text-amber-300" id="rE0">1.10 V</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">E cell</div>
        <div class="text-[10px] font-black text-emerald-300" id="rE">1.10 V</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[44vh] overflow-y-auto space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">[Zn²⁺] (M)</label><span class="text-[11px] font-black text-cyan-400" id="znV">1.0</span></div>
        <input type="range" id="znSlider" min="0.01" max="2" step="0.01" value="1" class="w-full accent-cyan-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">[Cu²⁺] (M)</label><span class="text-[11px] font-black text-emerald-400" id="cuV">1.0</span></div>
        <input type="range" id="cuSlider" min="0.01" max="2" step="0.01" value="1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400 uppercase">Temperature (K)</label><span class="text-[11px] font-black text-amber-400" id="tV">298</span></div>
        <input type="range" id="tSlider" min="273" max="373" step="1" value="298" class="w-full accent-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">Reaction Quotient Q</div>
          <div class="text-xs font-black text-purple-300" id="rQ">1.000</div>
        </div>
        <div class="bg-white/5 rounded-xl p-2 border border-white/10">
          <div class="text-[8px] text-slate-500 uppercase font-bold">ΔE (shift)</div>
          <div class="text-xs font-black text-rose-300" id="rD">0.000</div>
        </div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">E = E° − (0.059/n)·log Q.</b> Zn²⁺ badhao → Q↑ → E kam. Cu²⁺ badhao → Q↓ → E zyada. 25°C pe 0.059 constant.
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

  let zn = 1, cu = 1, T = 298;
  let animId = null, phase = 0;

  const E0 = 1.10, n = 2;

  function computeE() {
    const Q = zn / cu;
    const RTnF = (8.314 * T) / (n * 96485) * Math.log(10);
    return E0 - RTnF * Math.log10(Q);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Draw a gauge with E values
    const cx = W / 2, cy = H / 2;
    const gaugeR = Math.min(W, H) * 0.32;

    // Gauge background arc
    const e = computeE();
    const pct = Math.max(0, Math.min(1, (e + 0.5) / 2.0));

    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Value arc
    const startA = Math.PI * 0.75;
    const endA = startA + Math.PI * 1.5 * pct;
    const grad = ctx.createLinearGradient(cx - gaugeR, 0, cx + gaugeR, 0);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(1, '#10b981');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, startA, endA);
    ctx.stroke();

    // Needle
    const needleA = startA + Math.PI * 1.5 * pct;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleA) * (gaugeR - 8), cy + Math.sin(needleA) * (gaugeR - 8));
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();

    // Value
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.toFixed(3) + ' V', cx, cy + 20);

    // Min/Max labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    const minA = startA + Math.PI * 1.5;
    ctx.fillText('-0.5 V', cx + Math.cos(minA) * (gaugeR + 30), cy + Math.sin(minA) * (gaugeR + 30));
    ctx.fillText('+1.5 V', cx + Math.cos(startA) * (gaugeR + 30), cy + Math.sin(startA) * (gaugeR + 30));

    // E° marker
    const e0Pct = (E0 + 0.5) / 2.0;
    const e0A = startA + Math.PI * 1.5 * e0Pct;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(e0A) * (gaugeR - 12), cy + Math.sin(e0A) * (gaugeR - 12));
    ctx.lineTo(cx + Math.cos(e0A) * (gaugeR + 12), cy + Math.sin(e0A) * (gaugeR + 12));
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('E°', cx + Math.cos(e0A) * (gaugeR + 26), cy + Math.sin(e0A) * (gaugeR + 26));

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Nernst Equation — Cell Potential', cx, cy - gaugeR - 20);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const Q = zn / cu;
    const e = computeE();
    wrap.querySelector('#rE0').textContent = E0.toFixed(2) + ' V';
    wrap.querySelector('#rE').textContent = e.toFixed(3) + ' V';
    wrap.querySelector('#znV').textContent = zn.toFixed(2);
    wrap.querySelector('#cuV').textContent = cu.toFixed(2);
    wrap.querySelector('#tV').textContent = T;
    wrap.querySelector('#rQ').textContent = Q.toFixed(3);
    wrap.querySelector('#rD').textContent = (e - E0).toFixed(3);
  }

  wrap.querySelector('#znSlider').addEventListener('input', e => { zn = parseFloat(e.target.value); update(); });
  wrap.querySelector('#cuSlider').addEventListener('input', e => { cu = parseFloat(e.target.value); update(); });
  wrap.querySelector('#tSlider').addEventListener('input', e => { T = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    zn = 1; cu = 1; T = 298;
    wrap.querySelector('#znSlider').value = 1;
    wrap.querySelector('#cuSlider').value = 1;
    wrap.querySelector('#tSlider').value = 298;
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); update();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

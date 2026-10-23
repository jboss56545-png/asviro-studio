export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Principal Values</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Function</div>
        <div class="text-[11px] font-black text-emerald-300" id="rFn">sin⁻¹</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Range</div>
        <div class="text-[11px] font-black text-cyan-300" id="rRange">[−π/2, π/2]</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[46vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-3 gap-1.5">
        <button type="button" class="mtog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-m="0">sin⁻¹</button>
        <button type="button" class="mtog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="1">cos⁻¹</button>
        <button type="button" class="mtog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-m="2">tan⁻¹</button>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="0">0</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="1">½</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="2">1/√2</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="3">√3/2</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="4">1</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="5">-½</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="6">-1/√2</button>
        <button type="button" class="vbtn py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-v="7">-1</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[9px] text-slate-500 font-bold">VALUE</span>
          <span class="text-[10px] text-slate-400 font-mono" id="exprLabel">sin⁻¹(0)</span>
        </div>
        <div class="text-xl font-black text-emerald-300 text-center py-1" id="resultVal">0°</div>
        <div class="text-[9px] text-slate-500 text-center font-mono" id="radVal">0 rad</div>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Principal Value:</b> Inverse trig functions are many-valued, but we restrict to a specific range to get unique output. Yehi restricted range = principal value.
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

  const VALUES = [
    { label: '0', val: 0 },
    { label: '½', val: 0.5 },
    { label: '1/√2', val: Math.SQRT1_2 },
    { label: '√3/2', val: Math.sqrt(3) / 2 },
    { label: '1', val: 1 },
    { label: '-½', val: -0.5 },
    { label: '-1/√2', val: -Math.SQRT1_2 },
    { label: '-1', val: -1 }
  ];

  let mode = 0, vi = 0;
  let animId = null;

  function computeResult() {
    const v = VALUES[vi].val;
    let theta;
    if (mode === 0) theta = Math.asin(v);
    else if (mode === 1) theta = Math.acos(v);
    else theta = Math.atan(v);
    return theta;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const o = { x: W/2, y: H * 0.55 };
    const scale = Math.min(W, H) * 0.32;

    // Unit circle
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(o.x, o.y, scale, 0, Math.PI * 2); ctx.stroke();

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(o.x - scale * 1.3, o.y); ctx.lineTo(o.x + scale * 1.3, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x, o.y - scale * 1.3); ctx.lineTo(o.x, o.y + scale * 1.3); ctx.stroke();

    // Highlight principal range arc
    let startAng, endAng, rangeLabel, rangeColor;
    if (mode === 0) {
      startAng = -Math.PI / 2; endAng = Math.PI / 2;
      rangeLabel = '[−π/2, π/2]'; rangeColor = 'rgba(16,185,129,0.3)';
    } else if (mode === 1) {
      startAng = 0; endAng = Math.PI;
      rangeLabel = '[0, π]'; rangeColor = 'rgba(34,211,238,0.3)';
    } else {
      startAng = -Math.PI / 2 + 0.01; endAng = Math.PI / 2 - 0.01;
      rangeLabel = '(−π/2, π/2)'; rangeColor = 'rgba(168,85,247,0.3)';
    }
    // Draw range highlight
    ctx.strokeStyle = rangeColor.replace('0.3', '0.6');
    ctx.lineWidth = 12;
    ctx.beginPath();
    // Convert angle to canvas: 0 rad = right, positive is CCW visually
    ctx.arc(o.x, o.y, scale, -endAng, -startAng);
    ctx.stroke();

    // Compute current point
    const v = VALUES[vi].val;
    const theta = computeResult();
    // Point on unit circle
    let ptX, ptY;
    if (mode === 0) {
      ptX = Math.cos(theta); ptY = Math.sin(theta);
    } else if (mode === 1) {
      ptX = Math.cos(theta); ptY = Math.sin(theta);
    } else {
      ptX = Math.cos(theta); ptY = Math.sin(theta);
    }
    const pt = { x: o.x + ptX * scale, y: o.y - ptY * scale };

    // Radius line
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();

    // Point
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Angle arc
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, scale * 0.35, 0, -theta, theta > 0);
    ctx.stroke();

    // Angle label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const angDeg = (theta * 180 / Math.PI).toFixed(1);
    const labelR = scale * 0.55;
    ctx.fillText(angDeg + '°', o.x + Math.cos(theta / 2) * labelR * 0.9, o.y - Math.sin(theta / 2) * labelR * 0.9);

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Unit Circle — Principal Range highlighted', W / 2, 20);

    // Value display near x-axis
    if (mode === 0 || mode === 1) {
      // Show value on axis
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px sans-serif';
      if (mode === 0) {
        ctx.fillText('y = ' + v.toFixed(2), o.x + scale * 1.05, o.y - v * scale * 0.5);
      } else {
        ctx.fillText('x = ' + v.toFixed(2), o.x + v * scale, o.y + scale * 1.15);
      }
    }
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const v = VALUES[vi].val;
    const theta = computeResult();
    const deg = (theta * 180 / Math.PI).toFixed(1);
    wrap.querySelector('#rFn').textContent = ['sin⁻¹', 'cos⁻¹', 'tan⁻¹'][mode];
    wrap.querySelector('#rRange').textContent = ['[−π/2, π/2]', '[0, π]', '(−π/2, π/2)'][mode];
    wrap.querySelector('#exprLabel').textContent = ['sin⁻¹', 'cos⁻¹', 'tan⁻¹'][mode] + '(' + VALUES[vi].label + ')';
    wrap.querySelector('#resultVal').textContent = deg + '°';
    wrap.querySelector('#radVal').textContent = theta.toFixed(4) + ' rad';
  }

  wrap.querySelectorAll('.mtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.mtog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });

  wrap.querySelectorAll('.vbtn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      vi = idx;
      wrap.querySelectorAll('.vbtn').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    mode = 0; vi = 0;
    wrap.querySelectorAll('.mtog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelectorAll('.vbtn').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); update();
  // Initialize vbtn ui
  wrap.querySelectorAll('.vbtn')[0].classList.add('bg-emerald-500/20', 'border-emerald-500/40', 'text-emerald-300');
  wrap.querySelectorAll('.vbtn')[0].classList.remove('bg-white/5', 'border-white/10', 'text-slate-300');
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

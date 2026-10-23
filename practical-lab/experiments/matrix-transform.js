export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Matrix Transform 2D</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 3</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Det</div>
        <div class="text-[11px] font-black text-emerald-300" id="rDet">1.00</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Type</div>
        <div class="text-[11px] font-black text-amber-300" id="rType">Identity</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 max-h-[42vh] overflow-y-auto space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-4 gap-2">
        <div><div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-emerald-400">a</label><span class="text-[9px] font-black text-emerald-400" id="aV">1.0</span></div><input type="range" id="a" min="-3" max="3" step="0.1" value="1" class="w-full accent-emerald-500"></div>
        <div><div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-cyan-400">b</label><span class="text-[9px] font-black text-cyan-400" id="bV">0.0</span></div><input type="range" id="b" min="-3" max="3" step="0.1" value="0" class="w-full accent-cyan-500"></div>
        <div><div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-purple-400">c</label><span class="text-[9px] font-black text-purple-400" id="cV">0.0</span></div><input type="range" id="c" min="-3" max="3" step="0.1" value="0" class="w-full accent-purple-500"></div>
        <div><div class="flex justify-between mb-1"><label class="text-[9px] font-bold text-amber-400">d</label><span class="text-[9px] font-black text-amber-400" id="dV">1.0</span></div><input type="range" id="d" min="-3" max="3" step="0.1" value="1" class="w-full accent-amber-500"></div>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <button type="button" class="preset py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-p="identity">Identity</button>
        <button type="button" class="preset py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-p="rot45">Rotate 45°</button>
        <button type="button" class="preset py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-p="scale2">Scale 2x</button>
        <button type="button" class="preset py-2 rounded-xl text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300" data-p="shear">Shear</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Matrix [[a,b],[c,d]]</b> transforms the unit grid. Det = ad − bc. Negative det = mirror flip. Det = 0 → collapses to a line.
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

  let a = 1, b = 0, c = 0, d = 1;
  let animId = null;

  function w2s(x, y) {
    const scale = Math.min(W, H) / 6;
    return { x: W/2 + x * scale, y: H/2 - y * scale };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid lines
    const scale = Math.min(W, H) / 6;
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const p1 = w2s(i, -3), p2 = w2s(i, 3);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const q1 = w2s(-3, i), q2 = w2s(3, i);
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const o = w2s(0, 0);
    ctx.beginPath(); ctx.moveTo(o.x - 3 * scale, o.y); ctx.lineTo(o.x + 3 * scale, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x, o.y - 3 * scale); ctx.lineTo(o.x, o.y + 3 * scale); ctx.stroke();

    // Original unit square (faint)
    ctx.fillStyle = 'rgba(148,163,184,0.15)';
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    const su = [w2s(0,0), w2s(1,0), w2s(1,1), w2s(0,1)];
    ctx.beginPath();
    ctx.moveTo(su[0].x, su[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(su[i].x, su[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Transformed unit square
    const corners = [[0,0],[1,0],[1,1],[0,1]];
    const tCorners = corners.map(([x, y]) => {
      const tx = a * x + b * y;
      const ty = c * x + d * y;
      return w2s(tx, ty);
    });
    const det = a * d - b * c;
    const fillColor = det >= 0 ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)';
    const strokeColor = det >= 0 ? '#10b981' : '#f43f5e';
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tCorners[0].x, tCorners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(tCorners[i].x, tCorners[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Basis vectors
    const ex = w2s(a, c);
    const ey = w2s(b, d);
    // e1 (red)
    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex.x, ex.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex.x, ex.y, 5, 0, Math.PI * 2); ctx.fill();
    // e2 (cyan)
    ctx.strokeStyle = '#22d3ee';
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ey.x, ey.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(ey.x, ey.y, 5, 0, Math.PI * 2); ctx.fill();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('î', ex.x + 12, ex.y);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('ĵ', ey.x, ey.y - 12);
  }

  function loop() { draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const det = a * d - b * c;
    let type = 'Custom';
    if (Math.abs(a - 1) < 0.05 && Math.abs(d - 1) < 0.05 && Math.abs(b) < 0.05 && Math.abs(c) < 0.05) type = 'Identity';
    else if (Math.abs(det) < 0.05) type = 'Singular';
    else if (det < 0) type = 'Mirrored';
    else if (Math.abs(a - d) < 0.05 && Math.abs(b + c) < 0.05 && Math.abs(a*a + b*b - 1) < 0.05) type = 'Rotation';
    else type = 'Transform';
    wrap.querySelector('#rDet').textContent = det.toFixed(2);
    wrap.querySelector('#rType').textContent = type;
    wrap.querySelector('#aV').textContent = a.toFixed(1);
    wrap.querySelector('#bV').textContent = b.toFixed(1);
    wrap.querySelector('#cV').textContent = c.toFixed(1);
    wrap.querySelector('#dV').textContent = d.toFixed(1);
  }

  ['a','b','c','d'].forEach(id => {
    wrap.querySelector('#' + id).addEventListener('input', e => {
      if (id === 'a') a = parseFloat(e.target.value);
      if (id === 'b') b = parseFloat(e.target.value);
      if (id === 'c') c = parseFloat(e.target.value);
      if (id === 'd') d = parseFloat(e.target.value);
      update();
    });
  });

  wrap.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.p;
      if (p === 'identity') { a = 1; b = 0; c = 0; d = 1; }
      else if (p === 'rot45') { const th = Math.PI/4; a = Math.cos(th); b = -Math.sin(th); c = Math.sin(th); d = Math.cos(th); }
      else if (p === 'scale2') { a = 2; b = 0; c = 0; d = 2; }
      else if (p === 'shear') { a = 1; b = 1; c = 0; d = 1; }
      wrap.querySelector('#a').value = a; wrap.querySelector('#b').value = b;
      wrap.querySelector('#c').value = c; wrap.querySelector('#d').value = d;
      update();
    });
  });

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    a = 1; b = 0; c = 0; d = 1;
    wrap.querySelector('#a').value = 1; wrap.querySelector('#b').value = 0;
    wrap.querySelector('#c').value = 0; wrap.querySelector('#d').value = 1;
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

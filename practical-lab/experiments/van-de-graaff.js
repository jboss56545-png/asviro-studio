export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Van de Graaff Generator</div><div class="text-[9px] text-slate-500 truncate">Class 12 Physics - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Voltage</div>
        <div class="text-[10px] font-black text-emerald-300" id="rV">0 MV</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Charge</div>
        <div class="text-[10px] font-black text-cyan-300" id="rQ">0 μC</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-emerald-400 uppercase">Belt speed</label><span class="text-[11px] font-black text-emerald-400" id="sV">1.0</span></div>
        <input type="range" id="sSlider" min="0" max="3" step="0.1" value="1" class="w-full accent-emerald-500">
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-cyan-400 uppercase">Sphere radius R (cm)</label><span class="text-[11px] font-black text-cyan-400" id="rV2">15</span></div>
        <input type="range" id="rSlider" min="5" max="40" step="1" value="15" class="w-full accent-cyan-500">
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="btn-start py-2.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950">▶ Start</button>
        <button type="button" class="btn-discharge py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">⚡ Discharge</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">Van de Graaff:</b> Charge belt pe travel karke hollow sphere pe collect hota hai. Max V = E_max × R. Sphere ke andar E = 0, poora charge surface pe.
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
  let beltSpeed = 1, R = 15;
  let charge = 0, running = false;
  let animId = null, phase = 0;
  let beltParticles = [];

  function initBelt() {
    beltParticles = [];
    for (let i = 0; i < 12; i++) {
      beltParticles.push({ t: i / 12 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = W/2;
    const baseY = H * 0.85;
    const sphereR = R * Math.min(W, H) * 0.006;

    // Base box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 50, baseY - 20, 100, 40);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 50, baseY - 20, 100, 40);

    // Left roller (motor)
    const leftR = { x: cx - 30, y: baseY - 50 };
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(leftR.x, leftR.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke();

    // Right roller (top inside sphere)
    const rightR = { x: cx + 30, y: baseY - 50 - 140 };
    ctx.fillStyle = '#0891b2';
    ctx.beginPath(); ctx.arc(rightR.x, rightR.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0e7490'; ctx.stroke();

    // Belt
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftR.x - 8, leftR.y);
    ctx.lineTo(rightR.x - 8, rightR.y);
    ctx.moveTo(leftR.x + 8, leftR.y);
    ctx.lineTo(rightR.x + 8, rightR.y);
    ctx.stroke();

    // Belt particles (moving)
    if (running && beltSpeed > 0.05) {
      beltParticles.forEach(p => {
        p.t += 0.008 * beltSpeed;
        if (p.t > 1) { p.t = 0; charge += 0.5 * beltSpeed; }
        const px = leftR.x + (rightR.x - leftR.x) * p.t;
        const py = leftR.y + (rightR.y - leftR.y) * p.t;
        const color = p.t > 0.9 ? '#fbbf24' : '#22d3ee';
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px - 8, py, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 8, py, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Support column
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 30);
    ctx.lineTo(cx, rightR.y + 20);
    ctx.stroke();

    // Sphere (hollow ball on top)
    const sphereCx = cx;
    const sphereCy = rightR.y - sphereR * 0.6;
    // Filled glow inside
    const chargeIntensity = Math.min(1, charge / 200);
    const glow = ctx.createRadialGradient(sphereCx, sphereCy, 0, sphereCx, sphereCy, sphereR * 1.5);
    glow.addColorStop(0, `rgba(251,191,36,${0.15 + chargeIntensity * 0.5})`);
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sphereCx, sphereCy, sphereR * 1.5, 0, Math.PI * 2); ctx.fill();

    // Sphere shell
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sphereCx, sphereCy, sphereR, 0, Math.PI * 2); ctx.stroke();
    // Sphere fill (metallic)
    const sf = ctx.createRadialGradient(sphereCx - sphereR*0.3, sphereCy - sphereR*0.3, 2, sphereCx, sphereCy, sphereR);
    sf.addColorStop(0, 'rgba(200,210,230,0.35)');
    sf.addColorStop(1, 'rgba(100,116,139,0.15)');
    ctx.fillStyle = sf;
    ctx.beginPath(); ctx.arc(sphereCx, sphereCy, sphereR, 0, Math.PI * 2); ctx.fill();

    // Charge signs on sphere surface
    if (chargeIntensity > 0.02) {
      const numSigns = Math.floor(chargeIntensity * 12);
      for (let i = 0; i < numSigns; i++) {
        const a = (i / 12) * Math.PI * 2;
        const px = sphereCx + Math.cos(a) * (sphereR + 10);
        const py = sphereCy + Math.sin(a) * (sphereR + 10);
        ctx.fillStyle = `rgba(251,191,36,${0.5 + chargeIntensity * 0.5})`;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+', px, py);
      }
    }

    // Sparks if charge too high
    if (chargeIntensity > 0.85) {
      const t = (performance.now() * 0.01) % 1;
      if (t < 0.3) {
        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.random() * 0.2;
          const len = sphereR * (1.2 + Math.random() * 0.8);
          ctx.beginPath();
          ctx.moveTo(sphereCx + Math.cos(a) * sphereR, sphereCy + Math.sin(a) * sphereR);
          ctx.lineTo(sphereCx + Math.cos(a) * len, sphereCy + Math.sin(a) * len);
          ctx.stroke();
        }
      }
    }

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hollow sphere', sphereCx, sphereCy - sphereR - 20);
    ctx.fillText('Belt', leftR.x - 60, (leftR.y + rightR.y) / 2);
  }

  function loop() {
    phase += 0.02;
    if (running && beltSpeed > 0.05) {
      // Charge build up
      charge = Math.min(250, charge + 0.15 * beltSpeed);
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    const V = charge * R * 0.01; // MV
    wrap.querySelector('#rV').textContent = V.toFixed(2) + ' MV';
    wrap.querySelector('#rQ').textContent = charge.toFixed(1) + ' μC';
    wrap.querySelector('#sV').textContent = beltSpeed.toFixed(1);
    wrap.querySelector('#rV2').textContent = R;
  }

  wrap.querySelector('#sSlider').addEventListener('input', e => { beltSpeed = parseFloat(e.target.value); update(); });
  wrap.querySelector('#rSlider').addEventListener('input', e => { R = parseFloat(e.target.value); update(); });

  wrap.querySelector('.btn-start').addEventListener('click', (e) => {
    running = !running;
    e.target.textContent = running ? '⏸ Pause' : '▶ Start';
  });
  wrap.querySelector('.btn-discharge').addEventListener('click', () => {
    charge = 0;
    running = false;
    wrap.querySelector('.btn-start').textContent = '▶ Start';
    update();
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    beltSpeed = 1; R = 15; charge = 0; running = false;
    wrap.querySelector('#sSlider').value = 1;
    wrap.querySelector('#rSlider').value = 15;
    wrap.querySelector('.btn-start').textContent = '▶ Start';
    initBelt();
    update();
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize(); initBelt(); update();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

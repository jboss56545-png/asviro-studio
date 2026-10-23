export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Hormonal Control (HPG Axis)</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">GnRH pulse</div>
        <div class="text-[10px] font-black text-emerald-300" id="rGnRH">+</div>
      </div>
      <div class="absolute top-2 right-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Testosterone</div>
        <div class="text-[10px] font-black text-cyan-300" id="rTesto">5 ng/mL</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="gtog py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-g="0">Male (HPG)</button>
        <button type="button" class="gtog py-2 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-g="1">Female (HPG)</button>
      </div>
      <div>
        <div class="flex justify-between mb-1"><label class="text-[10px] font-bold text-amber-400">Testosterone / Estrogen level</label><span class="text-[11px] font-black text-amber-400" id="horV">Medium</span></div>
        <input type="range" id="horSlider" min="0" max="100" step="1" value="50" class="w-full accent-amber-500">
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed">
        <b class="text-emerald-400">HPG Axis:</b> Hypothalamus → GnRH → Pituitary → FSH + LH → Gonads → Testosterone/Estrogen. Negative feedback: high testosterone → inhibits GnRH.
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

  let gender = 0, hormone = 50;
  let animId = null, phase = 0;

  function drawOrganBox(x, y, w, h, label, color, active) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, color + '55');
    g.addColorStop(1, color + '22');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w/2, y - h/2, w, h, 10);
    else ctx.rect(x - w/2, y - h/2, w, h);
    ctx.fill();
    ctx.strokeStyle = active ? color : color + '88';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  function drawArrow(x1, y1, x2, y2, color, dashed, pulse) {
    ctx.strokeStyle = color;
    ctx.lineWidth = pulse ? 3 : 2;
    ctx.setLineDash(dashed ? [5, 4] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(ang - 0.5), y2 - 10 * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - 10 * Math.cos(ang + 0.5), y2 - 10 * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const boxW = Math.min(W * 0.36, 130);
    const boxH = 40;

    // Hypothalamus (top)
    drawOrganBox(cx, H * 0.15, boxW, boxH, 'Hypothalamus', '#a855f7', true);

    // GnRH arrow
    const gnrhPulse = Math.sin(phase * 3) * 0.5 + 0.5;
    drawArrow(cx, H * 0.15 + boxH/2 + 4, cx, H * 0.3 - boxH/2 - 4, '#a855f7', false, gnrhPulse > 0.5);
    ctx.fillStyle = 'rgba(168,85,247,0.95)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GnRH', cx + 8, H * 0.22);

    // Anterior Pituitary
    drawOrganBox(cx, H * 0.3, boxW, boxH, 'Anterior Pituitary', '#8b5cf6', true);

    // FSH + LH arrows (two paths)
    const fshX = cx - 50;
    const lhX = cx + 50;
    drawArrow(cx - 20, H * 0.3 + boxH/2 + 4, fshX, H * 0.52 - boxH/2 - 4, '#22d3ee', false, false);
    drawArrow(cx + 20, H * 0.3 + boxH/2 + 4, lhX, H * 0.52 - boxH/2 - 4, '#f43f5e', false, false);
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('FSH', fshX - 20, H * 0.42);
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText('LH', lhX + 20, H * 0.42);

    // Gonads
    const gonadColor = gender === 0 ? '#f59e0b' : '#ec4899';
    const gonadLabel = gender === 0 ? 'Testes' : 'Ovaries';
    drawOrganBox(cx, H * 0.52, boxW, boxH, gonadLabel, gonadColor, true);

    // Hormone product arrow
    drawArrow(cx, H * 0.52 + boxH/2 + 4, cx, H * 0.68 - boxH/2 - 4, gonadColor, false, false);

    // Hormone product
    const productLabel = gender === 0 ? 'Testosterone' : 'Estrogen + Progesterone';
    drawOrganBox(cx, H * 0.68, boxW + 20, boxH, productLabel, gonadColor, true);

    // Negative feedback arrow (curves from hormone back to hypothalamus)
    const feedbackActive = hormone > 30;
    const feedbackColor = feedbackActive ? 'rgba(244,63,94,0.9)' : 'rgba(100,116,139,0.4)';
    ctx.strokeStyle = feedbackColor;
    ctx.lineWidth = feedbackActive ? 2.5 : 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - boxW/2 - 10, H * 0.68);
    ctx.bezierCurveTo(W * 0.1, H * 0.6, W * 0.1, H * 0.3, cx - boxW/2 - 10, H * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead up
    ctx.fillStyle = feedbackActive ? '#f43f5e' : 'rgba(100,116,139,0.6)';
    ctx.beginPath();
    ctx.moveTo(cx - boxW/2 - 10, H * 0.15);
    ctx.lineTo(cx - boxW/2 - 18, H * 0.15 + 10);
    ctx.lineTo(cx - boxW/2 - 2, H * 0.15 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = feedbackActive ? '#f43f5e' : 'rgba(100,116,139,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(cx - boxW/2 - 25, H * 0.42);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Negative Feedback', 0, 0);
    ctx.restore();

    // Hormone level gauge
    const gaugeX = W * 0.85;
    const gaugeY = H * 0.68;
    const gaugeW = 30;
    const gaugeH = 80;
    // bar
    ctx.fillStyle = 'rgba(148,163,184,0.15)';
    ctx.fillRect(gaugeX - gaugeW/2, gaugeY - gaugeH/2, gaugeW, gaugeH);
    // fill
    const pct = hormone / 100;
    const grad = ctx.createLinearGradient(0, gaugeY + gaugeH/2, 0, gaugeY - gaugeH/2);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(1, '#f43f5e');
    ctx.fillStyle = grad;
    ctx.fillRect(gaugeX - gaugeW/2, gaugeY + gaugeH/2 - gaugeH * pct, gaugeW, gaugeH * pct);
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gaugeX - gaugeW/2, gaugeY - gaugeH/2, gaugeW, gaugeH);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hormone', gaugeX, gaugeY - gaugeH/2 - 10);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  function update() {
    const level = hormone < 30 ? 'Low' : hormone < 60 ? 'Medium' : 'High';
    wrap.querySelector('#horV').textContent = level;
    wrap.querySelector('#rGnRH').textContent = hormone > 60 ? '−' : '+';
    wrap.querySelector('#rTesto').textContent = (hormone / 10).toFixed(1) + (gender === 0 ? ' ng/mL' : ' pg/mL');
  }

  wrap.querySelectorAll('.gtog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      gender = idx;
      wrap.querySelectorAll('.gtog').forEach((b, i) => {
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
  wrap.querySelector('#horSlider').addEventListener('input', e => { hormone = parseFloat(e.target.value); update(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    gender = 0; hormone = 50;
    wrap.querySelector('#horSlider').value = 50;
    wrap.querySelectorAll('.gtog').forEach((b, i) => {
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
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

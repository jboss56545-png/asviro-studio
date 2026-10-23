export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Function Types</div><div class="text-[9px] text-slate-500 truncate">Class 12 Math - Ch 1</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Property</div>
        <div class="text-[11px] font-black text-emerald-300" id="rProp">—</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2.5" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ftog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-f="0">One-One</button>
        <button type="button" class="ftog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="1">Onto</button>
        <button type="button" class="ftog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="2">Bijection</button>
        <button type="button" class="ftog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-f="3">Neither</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">One-One (Injective):</b> Har input ka alag output. Koi 2 inputs same output nahi denge.
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

  let mode = 0;
  let animId = null;
  let pulse = 0;

  // Domain and codomain nodes
  const DOMAIN = ['a', 'b', 'c', 'd'];
  const CODOMAIN = ['1', '2', '3', '4'];

  // Mappings for each mode
  // one-one: 0→1, 1→2, 2→3, 3→4 (all distinct)
  // onto: 0→1, 1→1, 2→3, 3→4 (all codomain hit)
  // bijection: 0→1, 1→3, 2→2, 3→4 (perfect)
  // neither: 0→1, 1→1, 2→2, 3→2 (not onto, not 1-1)
  const MAPS = [
    { m: [1, 2, 3, 4], title: 'One-One (Injective)', desc: 'Har input ka alag output. Koi 2 inputs same output nahi denge.' },
    { m: [0, 0, 2, 3], title: 'Onto (Surjective)', desc: 'Codomain ke sab elements hit. Ek ya zyada inputs same output de sakte hain.' },
    { m: [1, 3, 2, 4], title: 'Bijection', desc: 'One-One + Onto. Perfect pairing — inverse exists. Har codomain pe exactly 1 arrow.' },
    { m: [0, 0, 1, 1], title: 'Neither', desc: 'Not one-one (a,b → 1) and not onto (3,4 untouched).' }
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const colX = W * 0.25;
    const codX = W * 0.75;
    const startY = H * 0.18;
    const gapY = H * 0.15;

    const col = MAPS[mode];

    // Arrows first (behind circles)
    col.m.forEach((to, from) => {
      const x1 = colX + 30;
      const y1 = startY + from * gapY;
      const x2 = codX - 30;
      const y2 = startY + to * gapY;
      // Bezier curve
      const cx1 = colX + (codX - colX) * 0.3;
      const cx2 = colX + (codX - colX) * 0.7;
      ctx.strokeStyle = `rgba(251,191,36,${0.6 + Math.sin(pulse + from) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cx1, y1, cx2, y2, x2, y2);
      ctx.stroke();

      // Arrowhead
      const ang = Math.atan2(y2 - y2, x2 - x2);
      // Simplified arrowhead using bezier tangent
      const tx = x2 - cx2;
      const ty = y2 - y2;
      const tAng = Math.atan2(ty, tx);
      ctx.fillStyle = 'rgba(251,191,36,0.85)';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(tAng - 0.4), y2 - 10 * Math.sin(tAng - 0.4));
      ctx.lineTo(x2 - 10 * Math.cos(tAng + 0.4), y2 - 10 * Math.sin(tAng + 0.4));
      ctx.closePath();
      ctx.fill();
    });

    // Domain circles
    DOMAIN.forEach((label, i) => {
      const x = colX;
      const y = startY + i * gapY;
      const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 22);
      g.addColorStop(0, '#67e8f9');
      g.addColorStop(1, '#0891b2');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 1);
    });

    // Codomain circles
    CODOMAIN.forEach((label, i) => {
      const x = codX;
      const y = startY + i * gapY;
      const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 22);
      g.addColorStop(0, '#f9a8d4');
      g.addColorStop(1, '#be185d');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 1);
    });

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Domain (X)', colX, startY - 30);
    ctx.fillText('Codomain (Y)', codX, startY - 30);

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(col.title, W / 2, H - 20);
  }

  function loop() { pulse += 0.05; draw(); animId = requestAnimationFrame(loop); }

  wrap.querySelectorAll('.ftog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      mode = idx;
      wrap.querySelectorAll('.ftog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#rProp').textContent = col_title(idx);
      wrap.querySelector('#infoBox').innerHTML = '<b class="text-emerald-400">' + MAPS[idx].title + ':</b> ' + MAPS[idx].desc;
    });
  });
  function col_title(i) {
    return ['Injective', 'Surjective', 'Bijection', 'Neither'][i];
  }

  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    mode = 0;
    wrap.querySelectorAll('.ftog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#rProp').textContent = 'Injective';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  wrap.querySelector('#rProp').textContent = 'Injective';
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

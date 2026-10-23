export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col';
  wrap.innerHTML = `
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5 shrink-0" style="backdrop-filter:blur(20px);">
      <button type="button" class="back-btn flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-arrow-left text-[10px]"></i> Back</button>
      <div class="flex-1 text-center min-w-0"><div class="text-xs font-black text-slate-100 truncate">Identical vs Fraternal Twins</div><div class="text-[9px] text-slate-500 truncate">Class 12 Bio - Ch 2</div></div>
      <button type="button" class="reset-btn w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center"><i class="fa-solid fa-rotate-left text-xs"></i></button>
    </div>
    <div class="relative flex-1 bg-slate-950 min-h-0">
      <canvas class="absolute inset-0 w-full h-full"></canvas>
      <div class="absolute top-2 left-2 bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 pointer-events-none" style="backdrop-filter:blur(12px);">
        <div class="text-[8px] text-slate-400 uppercase font-bold">Type</div>
        <div class="text-[10px] font-black text-pink-300" id="rType">Identical</div>
      </div>
    </div>
    <div class="bg-white/5 border-t border-white/10 p-3 shrink-0 space-y-2" style="backdrop-filter:blur(20px);">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" class="ttog py-2.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" data-t="0">Identical (Monozygotic)</button>
        <button type="button" class="ttog py-2.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300" data-t="1">Fraternal (Dizygotic)</button>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[9px] text-slate-400 leading-relaxed" id="infoBox">
        <b class="text-emerald-400">Identical twins:</b> One fertilized egg (zygote) splits into two embryos. Same genome (100% identical). Same placenta or 2 placentas. Same sex always. Frequency ~1 in 250 births.
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

  let type = 0;
  let animId = null, phase = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#1e1b2e'); bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const topY = H * 0.15;
    const midY = H * 0.45;
    const botY = H * 0.78;

    // Common uterus outline
    ctx.fillStyle = 'rgba(251,207,232,0.15)';
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.35, topY);
    ctx.quadraticCurveTo(cx - W * 0.4, botY - 20, cx, botY);
    ctx.quadraticCurveTo(cx + W * 0.4, botY - 20, cx + W * 0.35, topY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(236,72,153,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (type === 0) {
      // Identical twins — same sex, same DNA
      drawStep(cx, topY + 30, 'Zygote', '#22d3ee', '1 fertilized egg');
      drawArrowDown(cx, topY + 50, topY + 90);
      drawSplit(cx, topY + 110);
      drawStep(cx - 70, midY, 'Embryo 1', '#3b82f6', '♀ Female');
      drawStep(cx + 70, midY, 'Embryo 2', '#3b82f6', '♀ Female');
      drawArrowDown(cx - 70, midY + 45, midY + 75);
      drawArrowDown(cx + 70, midY + 45, midY + 75);
      drawStep(cx, botY - 40, 'Same DNA • Same sex • 1 placenta (usually)', '#10b981', '');
    } else {
      // Fraternal twins — different eggs, different sperm
      drawStep(cx - 70, topY + 30, 'Egg 1', '#f472b6', '');
      drawStep(cx + 70, topY + 30, 'Egg 2', '#f472b6', '');
      drawSpermLeft(cx - 70, topY + 5);
      drawSpermRight(cx + 70, topY + 5);
      drawStep(cx - 70, midY, 'Embryo 1', '#3b82f6', '♂ Male');
      drawStep(cx + 70, midY, 'Embryo 2', '#a855f7', '♀ Female');
      drawArrowDown(cx - 70, topY + 45, midY - 30);
      drawArrowDown(cx + 70, topY + 45, midY - 30);
      drawArrowDown(cx - 70, midY + 45, midY + 75);
      drawArrowDown(cx + 70, midY + 45, midY + 75);
      drawStep(cx, botY - 40, 'Different DNA • Can be different sex • 2 placentas', '#a855f7', '');
    }

    // Uterus label
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Uterus', 15, H * 0.9);
  }

  function drawStep(x, y, label, color, sub) {
    const bw = Math.min(W * 0.7, 300);
    const bh = 42;
    ctx.fillStyle = color + '22';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - bw/2, y - bh/2, bw, bh, 10);
    else ctx.rect(x - bw/2, y - bh/2, bw, bh);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - (sub ? 6 : 0));
    if (sub) {
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(sub, x, y + 8);
    }
  }

  function drawArrowDown(x, y1, y2) {
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.beginPath();
    ctx.moveTo(x, y2);
    ctx.lineTo(x - 6, y2 - 8);
    ctx.lineTo(x + 6, y2 - 8);
    ctx.closePath();
    ctx.fill();
  }

  function drawSplit(cx, y) {
    // Split lines from one zygote to two embryos
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx - 30, y + 15, cx - 70, y + 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + 30, y + 15, cx + 70, y + 30);
    ctx.stroke();
    // Split marker
    ctx.fillStyle = 'rgba(16,185,129,0.9)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPLITS', cx, y + 15);
  }

  function drawSpermLeft(x, y) {
    // Sperm head
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(x - 8, y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x - 25, y + Math.sin(phase * 5) * 3);
    ctx.stroke();
    // Arrow
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSpermRight(x, y) {
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(x + 8, y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + 25, y + Math.sin(phase * 5 + 1) * 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 6);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function loop() { phase += 0.02; draw(); animId = requestAnimationFrame(loop); }

  wrap.querySelectorAll('.ttog').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      type = idx;
      wrap.querySelectorAll('.ttog').forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('bg-emerald-500/20', on);
        b.classList.toggle('border-emerald-500/40', on);
        b.classList.toggle('text-emerald-300', on);
        b.classList.toggle('bg-white/5', !on);
        b.classList.toggle('border-white/10', !on);
        b.classList.toggle('text-slate-300', !on);
      });
      wrap.querySelector('#rType').textContent = idx === 0 ? 'Identical' : 'Fraternal';
      wrap.querySelector('#infoBox').innerHTML = idx === 0
        ? '<b class="text-emerald-400">Identical twins:</b> One fertilized egg (zygote) splits into two embryos. Same genome (100% identical). Same placenta or 2 placentas. Same sex always. Frequency ~1 in 250 births.'
        : '<b class="text-purple-400">Fraternal twins:</b> Two separate eggs fertilized by two different sperms. Different genomes (like normal siblings). 2 placentas. Can be different sexes. Frequency higher with fertility treatment.';
    });
  });
  wrap.querySelector('.reset-btn').addEventListener('click', () => {
    type = 0;
    wrap.querySelectorAll('.ttog').forEach((b, i) => {
      const on = i === 0;
      b.classList.toggle('bg-emerald-500/20', on);
      b.classList.toggle('border-emerald-500/40', on);
      b.classList.toggle('text-emerald-300', on);
      b.classList.toggle('bg-white/5', !on);
      b.classList.toggle('border-white/10', !on);
      b.classList.toggle('text-slate-300', !on);
    });
    wrap.querySelector('#rType').textContent = 'Identical';
    wrap.querySelector('#infoBox').innerHTML = '<b class="text-emerald-400">Identical twins:</b> One fertilized egg (zygote) splits into two embryos. Same genome (100% identical). Same placenta or 2 placentas. Same sex always. Frequency ~1 in 250 births.';
  });
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack());

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  resize();
  animId = requestAnimationFrame(loop);
  return function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

export function mount(host) {
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Order vs Molecularity</div><div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;">
      <div style="display:flex;gap:8px;background:rgba(15,23,42,0.6);padding:4px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
        <button id="btn1" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:900;color:#030712;background:#38bdf8;border:none;cursor:pointer;">Unimolecular</button>
        <button id="btn2" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:900;color:#94a3b8;background:transparent;border:none;cursor:pointer;">Bimolecular</button>
      </div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas'); const canvasHost = wrap.querySelector('#canvasHost'); const ctx = canvas.getContext('2d');
  const btn1 = wrap.querySelector('#btn1'); const btn2 = wrap.querySelector('#btn2');

  let W = 0, H = 0, animId = null, isRunning = true;
  let mode = 1; let phase = 0;

  function resize() { let w = canvasHost.clientWidth || window.innerWidth; let h = canvasHost.clientHeight || 300; const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); W=w; H=h; }
  function setMode(m) {
    mode = m;
    if(m===1) { btn1.style.background = '#38bdf8'; btn1.style.color = '#030712'; btn2.style.background = 'transparent'; btn2.style.color = '#94a3b8'; }
    else { btn2.style.background = '#a855f7'; btn2.style.color = '#fff'; btn1.style.background = 'transparent'; btn1.style.color = '#94a3b8'; }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W/2, cy = H/2; phase += 0.03;

    if(mode === 1) {
      // Unimolecular (1 molecule splits)
      let size = 30 + Math.sin(phase*2)*5;
      ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI*2);
      ctx.fillStyle = '#38bdf8'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(cx, cy-size); ctx.lineTo(cx, cy+size); ctx.stroke(); ctx.setLineDash([]);
    } else {
      // Bimolecular (2 molecules collide)
      let gap = 40 + Math.sin(phase)*20;
      ctx.beginPath(); ctx.arc(cx - gap, cy, 25, 0, Math.PI*2); ctx.fillStyle = '#a855f7'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + gap, cy, 25, 0, Math.PI*2); ctx.fillStyle = '#a855f7'; ctx.fill();
      if(gap < 25) { // Collision flash
        ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fillStyle = '#fbbf24'; ctx.fill();
      }
    }
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  btn1.addEventListener('click', () => setMode(1)); btn2.addEventListener('click', () => setMode(2));
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize); setMode(1); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);
  return function cleanup() { isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow; };
}

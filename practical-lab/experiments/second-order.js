export function mount(host) {
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Second Order Reactions</div><div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;text-align:center;">
      <div style="font-size:11px;color:#cbd5e1;">Rate = k[A]² | Equation: 1/[A] = 1/[A]₀ + kt</div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas'); const canvasHost = wrap.querySelector('#canvasHost'); const ctx = canvas.getContext('2d');

  let W = 0, H = 0, animId = null, isRunning = true;
  let time = 0, k = 0.5;

  function resize() { let w = canvasHost.clientWidth || window.innerWidth; let h = canvasHost.clientHeight || 300; const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); W=w; H=h; }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    time += 0.02; if(time > 5) time = 0; // reset fast because second order drops quickly

    let graphH = H * 0.7, graphY = H * 0.85;
    let graphW = W * 0.8, graphX = W * 0.1;

    ctx.beginPath(); ctx.moveTo(graphX, graphY); ctx.lineTo(graphX, graphY - graphH); ctx.lineTo(graphX + graphW, graphY - graphH); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

    // [A] = 1 / (1/[A]0 + kt) => [A] = 1 / (1 + kt) assuming [A]0 = 1
    ctx.beginPath(); ctx.moveTo(graphX, graphY);
    for(let t=0; t<=time; t+=0.05) {
      let c = 1 / (1 + k*t);
      let cx = graphX + (t/5) * graphW;
      let cy = graphY - c * graphH;
      if(t===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 5; ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;

    let cNow = 1 / (1 + k*time);
    let px = graphX + (time/5) * graphW;
    let py = graphY - cNow * graphH;
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.fillStyle = '#f43f5e'; ctx.fill();

    ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Time (s) →', graphX + graphW/2, graphY + 20);
    ctx.save(); ctx.translate(graphX - 20, graphY - graphH/2); ctx.rotate(-Math.PI/2); ctx.fillText('[A] →', 0, 0); ctx.restore();
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);
  return function cleanup() { isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow; };
}

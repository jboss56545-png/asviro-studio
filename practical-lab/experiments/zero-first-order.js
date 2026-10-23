export function mount(host) {
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Zero & First Order</div><div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;text-align:center;">
      <div style="font-size:11px;color:#cbd5e1;">Left: Zero Order (Linear) | Right: First Order (Exponential)</div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas'); const canvasHost = wrap.querySelector('#canvasHost'); const ctx = canvas.getContext('2d');

  let W = 0, H = 0, animId = null, isRunning = true;
  let time = 0, k = 0.5;

  function resize() { let w = canvasHost.clientWidth || window.innerWidth; let h = canvasHost.clientHeight || 300; const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); W=w; H=h; }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    time += 0.02; if(time > 10) time = 0;

    let halfW = W/2;
    let graphH = H * 0.6, graphY = H * 0.8;

    // Left: Zero Order
    ctx.beginPath(); ctx.moveTo(20, graphY); ctx.lineTo(20, graphY - graphH); ctx.lineTo(halfW - 20, graphY - graphH); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
    
    ctx.beginPath(); ctx.moveTo(20, graphY);
    let zc = 1.0 - k*time; if(zc < 0) zc = 0;
    let zy = graphY - (zc / 1.0) * graphH;
    ctx.lineTo(20 + (time/10)*(halfW-40), zy);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(20 + (time/10)*(halfW-40), zy, 6, 0, Math.PI*2); ctx.fillStyle = '#38bdf8'; ctx.fill();

    // Right: First Order
    ctx.beginPath(); ctx.moveTo(halfW + 20, graphY); ctx.lineTo(halfW + 20, graphY - graphH); ctx.lineTo(W - 20, graphY - graphH); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
    
    ctx.beginPath(); ctx.moveTo(halfW + 20, graphY);
    let fc = Math.exp(-k*time);
    let fy = graphY - (fc / 1.0) * graphH;
    // Draw curve points
    for(let t=0; t<=time; t+=0.1) {
      let cx = halfW + 20 + (t/10)*(halfW-40);
      let cy = graphY - (Math.exp(-k*t)) * graphH;
      if(t===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(halfW + 20 + (time/10)*(halfW-40), fy, 6, 0, Math.PI*2); ctx.fillStyle = '#a855f7'; ctx.fill();
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);
  return function cleanup() { isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow; };
        }

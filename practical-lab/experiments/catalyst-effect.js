export function mount(host) {
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Catalyst Effect</div><div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;">
      <div style="display:flex;gap:8px;background:rgba(15,23,42,0.6);padding:4px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
        <button id="btnNoCat" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:900;color:#030712;background:#f43f5e;border:none;cursor:pointer;">Without Catalyst</button>
        <button id="btnCat" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:900;color:#94a3b8;background:transparent;border:none;cursor:pointer;">With Catalyst</button>
      </div>
      <div id="statusText" style="text-align:center;font-size:11px;color:#fbbf24;margin-top:10px;font-weight:bold;">High Activation Energy Barrier</div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas'); const canvasHost = wrap.querySelector('#canvasHost'); const ctx = canvas.getContext('2d');
  const btnNoCat = wrap.querySelector('#btnNoCat'); const btnCat = wrap.querySelector('#btnCat'); const statusText = wrap.querySelector('#statusText');

  let W = 0, H = 0, animId = null, isRunning = true;
  let hasCatalyst = false; let phase = 0;

  function resize() { let w = canvasHost.clientWidth || window.innerWidth; let h = canvasHost.clientHeight || 300; const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); W=w; H=h; }

  function setCat(c) {
    hasCatalyst = c;
    if(c) { btnCat.style.background = '#10b981'; btnCat.style.color = '#030712'; btnNoCat.style.background = 'transparent'; btnNoCat.style.color = '#94a3b8'; statusText.textContent = "Lowered Activation Energy (Fast Reaction)"; statusText.style.color = "#10b981"; }
    else { btnNoCat.style.background = '#f43f5e'; btnNoCat.style.color = '#fff'; btnCat.style.background = 'transparent'; btnCat.style.color = '#94a3b8'; statusText.textContent = "High Activation Energy Barrier"; statusText.style.color = "#fbbf24"; }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W/2, cy = H/2; phase += 0.05;
    
    let peakY = hasCatalyst ? H*0.4 : H*0.15; // Catalyst lowers peak
    let col = hasCatalyst ? '#10b981' : '#f43f5e';

    // Energy Profile Curve
    ctx.beginPath(); ctx.moveTo(W*0.1, H*0.8);
    ctx.bezierCurveTo(W*0.3, H*0.8, W*0.4, peakY, cx, peakY);
    ctx.bezierCurveTo(W*0.6, peakY, W*0.7, H*0.8, W*0.9, H*0.8);
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;

    // Molecules moving
    for(let i=0; i<5; i++) {
      let t = (phase + i*0.2) % 1;
      let mx = W*0.1 + t*(W*0.8);
      // Parabola approx for y
      let my = H*0.8 - Math.sin(t*Math.PI) * (H*0.8 - peakY);
      
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI*2);
      ctx.fillStyle = hasCatalyst && t>0.4 ? '#10b981' : '#38bdf8'; // Turn green after crossing barrier
      ctx.fill();
    }
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  btnNoCat.addEventListener('click', () => setCat(false));
  btnCat.addEventListener('click', () => setCat(true));
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize); setCat(false); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);
  return function cleanup() { isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow; };
    }

export function mount(host) {
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Rate of Reaction</div><div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;">
      <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <label style="font-size:11px;color:#e2e8f0;">Initial [Reactant]</label><span id="concVal" style="font-size:11px;color:#38bdf8;font-weight:bold;">1.0 M</span>
        </div>
        <input id="concSlider" type="range" min="0.2" max="2.0" step="0.1" value="1" style="width:100%;accent-color:#38bdf8;cursor:pointer;" />
      </div>
    </div>
  `;
  host.appendChild(wrap);
  const canvas = wrap.querySelector('canvas'); const canvasHost = wrap.querySelector('#canvasHost'); const ctx = canvas.getContext('2d');
  const concSlider = wrap.querySelector('#concSlider'); const concVal = wrap.querySelector('#concVal');

  let W = 0, H = 0, animId = null, isRunning = true;
  let initialConc = 1.0, currentConc = 1.0, time = 0, k = 0.5;

  function resize() { let w = canvasHost.clientWidth || window.innerWidth; let h = canvasHost.clientHeight || 300; const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); W=w; H=h; }
  function updatePhysics() { initialConc = parseFloat(concSlider.value); concVal.textContent = initialConc.toFixed(1) + ' M'; currentConc = initialConc; time = 0; }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    time += 0.02;
    currentConc = initialConc * Math.exp(-k * time);
    if(currentConc < 0.01) { currentConc = initialConc; time = 0; } // loop

    // Beaker representation (Size based on conc)
    let beakerH = H * 0.6;
    let fillH = beakerH * (currentConc / 2.0); // Max 2.0 M
    
    let cx = W/2, cy = H/2;
    
    // Beaker outline
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 4;
    ctx.strokeRect(cx - 60, cy - beakerH/2, 120, beakerH);
    
    // Liquid
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.fillRect(cx - 58, cy + beakerH/2 - fillH, 116, fillH);
    
    // Bubbles
    for(let i=0; i<15; i++) {
      let bx = cx - 50 + Math.random()*100;
      let by = cy + beakerH/2 - Math.random()*fillH;
      ctx.beginPath(); ctx.arc(bx, by, 2+Math.random()*3, 0, Math.PI*2);
      ctx.fillStyle = '#f8fafc'; ctx.fill();
    }
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  concSlider.addEventListener('input', updatePhysics);
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize); updatePhysics(); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);
  return function cleanup() { isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow; };
}

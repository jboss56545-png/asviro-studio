export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="flex:1;text-align:center;min-width:0;"><div style="font-size:12px;font-weight:900;color:#f1f5f9;">Arrhenius Equation</div><div style="font-size:9px;color:#64748b;">Chem 12 - Ch 3</div></div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-rotate-left"></i></button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Temperature (K)</label>
            <span id="tempVal" style="font-size:11px;font-weight:900;color:#fbbf24;">300 K</span>
          </div>
          <input id="tempSlider" type="range" min="250" max="500" step="5" value="300" style="width:100%;accent-color:#fbbf24;cursor:pointer;height:5px;" />
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const tempSlider = wrap.querySelector('#tempSlider');
  const tempVal = wrap.querySelector('#tempVal');
  
  let W = 0, H = 0, animId = null, isRunning = true;
  let T = 300, Ea = 50, R = 8.314;
  let phase = 0;

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }

  function updatePhysics() {
    T = parseFloat(tempSlider.value);
    tempVal.textContent = T + ' K';
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.05;

    // Calculate fraction of molecules with E > Ea (Maxwell-Boltzmann)
    // f = e^(-Ea/RT). We'll simulate this visually.
    let fraction = Math.exp(-Ea * 1000 / (R * T)); 
    let activeMolecules = Math.floor(fraction * 50); // out of 50

    // Draw Energy barrier (Ea)
    ctx.beginPath();
    ctx.moveTo(W*0.2, H*0.8);
    ctx.bezierCurveTo(W*0.4, H*0.8, W*0.4, H*0.2, W*0.5, H*0.2); // Peak
    ctx.bezierCurveTo(W*0.6, H*0.2, W*0.6, H*0.8, W*0.8, H*0.8);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'; ctx.lineWidth = 6; ctx.stroke();
    
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('Ea (Activation Energy)', cx, H*0.15);

    // Draw Molecules bouncing. More temp = faster, more chance to go over.
    for (let i = 0; i < 50; i++) {
      let angle = (i / 50) * Math.PI * 2 + phase * (T/100);
      let r = 50 + Math.sin(phase*2 + i)*30;
      let mx = cx + Math.cos(angle) * r;
      let my = H*0.6 + Math.sin(angle) * r * 0.5;
      
      // If it's an "active" molecule, let it glow and move higher
      let isActive = i < activeMolecules;
      
      ctx.beginPath(); ctx.arc(mx, my, isActive ? 5 : 3, 0, Math.PI*2);
      ctx.fillStyle = isActive ? '#f43f5e' : '#64748b';
      if (isActive) { ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 10; }
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tempSlider.addEventListener('input', updatePhysics);
  wrap.querySelector('.back-btn').addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => { tempSlider.value = 300; updatePhysics(); });

  window.addEventListener('resize', resize);
  updatePhysics(); resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
               }

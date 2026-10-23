export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
      <div style="flex:1;text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Resistivity vs Temp</div>
      </div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.35);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#f43f5e;box-shadow:0 0 10px #f43f5e;"></span>
            <span style="font-size:11px;font-weight:900;color:#f43f5e;letter-spacing:0.4px;text-transform:uppercase;">Thermal Effect</span>
          </div>
          <div id="statusText" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:monospace;">
            R = 10.00 Ω
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="tempSlider" style="font-size:11px;font-weight:800;color:#e2e8f0;">Temperature (°C)</label>
              <span id="tempVal" style="font-size:11px;font-weight:900;color:#f43f5e;">20 °C</span>
            </div>
            <input id="tempSlider" type="range" min="20" max="200" step="5" value="20" style="width:100%;accent-color:#f43f5e;cursor:pointer;height:5px;" />
          </div>
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
  const statusText = wrap.querySelector('#statusText');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let T = 20, R0 = 10, alpha = 0.004; // alpha for copper approx
  
  let electrons = [];
  let latticeAtoms = [];

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    initParticles();
  }

  function initParticles() {
    electrons = [];
    latticeAtoms = [];
    for(let i=0; i<40; i++) {
      electrons.push({ x: Math.random()*W, y: H*0.4 + Math.random()*H*0.2, vx: 2, vy: (Math.random()-0.5)*2 });
    }
    for(let i=0; i<15; i++) {
      for(let j=0; j<4; j++) {
        latticeAtoms.push({ x0: W*0.1 + i*(W*0.8/14), y0: H*0.4 + j*(H*0.2/3), phase: Math.random()*Math.PI*2 });
      }
    }
  }

  function updatePhysics() {
    T = parseFloat(tempSlider.value);
    tempVal.textContent = T + ' °C';
    
    // R = R0(1 + alpha * deltaT)
    let deltaT = T - 20;
    let R = R0 * (1 + alpha * deltaT);
    statusText.textContent = 'R = ' + R.toFixed(2) + ' Ω';
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    
    // Background heat glow based on temperature
    let heatIntensity = (T - 20) / 180;
    if (heatIntensity > 0) {
      let grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W/2);
      grad.addColorStop(0, 'rgba(244, 63, 94, ' + (heatIntensity * 0.15) + ')');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    }

    // Draw Wire Container
    ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
    drawRoundedRect(W*0.1, H*0.4, W*0.8, H*0.2, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.3 + heatIntensity*0.7) + ')'; ctx.lineWidth = 2; ctx.stroke();

    // Draw Lattice Atoms (Vibrating)
    let vibrationAmp = (T - 20) * 0.05;
    latticeAtoms.forEach(atom => {
      let vx = Math.sin(Date.now() * 0.01 + atom.phase) * vibrationAmp;
      let vy = Math.cos(Date.now() * 0.015 + atom.phase) * vibrationAmp;
      
      ctx.beginPath(); ctx.arc(atom.x0 + vx, atom.y0 + vy, 4, 0, Math.PI*2);
      ctx.fillStyle = '#64748b'; ctx.fill();
    });

    // Draw Electrons (Slower as resistance increases due to more collisions)
    let collisionProb = heatIntensity * 0.1;
    electrons.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      
      // Scatter on high temp
      if (Math.random() < collisionProb) {
        e.vy = (Math.random() - 0.5) * 4;
        e.vx = Math.random() * 1.5 + 0.5; // slows down
      }

      if (e.x > W*0.9) { e.x = W*0.1; e.vy = (Math.random()-0.5)*2; }
      if (e.y < H*0.4+10) e.vy *= -1;
      if (e.y > H*0.6-10) e.vy *= -1;

      ctx.beginPath(); ctx.arc(e.x, e.y, 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 6;
      ctx.fill(); ctx.shadowBlur = 0;
    });

    // Overlay Card
    let fCardX = 16, fCardY = 12, fCardW = 240, fCardH = 75;
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = '#f43f5e'; ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 9.5px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('RESISTIVITY FORMULA', fCardX + 18, fCardY + 20);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 14px system-ui';
    ctx.fillText('Rₜ = R₀(1 + αΔT)', fCardX + 18, fCardY + 43);
    ctx.fillStyle = '#f43f5e'; ctx.font = '700 11px system-ui';
    ctx.fillText('Higher T = More Collisions', fCardX + 18, fCardY + 65);
    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tempSlider.addEventListener('input', updatePhysics);
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { tempSlider.value = 20; updatePhysics(); });

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

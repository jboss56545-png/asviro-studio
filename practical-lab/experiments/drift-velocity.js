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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Drift Velocity</div>
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
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.35);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#38bdf8;box-shadow:0 0 10px #38bdf8;"></span>
            <span style="font-size:11px;font-weight:900;color:#38bdf8;letter-spacing:0.4px;text-transform:uppercase;">Electron Drift</span>
          </div>
          <div id="statusText" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:monospace;">
            v_d = 0.00 mm/s
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="voltageSlider" style="font-size:11px;font-weight:800;color:#e2e8f0;">Voltage (V)</label>
              <span id="voltageVal" style="font-size:11px;font-weight:900;color:#fbbf24;">5.0 V</span>
            </div>
            <input id="voltageSlider" type="range" min="1" max="10" step="0.5" value="5" style="width:100%;accent-color:#fbbf24;cursor:pointer;height:5px;" />
          </div>
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="materialSlider" style="font-size:11px;font-weight:800;color:#e2e8f0;">Material (n)</label>
              <span id="materialVal" style="font-size:11px;font-weight:900;color:#a855f7;">Copper</span>
            </div>
            <input id="materialSlider" type="range" min="1" max="3" step="1" value="1" style="width:100%;accent-color:#a855f7;cursor:pointer;height:5px;" />
          </div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const voltageSlider = wrap.querySelector('#voltageSlider');
  const materialSlider = wrap.querySelector('#materialSlider');
  const voltageVal = wrap.querySelector('#voltageVal');
  const materialVal = wrap.querySelector('#materialVal');
  const statusText = wrap.querySelector('#statusText');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let V = 5, materialIdx = 1, driftSpeed = 0;
  let electrons = [];

  const materials = [
    { name: 'Copper', color: '#b87333' },
    { name: 'Silicon', color: '#64748b' },
    { name: 'Rubber', color: '#1e293b' }
  ];

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }

  function initElectrons() {
    electrons = [];
    for (let i = 0; i < 60; i++) {
      electrons.push({
        x: Math.random() * W,
        y: H * 0.4 + Math.random() * (H * 0.2),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: 2 + Math.random() * 2
      });
    }
  }

  function updatePhysics() {
    V = parseFloat(voltageSlider.value);
    materialIdx = parseInt(materialSlider.value);
    
    voltageVal.textContent = V.toFixed(1) + ' V';
    materialVal.textContent = materials[materialIdx-1].name;

    // Drift speed proportional to V, inversely proportional to material density (simulated)
    let densityFactor = materialIdx === 1 ? 1 : (materialIdx === 2 ? 0.3 : 0.05);
    driftSpeed = (V * 0.2) * densityFactor;
    
    statusText.textContent = 'v_d = ' + (driftSpeed * 10).toFixed(2) + ' mm/s';
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    
    // Draw Wire
    const wireY = H * 0.5;
    const wireH = H * 0.25;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    drawRoundedRect(W * 0.1, wireY - wireH/2, W * 0.8, wireH, 20);
    ctx.fill();
    ctx.strokeStyle = materials[materialIdx-1].color; ctx.lineWidth = 2; ctx.stroke();

    // Draw Overlays
    let fCardX = 16, fCardY = 12, fCardW = 240, fCardH = 75;
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = '#38bdf8'; ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 9.5px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('DRIFT VELOCITY FORMULA', fCardX + 18, fCardY + 20);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 14px system-ui';
    ctx.fillText('v_d = I / (nAe)', fCardX + 18, fCardY + 43);
    ctx.fillStyle = '#38bdf8'; ctx.font = '700 11px system-ui';
    ctx.fillText('v_d ∝ V (Voltage)', fCardX + 18, fCardY + 65);
    ctx.restore();

    // Update & Draw Electrons
    electrons.forEach(e => {
      // Random thermal motion + drift
      e.x += e.vx + driftSpeed;
      e.y += e.vy;

      if (e.x > W * 0.9 - 10) e.x = W * 0.1 + 10;
      if (e.x < W * 0.1 + 10) e.x = W * 0.9 - 10;
      if (e.y < wireY - wireH/2 + 10) e.vy *= -1;
      if (e.y > wireY + wireH/2 - 10) e.vy *= -1;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    });
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  voltageSlider.addEventListener('input', updatePhysics);
  materialSlider.addEventListener('input', updatePhysics);
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { voltageSlider.value = 5; materialSlider.value = 1; updatePhysics(); });

  window.addEventListener('resize', resize);
  updatePhysics(); resize(); initElectrons();
  requestAnimationFrame(() => { resize(); initElectrons(); });
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

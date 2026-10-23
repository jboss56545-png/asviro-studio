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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Combination of Cells</div>
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
        
        <!-- Toggle Button -->
        <div style="display:flex; gap:8px; background:rgba(15,23,42,0.6); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <button id="btnSeries" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#030712; background:#38bdf8; border:none; cursor:pointer; transition:0.2s;">SERIES</button>
          <button id="btnParallel" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">PARALLEL</button>
        </div>

        <!-- Status Banner -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.35);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#38bdf8;box-shadow:0 0 10px #38bdf8;"></span>
            <span id="statusTitle" style="font-size:11px;font-weight:900;color:#38bdf8;letter-spacing:0.4px;text-transform:uppercase;">Equivalent Values</span>
          </div>
          <div id="eqReadout" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:monospace;">
            E_eq = 10V | r_eq = 2Ω
          </div>
        </div>

        <!-- Sliders Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Cells (n)</label>
              <span id="numCellsVal" style="font-size:11px;font-weight:900;color:#38bdf8;">2</span>
            </div>
            <input id="numCells" type="range" min="1" max="4" step="1" value="2" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>

          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">EMF (E)</label>
              <span id="emfVal" style="font-size:11px;font-weight:900;color:#a855f7;">5.0 V</span>
            </div>
            <input id="emfSlider" type="range" min="1" max="10" step="0.5" value="5" style="width:100%;accent-color:#a855f7;cursor:pointer;height:5px;" />
          </div>

          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Int. Res (r)</label>
              <span id="intResVal" style="font-size:11px;font-weight:900;color:#fbbf24;">1.0 Ω</span>
            </div>
            <input id="intResSlider" type="range" min="0.5" max="5" step="0.5" value="1" style="width:100%;accent-color:#fbbf24;cursor:pointer;height:5px;" />
          </div>

          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Ext. Res (R)</label>
              <span id="extResVal" style="font-size:11px;font-weight:900;color:#10b981;">10.0 Ω</span>
            </div>
            <input id="extResSlider" type="range" min="1" max="20" step="1" value="10" style="width:100%;accent-color:#10b981;cursor:pointer;height:5px;" />
          </div>

        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const btnSeries = wrap.querySelector('#btnSeries');
  const btnParallel = wrap.querySelector('#btnParallel');
  const numCellsSlider = wrap.querySelector('#numCells');
  const emfSlider = wrap.querySelector('#emfSlider');
  const intResSlider = wrap.querySelector('#intResSlider');
  const extResSlider = wrap.querySelector('#extResSlider');
  
  const numCellsVal = wrap.querySelector('#numCellsVal');
  const emfVal = wrap.querySelector('#emfVal');
  const intResVal = wrap.querySelector('#intResVal');
  const extResVal = wrap.querySelector('#extResVal');
  const eqReadout = wrap.querySelector('#eqReadout');
  const statusTitle = wrap.querySelector('#statusTitle');
  
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let isSeries = true;
  
  let n = 2, E_cell = 5, r_cell = 1, R_ext = 10;
  let E_eq = 0, r_eq = 0, I_total = 0, V_terminal = 0;
  
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
    n = parseInt(numCellsSlider.value);
    E_cell = parseFloat(emfSlider.value);
    r_cell = parseFloat(intResSlider.value);
    R_ext = parseFloat(extResSlider.value);

    numCellsVal.textContent = n;
    emfVal.textContent = E_cell.toFixed(1) + ' V';
    intResVal.textContent = r_cell.toFixed(1) + ' \u03A9';
    extResVal.textContent = R_ext.toFixed(1) + ' \u03A9';

    if (isSeries) {
      E_eq = n * E_cell;
      r_eq = n * r_cell;
    } else {
      E_eq = E_cell;
      r_eq = r_cell / n;
    }

    I_total = E_eq / (R_ext + r_eq);
    V_terminal = E_eq - I_total * r_eq;

    eqReadout.innerHTML = `E_eq = ${E_eq.toFixed(1)}V | r_eq = ${r_eq.toFixed(1)}\u03A9 | I = ${I_total.toFixed(2)}A`;
  }

  function setMode(series) {
    isSeries = series;
    if (isSeries) {
      btnSeries.style.background = '#38bdf8';
      btnSeries.style.color = '#030712';
      btnParallel.style.background = 'transparent';
      btnParallel.style.color = '#94a3b8';
      statusTitle.textContent = 'Series Combination';
    } else {
      btnParallel.style.background = '#a855f7';
      btnParallel.style.color = '#ffffff';
      btnSeries.style.background = 'transparent';
      btnSeries.style.color = '#94a3b8';
      statusTitle.textContent = 'Parallel Combination';
    }
    updatePhysics();
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function drawBattery(x, y, isHorizontal, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    if (!isHorizontal) ctx.rotate(Math.PI / 2);
    
    let bW = 40 * scale;
    let bH = 16 * scale;

    // Cell body
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
    drawRoundedRect(-bW/2, -bH/2, bW, bH, 4);
    ctx.fill(); ctx.stroke();

    // Plates (+ and -)
    ctx.beginPath(); ctx.moveTo(-5, -bH/2 + 3); ctx.lineTo(-5, bH/2 - 3);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath(); ctx.moveTo(5, -bH/4); ctx.lineTo(5, bH/4);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.stroke();

    // Labels
    ctx.fillStyle = '#38bdf8'; ctx.font = `bold ${9 * scale}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', -bW/2 - 5, 0);
    ctx.fillStyle = '#94a3b8'; ctx.fillText('-', bW/2 + 5, 0);

    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);

    let cx = W / 2;
    let cy = H / 2;

    // Main External Circuit Loop
    let leftX = W * 0.2, rightX = W * 0.8;
    let topY = H * 0.25, bottomY = H * 0.75;

    // Draw Wires
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, topY); ctx.lineTo(rightX, topY);
    ctx.lineTo(rightX, bottomY); ctx.lineTo(leftX, bottomY); ctx.lineTo(leftX, topY);
    ctx.stroke();

    // Draw External Resistor (Bottom)
    let rWidth = 50;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
    drawRoundedRect(cx - rWidth/2, bottomY - 12, rWidth, 24, 6);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('R', cx, bottomY);

    // Draw Cells Combination (Top Branch)
    if (isSeries) {
      let totalW = n * 60;
      let startX = cx - totalW / 2 + 30;
      for (let i = 0; i < n; i++) {
        drawBattery(startX + i * 60, topY, true, 1);
      }
    } else {
      // Parallel Drawing
      let totalH = n * 30;
      let startY = cy - totalH / 2 + 15 - (bottomY - cy)/2;
      // Draw connecting wires
      ctx.beginPath();
      ctx.moveTo(leftX, topY); ctx.lineTo(cx, topY);
      ctx.moveTo(rightX, topY); ctx.lineTo(cx, topY);
      for (let i = 0; i < n; i++) {
        ctx.moveTo(cx, topY); ctx.lineTo(cx, startY + i * 30);
        ctx.moveTo(cx, topY); ctx.lineTo(cx, startY + i * 30); 
      }
      ctx.stroke();
      
      for (let i = 0; i < n; i++) {
        // draw batteries vertically
        drawBattery(cx, startY + i * 30, false, 0.8);
      }
    }

    // Animated Electrons (Speed based on I_total)
    phase = (phase + I_total * 0.02) % 1;
    const numParticles = 20;
    ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 6;

    for (let i = 0; i < numParticles; i++) {
      let p = (i / numParticles + phase) % 1;
      let px, py;

      // Perimeter logic (rectangle)
      let width = rightX - leftX;
      let height = bottomY - topY;
      let perimeter = 2 * width + 2 * height;
      let dist = p * perimeter;

      if (dist < width) {
        px = leftX + dist; py = topY;
      } else if (dist < width + height) {
        px = rightX; py = topY + (dist - width);
      } else if (dist < 2*width + height) {
        px = rightX - (dist - width - height); py = bottomY;
      } else {
        px = leftX; py = bottomY - (dist - 2*width - height);
      }

      // Don't draw electrons over top cells area (fake masking for simplicity)
      if (py === topY && px > cx - (n*60)/2 && px < cx + (n*60)/2 && isSeries) continue;

      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // HUD Overlay Card
    let fCardX = 16, fCardY = 12, fCardW = 260, fCardH = 75;
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
    ctx.strokeStyle = isSeries ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.45)'; 
    ctx.lineWidth = 1.2; ctx.stroke();
    
    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = isSeries ? '#38bdf8' : '#a855f7'; ctx.fill();
    
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 9.5px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('TERMINAL VOLTAGE', fCardX + 18, fCardY + 20);
    
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 16px system-ui';
    ctx.fillText('V = ' + V_terminal.toFixed(2) + ' V', fCardX + 18, fCardY + 43);
    
    ctx.fillStyle = isSeries ? '#38bdf8' : '#a855f7'; ctx.font = '700 11px system-ui';
    ctx.fillText('Formula: V = E_eq - I·r_eq', fCardX + 18, fCardY + 65);
    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  btnSeries.addEventListener('click', () => setMode(true));
  btnParallel.addEventListener('click', () => setMode(false));
  
  numCellsSlider.addEventListener('input', updatePhysics);
  emfSlider.addEventListener('input', updatePhysics);
  intResSlider.addEventListener('input', updatePhysics);
  extResSlider.addEventListener('input', updatePhysics);
  
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => {
    numCellsSlider.value = 2; emfSlider.value = 5; intResSlider.value = 1; extResSlider.value = 10;
    setMode(true);
  });

  window.addEventListener('resize', resize);
  setMode(true);
  resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

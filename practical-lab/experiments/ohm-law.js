export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;user-select:none;-webkit-user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
      <div style="flex:1;text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Ohm's Law Explorer</div>
      </div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
        <!-- Live Readout Cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:12px;padding:8px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#7dd3fc;text-transform:uppercase;letter-spacing:0.6px;">Voltage (V)</div>
            <div id="valVCard" style="font-size:16px;font-weight:900;color:#38bdf8;margin-top:2px;">10.0 V</div>
          </div>
          <div style="background:rgba(244,114,182,0.08);border:1px solid rgba(244,114,182,0.25);border-radius:12px;padding:8px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#f9a8d4;text-transform:uppercase;letter-spacing:0.6px;">Resistance (R)</div>
            <div id="valRCard" style="font-size:16px;font-weight:900;color:#f472b6;margin-top:2px;">5.0 &Omega;</div>
          </div>
          <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.28);border-radius:12px;padding:8px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.6px;">Current (I = V/R)</div>
            <div id="valICard" style="font-size:16px;font-weight:900;color:#34d399;margin-top:2px;">2.00 A</div>
          </div>
        </div>

        <!-- Interactive Sliders -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
          <!-- Voltage Slider (0-20V) -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label for="sliderV" style="font-size:12px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
                Voltage (V)
              </label>
              <span id="labelV" style="font-size:12px;font-weight:900;color:#38bdf8;background:rgba(56,189,248,0.12);padding:2px 8px;border-radius:8px;border:1px solid rgba(56,189,248,0.3);">10.0 V</span>
            </div>
            <input id="sliderV" type="range" min="0" max="20" step="0.5" value="10" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:6px;border-radius:6px;" />
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-top:4px;font-weight:600;">
              <span>0 V</span>
              <span>10 V</span>
              <span>20 V</span>
            </div>
          </div>

          <!-- Resistance Slider (1-20Ω) -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label for="sliderR" style="font-size:12px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f472b6;box-shadow:0 0 8px #f472b6;"></span>
                Resistance (R)
              </label>
              <span id="labelR" style="font-size:12px;font-weight:900;color:#f472b6;background:rgba(244,114,182,0.12);padding:2px 8px;border-radius:8px;border:1px solid rgba(244,114,182,0.3);">5.0 &Omega;</span>
            </div>
            <input id="sliderR" type="range" min="1" max="20" step="0.5" value="5" style="width:100%;accent-color:#f472b6;cursor:pointer;height:6px;border-radius:6px;" />
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-top:4px;font-weight:600;">
              <span>1 &Omega;</span>
              <span>10 &Omega;</span>
              <span>20 &Omega;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const sliderV = wrap.querySelector('#sliderV');
  const sliderR = wrap.querySelector('#sliderR');
  const labelV = wrap.querySelector('#labelV');
  const labelR = wrap.querySelector('#labelR');
  const valVCard = wrap.querySelector('#valVCard');
  const valRCard = wrap.querySelector('#valRCard');
  const valICard = wrap.querySelector('#valICard');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  // ALL VARIABLES HERE
  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  let phase = 0;
  let convPhase = 0;
  let pulseTime = 0;
  let V = 10;
  let R = 5;
  let I = 2;
  let P = 20;
  let electronCount = 44;
  let i = 0;
  let u = 0;
  let ey = 0;
  let isCompact = false;
  let padX = 0, padY = 0;
  let topPanelH = 0;
  let cLeft = 0, cRight = 0, cTop = 0, cBottom = 0, cWidth = 0, cHeight = 0;
  let perim = 0;
  let speed = 0;
  let dist = 0;
  let pt = null;
  let nextPt = null;
  let angle = 0;
  let resW = 0, resH = 0, resX = 0, resY = 0;
  let batW = 0, batH = 0, batX = 0, batY = 0;
  let ammX = 0, ammY = 0, ammR = 0;
  let voltX = 0, voltY = 0, voltR = 0;
  let heatRatio = 0;
  let glowAlpha = 0;
  let zigSteps = 9;
  let stepX = 0;
  let zx = 0, zy = 0;
  let ionCol = 0, ionRow = 0, ix = 0, iy = 0, jx = 0, jy = 0, jitterAmp = 0;
  let fCardX = 0, fCardY = 0, fCardW = 0, fCardH = 0;
  let gCardX = 0, gCardY = 0, gCardW = 0, gCardH = 0;
  let plotX = 0, plotY = 0, plotW = 0, plotH = 0;
  let maxV = 20, maxI = 10;
  let lineEndV = 0, lineEndI = 0;
  let px = 0, py = 0;
  let bgGrad = null, heatGrad = null, eGrad = null;

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

  function updatePhysicsState() {
    V = parseFloat(sliderV.value) || 0;
    R = Math.max(1, parseFloat(sliderR.value) || 1);
    I = V / R;
    P = V * I;

    labelV.textContent = V.toFixed(1) + ' V';
    labelR.innerHTML = R.toFixed(1) + ' &Omega;';
    valVCard.textContent = V.toFixed(1) + ' V';
    valRCard.innerHTML = R.toFixed(1) + ' &Omega;';
    valICard.textContent = I.toFixed(2) + ' A';
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function getPointOnCircuit(d, left, top, width, height) {
    const total = 2 * (width + height);
    u = ((d % total) + total) % total;

    if (u <= width) {
      return { x: left + u, y: top, edge: 'top' };
    }
    u -= width;
    if (u <= height) {
      return { x: left + width, y: top + u, edge: 'right' };
    }
    u -= height;
    if (u <= width) {
      return { x: left + width - u, y: top + height, edge: 'bottom' };
    }
    u -= width;
    return { x: left, y: top + height - u, edge: 'left' };
  }

  function drawBackgroundGrid() {
    bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.52, 10, W * 0.5, H * 0.52, Math.max(W, H) * 0.75);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.6, '#090f1d');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 1;
    const gridStep = 28;
    for (i = 0; i < W; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }
    for (i = 0; i < H; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTopOverlays() {
    isCompact = W < 540 || H < 370;
    fCardX = isCompact ? 10 : 18;
    fCardY = isCompact ? 8 : 12;
    fCardW = isCompact ? Math.min(220, W * 0.54) : 265;
    fCardH = isCompact ? 76 : 92;

    // 1. Live Formula Overlay Card (I = V / R)
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 14);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();

    drawRoundedRect(fCardX + 8, fCardY + 10, 4, fCardH - 20, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = (isCompact ? '700 9px' : '700 10px') + ' system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("LIVE OHM'S LAW FORMULA", fCardX + 20, fCardY + (isCompact ? 18 : 22));

    ctx.font = (isCompact ? '900 13px' : '900 16px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('I = V / R =', fCardX + 20, fCardY + (isCompact ? 38 : 46));

    const eqOffset = isCompact ? 94 : 112;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(V.toFixed(1) + 'V', fCardX + eqOffset, fCardY + (isCompact ? 38 : 46));

    const slashOffset = eqOffset + ctx.measureText(V.toFixed(1) + 'V').width + 4;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('/', fCardX + slashOffset, fCardY + (isCompact ? 38 : 46));

    const rOffset = slashOffset + 9;
    ctx.fillStyle = '#f472b6';
    ctx.fillText(R.toFixed(1) + 'Ω', fCardX + rOffset, fCardY + (isCompact ? 38 : 46));

    ctx.font = (isCompact ? '800 11px' : '800 12px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('I = ' + I.toFixed(2) + ' A', fCardX + 20, fCardY + (isCompact ? 56 : 68));

    ctx.fillStyle = '#fbbf24';
    ctx.fillText('P = VI = ' + P.toFixed(1) + ' W', fCardX + (isCompact ? 95 : 112), fCardY + (isCompact ? 56 : 68));

    if (!isCompact) {
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Drift speed v_d ∝ I (Electrons: - to +)', fCardX + 20, fCardY + 84);
    }
    ctx.restore();

    // 2. Real-time V-I Characteristic Mini-Graph (Slope = 1/R)
    gCardW = isCompact ? Math.min(148, W - fCardW - 28) : 190;
    if (gCardW >= 110) {
      gCardH = fCardH;
      gCardX = W - gCardW - (isCompact ? 10 : 18);
      gCardY = fCardY;

      ctx.save();
      drawRoundedRect(gCardX, gCardY, gCardW, gCardH, 14);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = (isCompact ? '700 8.5px' : '700 10px') + ' system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('I-V SLOPE (1/R)', gCardX + 12, gCardY + (isCompact ? 16 : 19));

      plotX = gCardX + 26;
      plotY = gCardY + (isCompact ? 23 : 27);
      plotW = gCardW - 38;
      plotH = gCardH - (isCompact ? 35 : 40);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX, plotY);
      ctx.lineTo(plotX, plotY + plotH);
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '700 8px system-ui, sans-serif';
      ctx.fillText('I', plotX - 10, plotY + 6);
      ctx.fillText('V', plotX + plotW - 6, plotY + plotH + 10);

      maxV = 20;
      maxI = 10;
      lineEndV = maxV;
      lineEndI = lineEndV / R;
      if (lineEndI > maxI) {
        lineEndI = maxI;
        lineEndV = maxI * R;
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plotX, plotY + plotH);
      ctx.lineTo(
        plotX + (lineEndV / maxV) * plotW,
        plotY + plotH - (lineEndI / maxI) * plotH
      );
      ctx.stroke();

      px = plotX + (Math.min(V, maxV) / maxV) * plotW;
      py = plotY + plotH - (Math.min(I, maxI) / maxI) * plotH;

      ctx.save();
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }

  function draw() {
    drawBackgroundGrid();
    drawTopOverlays();

    isCompact = W < 540 || H < 370;
    topPanelH = (isCompact ? 76 : 92) + (isCompact ? 22 : 34);
    padX = Math.max(46, Math.min(95, W * 0.14));
    padY = Math.max(28, Math.min(48, (H - topPanelH) * 0.14));

    cLeft = padX;
    cRight = W - padX;
    cTop = topPanelH + padY * 0.85;
    cBottom = H - padY * 1.15;

    if (cBottom - cTop < 110) {
      cTop = topPanelH + 18;
      cBottom = H - 22;
    }

    cWidth = Math.max(140, cRight - cLeft);
    cHeight = Math.max(100, cBottom - cTop);
    perim = 2 * (cWidth + cHeight);

    resW = Math.min(180, Math.max(105, cWidth * 0.44));
    resH = isCompact ? 34 : 42;
    resX = cLeft + cWidth * 0.5;
    resY = cTop;

    batW = Math.min(130, Math.max(86, cWidth * 0.32));
    batH = isCompact ? 36 : 44;
    batX = cLeft + cWidth * 0.5;
    batY = cBottom;

    ammX = cRight;
    ammY = cTop + cHeight * 0.5;
    ammR = isCompact ? 22 : 27;

    // 1. Main Conducting Wire Loop (Outer Glow + Core)
    glowAlpha = Math.min(0.85, 0.18 + (I / 10) * 0.65);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12 + Math.min(20, I * 2.5);
    ctx.strokeStyle = 'rgba(56, 189, 248, ' + glowAlpha.toFixed(3) + ')';
    ctx.lineWidth = isCompact ? 8 : 10;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = isCompact ? 5 : 6;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();
    ctx.restore();

    // 2. Parallel Voltmeter Branch Across Resistor
    voltR = isCompact ? 16 : 19;
    voltX = resX;
    voltY = resY + (cHeight > 165 ? 48 : 38);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(resX - resW * 0.5 - 12, resY);
    ctx.lineTo(resX - resW * 0.5 - 12, voltY);
    ctx.lineTo(voltX - voltR, voltY);
    ctx.moveTo(voltX + voltR, voltY);
    ctx.lineTo(resX + resW * 0.5 + 12, voltY);
    ctx.lineTo(resX + resW * 0.5 + 12, resY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(resX - resW * 0.5 - 12, resY, 3.5, 0, Math.PI * 2);
    ctx.arc(resX + resW * 0.5 + 12, resY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(voltX, voltY, voltR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#38bdf8';
    ctx.font = (isCompact ? '900 10px' : '900 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', voltX, voltY - 4);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = (isCompact ? '700 8px' : '700 9px') + ' system-ui, sans-serif';
    ctx.fillText(V.toFixed(1) + 'V', voltX, voltY + 7);
    ctx.restore();

    // 3. Conventional Current (I) Chevrons along wire (Clockwise: + left to - right)
    if (I > 0.01) {
      ctx.save();
      const arrowCount = 8;
      for (i = 0; i < arrowCount; i++) {
        dist = ((i / arrowCount) * perim + convPhase) % perim;
        pt = getPointOnCircuit(dist, cLeft, cTop, cWidth, cHeight);
        if (pt.edge === 'top' && Math.abs(pt.x - resX) < resW * 0.58) continue;
        if (pt.edge === 'bottom' && Math.abs(pt.x - batX) < batW * 0.58) continue;
        if (pt.edge === 'right' && Math.abs(pt.y - ammY) < ammR * 1.35) continue;

        nextPt = getPointOnCircuit(dist + 4, cLeft, cTop, cWidth, cHeight);
        angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.48)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(3, 0);
        ctx.lineTo(-4, 4);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // 4. Resistor Component (Top Edge) with Joule Heating Aura & Atomic Lattice
    heatRatio = Math.min(1, P / 120);
    ctx.save();

    if (P > 0.5) {
      heatGrad = ctx.createRadialGradient(resX, resY, 6, resX, resY, resW * 0.65);
      heatGrad.addColorStop(0, 'rgba(244, 63, 94, ' + (0.15 + heatRatio * 0.45).toFixed(3) + ')');
      heatGrad.addColorStop(0.5, 'rgba(251, 146, 60, ' + (0.08 + heatRatio * 0.25).toFixed(3) + ')');
      heatGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(resX, resY, resW * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    drawRoundedRect(resX - resW * 0.5, resY - resH * 0.5, resW, resH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = heatRatio > 0.45 ? '#fb7185' : '#f472b6';
    ctx.shadowColor = heatRatio > 0.45 ? '#f43f5e' : '#f472b6';
    ctx.shadowBlur = 10 + heatRatio * 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const cols = Math.min(11, Math.max(4, Math.round(3 + R * 0.4)));
    const rows = 2;
    jitterAmp = Math.min(2.4, 0.2 + heatRatio * 2.2);
    for (ionCol = 0; ionCol < cols; ionCol++) {
      for (ionRow = 0; ionRow < rows; ionRow++) {
        ix = (resX - resW * 0.4) + (ionCol / (cols - 1)) * (resW * 0.8);
        iy = (resY - resH * 0.22) + ionRow * (resH * 0.44);
        jx = Math.sin(pulseTime * 9 + ionCol * 1.7 + ionRow * 2.3) * jitterAmp;
        jy = Math.cos(pulseTime * 8 + ionCol * 2.1 - ionRow * 1.9) * jitterAmp;

        ctx.fillStyle = heatRatio > 0.35
          ? 'rgba(251, 146, 60, 0.55)'
          : 'rgba(244, 114, 182, 0.42)';
        ctx.beginPath();
        ctx.arc(ix + jx, iy + jy, isCompact ? 2.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    zigSteps = Math.max(6, Math.min(14, Math.round(5 + R * 0.45)));
    stepX = (resW * 0.78) / zigSteps;
    ctx.beginPath();
    ctx.moveTo(resX - resW * 0.5, resY);
    ctx.lineTo(resX - resW * 0.39, resY);
    for (i = 0; i < zigSteps; i++) {
      zx = (resX - resW * 0.39) + (i + 0.5) * stepX;
      zy = resY + (i % 2 === 0 ? -1 : 1) * (resH * 0.32);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(resX + resW * 0.39, resY);
    ctx.lineTo(resX + resW * 0.5, resY);
    ctx.strokeStyle = heatRatio > 0.5 ? '#fda4af' : '#f472b6';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#f9a8d4';
    ctx.font = (isCompact ? '800 10px' : '800 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESISTOR R = ' + R.toFixed(1) + ' Ω', resX, resY - resH * 0.5 - 8);
    ctx.restore();

    // 5. Moving Electrons (Counter-Clockwise: from Negative Right terminal to Positive Left terminal)
    ctx.save();
    for (i = 0; i < electronCount; i++) {
      dist = ((i / electronCount) * perim - phase) % perim;
      if (dist < 0) dist += perim;
      pt = getPointOnCircuit(dist, cLeft, cTop, cWidth, cHeight);

      if (pt.edge === 'bottom' && Math.abs(pt.x - batX) < batW * 0.42) continue;
      if (pt.edge === 'right' && Math.abs(pt.y - ammY) < ammR * 0.95) continue;

      ey = pt.y;
      if (pt.edge === 'top' && Math.abs(pt.x - resX) < resW * 0.42 && I > 0.01) {
        ey += Math.sin(dist * 0.35 + pulseTime * 6) * (resH * 0.22);
      }

      eGrad = ctx.createRadialGradient(pt.x, ey, 0.5, pt.x, ey, isCompact ? 6 : 7.5);
      eGrad.addColorStop(0, '#ffffff');
      eGrad.addColorStop(0.45, '#38bdf8');
      eGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(pt.x, ey, isCompact ? 6 : 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 6. DC Voltage Source / Battery (Bottom Edge)
    ctx.save();
    drawRoundedRect(batX - batW * 0.5, batY - batH * 0.5, batW, batH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const platePairs = 2;
    const cellSpacing = 18;
    const startPlateX = batX - ((platePairs - 1) * cellSpacing) * 0.5;
    for (i = 0; i < platePairs; i++) {
      const cx = startPlateX + i * cellSpacing;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, batY - batH * 0.32);
      ctx.lineTo(cx - 4, batY + batH * 0.32);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx + 4, batY - batH * 0.18);
      ctx.lineTo(cx + 4, batY + batH * 0.18);
      ctx.stroke();
    }

    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('+', batX - batW * 0.34, batY);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('−', batX + batW * 0.34, batY);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = (isCompact ? '800 10px' : '800 11px') + ' system-ui, sans-serif';
    ctx.fillText('DC SOURCE V = ' + V.toFixed(1) + ' V', batX, batY + batH * 0.5 + 13);
    ctx.restore();

    // 7. Series Ammeter (Right Edge)
    ctx.save();
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(ammX, ammY, ammR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ammX, ammY + 2, ammR * 0.68, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    const needleRatio = Math.min(1, I / 10);
    const needleAngle = Math.PI * 1.15 + needleRatio * (Math.PI * 0.7);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(ammX, ammY + 2);
    ctx.lineTo(
      ammX + Math.cos(needleAngle) * (ammR * 0.62),
      ammY + 2 + Math.sin(needleAngle) * (ammR * 0.62)
    );
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = (isCompact ? '900 10px' : '900 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', ammX, ammY - ammR * 0.25);

    ctx.fillStyle = '#ecfdf5';
    ctx.font = (isCompact ? '800 8.5px' : '800 9.5px') + ' system-ui, sans-serif';
    ctx.fillText(I.toFixed(2) + 'A', ammX, ammY + ammR * 0.42);
    ctx.restore();

    // 8. Conventional Current Direction Indicator on Left Wire
    ctx.save();
    const legX = cLeft - (isCompact ? 8 : 12);
    const legY = cTop + cHeight * 0.5;

    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX, legY + 18);
    ctx.lineTo(legX, legY - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legX - 4, legY - 12);
    ctx.lineTo(legX, legY - 20);
    ctx.lineTo(legX + 4, legY - 12);
    ctx.closePath();
    ctx.fill();

    if (!isCompact) {
      ctx.save();
      ctx.translate(legX - 10, legY);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '700 9.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Conventional I', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function handleSliderInput() {
    updatePhysicsState();
  }

  function handleBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  function handleResetClick() {
    sliderV.value = '10';
    sliderR.value = '5';
    updatePhysicsState();
  }

  function loop() {
    if (!isRunning) return;
    try {
      speed = I === 0 ? 0 : (0.35 + I * 1.15);
      phase = (phase + speed) % 100000;
      convPhase = (convPhase + speed * 0.85) % 100000;
      pulseTime += 0.016;
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  sliderV.addEventListener('input', handleSliderInput);
  sliderR.addEventListener('input', handleSliderInput);
  backBtn.addEventListener('click', handleBackClick);
  resetBtn.addEventListener('click', handleResetClick);

  window.addEventListener('resize', resize);
  updatePhysicsState();
  resize();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    sliderV.removeEventListener('input', handleSliderInput);
    sliderR.removeEventListener('input', handleSliderInput);
    backBtn.removeEventListener('click', handleBackClick);
    resetBtn.removeEventListener('click', handleResetClick);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

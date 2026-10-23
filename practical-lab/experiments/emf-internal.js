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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">EMF & Internal Resistance</div>
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
        <!-- Live Telemetry Cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.28);border-radius:12px;padding:7px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.5px;">Current I = E/(R+r)</div>
            <div id="cardCurrent" style="font-size:15px;font-weight:900;color:#34d399;margin-top:2px;">2.00 A</div>
          </div>
          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);border-radius:12px;padding:7px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#7dd3fc;text-transform:uppercase;letter-spacing:0.5px;">Terminal V = E &minus; Ir</div>
            <div id="cardTerminalV" style="font-size:15px;font-weight:900;color:#38bdf8;margin-top:2px;">10.00 V</div>
          </div>
          <div style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.28);border-radius:12px;padding:7px 10px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#fdba74;text-transform:uppercase;letter-spacing:0.5px;">Internal Drop (Ir)</div>
            <div id="cardDropV" style="font-size:15px;font-weight:900;color:#fb923c;margin-top:2px;">2.00 V</div>
          </div>
        </div>

        <!-- 3 Sliders for E, r, and R -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
          <!-- EMF (E) Slider: 5V to 24V -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="sliderE" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
                EMF (E)
              </label>
              <span id="labelE" style="font-size:11px;font-weight:900;color:#38bdf8;background:rgba(56,189,248,0.12);padding:2px 7px;border-radius:6px;">12.0 V</span>
            </div>
            <input id="sliderE" type="range" min="5" max="24" step="0.5" value="12" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
            <div style="display:flex;justify-content:space-between;font-size:9.5px;color:#64748b;margin-top:3px;font-weight:600;">
              <span>5 V</span>
              <span>14.5 V</span>
              <span>24 V</span>
            </div>
          </div>

          <!-- Internal Resistance (r) Slider: 0.1Ω to 5Ω -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="sliderIntR" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#fb923c;box-shadow:0 0 8px #fb923c;"></span>
                Internal Res (r)
              </label>
              <span id="labelIntR" style="font-size:11px;font-weight:900;color:#fb923c;background:rgba(251,146,60,0.12);padding:2px 7px;border-radius:6px;">1.0 &Omega;</span>
            </div>
            <input id="sliderIntR" type="range" min="0.1" max="5" step="0.1" value="1" style="width:100%;accent-color:#fb923c;cursor:pointer;height:5px;" />
            <div style="display:flex;justify-content:space-between;font-size:9.5px;color:#64748b;margin-top:3px;font-weight:600;">
              <span>0.1 &Omega;</span>
              <span>2.5 &Omega;</span>
              <span>5.0 &Omega;</span>
            </div>
          </div>

          <!-- External Resistance (R) Slider: 1Ω to 20Ω -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="sliderExtR" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#f472b6;box-shadow:0 0 8px #f472b6;"></span>
                External Res (R)
              </label>
              <span id="labelExtR" style="font-size:11px;font-weight:900;color:#f472b6;background:rgba(244,114,182,0.12);padding:2px 7px;border-radius:6px;">5.0 &Omega;</span>
            </div>
            <input id="sliderExtR" type="range" min="1" max="20" step="0.5" value="5" style="width:100%;accent-color:#f472b6;cursor:pointer;height:5px;" />
            <div style="display:flex;justify-content:space-between;font-size:9.5px;color:#64748b;margin-top:3px;font-weight:600;">
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
  const sliderE = wrap.querySelector('#sliderE');
  const sliderIntR = wrap.querySelector('#sliderIntR');
  const sliderExtR = wrap.querySelector('#sliderExtR');
  const labelE = wrap.querySelector('#labelE');
  const labelIntR = wrap.querySelector('#labelIntR');
  const labelExtR = wrap.querySelector('#labelExtR');
  const cardCurrent = wrap.querySelector('#cardCurrent');
  const cardTerminalV = wrap.querySelector('#cardTerminalV');
  const cardDropV = wrap.querySelector('#cardDropV');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  // ALL VARIABLES HERE (Declared at top of mount to prevent Temporal Dead Zone / ReferenceError)
  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  let phase = 0;
  let pulseTime = 0;

  let E = 12; // EMF (V)
  let r = 1;  // Internal resistance (Ohms)
  let R = 5;  // External resistance (Ohms)
  let I = E / (R + r);
  let V_terminal = E - I * r;
  let V_drop = I * r;

  let isCompact = false;
  let i = 0;
  let u = 0;
  let dist = 0;
  let pt = null;
  let electronCount = 46;
  let topClearance = 0;
  let padX = 0, padY = 0;
  let cLeft = 0, cRight = 0, cTop = 0, cBottom = 0, cWidth = 0, cHeight = 0;
  let perim = 0;
  let extW = 0, extH = 0, extX = 0, extY = 0;
  let batW = 0, batH = 0, batX = 0, batY = 0;
  let cellX = 0, intResX = 0, intResW = 0;
  let termLeftX = 0, termRightX = 0;
  let voltX = 0, voltY = 0, voltR = 0;
  let ammX = 0, ammY = 0, ammR = 0;
  let fCardX = 0, fCardY = 0, fCardW = 0, fCardH = 0;
  let mCardX = 0, mCardY = 0, mCardW = 0, mCardH = 0;
  let zigSteps = 8, stepX = 0, zx = 0, zy = 0;
  let ey = 0;
  let needleRatio = 0, needleAngle = 0;
  let bgGrad = null, eGrad = null, heatGrad = null;

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

  function updatePhysics() {
    E = parseFloat(sliderE.value) || 12;
    r = parseFloat(sliderIntR.value) || 1;
    R = parseFloat(sliderExtR.value) || 5;

    I = E / (R + r);
    V_drop = I * r;
    V_terminal = E - V_drop;

    labelE.textContent = E.toFixed(1) + ' V';
    labelIntR.innerHTML = r.toFixed(1) + ' &Omega;';
    labelExtR.innerHTML = R.toFixed(1) + ' &Omega;';

    cardCurrent.textContent = I.toFixed(2) + ' A';
    cardTerminalV.textContent = V_terminal.toFixed(2) + ' V';
    cardDropV.textContent = V_drop.toFixed(2) + ' V';
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const rad = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + width - rad, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + rad);
    ctx.lineTo(x + width, y + height - rad);
    ctx.quadraticCurveTo(x + width, y + height, x + width - rad, y + height);
    ctx.lineTo(x + rad, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
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

  function drawBackground() {
    bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.55, '#090f1d');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
    ctx.lineWidth = 1;
    for (i = 0; i < W; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }
    for (i = 0; i < H; i += 28) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTopOverlays() {
    isCompact = W < 560 || H < 380;
    fCardX = isCompact ? 10 : 18;
    fCardY = isCompact ? 8 : 12;
    fCardW = isCompact ? Math.min(228, W * 0.53) : 272;
    fCardH = isCompact ? 68 : 80;

    // 1. Left Overlay Card: Live Equations
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();

    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TERMINAL VOLTAGE FORMULA', fCardX + 18, fCardY + (isCompact ? 17 : 20));

    ctx.font = (isCompact ? '900 12px' : '900 14px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(
      'V = E − I·r = ' + E.toFixed(1) + ' − ' + V_drop.toFixed(2) + ' = ' + V_terminal.toFixed(2) + 'V',
      fCardX + 18,
      fCardY + (isCompact ? 36 : 43)
    );

    ctx.font = (isCompact ? '800 10px' : '800 11.5px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(
      'I = E / (R + r) = ' + I.toFixed(2) + ' A',
      fCardX + 18,
      fCardY + (isCompact ? 54 : 64)
    );
    ctx.restore();

    // 2. Right Overlay Card: Live Readings Summary
    mCardW = isCompact ? Math.min(165, W - fCardW - 28) : 215;
    if (mCardW >= 120) {
      mCardH = fCardH;
      mCardX = W - mCardW - (isCompact ? 10 : 18);
      mCardY = fCardY;

      ctx.save();
      drawRoundedRect(mCardX, mCardY, mCardW, mCardH, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LIVE METER READINGS', mCardX + 12, mCardY + (isCompact ? 17 : 20));

      ctx.font = (isCompact ? '900 11.5px' : '900 13px') + ' system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('V_term : ' + V_terminal.toFixed(2) + ' V', mCardX + 12, mCardY + (isCompact ? 36 : 43));

      ctx.fillStyle = '#fb923c';
      ctx.font = (isCompact ? '800 10px' : '800 11px') + ' system-ui, sans-serif';
      ctx.fillText('Lost Volts (Ir) : ' + V_drop.toFixed(2) + ' V', mCardX + 12, mCardY + (isCompact ? 54 : 64));
      ctx.restore();
    }
  }

  function draw() {
    drawBackground();
    drawTopOverlays();

    isCompact = W < 560 || H < 380;
    topClearance = isCompact ? 80 : 94;
    padX = Math.max(46, Math.min(96, W * 0.14));
    padY = Math.max(24, Math.min(44, (H - topClearance) * 0.13));

    cLeft = padX;
    cRight = W - padX;
    cTop = topClearance + padY * 0.7;
    cBottom = H - padY * 1.15;

    if (cBottom - cTop < 120) {
      cTop = topClearance + 14;
      cBottom = H - 22;
    }

    cWidth = Math.max(160, cRight - cLeft);
    cHeight = Math.max(110, cBottom - cTop);
    perim = 2 * (cWidth + cHeight);

    // Component coordinates
    extW = Math.min(180, Math.max(110, cWidth * 0.44));
    extH = isCompact ? 32 : 38;
    extX = cLeft + cWidth * 0.5;
    extY = cTop;

    batW = Math.min(230, Math.max(148, cWidth * 0.58));
    batH = isCompact ? 48 : 58;
    batX = cLeft + cWidth * 0.5;
    batY = cBottom;

    ammX = cRight;
    ammY = cTop + cHeight * 0.45;
    ammR = isCompact ? 22 : 27;

    // 1. Main Conducting Wire Loop (Outer Neon Glow + Dark Metallic Core)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10 + Math.min(18, I * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
    ctx.lineWidth = isCompact ? 8 : 10;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = isCompact ? 5 : 6;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
    ctx.lineWidth = 1.4;
    drawRoundedRect(cLeft, cTop, cWidth, cHeight, 18);
    ctx.stroke();
    ctx.restore();

    // 2. External Resistor (R) at Top of Circuit
    ctx.save();
    drawRoundedRect(extX - extW * 0.5, extY - extH * 0.5, extW, extH, 10);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f472b6';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    zigSteps = Math.max(6, Math.min(13, Math.round(5 + R * 0.4)));
    stepX = (extW * 0.78) / zigSteps;
    ctx.beginPath();
    ctx.moveTo(extX - extW * 0.5, extY);
    ctx.lineTo(extX - extW * 0.39, extY);
    for (i = 0; i < zigSteps; i++) {
      zx = (extX - extW * 0.39) + (i + 0.5) * stepX;
      zy = extY + (i % 2 === 0 ? -1 : 1) * (extH * 0.32);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(extX + extW * 0.39, extY);
    ctx.lineTo(extX + extW * 0.5, extY);
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#f9a8d4';
    ctx.font = (isCompact ? '800 10px' : '800 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXTERNAL LOAD R = ' + R.toFixed(1) + ' Ω', extX, extY - extH * 0.5 - 7);
    ctx.restore();

    // 3. Battery Box at Bottom (Containing both Ideal EMF E and Internal Resistance r)
    termLeftX = batX - batW * 0.5;
    termRightX = batX + batW * 0.5;

    ctx.save();
    // Battery outer casing with dashed internal boundary feel
    drawRoundedRect(termLeftX, batY - batH * 0.5, batW, batH, 14);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Internal dashed sub-frame showing "Real Battery (E, r)"
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = 1;
    drawRoundedRect(termLeftX + 6, batY - batH * 0.5 + 5, batW - 12, batH - 10, 10);
    ctx.stroke();
    ctx.restore();

    // Internal wire connecting Left Terminal (+) -> Ideal Cell (E) -> Internal Resistor (r) -> Right Terminal (-)
    cellX = batX - batW * 0.2;
    intResX = batX + batW * 0.18;
    intResW = batW * 0.28;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(termLeftX, batY);
    ctx.lineTo(cellX - 10, batY);
    ctx.moveTo(cellX + 10, batY);
    ctx.lineTo(intResX - intResW * 0.5, batY);
    ctx.moveTo(intResX + intResW * 0.5, batY);
    ctx.lineTo(termRightX, batY);
    ctx.stroke();

    // Ideal EMF Cell Plates (E) inside left side of Battery Box
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cellX - 8, batY - batH * 0.28);
    ctx.lineTo(cellX - 8, batY + batH * 0.28);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cellX - 1, batY - batH * 0.16);
    ctx.lineTo(cellX - 1, batY + batH * 0.16);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cellX + 6, batY - batH * 0.28);
    ctx.lineTo(cellX + 6, batY + batH * 0.28);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cellX + 13, batY - batH * 0.16);
    ctx.lineTo(cellX + 13, batY + batH * 0.16);
    ctx.stroke();

    // EMF Label inside Battery Box
    ctx.fillStyle = '#38bdf8';
    ctx.font = (isCompact ? '800 9px' : '800 10px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E = ' + E.toFixed(1) + 'V', cellX + 2, batY + batH * 0.38);

    // Internal Resistance (r) Zig-Zag inside right side of Battery Box
    if (V_drop > 0.5) {
      heatGrad = ctx.createRadialGradient(intResX, batY, 2, intResX, batY, intResW * 0.7);
      heatGrad.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
      heatGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(intResX, batY, intResW * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(intResX - intResW * 0.5, batY);
    for (i = 0; i < 6; i++) {
      zx = (intResX - intResW * 0.5) + ((i + 0.5) / 6) * intResW;
      zy = batY + (i % 2 === 0 ? -1 : 1) * (batH * 0.2);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(intResX + intResW * 0.5, batY);
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fb923c';
    ctx.font = (isCompact ? '800 9px' : '800 10px') + ' system-ui, sans-serif';
    ctx.fillText('r = ' + r.toFixed(1) + 'Ω', intResX, batY + batH * 0.38);

    // Battery External Terminals (+ on Left, - on Right)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(termLeftX, batY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '900 12px system-ui, sans-serif';
    ctx.fillText('+', termLeftX - 10, batY - 10);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(termRightX, batY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('−', termRightX + 10, batY - 10);

    // Battery Title Caption Below
    ctx.fillStyle = '#94a3b8';
    ctx.font = (isCompact ? '800 9.5px' : '800 10.5px') + ' system-ui, sans-serif';
    ctx.fillText('BATTERY CELL (EMF E & INTERNAL RESISTANCE r)', batX, batY + batH * 0.5 + 13);
    ctx.restore();

    // 4. Voltmeter Connected Across Battery Terminals to Measure Terminal Voltage (V = E - Ir)
    voltR = isCompact ? 20 : 24;
    voltX = batX;
    voltY = batY - batH * 0.5 - (isCompact ? 34 : 42);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    // Left probe to positive battery terminal
    ctx.moveTo(termLeftX, batY);
    ctx.lineTo(termLeftX, voltY);
    ctx.lineTo(voltX - voltR, voltY);
    // Right probe to negative battery terminal
    ctx.moveTo(voltX + voltR, voltY);
    ctx.lineTo(termRightX, voltY);
    ctx.lineTo(termRightX, batY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Voltmeter Dial Circle
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(voltX, voltY, voltR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#38bdf8';
    ctx.font = (isCompact ? '900 10px' : '900 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', voltX, voltY - 5);

    ctx.fillStyle = '#f8fafc';
    ctx.font = (isCompact ? '800 8.5px' : '800 9.5px') + ' system-ui, sans-serif';
    ctx.fillText(V_terminal.toFixed(2) + 'V', voltX, voltY + 7);
    ctx.restore();

    // 5. Moving Electrons (Yellow Dots) Around Circuit Loop (Speed depends on Current I = E / (R + r))
    ctx.save();
    for (i = 0; i < electronCount; i++) {
      // Counter-clockwise electron drift from Negative Right terminal to Positive Left terminal
      dist = ((i / electronCount) * perim - phase) % perim;
      if (dist < 0) dist += perim;
      pt = getPointOnCircuit(dist, cLeft, cTop, cWidth, cHeight);

      // Keep Ammeter dial face clean
      if (pt.edge === 'right' && Math.abs(pt.y - ammY) < ammR * 0.95) continue;

      ey = pt.y;
      // Slight thermal scatter inside External Resistor R and Internal Resistor r
      if (pt.edge === 'top' && Math.abs(pt.x - extX) < extW * 0.42) {
        ey += Math.sin(dist * 0.35 + pulseTime * 6) * (extH * 0.18);
      }

      // Glowing Yellow Electron Dot
      eGrad = ctx.createRadialGradient(pt.x, ey, 0.5, pt.x, ey, isCompact ? 5.5 : 7);
      eGrad.addColorStop(0, '#fef9c3');
      eGrad.addColorStop(0.45, '#facc15');
      eGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(pt.x, ey, isCompact ? 5.5 : 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 6. Series Ammeter (A) on Right Branch
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

    // Ammeter scale arc & live needle
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ammX, ammY + 2, ammR * 0.68, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    needleRatio = Math.min(1, I / 12);
    needleAngle = Math.PI * 1.15 + needleRatio * (Math.PI * 0.7);
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
  }

  function handleSliderInput() {
    updatePhysics();
  }

  function handleBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  function handleResetClick() {
    sliderE.value = '12';
    sliderIntR.value = '1';
    sliderExtR.value = '5';
    updatePhysics();
  }

  function loop() {
    if (!isRunning) return;
    try {
      phase = (phase + (0.35 + I * 0.85)) % 100000;
      pulseTime += 0.016;
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  sliderE.addEventListener('input', handleSliderInput);
  sliderIntR.addEventListener('input', handleSliderInput);
  sliderExtR.addEventListener('input', handleSliderInput);
  backBtn.addEventListener('click', handleBackClick);
  resetBtn.addEventListener('click', handleResetClick);

  window.addEventListener('resize', resize);
  updatePhysics();
  resize();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    sliderE.removeEventListener('input', handleSliderInput);
    sliderIntR.removeEventListener('input', handleSliderInput);
    sliderExtR.removeEventListener('input', handleSliderInput);
    backBtn.removeEventListener('click', handleBackClick);
    resetBtn.removeEventListener('click', handleResetClick);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

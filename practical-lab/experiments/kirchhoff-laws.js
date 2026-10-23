export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#f8fafc;user-select:none;-webkit-user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
      <div style="flex:1;text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Kirchhoff's Laws</div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;">Class 12 Physics &bull; Current Electricity (KCL &amp; KVL)</div>
      </div>
      <button type="button" class="reset-btn" title="Reset Experiment" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>

    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:radial-gradient(circle at 50% 50%, #0f172a 0%, #0b1220 65%, #030712 100%);overflow:hidden;touch-action:none;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>

      <!-- Live KCL & KVL Equations Overlay (Grid for Side-by-Side) -->
      <div style="position:absolute;top:8px;left:8px;right:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;pointer-events:none;z-index:10;">
        
        <!-- KCL Junction Law Card -->
        <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.32);border-radius:10px;padding:6px 8px;backdrop-filter:blur(16px);box-shadow:0 8px 28px rgba(0,0,0,0.45);">
          <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#38bdf8;margin-bottom:3px;display:flex;align-items:center;gap:4px;">
            <span style="width:5px;height:5px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
            KCL (Junction Rule)
          </div>
          <div style="font-size:10px;font-weight:800;color:#f8fafc;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
            At A: <span style="color:#38bdf8;">I&#8321;</span> + <span style="color:#a855f7;">I&#8322;</span> = <span style="color:#34d399;">I&#8323;</span>
          </div>
          <div id="kclNumericDisplay" style="font-size:9px;font-weight:700;color:#cbd5e1;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;margin-top:2px;">
            0.50 A + 0.00 A = 0.50 A
          </div>
        </div>

        <!-- KVL Loop Law Card -->
        <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(245,158,11,0.32);border-radius:10px;padding:6px 8px;backdrop-filter:blur(16px);box-shadow:0 8px 28px rgba(0,0,0,0.45);">
          <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#fbbf24;margin-bottom:3px;display:flex;align-items:center;gap:4px;">
            <span style="width:5px;height:5px;border-radius:50%;background:#fbbf24;box-shadow:0 0 8px #fbbf24;"></span>
            KVL (Mesh Rule)
          </div>
          <div id="kvlLoop1Display" style="font-size:9px;font-weight:700;color:#e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
            L1: 10.0V - 5.0V - 5.0V = 0V
          </div>
          <div id="kvlLoop2Display" style="font-size:9px;font-weight:700;color:#e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;margin-top:2px;">
            L2: 5.0V - 0.0V - 5.0V = 0V
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Control Panel -->
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:14px 16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:10px;">
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
          <!-- EMF 1 (E1) Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(56,189,248,0.28);border-radius:12px;padding:9px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="e1Slider" style="font-size:11px;font-weight:800;color:#38bdf8;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
                EMF 1 (E&#8321; &bull; Left Loop)
              </label>
              <span id="e1Readout" style="font-size:12px;font-weight:900;color:#e0f2fe;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(56,189,248,0.18);border:1px solid rgba(56,189,248,0.4);padding:2px 8px;border-radius:6px;">
                10.0 V
              </span>
            </div>
            <input id="e1Slider" type="range" min="2" max="20" step="0.5" value="10" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:6px;border-radius:4px;" />
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:3px;font-weight:600;">
              <span>2.0 V</span>
              <span id="i1ReadoutBadge" style="color:#38bdf8;font-weight:800;">I&#8321; = +0.50 A</span>
              <span>20.0 V</span>
            </div>
          </div>

          <!-- EMF 2 (E2) Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(168,85,247,0.28);border-radius:12px;padding:9px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="e2Slider" style="font-size:11px;font-weight:800;color:#c084fc;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#a855f7;box-shadow:0 0 8px #a855f7;"></span>
                EMF 2 (E&#8322; &bull; Right Loop)
              </label>
              <span id="e2Readout" style="font-size:12px;font-weight:900;color:#f3e8ff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(168,85,247,0.18);border:1px solid rgba(168,85,247,0.4);padding:2px 8px;border-radius:6px;">
                5.0 V
              </span>
            </div>
            <input id="e2Slider" type="range" min="2" max="20" step="0.5" value="5" style="width:100%;accent-color:#a855f7;cursor:pointer;height:6px;border-radius:4px;" />
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:3px;font-weight:600;">
              <span>2.0 V</span>
              <span id="i2ReadoutBadge" style="color:#c084fc;font-weight:800;">I&#8322; = 0.00 A</span>
              <span>20.0 V</span>
            </div>
          </div>

          <!-- Resistance (R1 = R2 = R3) Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(52,211,153,0.28);border-radius:12px;padding:9px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="rSlider" style="font-size:11px;font-weight:800;color:#34d399;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
                Resistors (R&#8321;=R&#8322;=R&#8323;)
              </label>
              <span id="rReadout" style="font-size:12px;font-weight:900;color:#d1fae5;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(16,185,129,0.18);border:1px solid rgba(16,185,129,0.4);padding:2px 8px;border-radius:6px;">
                10 &Omega;
              </span>
            </div>
            <input id="rSlider" type="range" min="5" max="25" step="1" value="10" style="width:100%;accent-color:#10b981;cursor:pointer;height:6px;border-radius:4px;" />
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:3px;font-weight:600;">
              <span>5 &Omega;</span>
              <span id="i3ReadoutBadge" style="color:#34d399;font-weight:800;">I&#8323; = +0.50 A</span>
              <span>25 &Omega;</span>
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
  const e1Slider = wrap.querySelector('#e1Slider');
  const e2Slider = wrap.querySelector('#e2Slider');
  const rSlider = wrap.querySelector('#rSlider');
  const e1Readout = wrap.querySelector('#e1Readout');
  const e2Readout = wrap.querySelector('#e2Readout');
  const rReadout = wrap.querySelector('#rReadout');
  const i1ReadoutBadge = wrap.querySelector('#i1ReadoutBadge');
  const i2ReadoutBadge = wrap.querySelector('#i2ReadoutBadge');
  const i3ReadoutBadge = wrap.querySelector('#i3ReadoutBadge');
  const kclNumericDisplay = wrap.querySelector('#kclNumericDisplay');
  const kvlLoop1Display = wrap.querySelector('#kvlLoop1Display');
  const kvlLoop2Display = wrap.querySelector('#kvlLoop2Display');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  let phase = 0;

  let E1 = 10.0;
  let E2 = 5.0;
  let R1 = 10.0, R2 = 10.0, R3 = 10.0;
  let I1 = 0.5;
  let I2 = 0.0;
  let I3 = 0.5;
  let VA = 5.0;

  let offset1 = 0;
  let offset2 = 0;
  let offset3 = 0;

  let cx = 0;
  let cy = 0;
  let loopW = 0;
  let loopH = 0;
  let leftX = 0;
  let midX = 0;
  let rightX = 0;
  let topY = 0;
  let botY = 0;

  let gx = 0;
  let gy = 0;
  let idx = 0;
  let numDotsBranch1 = 18;
  let numDotsBranch2 = 18;
  let numDotsBranch3 = 10;
  let tParam = 0;
  let pt = null;
  let seg1 = 0;
  let seg2 = 0;
  let seg3 = 0;
  let totalLen = 0;
  let distAlong = 0;
  let zigIdx = 0;
  let zigSteps = 6;
  let zigAmp = 7;

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

  function solveKirchhoffCircuit() {
    const conductanceSum = (1 / R1) + (1 / R2) + (1 / R3);
    VA = ((E1 / R1) + (E2 / R2)) / conductanceSum;

    I1 = (E1 - VA) / R1;
    I2 = (E2 - VA) / R2;
    I3 = VA / R3;
  }

  function formatSignedCurrent(val) {
    const sign = val >= 0 ? '+' : '-';
    return sign + Math.abs(val).toFixed(2) + ' A';
  }

  function updateUIReadouts() {
    solveKirchhoffCircuit();

    e1Readout.textContent = E1.toFixed(1) + ' V';
    e2Readout.textContent = E2.toFixed(1) + ' V';
    rReadout.innerHTML = R1.toFixed(0) + ' &Omega;';

    i1ReadoutBadge.innerHTML = 'I&#8321; = ' + formatSignedCurrent(I1);
    i2ReadoutBadge.innerHTML = 'I&#8322; = ' + formatSignedCurrent(I2);
    i3ReadoutBadge.innerHTML = 'I&#8323; = ' + formatSignedCurrent(I3);

    const i2Term = I2 >= 0 ? `+ ${I2.toFixed(2)}` : `- ${Math.abs(I2).toFixed(2)}`;
    kclNumericDisplay.textContent = `${I1.toFixed(2)} A ${i2Term} A = ${I3.toFixed(2)} A`;

    const vR1 = (Math.abs(I1) * R1).toFixed(1);
    const vR2 = (Math.abs(I2) * R2).toFixed(1);
    const vR3 = (Math.abs(I3) * R3).toFixed(1);
    
    // Compact strings for small cards
    kvlLoop1Display.innerHTML = `L1: ${E1.toFixed(1)}V - ${vR1}V - ${vR3}V = 0V`;
    kvlLoop2Display.innerHTML = `L2: ${E2.toFixed(1)}V - ${vR2}V - ${vR3}V = 0V`;
  }

  function drawRoundedRectPath(x, y, width, height, radius) {
    const r = Math.min(radius, width * 0.5, height * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawBackgroundGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 1;
    const step = 36;
    for (gx = (W * 0.5) % step; gx < W; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (gy = (H * 0.5) % step; gy < H; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function getLeftBranchPoint(t) {
    seg1 = midX - leftX;
    seg2 = botY - topY;
    seg3 = midX - leftX;
    totalLen = seg1 + seg2 + seg3;
    distAlong = ((t % 1) + 1) % 1 * totalLen;

    if (distAlong <= seg1) {
      return { x: midX - distAlong, y: botY };
    } else if (distAlong <= seg1 + seg2) {
      return { x: leftX, y: botY - (distAlong - seg1) };
    } else {
      return { x: leftX + (distAlong - seg1 - seg2), y: topY };
    }
  }

  function getRightBranchPoint(t) {
    seg1 = rightX - midX;
    seg2 = botY - topY;
    seg3 = rightX - midX;
    totalLen = seg1 + seg2 + seg3;
    distAlong = ((t % 1) + 1) % 1 * totalLen;

    if (distAlong <= seg1) {
      return { x: midX + distAlong, y: botY };
    } else if (distAlong <= seg1 + seg2) {
      return { x: rightX, y: botY - (distAlong - seg1) };
    } else {
      return { x: rightX - (distAlong - seg1 - seg2), y: topY };
    }
  }

  function getMiddleBranchPoint(t) {
    const normT = ((t % 1) + 1) % 1;
    return { x: midX, y: topY + normT * (botY - topY) };
  }

  function drawResistorHorizontal(cxPos, cyPos, label, subLabel, color) {
    const halfLen = Math.min(34, loopW * 0.22);
    ctx.save();

    ctx.fillStyle = '#09101f';
    drawRoundedRectPath(cxPos - halfLen - 4, cyPos - 12, (halfLen + 4) * 2, 24, 6);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cxPos - halfLen, cyPos);
    zigSteps = 6;
    zigAmp = 8;
    for (zigIdx = 1; zigIdx <= zigSteps; zigIdx++) {
      const zx = (cxPos - halfLen) + (( zigIdx - 0.5) / zigSteps) * (halfLen * 2);
      const zy = cyPos + (zigIdx % 2 === 1 ? -zigAmp : zigAmp);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(cxPos + halfLen, cyPos);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, cxPos, cyPos - 15);

    ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = color;
    ctx.fillText(subLabel, cxPos, cyPos + 21);

    ctx.restore();
  }

  function drawResistorVertical(cxPos, cyPos, label, subLabel, color) {
    const halfLen = Math.min(34, loopH * 0.22);
    ctx.save();

    ctx.fillStyle = '#09101f';
    drawRoundedRectPath(cxPos - 14, cyPos - halfLen - 4, 28, (halfLen + 4) * 2, 6);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cxPos, cyPos - halfLen);
    zigSteps = 6;
    zigAmp = 8;
    for (zigIdx = 1; zigIdx <= zigSteps; zigIdx++) {
      const zy = (cyPos - halfLen) + ((zigIdx - 0.5) / zigSteps) * (halfLen * 2);
      const zx = cxPos + (zigIdx % 2 === 1 ? -zigAmp : zigAmp);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(cxPos, cyPos + halfLen);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, cxPos + 14, cyPos - 2);

    ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = color;
    ctx.fillText(subLabel, cxPos + 14, cyPos + 12);

    ctx.restore();
  }

  function drawBatteryVertical(cxPos, cyPos, title, voltageVal, color, isLeft) {
    ctx.save();

    ctx.fillStyle = '#09101f';
    drawRoundedRectPath(cxPos - 18, cyPos - 18, 36, 36, 8);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cxPos - 16, cyPos - 6);
    ctx.lineTo(cxPos + 16, cyPos - 6);
    ctx.stroke();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cxPos - 9, cyPos + 6);
    ctx.lineTo(cxPos + 9, cyPos + 6);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText('+', cxPos + (isLeft ? -22 : 22), cyPos - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('−', cxPos + (isLeft ? -22 : 22), cyPos + 11);

    const labelX = isLeft ? cxPos + 16 : cxPos - 16;
    ctx.textAlign = isLeft ? 'left' : 'right';
    ctx.font = '900 12px system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${title} = ${voltageVal.toFixed(1)} V`, labelX, cyPos - 2);

    ctx.restore();
  }

  function drawCurrentArrow(x, y, dirAngle, label, currentVal, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dirAngle);

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4.5);
    ctx.lineTo(-5, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '800 10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(`${label}: ${formatSignedCurrent(currentVal)}`, x, y - 10);
    ctx.restore();
  }

  function drawLoopMeshIndicators() {
    ctx.save();
    const loop1CenterX = (leftX + midX) * 0.5;
    const loop2CenterX = (midX + rightX) * 0.5;
    const loopCenterY = (topY + botY) * 0.5;
    const loopRad = Math.min(loopW * 0.22, loopH * 0.2);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(loop1CenterX, loopCenterY, loopRad, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
    ctx.beginPath();
    ctx.arc(loop2CenterX, loopCenterY, loopRad, -Math.PI * 0.25, Math.PI * 1.25, true);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '800 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.fillText('LOOP 1', loop1CenterX, loopCenterY + 4);
    ctx.fillStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.fillText('LOOP 2', loop2CenterX, loopCenterY + 4);

    ctx.restore();
  }

  function drawMovingElectrons() {
    ctx.save();

    for (idx = 0; idx < numDotsBranch1; idx++) {
      tParam = (idx / numDotsBranch1 + offset1) % 1;
      pt = getLeftBranchPoint(tParam);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (idx = 0; idx < numDotsBranch2; idx++) {
      tParam = (idx / numDotsBranch2 + offset2) % 1;
      pt = getRightBranchPoint(tParam);
      ctx.fillStyle = Math.abs(I2) < 0.005 ? 'rgba(250, 204, 21, 0.45)' : '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = Math.abs(I2) < 0.005 ? 3 : 9;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (idx = 0; idx < numDotsBranch3; idx++) {
      tParam = (idx / numDotsBranch3 + offset3) % 1;
      pt = getMiddleBranchPoint(tParam);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawJunctionNodes() {
    ctx.save();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(midX, topY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(midX, topY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.2;
    drawRoundedRectPath(midX - 58, topY - 36, 116, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#e0f2fe';
    ctx.textAlign = 'center';
    ctx.fillText(`Node A (${VA.toFixed(1)}V)`, midX, topY - 21);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#34d399';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(midX, botY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(midX, botY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.lineWidth = 1.2;
    drawRoundedRectPath(midX - 58, botY + 14, 116, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#d1fae5';
    ctx.textAlign = 'center';
    ctx.fillText('Node B (0.0V)', midX, botY + 29);

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackgroundGrid();

    // Center the circuit perfectly
    cx = W * 0.5;
    cy = H * 0.5; 

    // Adjust width and height proportionally
    loopW = Math.max(80, Math.min(200, W * 0.4));
    loopH = Math.max(90, Math.min(170, H * 0.45));

    leftX = cx - loopW;
    midX = cx;
    rightX = cx + loopW;
    topY = cy - loopH * 0.5;
    botY = cy + loopH * 0.5;

    // 1. Draw glowing circuit wires
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(midX, botY);
    ctx.lineTo(leftX, botY);
    ctx.lineTo(leftX, topY);
    ctx.lineTo(midX, topY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(midX, botY);
    ctx.lineTo(rightX, botY);
    ctx.lineTo(rightX, topY);
    ctx.lineTo(midX, topY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(midX, topY);
    ctx.lineTo(midX, botY);
    ctx.stroke();
    ctx.restore();

    // 2. Draw KVL Mesh Loop Indicators
    drawLoopMeshIndicators();

    // 3. Animate Moving Electrons
    drawMovingElectrons();

    // 4. Draw Batteries
    drawBatteryVertical(leftX, cy, 'E₁', E1, '#38bdf8', true);
    drawBatteryVertical(rightX, cy, 'E₂', E2, '#c084fc', false);

    // 5. Draw Three Resistors
    drawResistorHorizontal(
      (leftX + midX) * 0.5,
      topY,
      `R₁ = ${R1.toFixed(0)}Ω`,
      `ΔV₁ = ${(Math.abs(I1) * R1).toFixed(1)}V`,
      '#38bdf8'
    );
    drawResistorHorizontal(
      (midX + rightX) * 0.5,
      botY,
      `R₂ = ${R2.toFixed(0)}Ω`,
      `ΔV₂ = ${(Math.abs(I2) * R2).toFixed(1)}V`,
      '#c084fc'
    );
    drawResistorVertical(
      midX,
      cy,
      `R₃ = ${R3.toFixed(0)}Ω`,
      `ΔV₃ = ${(Math.abs(I3) * R3).toFixed(1)}V`,
      '#34d399'
    );

    // 6. Draw Branch Current Direction Arrows
    drawCurrentArrow(
      midX - loopW * 0.22,
      topY,
      I1 >= 0 ? 0 : Math.PI,
      'I₁',
      I1,
      '#38bdf8'
    );
    drawCurrentArrow(
      midX + loopW * 0.45,
      topY,
      I2 >= 0 ? Math.PI : 0,
      'I₂',
      I2,
      '#c084fc'
    );
    drawCurrentArrow(
      midX,
      topY + loopH * 0.21,
      I3 >= 0 ? Math.PI * 0.5 : -Math.PI * 0.5,
      'I₃',
      I3,
      '#34d399'
    );

    // 7. Draw Junction Nodes
    drawJunctionNodes();
  }

  function updateElectronOffsets() {
    const scaleFactor = 0.0042;
    offset1 = (offset1 + I1 * scaleFactor + 1) % 1;
    offset2 = (offset2 + I2 * scaleFactor + 1) % 1;
    offset3 = (offset3 + I3 * scaleFactor + 1) % 1;
  }

  function loop() {
    if (!isRunning) return;
    try {
      phase += 0.02;
      solveKirchhoffCircuit();
      updateElectronOffsets();
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  function onE1Input(evt) {
    E1 = parseFloat(evt.target.value) || 10.0;
    updateUIReadouts();
  }

  function onE2Input(evt) {
    E2 = parseFloat(evt.target.value) || 5.0;
    updateUIReadouts();
  }

  function onRInput(evt) {
    const rVal = parseFloat(evt.target.value) || 10.0;
    R1 = rVal;
    R2 = rVal;
    R3 = rVal;
    updateUIReadouts();
  }

  function onBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  function onResetClick() {
    E1 = 10.0;
    E2 = 5.0;
    R1 = 10.0;
    R2 = 10.0;
    R3 = 10.0;
    e1Slider.value = '10';
    e2Slider.value = '5';
    rSlider.value = '10';
    updateUIReadouts();
  }

  window.addEventListener('resize', resize);
  e1Slider.addEventListener('input', onE1Input);
  e2Slider.addEventListener('input', onE2Input);
  rSlider.addEventListener('input', onRInput);
  backBtn.addEventListener('click', onBackClick);
  resetBtn.addEventListener('click', onResetClick);

  resize();
  updateUIReadouts();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    e1Slider.removeEventListener('input', onE1Input);
    e2Slider.removeEventListener('input', onE2Input);
    rSlider.removeEventListener('input', onRInput);
    backBtn.removeEventListener('click', onBackClick);
    resetBtn.removeEventListener('click', onResetClick);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
      }

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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Biot-Savart Law</div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;">Class 12 Physics &bull; Moving Charges &amp; Magnetism</div>
      </div>
      <button type="button" class="reset-btn" title="Reset Experiment" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>

    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:radial-gradient(circle at 50% 50%, #0f172a 0%, #0b1220 65%, #030712 100%);overflow:hidden;touch-action:none;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>

      <!-- Floating Glassmorphic Telemetry HUD (Shifted Up & Compacted) -->
      <div style="position:absolute;top:8px;left:8px;right:8px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:6px;pointer-events:none;z-index:10;">
        <!-- Live B-Field Readout Card -->
        <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:8px 10px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.45),0 0 20px rgba(56,189,248,0.12);min-width:150px;">
          <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#38bdf8;margin-bottom:2px;display:flex;align-items:center;gap:4px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
            Magnetic Field at P
          </div>
          <div id="bValueDisplay" style="font-size:18px;font-weight:900;color:#f8fafc;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:-0.5px;">
            1.00 &mu;T
          </div>
          <div id="bSciDisplay" style="font-size:9px;font-weight:600;color:#94a3b8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;margin-top:1px;">
            1.00 &times; 10&#8315;&#8310; T
          </div>
          <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.08);font-size:9px;color:#cbd5e1;display:flex;align-items:center;gap:4px;">
            <span id="dirBadge" style="display:inline-flex;align-items:center;justify-content:center;padding:2px 6px;border-radius:4px;background:rgba(244,63,94,0.18);border:1px solid rgba(244,63,94,0.45);color:#fda4af;font-weight:800;font-size:9px;">
              &otimes; Into Page (-k&#770;) at P
            </span>
          </div>
        </div>

        <!-- Formula & Right-Hand Thumb Rule Legend Card -->
        <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:6px 10px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.45);max-width:220px;">
          <div style="font-size:9px;font-weight:800;color:#c084fc;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:4px;">
            Biot-Savart Law &amp; R.H. Rule
          </div>
          <div style="font-size:10px;color:#e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(255,255,255,0.04);padding:3px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);line-height:1.3;">
            dB = (&mu;&#8320;/4&pi;)&middot;(I&middot;dl&middot;sin&theta;)/R&sup2;<br>
            <span style="color:#38bdf8;font-weight:800;">B = (&mu;&#8320;&middot;I) / (2&pi;&middot;r)</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;font-size:9px;color:#cbd5e1;font-weight:600;">
            <span style="display:flex;align-items:center;gap:2px;">
              <span style="display:inline-flex;width:12px;height:12px;border-radius:50%;border:1px solid #34d399;color:#34d399;align-items:center;justify-content:center;font-size:8px;font-weight:900;">&bull;</span>
              Out of Page (&odot;)
            </span>
            <span style="display:flex;align-items:center;gap:2px;">
              <span style="display:inline-flex;width:12px;height:12px;border-radius:50%;border:1px solid #fb7185;color:#fb7185;align-items:center;justify-content:center;font-size:8px;font-weight:900;">&times;</span>
              Into Page (&otimes;)
            </span>
          </div>
        </div>
      </div>

      <!-- Interactive Hint Pill -->
      <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.78);border:1px solid rgba(255,255,255,0.1);padding:4px 12px;border-radius:999px;font-size:10px;color:#94a3b8;backdrop-filter:blur(10px);pointer-events:none;white-space:nowrap;">
        Drag Point <strong style="color:#38bdf8;">P</strong> horizontally or adjust sliders below
      </div>
    </div>

    <!-- Bottom Glassmorphic Control Panel -->
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
          <!-- Current (I) Slider Control -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="currentSlider" style="font-size:11px;font-weight:800;color:#fbbf24;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></span>
                Current (I)
              </label>
              <span id="currentReadout" style="font-size:12px;font-weight:900;color:#fef3c7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.4);padding:2px 8px;border-radius:6px;">
                5.0 A
              </span>
            </div>
            <input id="currentSlider" type="range" min="1" max="10" step="0.1" value="5" style="width:100%;accent-color:#f59e0b;cursor:pointer;height:6px;border-radius:4px;" />
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:4px;font-weight:600;">
              <span>1.0 A</span>
              <span style="color:#fbbf24;">Direct: B &prop; I</span>
              <span>10.0 A</span>
            </div>
          </div>

          <!-- Perpendicular Distance (r) Slider Control -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(56,189,248,0.25);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="distanceSlider" style="font-size:11px;font-weight:800;color:#38bdf8;display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span>
                Distance (r)
              </label>
              <span id="distanceReadout" style="font-size:12px;font-weight:900;color:#e0f2fe;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(56,189,248,0.18);border:1px solid rgba(56,189,248,0.4);padding:2px 8px;border-radius:6px;">
                1.00 m
              </span>
            </div>
            <input id="distanceSlider" type="range" min="0.1" max="2.0" step="0.05" value="1.0" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:6px;border-radius:4px;" />
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:4px;font-weight:600;">
              <span>0.10 m</span>
              <span style="color:#38bdf8;">Inverse: B &prop; 1/r</span>
              <span>2.00 m</span>
            </div>
          </div>
        </div>

        <!-- Secondary Controls: Current Polarity & Biot-Savart Element Toggle -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding-top:2px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button type="button" id="polarityBtn" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fde68a;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
              <span id="polarityIcon" style="font-size:12px;">&uarr;</span>
              <span id="polarityText">Current: Upward (+Y)</span>
            </button>
            <button type="button" id="dlToggleBtn" style="background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.5);color:#f3e8ff;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
              <span>Show dB Element (I&middot;dl&#8407;)</span>
            </button>
          </div>
          <div style="font-size:10px;color:#94a3b8;font-weight:600;">
            &mu;&#8320; = 4&pi; &times; 10&#8315;&#8311; T&middot;m/A &nbsp;|&nbsp; Right-Hand Thumb Rule
          </div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const currentSlider = wrap.querySelector('#currentSlider');
  const distanceSlider = wrap.querySelector('#distanceSlider');
  const currentReadout = wrap.querySelector('#currentReadout');
  const distanceReadout = wrap.querySelector('#distanceReadout');
  const bValueDisplay = wrap.querySelector('#bValueDisplay');
  const bSciDisplay = wrap.querySelector('#bSciDisplay');
  const dirBadge = wrap.querySelector('#dirBadge');
  const polarityBtn = wrap.querySelector('#polarityBtn');
  const polarityIcon = wrap.querySelector('#polarityIcon');
  const polarityText = wrap.querySelector('#polarityText');
  const dlToggleBtn = wrap.querySelector('#dlToggleBtn');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  let phase = 0;
  let current = 5.0;
  let distance = 1.0;
  let currentDir = 1;
  let showDlElement = true;
  let dlOffsetNorm = -0.28;
  let dlScanDir = 1;
  let isDraggingP = false;
  let charges = [];
  let i = 0;
  let numCharges = 28;
  let wireX = 0;
  let wireTop = 0;
  let wireBottom = 0;
  let wireRadius = 14;
  let maxReachPx = 160;
  let pxPerMeter = 100;
  let pointPX = 0;
  let pointPY = 0;
  let bFieldTesla = 0;
  let bFieldMicroT = 0;
  let intensityNorm = 0;
  let dlY = 0;
  let vecRX = 0;
  let vecRY = 0;
  let distR = 0;
  let sinTheta = 1;
  let thetaDeg = 90;
  let ringIndex = 0;
  let numRings = 5;
  let ringRadiusPx = 0;
  let ringAlpha = 0;
  let ringB = 0;
  let angle = 0;
  let arrowAngle = 0;
  let ax = 0;
  let ay = 0;
  let tx = 0;
  let ty = 0;
  let gx = 0;
  let gy = 0;
  let cols = 0;
  let rows = 0;
  let col = 0;
  let row = 0;
  let cellX = 0;
  let cellY = 0;
  let distFromWirePx = 0;
  let distFromWireM = 0;
  let localB = 0;
  let symbolAlpha = 0;
  let symbolRadius = 0;
  let isOutOfPage = false;
  let chargeObj = null;
  let chargeY = 0;
  let chargeX = 0;
  let pulseScale = 1;
  let pointerX = 0;
  let pointerY = 0;
  let newDistM = 1.0;
  let wireGrad = null;
  let glowGrad = null;
  let pGlow = null;
  let graphX = 0;
  let graphY = 0;
  let graphW = 0;
  let graphH = 0;
  let gxStep = 0;
  let rSample = 0;
  let bSample = 0;
  let plotX = 0;
  let plotY = 0;

  for (i = 0; i < numCharges; i++) {
    charges.push({
      progress: i / numCharges,
      lane: (i % 3 - 1) * 0.52
    });
  }

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

  function computeMagneticField(I, r) {
    const safeR = Math.max(0.05, r);
    return (2e-7 * I) / safeR;
  }

  function updateUIReadouts() {
    bFieldTesla = computeMagneticField(current, distance);
    bFieldMicroT = bFieldTesla * 1e6;

    currentReadout.textContent = current.toFixed(1) + ' A';
    distanceReadout.textContent = distance.toFixed(2) + ' m';

    if (bFieldMicroT >= 10) {
      bValueDisplay.innerHTML = bFieldMicroT.toFixed(2) + ' &mu;T';
    } else {
      bValueDisplay.innerHTML = bFieldMicroT.toFixed(3) + ' &mu;T';
    }
    bSciDisplay.innerHTML = bFieldMicroT.toFixed(2) + ' &times; 10&#8315;&#8310; T';

    if (currentDir === 1) {
      dirBadge.style.background = 'rgba(244,63,94,0.18)';
      dirBadge.style.borderColor = 'rgba(244,63,94,0.45)';
      dirBadge.style.color = '#fda4af';
      dirBadge.innerHTML = '&otimes; Into Page (-k&#770;) at P';
      polarityIcon.innerHTML = '&uarr;';
      polarityText.textContent = 'Current: Upward (+Y)';
    } else {
      dirBadge.style.background = 'rgba(16,185,129,0.18)';
      dirBadge.style.borderColor = 'rgba(16,185,129,0.45)';
      dirBadge.style.color = '#6ee7b7';
      dirBadge.innerHTML = '&odot; Out of Page (+k&#770;) at P';
      polarityIcon.innerHTML = '&darr;';
      polarityText.textContent = 'Current: Downward (-Y)';
    }

    if (showDlElement) {
      dlToggleBtn.style.background = 'rgba(168,85,247,0.22)';
      dlToggleBtn.style.borderColor = 'rgba(168,85,247,0.55)';
      dlToggleBtn.style.color = '#f3e8ff';
    } else {
      dlToggleBtn.style.background = 'rgba(255,255,255,0.05)';
      dlToggleBtn.style.borderColor = 'rgba(255,255,255,0.12)';
      dlToggleBtn.style.color = '#94a3b8';
    }
  }

  function drawBackgroundGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    const step = 36;
    for (gx = (wireX % step); gx < W; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (gy = ((H * 0.5) % step); gy < H; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVectorFieldGrid() {
    ctx.save();
    const spacing = W < 500 ? 48 : 56;
    cols = Math.floor(W / spacing);
    rows = Math.floor((wireBottom - wireTop - 40) / spacing);

    for (col = -cols; col <= cols; col++) {
      if (col === 0) continue;
      cellX = wireX + col * spacing;
      if (cellX < 20 || cellX > W - 20) continue;

      distFromWirePx = Math.abs(cellX - wireX);
      if (distFromWirePx < wireRadius + 14) continue;

      distFromWireM = distFromWirePx / pxPerMeter;
      localB = computeMagneticField(current, distFromWireM) * 1e6;

      symbolAlpha = Math.min(0.88, Math.max(0.14, 0.14 + (localB / 8.0) * 0.72));
      symbolRadius = Math.min(11, Math.max(4.5, 4.5 + (localB / 10.0) * 6.5));

      isOutOfPage = (cellX < wireX) ? (currentDir === 1) : (currentDir === -1);

      for (row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
        cellY = pointPY + row * spacing;
        if (cellY < 75 || cellY > H - 40) continue;
        if (Math.hypot(cellX - pointPX, cellY - pointPY) < 28) continue;

        ctx.save();
        if (isOutOfPage) {
          ctx.strokeStyle = `rgba(52, 211, 153, ${symbolAlpha * 0.75})`;
          ctx.fillStyle = `rgba(52, 211, 153, ${Math.min(1, symbolAlpha + 0.15)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cellX, cellY, symbolRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cellX, cellY, Math.max(1.8, symbolRadius * 0.34), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(251, 113, 133, ${symbolAlpha * 0.85})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cellX, cellY, symbolRadius, 0, Math.PI * 2);
          ctx.stroke();

          const d = symbolRadius * 0.52;
          ctx.beginPath();
          ctx.moveTo(cellX - d, cellY - d);
          ctx.lineTo(cellX + d, cellY + d);
          ctx.moveTo(cellX + d, cellY - d);
          ctx.lineTo(cellX - d, cellY + d);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawConcentricFieldLoops() {
    ctx.save();
    numRings = Math.floor(3 + (current / 10) * 5);
    const maxRingR = Math.min(W * 0.55, maxReachPx * 1.18);

    for (ringIndex = 1; ringIndex <= numRings; ringIndex++) {
      ringRadiusPx = (ringIndex / numRings) * maxRingR;
      if (ringRadiusPx < wireRadius + 10) continue;

      ringB = computeMagneticField(current, ringRadiusPx / pxPerMeter) * 1e6;
      ringAlpha = Math.min(0.65, Math.max(0.14, (ringB / 6.0) * 0.45));

      ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -phase * 28 * currentDir;

      ctx.beginPath();
      ctx.ellipse(wireX, pointPY, ringRadiusPx, ringRadiusPx * 0.24, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      arrowAngle = (phase * 0.9 * currentDir + ringIndex * 1.3) % (Math.PI * 2);
      ax = wireX + Math.cos(arrowAngle) * ringRadiusPx;
      ay = pointPY + Math.sin(arrowAngle) * (ringRadiusPx * 0.24);
      tx = -Math.sin(arrowAngle) * currentDir;
      ty = Math.cos(arrowAngle) * 0.24 * currentDir;
      angle = Math.atan2(ty, tx);

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.95, ringAlpha + 0.25)})`;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const pRingRadius = distance * pxPerMeter;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.ellipse(wireX, pointPY, pRingRadius, pRingRadius * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawCurrentWire() {
    ctx.save();

    const auraRadius = wireRadius + 14 + (current / 10) * 26;
    glowGrad = ctx.createRadialGradient(wireX, pointPY, wireRadius * 0.3, wireX, pointPY, auraRadius * 2.2);
    glowGrad.addColorStop(0, `rgba(245, 158, 11, ${0.18 + (current / 10) * 0.25})`);
    glowGrad.addColorStop(0.5, `rgba(245, 158, 11, ${0.06 + (current / 10) * 0.1})`);
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(wireX - auraRadius * 2, wireTop, auraRadius * 4, wireBottom - wireTop);

    wireGrad = ctx.createLinearGradient(wireX - wireRadius, 0, wireX + wireRadius, 0);
    wireGrad.addColorStop(0, '#1e293b');
    wireGrad.addColorStop(0.28, '#475569');
    wireGrad.addColorStop(0.5, '#334155');
    wireGrad.addColorStop(0.85, '#1e293b');
    wireGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = wireGrad;
    ctx.fillRect(wireX - wireRadius, wireTop, wireRadius * 2, wireBottom - wireTop);

    ctx.strokeStyle = `rgba(251, 191, 36, ${0.45 + (current / 10) * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wireX - wireRadius, wireTop);
    ctx.lineTo(wireX - wireRadius, wireBottom);
    ctx.moveTo(wireX + wireRadius, wireTop);
    ctx.lineTo(wireX + wireRadius, wireBottom);
    ctx.stroke();

    const wireLen = wireBottom - wireTop;
    for (i = 0; i < charges.length; i++) {
      chargeObj = charges[i];
      chargeY = wireTop + ((chargeObj.progress * wireLen) % wireLen);
      if (chargeY < wireTop) chargeY += wireLen;
      chargeX = wireX + chargeObj.lane * (wireRadius * 0.65);

      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(chargeX, chargeY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(chargeX - 1.8, chargeY);
      ctx.lineTo(chargeX + 1.8, chargeY);
      ctx.moveTo(chargeX, chargeY - 1.8);
      ctx.lineTo(chargeX, chargeY + 1.8);
      ctx.stroke();
      ctx.restore();
    }

    const arrowX = wireX - wireRadius - 22;
    const arrowCenterY = pointPY - 70;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (currentDir === 1) {
      ctx.moveTo(arrowX, arrowCenterY + 26);
      ctx.lineTo(arrowX, arrowCenterY - 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowCenterY - 32);
      ctx.lineTo(arrowX - 6, arrowCenterY - 20);
      ctx.lineTo(arrowX + 6, arrowCenterY - 20);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.moveTo(arrowX, arrowCenterY - 26);
      ctx.lineTo(arrowX, arrowCenterY + 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowCenterY + 32);
      ctx.lineTo(arrowX - 6, arrowCenterY + 20);
      ctx.lineTo(arrowX + 6, arrowCenterY + 20);
      ctx.closePath();
      ctx.fill();
    }

    ctx.font = '900 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`I = ${current.toFixed(1)} A`, arrowX - 8, arrowCenterY + 4);
    ctx.restore();

    ctx.restore();
  }

  function drawDifferentialElementAndPointP() {
    ctx.save();

    if (showDlElement) {
      dlY = pointPY + dlOffsetNorm * Math.min(220, (wireBottom - wireTop) * 0.36);
      const dlHalfH = 14;

      ctx.save();
      ctx.fillStyle = 'rgba(192, 132, 252, 0.38)';
      ctx.strokeStyle = '#e879f9';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.2;
      drawRoundedRectPath(wireX - wireRadius - 3, dlY - dlHalfH, (wireRadius + 3) * 2, dlHalfH * 2, 5);
      ctx.fill();
      ctx.stroke();

      vecRX = pointPX - wireX;
      vecRY = pointPY - dlY;
      distR = Math.hypot(vecRX, vecRY);
      sinTheta = distR > 0 ? Math.abs(vecRX) / distR : 1;
      thetaDeg = Math.round(Math.asin(Math.min(1, Math.max(0, sinTheta))) * (180 / Math.PI));

      ctx.strokeStyle = 'rgba(216, 180, 254, 0.8)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(wireX, dlY);
      ctx.lineTo(pointPX, pointPY);
      ctx.stroke();
      ctx.setLineDash([]);

      const arcRadius = 24;
      const rayAngle = Math.atan2(vecRY, vecRX);
      const wireDirAngle = currentDir === 1 ? -Math.PI / 2 : Math.PI / 2;
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(
        wireX,
        dlY,
        arcRadius,
        Math.min(wireDirAngle, rayAngle),
        Math.max(wireDirAngle, rayAngle)
      );
      ctx.stroke();

      ctx.fillStyle = '#f5d0fe';
      ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('I·dl⃗', wireX - wireRadius - 8, dlY + 4);
      ctx.textAlign = 'left';
      ctx.fillText(`θ = ${thetaDeg}°`, wireX + wireRadius + 8, dlY + (dlY < pointPY ? 18 : -10));

      ctx.fillStyle = '#e9d5ff';
      ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText('R⃗', (wireX + pointPX) * 0.5, (dlY + pointPY) * 0.5 - 6);
      ctx.restore();
    }

    const sqSize = 10;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wireX + wireRadius, pointPY - sqSize);
    ctx.lineTo(wireX + wireRadius + sqSize, pointPY - sqSize);
    ctx.lineTo(wireX + wireRadius + sqSize, pointPY);
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(wireX, pointPY);
    ctx.lineTo(pointPX, pointPY);
    ctx.stroke();
    ctx.setLineDash([]);

    const midRX = (wireX + wireRadius + pointPX) * 0.5;
    const rText = `r = ${distance.toFixed(2)} m`;
    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    const textW = ctx.measureText(rText).width + 14;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1.2;
    drawRoundedRectPath(midRX - textW * 0.5, pointPY + 10, textW, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7dd3fc';
    ctx.textAlign = 'center';
    ctx.fillText(rText, midRX, pointPY + 24);
    ctx.restore();

    intensityNorm = Math.min(1, Math.max(0.08, Math.log10(bFieldMicroT * 10 + 1) / Math.log10(201)));
    pulseScale = 1 + 0.08 * Math.sin(phase * 4);
    const pRadius = (18 + intensityNorm * 16) * pulseScale;

    pGlow = ctx.createRadialGradient(pointPX, pointPY, 2, pointPX, pointPY, pRadius * 2.2);
    if (currentDir === 1) {
      pGlow.addColorStop(0, `rgba(244, 63, 94, ${0.45 + intensityNorm * 0.45})`);
      pGlow.addColorStop(0.5, `rgba(56, 189, 248, ${0.2 + intensityNorm * 0.25})`);
      pGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    } else {
      pGlow.addColorStop(0, `rgba(16, 185, 129, ${0.45 + intensityNorm * 0.45})`);
      pGlow.addColorStop(0.5, `rgba(56, 189, 248, ${0.2 + intensityNorm * 0.25})`);
      pGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    }
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(pointPX, pointPY, pRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    const symR = 14 + intensityNorm * 8;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = currentDir === 1 ? '#fb7185' : '#34d399';
    ctx.shadowColor = currentDir === 1 ? '#f43f5e' : '#10b981';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(pointPX, pointPY, symR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (currentDir === 1) {
      const crossR = symR * 0.52;
      ctx.beginPath();
      ctx.moveTo(pointPX - crossR, pointPY - crossR);
      ctx.lineTo(pointPX + crossR, pointPY + crossR);
      ctx.moveTo(pointPX + crossR, pointPY - crossR);
      ctx.lineTo(pointPX - crossR, pointPY + crossR);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(pointPX, pointPY, symR * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText('Point P', pointPX, pointPY - symR - 22);

    ctx.font = '800 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = currentDir === 1 ? '#fda4af' : '#6ee7b7';
    ctx.fillText(
      `B = ${bFieldMicroT >= 10 ? bFieldMicroT.toFixed(1) : bFieldMicroT.toFixed(2)} μT ${currentDir === 1 ? '⊗' : '⊙'}`,
      pointPX,
      pointPY - symR - 8
    );
    ctx.restore();

    ctx.restore();
  }

  function drawMiniBvsRGraph() {
    if (W < 420 || H < 310) return;

    ctx.save();
    graphW = 148;
    graphH = 86;
    graphX = W - graphW - 14;
    graphY = H - graphH - 38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    drawRoundedRectPath(graphX, graphY, graphW, graphH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('B vs r Curve (B ∝ 1/r)', graphX + 10, graphY + 14);

    const padL = 22;
    const padR = 10;
    const padT = 22;
    const padB = 16;
    const innerW = graphW - padL - padR;
    const innerH = graphH - padT - padB;
    const originX = graphX + padL;
    const originY = graphY + padT + innerH;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX, graphY + padT);
    ctx.lineTo(originX, originY);
    ctx.lineTo(originX + innerW, originY);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const maxBPlot = 20;
    for (gxStep = 0; gxStep <= innerW; gxStep += 2) {
      rSample = 0.1 + (gxStep / innerW) * 1.9;
      bSample = Math.min(maxBPlot, computeMagneticField(current, rSample) * 1e6);
      plotX = originX + gxStep;
      plotY = originY - (bSample / maxBPlot) * innerH;
      if (gxStep === 0) ctx.moveTo(plotX, plotY);
      else ctx.lineTo(plotX, plotY);
    }
    ctx.stroke();

    const curPlotX = originX + ((distance - 0.1) / 1.9) * innerW;
    const curPlotY = originY - (Math.min(maxBPlot, bFieldMicroT) / maxBPlot) * innerH;
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(curPlotX, curPlotY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#64748b';
    ctx.font = '700 8px ui-monospace, monospace';
    ctx.fillText('B', originX - 10, graphY + padT + 6);
    ctx.fillText('r (m)', originX + innerW - 22, originY + 12);

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Wire ko center me shift kiya gaya hai
    wireX = W * 0.5; 
    wireTop = 0;
    wireBottom = H;
    wireRadius = W < 480 ? 11 : 14;

    // Point P ke liye screen space adjust kiya gaya hai
    maxReachPx = Math.max(80, Math.min(W * 0.45, W - wireX - 32));
    pxPerMeter = maxReachPx / 2.0;

    pointPX = wireX + distance * pxPerMeter;
    pointPY = Math.max(130, Math.min(H - 65, H * 0.54)); // Thoda neeche shift kiya taaki upar ke text se overlap na ho

    bFieldTesla = computeMagneticField(current, distance);
    bFieldMicroT = bFieldTesla * 1e6;

    drawBackgroundGrid();
    drawVectorFieldGrid();
    drawConcentricFieldLoops();
    drawCurrentWire();
    drawDifferentialElementAndPointP();
    drawMiniBvsRGraph();
  }

  function updateChargePositions() {
    const speed = (0.0022 + (current / 10) * 0.0075) * currentDir;
    for (i = 0; i < charges.length; i++) {
      charges[i].progress = (charges[i].progress - speed + 1) % 1;
    }

    if (showDlElement) {
      dlOffsetNorm += 0.0022 * dlScanDir;
      if (dlOffsetNorm > 0.38) {
        dlOffsetNorm = 0.38;
        dlScanDir = -1;
      } else if (dlOffsetNorm < -0.38) {
        dlOffsetNorm = -0.38;
        dlScanDir = 1;
      }
    }
  }

  function loop() {
    if (!isRunning) return;
    try {
      phase += 0.016 + (current / 10) * 0.028;
      updateChargePositions();
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  function getPointerCoords(evt) {
    if (evt.touches && evt.touches.length > 0) {
      return {
        x: evt.touches[0].clientX - (canvasHost.offsetLeft || 0),
        y: evt.touches[0].clientY - (canvasHost.offsetTop || 0)
      };
    }
    if (typeof evt.offsetX === 'number' && evt.target === canvas) {
      return { x: evt.offsetX, y: evt.offsetY };
    }
    return {
      x: (evt.clientX || 0) - (canvasHost.offsetLeft || 0),
      y: (evt.clientY || 0) - (canvasHost.offsetTop || 0)
    };
  }

  function onPointerDown(evt) {
    const pos = getPointerCoords(evt);
    pointerX = pos.x;
    pointerY = pos.y;
    if (Math.hypot(pointerX - pointPX, pointerY - pointPY) < 38) {
      isDraggingP = true;
    }
  }

  function onPointerMove(evt) {
    if (!isDraggingP) return;
    const pos = getPointerCoords(evt);
    pointerX = pos.x;
    if (pxPerMeter > 0) {
      newDistM = (pointerX - wireX) / pxPerMeter;
      newDistM = Math.max(0.1, Math.min(2.0, Math.round(newDistM * 20) / 20));
      distance = newDistM;
      distanceSlider.value = String(distance);
      updateUIReadouts();
    }
  }

  function onPointerUp() {
    isDraggingP = false;
  }

  function onCurrentInput(evt) {
    current = parseFloat(evt.target.value) || 5.0;
    updateUIReadouts();
  }

  function onDistanceInput(evt) {
    distance = parseFloat(evt.target.value) || 1.0;
    updateUIReadouts();
  }

  function onPolarityClick() {
    currentDir = currentDir === 1 ? -1 : 1;
    updateUIReadouts();
  }

  function onDlToggleClick() {
    showDlElement = !showDlElement;
    updateUIReadouts();
  }

  function onBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  function onResetClick() {
    current = 5.0;
    distance = 1.0;
    currentDir = 1;
    showDlElement = true;
    dlOffsetNorm = -0.28;
    currentSlider.value = '5';
    distanceSlider.value = '1.0';
    updateUIReadouts();
  }

  window.addEventListener('resize', resize);
  currentSlider.addEventListener('input', onCurrentInput);
  distanceSlider.addEventListener('input', onDistanceInput);
  polarityBtn.addEventListener('click', onPolarityClick);
  dlToggleBtn.addEventListener('click', onDlToggleClick);
  backBtn.addEventListener('click', onBackClick);
  resetBtn.addEventListener('click', onResetClick);

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  resize();
  updateUIReadouts();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    currentSlider.removeEventListener('input', onCurrentInput);
    distanceSlider.removeEventListener('input', onDistanceInput);
    polarityBtn.removeEventListener('click', onPolarityClick);
    dlToggleBtn.removeEventListener('click', onDlToggleClick);
    backBtn.removeEventListener('click', onBackClick);
    resetBtn.removeEventListener('click', onResetClick);
    canvas.removeEventListener('mousedown', onPointerDown);
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    canvas.removeEventListener('touchstart', onPointerDown);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
        }

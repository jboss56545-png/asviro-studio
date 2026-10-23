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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Wheatstone Bridge</div>
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
        <!-- Balance Condition & Status Banner -->
        <div id="statusBanner" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.35);transition:all 0.2s ease;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="statusDot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d399;"></span>
            <span id="statusTitle" style="font-size:11px;font-weight:900;color:#34d399;letter-spacing:0.4px;text-transform:uppercase;">Bridge Balanced (Null Point: Ig = 0 A)</span>
          </div>
          <div id="ratioReadout" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
            R1/R2 = 1.00 &nbsp;=&nbsp; R3/R4 = 1.00
          </div>
        </div>

        <!-- 4 Resistor Sliders Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <!-- R1 Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderR1" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
                R1 (Arm AB)
              </label>
              <span id="labelR1" style="font-size:11px;font-weight:900;color:#38bdf8;">10.0 &Omega;</span>
            </div>
            <input id="sliderR1" type="range" min="1" max="20" step="0.5" value="10" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>

          <!-- R2 Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderR2" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#a855f7;box-shadow:0 0 6px #a855f7;"></span>
                R2 (Arm BC)
              </label>
              <span id="labelR2" style="font-size:11px;font-weight:900;color:#c084fc;">10.0 &Omega;</span>
            </div>
            <input id="sliderR2" type="range" min="1" max="20" step="0.5" value="10" style="width:100%;accent-color:#a855f7;cursor:pointer;height:5px;" />
          </div>

          <!-- R3 Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderR3" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#f472b6;box-shadow:0 0 6px #f472b6;"></span>
                R3 (Arm AD)
              </label>
              <span id="labelR3" style="font-size:11px;font-weight:900;color:#f472b6;">10.0 &Omega;</span>
            </div>
            <input id="sliderR3" type="range" min="1" max="20" step="0.5" value="10" style="width:100%;accent-color:#f472b6;cursor:pointer;height:5px;" />
          </div>

          <!-- R4 Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderR4" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#fbbf24;box-shadow:0 0 6px #fbbf24;"></span>
                R4 (Arm DC)
              </label>
              <span id="labelR4" style="font-size:11px;font-weight:900;color:#fbbf24;">10.0 &Omega;</span>
            </div>
            <input id="sliderR4" type="range" min="1" max="20" step="0.5" value="10" style="width:100%;accent-color:#fbbf24;cursor:pointer;height:5px;" />
          </div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const sliderR1 = wrap.querySelector('#sliderR1');
  const sliderR2 = wrap.querySelector('#sliderR2');
  const sliderR3 = wrap.querySelector('#sliderR3');
  const sliderR4 = wrap.querySelector('#sliderR4');
  const labelR1 = wrap.querySelector('#labelR1');
  const labelR2 = wrap.querySelector('#labelR2');
  const labelR3 = wrap.querySelector('#labelR3');
  const labelR4 = wrap.querySelector('#labelR4');
  const statusBanner = wrap.querySelector('#statusBanner');
  const statusDot = wrap.querySelector('#statusDot');
  const statusTitle = wrap.querySelector('#statusTitle');
  const ratioReadout = wrap.querySelector('#ratioReadout');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  // ALL VARIABLES HERE
  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;

  // Resistance values & circuit electrical quantities
  let R1 = 10, R2 = 10, R3 = 10, R4 = 10;
  let Rg = 10;
  let E = 10;
  let ratioLeft = 1;
  let ratioRight = 1;
  let isBalanced = true;
  let VB0 = 5, VD0 = 5, Vth = 0, Rth = 10;
  let Ig = 0;
  let VB = 5, VD = 5;
  let I1 = 0.5, I2 = 0.5, I3 = 0.5, I4 = 0.5, Itotal = 1.0;

  // Animation & layout state variables (all declared at top of mount)
  let phase1 = 0, phase2 = 0, phase3 = 0, phase4 = 0, phaseG = 0, phaseBat = 0;
  let pulseTime = 0;
  let needleAngle = 0;
  let targetNeedleAngle = 0;
  let isCompact = false;
  let i = 0;
  let t = 0;
  let cx = 0, cy = 0;
  let dRx = 0, dRy = 0;
  let ax = 0, ay = 0, bx = 0, by = 0, ccx = 0, ccy = 0, dx = 0, dy = 0;
  let batY = 0, batW = 0, batH = 0;
  let galvR = 0;
  let bgGrad = null, eGrad = null, galvGrad = null;
  let fCardX = 0, fCardY = 0, fCardW = 0, fCardH = 0;
  let gCardX = 0, gCardY = 0, gCardW = 0, gCardH = 0;
  let mx = 0, my = 0, ang = 0, rw = 0, rh = 0;
  let zigCount = 7, stepX = 0, zx = 0, zy = 0;
  let px = 0, py = 0;
  let segLen = 0, u = 0;
  let tickAng = 0, tx1 = 0, ty1 = 0, tx2 = 0, ty2 = 0;

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

  function updateBridgePhysics() {
    R1 = parseFloat(sliderR1.value) || 10;
    R2 = parseFloat(sliderR2.value) || 10;
    R3 = parseFloat(sliderR3.value) || 10;
    R4 = parseFloat(sliderR4.value) || 10;

    labelR1.innerHTML = R1.toFixed(1) + ' &Omega;';
    labelR2.innerHTML = R2.toFixed(1) + ' &Omega;';
    labelR3.innerHTML = R3.toFixed(1) + ' &Omega;';
    labelR4.innerHTML = R4.toFixed(1) + ' &Omega;';

    ratioLeft = R1 / R2;
    ratioRight = R3 / R4;

    // Exact Thevenin equivalent across nodes B (top) and D (bottom)
    VB0 = E * (R2 / (R1 + R2));
    VD0 = E * (R4 / (R3 + R4));
    Vth = VB0 - VD0;
    Rth = (R1 * R2) / (R1 + R2) + (R3 * R4) / (R3 + R4);

    // Current Ig from B to D through Galvanometer of resistance Rg
    Ig = Vth / (Rth + Rg);
    if (Math.abs(Ig) < 0.0005) {
      Ig = 0;
    }

    isBalanced = Math.abs(Ig) === 0;

    VB = VB0 - Ig * ((R1 * R2) / (R1 + R2));
    VD = VD0 + Ig * ((R3 * R4) / (R3 + R4));

    I1 = (E - VB) / R1;
    I2 = VB / R2;
    I3 = (E - VD) / R3;
    I4 = VD / R4;
    Itotal = I1 + I3;

    // Update UI status banner
    if (isBalanced) {
      statusBanner.style.background = 'rgba(52,211,153,0.12)';
      statusBanner.style.borderColor = 'rgba(52,211,153,0.4)';
      statusDot.style.background = '#34d399';
      statusDot.style.boxShadow = '0 0 10px #34d399';
      statusTitle.style.color = '#34d399';
      statusTitle.textContent = 'Bridge Balanced (Null Point: Ig = 0 A)';
      ratioReadout.innerHTML =
        'R1/R2 = ' + ratioLeft.toFixed(2) + ' &nbsp;=&nbsp; R3/R4 = ' + ratioRight.toFixed(2);
    } else {
      statusBanner.style.background = 'rgba(251,191,36,0.1)';
      statusBanner.style.borderColor = 'rgba(251,191,36,0.38)';
      statusDot.style.background = '#fbbf24';
      statusDot.style.boxShadow = '0 0 10px #fbbf24';
      statusTitle.style.color = '#fbbf24';
      statusTitle.textContent =
        Ig > 0
          ? 'Unbalanced (VB > VD : Current flows B → D)'
          : 'Unbalanced (VD > VB : Current flows D → B)';
      ratioReadout.innerHTML =
        'R1/R2 = ' + ratioLeft.toFixed(2) + ' &nbsp;&ne;&nbsp; R3/R4 = ' + ratioRight.toFixed(2);
    }
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
    fCardX = isCompact ? 10 : 16;
    fCardY = isCompact ? 8 : 12;
    fCardW = isCompact ? Math.min(218, W * 0.52) : 256;
    fCardH = isCompact ? 68 : 82;

    // 1. Left Overlay Card: Balance Condition Formula
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.4)';
    ctx.stroke();

    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BALANCE CONDITION (R1/R2 = R3/R4)', fCardX + 18, fCardY + (isCompact ? 17 : 20));

    ctx.font = (isCompact ? '900 12px' : '900 14px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(
      ratioLeft.toFixed(2) + (isBalanced ? '  =  ' : '  ≠  ') + ratioRight.toFixed(2),
      fCardX + 18,
      fCardY + (isCompact ? 36 : 43)
    );

    ctx.font = (isCompact ? '700 9.5px' : '700 11px') + ' system-ui, sans-serif';
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24';
    ctx.fillText(
      'VB = ' + VB.toFixed(2) + 'V   VD = ' + VD.toFixed(2) + 'V',
      fCardX + 18,
      fCardY + (isCompact ? 54 : 65)
    );
    ctx.restore();

    // 2. Right Overlay Card: Galvanometer Current & Bridge Telemetry
    gCardW = isCompact ? Math.min(168, W - fCardW - 28) : 210;
    if (gCardW >= 120) {
      gCardH = fCardH;
      gCardX = W - gCardW - (isCompact ? 10 : 16);
      gCardY = fCardY;

      ctx.save();
      drawRoundedRect(gCardX, gCardY, gCardW, gCardH, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.4)' : 'rgba(244, 63, 94, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('GALVANOMETER (G)', gCardX + 12, gCardY + (isCompact ? 17 : 20));

      ctx.font = (isCompact ? '900 12px' : '900 14px') + ' system-ui, sans-serif';
      ctx.fillStyle = isBalanced ? '#34d399' : '#fb7185';
      ctx.fillText(
        'Ig = ' + (Ig * 1000).toFixed(1) + ' mA',
        gCardX + 12,
        gCardY + (isCompact ? 36 : 43)
      );

      ctx.font = (isCompact ? '700 9.5px' : '700 11px') + ' system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        'ΔV_BD = ' + (VB - VD).toFixed(2) + ' V',
        gCardX + 12,
        gCardY + (isCompact ? 54 : 65)
      );
      ctx.restore();
    }
  }

  function drawResistorOnArm(x1, y1, x2, y2, resValue, armCurrent, phaseVal, colorHex, labelName, isTopSide) {
    // 1. Glowing Arm Wire
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = isCompact ? 6 : 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = isCompact ? 3.5 : 4.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // 2. Animated Current Carriers Along Arm (from x1,y1 -> x2,y2)
    ctx.save();
    const particleCount = 6;
    for (i = 0; i < particleCount; i++) {
      t = ((i / particleCount) + phaseVal) % 1;
      if (t < 0) t += 1;
      px = x1 + (x2 - x1) * t;
      py = y1 + (y2 - y1) * t;

      eGrad = ctx.createRadialGradient(px, py, 0.5, px, py, isCompact ? 5 : 6.5);
      eGrad.addColorStop(0, '#ffffff');
      eGrad.addColorStop(0.45, colorHex);
      eGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(px, py, isCompact ? 5 : 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Angled Resistor Body at Midpoint of Arm
    mx = (x1 + x2) * 0.5;
    my = (y1 + y2) * 0.5;
    ang = Math.atan2(y2 - y1, x2 - x1);
    rw = isCompact ? 56 : 72;
    rh = isCompact ? 20 : 25;

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);

    drawRoundedRect(-rw * 0.5, -rh * 0.5, rw, rh, 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Zig-zag precision resistor trace inside capsule
    zigCount = 7;
    stepX = (rw * 0.76) / zigCount;
    ctx.beginPath();
    ctx.moveTo(-rw * 0.5, 0);
    ctx.lineTo(-rw * 0.38, 0);
    for (i = 0; i < zigCount; i++) {
      zx = -rw * 0.38 + (i + 0.5) * stepX;
      zy = (i % 2 === 0 ? -1 : 1) * (rh * 0.3);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(rw * 0.38, 0);
    ctx.lineTo(rw * 0.5, 0);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // 4. Upright Label Pill Next to Resistor
    const offsetDist = isCompact ? 24 : 30;
    const normX = Math.sin(ang) * (isTopSide ? -1 : 1);
    const normY = -Math.cos(ang) * (isTopSide ? -1 : 1);
    const lx = mx + normX * offsetDist;
    const ly = my + normY * offsetDist;

    ctx.save();
    ctx.font = (isCompact ? '800 9.5px' : '800 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const badgeText = labelName + ': ' + resValue.toFixed(1) + 'Ω';
    const bw = ctx.measureText(badgeText).width + 12;
    const bh = isCompact ? 17 : 20;

    drawRoundedRect(lx - bw * 0.5, ly - bh * 0.5, bw, bh, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fill();
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(badgeText, lx, ly);
    ctx.restore();
  }

  function drawOuterBatteryLoop() {
    // Outer loop from Left Node A (ax, ay) down to (ax, batY), across to (ccx, batY), up to Right Node C (ccx, ccy)
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = isCompact ? 5 : 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, batY);
    ctx.lineTo(ccx, batY);
    ctx.lineTo(ccx, ccy);
    ctx.stroke();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = isCompact ? 3 : 3.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, batY);
    ctx.lineTo(ccx, batY);
    ctx.lineTo(ccx, ccy);
    ctx.stroke();
    ctx.restore();

    // Moving charges along outer battery feed loop (C -> bottom right -> battery -> bottom left -> A)
    const sideH = batY - ay;
    const botW = ccx - ax;
    segLen = 2 * sideH + botW;
    if (segLen > 10) {
      ctx.save();
      const count = 12;
      for (i = 0; i < count; i++) {
        u = (((i / count) + phaseBat) % 1) * segLen;
        // Path goes from C(ccx, ccy) -> (ccx, batY) -> (ax, batY) -> A(ax, ay)
        if (u <= sideH) {
          px = ccx;
          py = ccy + u;
        } else if (u <= sideH + botW) {
          px = ccx - (u - sideH);
          py = batY;
        } else {
          px = ax;
          py = batY - (u - sideH - botW);
        }

        if (Math.abs(py - batY) < 4 && Math.abs(px - cx) < batW * 0.5) continue;

        eGrad = ctx.createRadialGradient(px, py, 0.5, px, py, isCompact ? 4.5 : 5.5);
        eGrad.addColorStop(0, '#ffffff');
        eGrad.addColorStop(0.5, '#38bdf8');
        eGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = eGrad;
        ctx.beginPath();
        ctx.arc(px, py, isCompact ? 4.5 : 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Battery Capsule at (cx, batY)
    batW = isCompact ? 88 : 108;
    batH = isCompact ? 28 : 34;
    ctx.save();
    drawRoundedRect(cx - batW * 0.5, batY - batH * 0.5, batW, batH, 10);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Battery Plates (+ on Left, - on Right)
    for (i = -1; i <= 1; i += 2) {
      const bxPlate = cx + i * 9;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(bxPlate - 3, batY - batH * 0.32);
      ctx.lineTo(bxPlate - 3, batY + batH * 0.32);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(bxPlate + 3, batY - batH * 0.18);
      ctx.lineTo(bxPlate + 3, batY + batH * 0.18);
      ctx.stroke();
    }

    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('+', cx - batW * 0.35, batY);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('−', cx + batW * 0.35, batY);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = (isCompact ? '800 9px' : '800 10px') + ' system-ui, sans-serif';
    ctx.fillText('SOURCE E = ' + E.toFixed(0) + 'V', cx, batY - batH * 0.5 - 7);
    ctx.restore();
  }

  function drawCenterGalvanometerBranch() {
    const bridgeColor = isBalanced ? '#34d399' : '#fbbf24';

    // Central Vertical Wire between Top Node B (bx, by) and Bottom Node D (dx, dy)
    ctx.save();
    ctx.shadowColor = bridgeColor;
    ctx.shadowBlur = isBalanced ? 14 : 10;
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.55)' : 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = isCompact ? 6 : 7;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(dx, dy);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = isCompact ? 3 : 4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(dx, dy);
    ctx.stroke();
    ctx.restore();

    // Animated Particles on Central Galvanometer Wire (Still when Balanced, moving when Unbalanced)
    ctx.save();
    const gParticles = 6;
    for (i = 0; i < gParticles; i++) {
      t = ((i / gParticles) + phaseG) % 1;
      if (t < 0) t += 1;
      py = by + (dy - by) * t;
      if (Math.abs(py - cy) < galvR * 1.05) continue;

      eGrad = ctx.createRadialGradient(cx, py, 0.5, cx, py, isCompact ? 4.5 : 6);
      eGrad.addColorStop(0, '#ffffff');
      eGrad.addColorStop(0.5, bridgeColor);
      eGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(cx, py, isCompact ? 4.5 : 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Galvanometer Dial Body at Center (cx, cy)
    ctx.save();
    galvGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, galvR * 1.35);
    galvGrad.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
    galvGrad.addColorStop(0.75, 'rgba(15, 23, 42, 0.96)');
    galvGrad.addColorStop(1, isBalanced ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 191, 36, 0.25)');

    ctx.shadowColor = bridgeColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = galvGrad;
    ctx.strokeStyle = bridgeColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, galvR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dial Scale Arc & Tick Marks (-Max, 0 at Top, +Max)
    const arcRadius = galvR * 0.74;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, arcRadius, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();

    for (i = -4; i <= 4; i++) {
      tickAng = -Math.PI * 0.5 + (i / 4) * (Math.PI * 0.34);
      tx1 = cx + Math.cos(tickAng) * (arcRadius - (i === 0 ? 6 : 3.5));
      ty1 = (cy + 4) + Math.sin(tickAng) * (arcRadius - (i === 0 ? 6 : 3.5));
      tx2 = cx + Math.cos(tickAng) * (arcRadius + 2);
      ty2 = (cy + 4) + Math.sin(tickAng) * (arcRadius + 2);

      ctx.strokeStyle = i === 0 ? '#34d399' : 'rgba(203, 213, 225, 0.55)';
      ctx.lineWidth = i === 0 ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }

    // Zero-Center '0' Marker at Top of Dial
    ctx.fillStyle = '#34d399';
    ctx.font = (isCompact ? '800 8px' : '800 9px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', cx, cy - galvR * 0.78);

    // Animated Galvanometer Needle (0 = straight up -PI/2; deflects right for Ig > 0, left for Ig < 0)
    const drawAng = -Math.PI * 0.5 + needleAngle;
    const needleLen = galvR * 0.66;
    const nx = cx + Math.cos(drawAng) * needleLen;
    const ny = (cy + 4) + Math.sin(drawAng) * needleLen;

    ctx.save();
    ctx.shadowColor = bridgeColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = isBalanced ? '#34d399' : '#fb7185';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // Needle arrow tip
    ctx.fillStyle = isBalanced ? '#34d399' : '#fb7185';
    ctx.beginPath();
    ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pivot Hub
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // 'G' Label & Live Ig Value Inside Galvanometer
    ctx.fillStyle = '#f8fafc';
    ctx.font = (isCompact ? '900 10px' : '900 12px') + ' system-ui, sans-serif';
    ctx.fillText('G', cx, cy + galvR * 0.34);

    ctx.fillStyle = bridgeColor;
    ctx.font = (isCompact ? '800 8px' : '800 9px') + ' system-ui, sans-serif';
    ctx.fillText((Ig * 1000).toFixed(1) + ' mA', cx, cy + galvR * 0.64);
    ctx.restore();
  }

  function drawNode(x, y, label, voltageText, color) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, isCompact ? 10 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f8fafc';
    ctx.font = (isCompact ? '900 9.5px' : '900 11px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);

    if (voltageText) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
      const vy = label === 'B' ? y - (isCompact ? 16 : 19) : label === 'D' ? y + (isCompact ? 17 : 20) : y - (isCompact ? 16 : 19);
      ctx.fillText(voltageText, x, vy);
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawTopOverlays();

    isCompact = W < 560 || H < 380;
    const topClearance = isCompact ? 80 : 96;
    const bottomSpace = isCompact ? 42 : 52;
    const availH = Math.max(140, H - topClearance - bottomSpace);

    cx = W * 0.5;
    cy = topClearance + availH * 0.46;

    dRx = Math.min(230, Math.max(105, W * 0.34));
    dRy = Math.min(135, Math.max(62, availH * 0.43));

    // 4 Diamond Vertices: A (Left), B (Top), C (Right), D (Bottom)
    ax = cx - dRx;
    ay = cy;
    bx = cx;
    by = cy - dRy;
    ccx = cx + dRx;
    ccy = cy;
    dx = cx;
    dy = cy + dRy;

    batY = Math.min(H - (isCompact ? 18 : 24), dy + (isCompact ? 30 : 38));
    galvR = isCompact ? 28 : 35;

    // 1. Draw External Battery Diagonal Loop (connecting A and C)
    drawOuterBatteryLoop();

    // 2. Draw 4 Diamond Resistor Arms (R1, R2, R3, R4)
    drawResistorOnArm(ax, ay, bx, by, R1, I1, phase1, '#38bdf8', 'R1', true);
    drawResistorOnArm(bx, by, ccx, ccy, R2, I2, phase2, '#a855f7', 'R2', true);
    drawResistorOnArm(ax, ay, dx, dy, R3, I3, phase3, '#f472b6', 'R3', false);
    drawResistorOnArm(dx, dy, ccx, ccy, R4, I4, phase4, '#fbbf24', 'R4', false);

    // 3. Draw Central Galvanometer Branch (Connecting B and D)
    drawCenterGalvanometerBranch();

    // 4. Draw Diamond Junction Nodes A, B, C, D
    drawNode(ax, ay, 'A', '10.0V', '#38bdf8');
    drawNode(bx, by, 'B', VB.toFixed(2) + 'V', isBalanced ? '#34d399' : '#fbbf24');
    drawNode(ccx, ccy, 'C', '0.0V', '#38bdf8');
    drawNode(dx, dy, 'D', VD.toFixed(2) + 'V', isBalanced ? '#34d399' : '#fbbf24');
  }

  function handleSliderInput() {
    updateBridgePhysics();
  }

  function handleBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  function handleResetClick() {
    sliderR1.value = '10';
    sliderR2.value = '10';
    sliderR3.value = '10';
    sliderR4.value = '10';
    updateBridgePhysics();
  }

  function loop() {
    if (!isRunning) return;
    try {
      phase1 = (phase1 + Math.max(0.002, I1 * 0.008)) % 1;
      phase2 = (phase2 + Math.max(0.002, I2 * 0.008)) % 1;
      phase3 = (phase3 + Math.max(0.002, I3 * 0.008)) % 1;
      phase4 = (phase4 + Math.max(0.002, I4 * 0.008)) % 1;
      phaseBat = (phaseBat + Math.max(0.002, Itotal * 0.0045)) % 1;

      if (!isBalanced) {
        phaseG = (phaseG + Ig * 0.022) % 1;
      }

      // Smoothly animate Galvanometer needle deflection (-0.95 rad to +0.95 rad)
      targetNeedleAngle = Math.max(-0.95, Math.min(0.95, Ig * 1.8));
      needleAngle += (targetNeedleAngle - needleAngle) * 0.14;

      pulseTime += 0.016;
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  sliderR1.addEventListener('input', handleSliderInput);
  sliderR2.addEventListener('input', handleSliderInput);
  sliderR3.addEventListener('input', handleSliderInput);
  sliderR4.addEventListener('input', handleSliderInput);
  backBtn.addEventListener('click', handleBackClick);
  resetBtn.addEventListener('click', handleResetClick);

  window.addEventListener('resize', resize);
  updateBridgePhysics();
  resize();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    sliderR1.removeEventListener('input', handleSliderInput);
    sliderR2.removeEventListener('input', handleSliderInput);
    sliderR3.removeEventListener('input', handleSliderInput);
    sliderR4.removeEventListener('input', handleSliderInput);
    backBtn.removeEventListener('click', handleBackClick);
    resetBtn.removeEventListener('click', handleResetClick);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

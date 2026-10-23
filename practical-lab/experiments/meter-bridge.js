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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Meter Bridge</div>
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
            <span id="statusTitle" style="font-size:11px;font-weight:900;color:#34d399;letter-spacing:0.4px;text-transform:uppercase;">Bridge Balanced (Null Point)</span>
          </div>
          <div id="ratioReadout" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
            R/S = 0.50 &nbsp;=&nbsp; l/(100-l) = 0.50
          </div>
        </div>

        <!-- Sliders Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          
          <!-- R Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderR" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
                Unknown (R)
              </label>
              <span id="labelR" style="font-size:11px;font-weight:900;color:#38bdf8;">5.0 &Omega;</span>
            </div>
            <input id="sliderR" type="range" min="1" max="20" step="0.5" value="5" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>

          <!-- S Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderS" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#a855f7;box-shadow:0 0 6px #a855f7;"></span>
                Known (S)
              </label>
              <span id="labelS" style="font-size:11px;font-weight:900;color:#c084fc;">10.0 &Omega;</span>
            </div>
            <input id="sliderS" type="range" min="1" max="20" step="0.5" value="10" style="width:100%;accent-color:#a855f7;cursor:pointer;height:5px;" />
          </div>

          <!-- Jockey Slider -->
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="sliderJockey" style="font-size:11px;font-weight:800;color:#e2e8f0;display:flex;align-items:center;gap:5px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#fbbf24;box-shadow:0 0 6px #fbbf24;"></span>
                Jockey (l)
              </label>
              <span id="labelJockey" style="font-size:11px;font-weight:900;color:#fbbf24;">33.3 cm</span>
            </div>
            <input id="sliderJockey" type="range" min="0" max="100" step="0.5" value="33.3" style="width:100%;accent-color:#fbbf24;cursor:pointer;height:5px;" />
          </div>

        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const sliderR = wrap.querySelector('#sliderR');
  const sliderS = wrap.querySelector('#sliderS');
  const sliderJockey = wrap.querySelector('#sliderJockey');
  const labelR = wrap.querySelector('#labelR');
  const labelS = wrap.querySelector('#labelS');
  const labelJockey = wrap.querySelector('#labelJockey');
  
  const statusBanner = wrap.querySelector('#statusBanner');
  const statusDot = wrap.querySelector('#statusDot');
  const statusTitle = wrap.querySelector('#statusTitle');
  const ratioReadout = wrap.querySelector('#ratioReadout');
  
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  // --- VARIABLES (ALL DECLARED AT TOP) ---
  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  
  let R = 5, S = 10;
  let jockeyPos = 0.333; // 0 to 1
  
  let balanceRatio = 0;
  let isBalanced = false;
  let targetNeedleAngle = 0;
  let needleAngle = 0;
  
  // Animation Phases
  let phaseMain = 0;
  let phaseGalv = 0;
  let time = 0;

  let isCompact = false;
  let cx = 0, cy = 0, dRx = 0, dRy = 0;
  let ax = 0, ay = 0, bx = 0, by = 0, cxLeft = 0, cyLeft = 0, cxRight = 0, cyRight = 0;
  let jockeyX = 0, jockeyY = 0;
  let i = 0;

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
    R = parseFloat(sliderR.value);
    S = parseFloat(sliderS.value);
    jockeyPos = parseFloat(sliderJockey.value) / 100;

    labelR.innerHTML = R.toFixed(1) + ' &Omega;';
    labelS.innerHTML = S.toFixed(1) + ' &Omega;';
    labelJockey.innerHTML = (jockeyPos * 100).toFixed(1) + ' cm';

    // Balance condition: R/S = l/(100-l)
    // Therefore l = 100 * R / (R+S)
    let balanceL = R / (R + S);
    balanceRatio = R / S;
    
    let currentRatio = jockeyPos / (1 - jockeyPos);
    let diff = Math.abs(balanceRatio - currentRatio);
    
    isBalanced = diff < 0.02;

    if (isBalanced) {
      statusBanner.style.background = 'rgba(52,211,153,0.12)';
      statusBanner.style.borderColor = 'rgba(52,211,153,0.4)';
      statusDot.style.background = '#34d399';
      statusDot.style.boxShadow = '0 0 10px #34d399';
      statusTitle.style.color = '#34d399';
      statusTitle.textContent = 'Bridge Balanced (Null Point)';
      ratioReadout.innerHTML = 'R/S = ' + balanceRatio.toFixed(2) + ' &nbsp;=&nbsp; l/(100-l) = ' + currentRatio.toFixed(2);
      targetNeedleAngle = 0;
    } else {
      statusBanner.style.background = 'rgba(251,191,36,0.1)';
      statusBanner.style.borderColor = 'rgba(251,191,36,0.38)';
      statusDot.style.background = '#fbbf24';
      statusDot.style.boxShadow = '0 0 10px #fbbf24';
      statusTitle.style.color = '#fbbf24';
      statusTitle.textContent = (currentRatio > balanceRatio) ? 'Unbalanced (Deflect Right)' : 'Unbalanced (Deflect Left)';
      ratioReadout.innerHTML = 'R/S = ' + balanceRatio.toFixed(2) + ' &nbsp;&ne;&nbsp; l/(100-l) = ' + currentRatio.toFixed(2);
      
      // Max deflection angle +/- 0.9 rad
      let defl = (currentRatio - balanceRatio) * 2;
      targetNeedleAngle = Math.max(-0.9, Math.min(0.9, defl));
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
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.55, '#090f1d');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
    ctx.lineWidth = 1;
    for (i = 0; i < W; i += 28) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (i = 0; i < H; i += 28) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }
    ctx.restore();
  }

  function drawOverlays() {
    isCompact = W < 560 || H < 380;
    let fCardX = isCompact ? 10 : 16;
    let fCardY = isCompact ? 8 : 12;
    let fCardW = isCompact ? Math.min(218, W * 0.52) : 256;
    let fCardH = isCompact ? 68 : 82;

    // Left Card
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.4)';
    ctx.stroke();

    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24'; ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('METRE BRIDGE BALANCE', fCardX + 18, fCardY + (isCompact ? 17 : 20));

    ctx.font = (isCompact ? '900 12px' : '900 14px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('R/S = l / (100-l)', fCardX + 18, fCardY + (isCompact ? 36 : 43));

    ctx.font = (isCompact ? '700 9.5px' : '700 11px') + ' system-ui, sans-serif';
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24';
    ctx.fillText('Jockey at ' + (jockeyPos * 100).toFixed(1) + ' cm', fCardX + 18, fCardY + (isCompact ? 54 : 65));
    ctx.restore();

    // Right Card
    let gCardW = isCompact ? Math.min(168, W - fCardW - 28) : 210;
    if (gCardW >= 120) {
      let gCardH = fCardH;
      let gCardX = W - gCardW - (isCompact ? 10 : 16);
      let gCardY = fCardY;

      ctx.save();
      drawRoundedRect(gCardX, gCardY, gCardW, gCardH, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.4)' : 'rgba(244, 63, 94, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = (isCompact ? '700 8.5px' : '700 9.5px') + ' system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('GALVANOMETER (G)', gCardX + 12, gCardY + (isCompact ? 17 : 20));

      ctx.font = (isCompact ? '900 12px' : '900 14px') + ' system-ui, sans-serif';
      ctx.fillStyle = isBalanced ? '#34d399' : '#fb7185';
      ctx.fillText(isBalanced ? 'Null Point' : 'Deflecting', gCardX + 12, gCardY + (isCompact ? 36 : 43));

      ctx.font = (isCompact ? '700 9.5px' : '700 11px') + ' system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('l = ' + (jockeyPos * 100).toFixed(1) + ' cm', gCardX + 12, gCardY + (isCompact ? 54 : 65));
      ctx.restore();
    }
  }

  function drawMeterBridge() {
    isCompact = W < 560 || H < 380;
    const topClearance = isCompact ? 85 : 100;
    const bottomSpace = isCompact ? 60 : 70;
    const availH = Math.max(140, H - topClearance - bottomSpace);

    cx = W * 0.5;
    cy = topClearance + availH * 0.4;
    
    dRx = Math.min(200, Math.max(100, W * 0.3));
    dRy = Math.min(100, Math.max(50, availH * 0.4));

    // Top Left Node (A), Top Right Node (B)
    ax = cx - dRx; ay = cy;
    bx = cx + dRx; by = cy;

    // Bottom Left Node (C), Bottom Right Node (D)
    cxLeft = cx - dRx; cyLeft = cy + dRy;
    cxRight = cx + dRx; cyRight = cy + dRy;

    // Draw Bottom Wire (1 meter wire)
    ctx.save();
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)'; ctx.lineWidth = isCompact ? 6 : 7;
    ctx.beginPath(); ctx.moveTo(cxLeft, cyLeft); ctx.lineTo(cxRight, cyRight); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = isCompact ? 3 : 4;
    ctx.beginPath(); ctx.moveTo(cxLeft, cyLeft); ctx.lineTo(cxRight, cyRight); ctx.stroke();
    ctx.restore();

    // Draw Scale (0 to 100)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = (isCompact ? '800 8px' : '800 10px') + ' system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (i = 0; i <= 10; i++) {
      let tickX = cxLeft + (cxRight - cxLeft) * (i / 10);
      ctx.fillRect(tickX - 0.5, cyLeft + 8, 1, 4);
      if (i % 2 === 0) ctx.fillText((i * 10).toString(), tickX, cyLeft + 14);
    }

    // Draw Top Wires & Resistors
    let midX = cx;
    let midY = ay;

    // Wire A to Mid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; ctx.lineWidth = isCompact ? 4 : 5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(midX, midY); ctx.stroke();
    // Wire Mid to B
    ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(bx, by); ctx.stroke();

    // Resistor R (Left gap)
    ctx.save();
    ctx.translate(ax + (midX - ax) * 0.5, ay);
    drawRoundedRect(-30, -10, 60, 20, 6);
    ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.font = '900 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('R', 0, 0);
    ctx.restore();

    // Resistor S (Right gap)
    ctx.save();
    ctx.translate(midX + (bx - midX) * 0.5, ay);
    drawRoundedRect(-30, -10, 60, 20, 6);
    ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fill();
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#a855f7'; ctx.font = '900 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('S', 0, 0);
    ctx.restore();

    // Draw Battery Loop (C to D)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; ctx.lineWidth = isCompact ? 4 : 5;
    ctx.beginPath(); ctx.moveTo(cxLeft, cyLeft); ctx.lineTo(cxLeft, cyLeft + 35); ctx.lineTo(cxRight, cyRight + 35); ctx.lineTo(cxRight, cyRight); ctx.stroke();
    
    // Battery Symbol
    ctx.save();
    ctx.translate(cx, cyLeft + 35);
    drawRoundedRect(-25, -12, 50, 24, 6);
    ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fill();
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.stroke();
    // Plates
    ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-5, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(5, 4); ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = '900 9px sans-serif'; ctx.fillText('E', 0, -18);
    ctx.restore();

    // Jockey Position
    jockeyX = cxLeft + (cxRight - cxLeft) * jockeyPos;
    jockeyY = cyLeft;

    // Galvanometer Branch (Mid top to Jockey)
    ctx.save();
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = isCompact ? 4 : 5;
    ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(jockeyX, jockeyY); ctx.stroke();
    
    // Jockey triangle
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(jockeyX, jockeyY - 15);
    ctx.lineTo(jockeyX - 8, jockeyY - 28);
    ctx.lineTo(jockeyX + 8, jockeyY - 28);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Galvanometer Dial (placed on the wire between mid and jockey)
    let gx = midX + (jockeyX - midX) * 0.5;
    let gy = midY + (jockeyY - midY) * 0.5;
    let gr = isCompact ? 20 : 25;

    ctx.save();
    ctx.translate(gx, gy);
    ctx.beginPath(); ctx.arc(0, 0, gr, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; ctx.fill();
    ctx.strokeStyle = isBalanced ? '#34d399' : '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
    
    // Needle
    ctx.rotate(needleAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -gr + 5);
    ctx.strokeStyle = isBalanced ? '#34d399' : '#fb7185'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Animate moving particles
    const moveSpeed = 0.02;
    const numParticles = 10;
    for (i = 0; i < numParticles; i++) {
      let p = (i / numParticles + phaseMain) % 1;
      // Battery loop particles (Left to Right)
      if (p < 0.4) {
        let px = cxLeft + (cxRight - cxLeft) * (p / 0.4);
        let py = cyLeft + 35;
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fillStyle = '#38bdf8'; ctx.fill();
      }
      // Wire A to C (Left side)
      else if (p < 0.5) {
        let py = cy + (cyLeft - cy) * ((p-0.4)/0.1);
        ctx.beginPath(); ctx.arc(cxLeft, py, 2, 0, Math.PI*2); ctx.fillStyle = '#38bdf8'; ctx.fill();
      }
    }
  }

  function loop() {
    if (!isRunning) return;
    try {
      time += 0.016;
      phaseMain = (phaseMain + 0.01) % 1;
      
      // Smooth needle animation
      needleAngle += (targetNeedleAngle - needleAngle) * 0.1;

      drawBackground();
      drawOverlays();
      drawMeterBridge();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  sliderR.addEventListener('input', updatePhysics);
  sliderS.addEventListener('input', updatePhysics);
  sliderJockey.addEventListener('input', updatePhysics);

  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => {
    sliderR.value = 5; sliderS.value = 10; sliderJockey.value = 33.3;
    updatePhysics();
  });

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
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
                     }

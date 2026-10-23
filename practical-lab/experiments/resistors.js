export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Declare ALL let variables at the TOP of mount() to prevent Temporal Dead Zone (TDZ) / ReferenceError
  let W = 0, H = 0;
  let animId = null;
  let isRunning = true;
  let phase = 0;
  let branchPhase1 = 0;
  let branchPhase2 = 0;
  let branchPhase3 = 0;

  let isSeries = true;
  let isSwitchClosed = true;
  let R1 = 5, R2 = 10, R3 = 15;
  let V_total = 12; // Volts
  let switchHitbox = { x: 0, y: 0, r: 32 };

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
      <div style="flex:1;text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Series &amp; Parallel Resistors</div>
      </div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;background:rgba(3,7,18,0.7);padding:4px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);flex:1;min-width:200px;">
            <button type="button" class="mode-series-btn" style="flex:1;padding:8px 12px;border-radius:9px;border:none;font-size:11px;font-weight:800;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s;">
              SERIES
            </button>
            <button type="button" class="mode-parallel-btn" style="flex:1;padding:8px 12px;border-radius:9px;border:none;font-size:11px;font-weight:800;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s;">
              PARALLEL
            </button>
          </div>
          <button type="button" class="switch-toggle-btn" style="padding:8px 14px;border-radius:12px;border:1px solid rgba(52,211,153,0.45);background:rgba(16,185,129,0.16);color:#34d399;font-size:11px;font-weight:800;letter-spacing:0.04em;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:7px;">
            <span class="switch-dot" style="width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;display:inline-block;"></span>
            <span class="switch-label">SWITCH: CLOSED</span>
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:800;color:#38bdf8;">Resistor 1 (R1)</span>
              <span class="val-r1" style="font-size:12px;font-weight:900;color:#f8fafc;background:rgba(56,189,248,0.18);padding:2px 8px;border-radius:6px;border:1px solid rgba(56,189,248,0.35);">5 &Omega;</span>
            </div>
            <input type="range" class="slider-r1" min="1" max="20" step="1" value="5" style="width:100%;accent-color:#38bdf8;cursor:pointer;" />
            <div class="meta-r1" style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:4px;font-weight:600;">
              <span>V1: 2.00 V</span>
              <span>I1: 0.40 A</span>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(192,132,252,0.3);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:800;color:#c084fc;">Resistor 2 (R2)</span>
              <span class="val-r2" style="font-size:12px;font-weight:900;color:#f8fafc;background:rgba(192,132,252,0.18);padding:2px 8px;border-radius:6px;border:1px solid rgba(192,132,252,0.35);">10 &Omega;</span>
            </div>
            <input type="range" class="slider-r2" min="1" max="20" step="1" value="10" style="width:100%;accent-color:#c084fc;cursor:pointer;" />
            <div class="meta-r2" style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:4px;font-weight:600;">
              <span>V2: 4.00 V</span>
              <span>I2: 0.40 A</span>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(52,211,153,0.3);border-radius:12px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:800;color:#34d399;">Resistor 3 (R3)</span>
              <span class="val-r3" style="font-size:12px;font-weight:900;color:#f8fafc;background:rgba(52,211,153,0.18);padding:2px 8px;border-radius:6px;border:1px solid rgba(52,211,153,0.35);">15 &Omega;</span>
            </div>
            <input type="range" class="slider-r3" min="1" max="20" step="1" value="15" style="width:100%;accent-color:#34d399;cursor:pointer;" />
            <div class="meta-r3" style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:4px;font-weight:600;">
              <span>V3: 6.00 V</span>
              <span>I3: 0.40 A</span>
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

  const btnSeries = wrap.querySelector('.mode-series-btn');
  const btnParallel = wrap.querySelector('.mode-parallel-btn');
  const btnSwitch = wrap.querySelector('.switch-toggle-btn');
  const sliderR1 = wrap.querySelector('.slider-r1');
  const sliderR2 = wrap.querySelector('.slider-r2');
  const sliderR3 = wrap.querySelector('.slider-r3');
  const valR1 = wrap.querySelector('.val-r1');
  const valR2 = wrap.querySelector('.val-r2');
  const valR3 = wrap.querySelector('.val-r3');
  const metaR1 = wrap.querySelector('.meta-r1');
  const metaR2 = wrap.querySelector('.meta-r2');
  const metaR3 = wrap.querySelector('.meta-r3');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

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

  function calculateCircuit() {
    const req = isSeries
      ? (R1 + R2 + R3)
      : (1 / ((1 / R1) + (1 / R2) + (1 / R3)));
    const iTotal = isSwitchClosed ? (V_total / req) : 0;
    const i1 = isSwitchClosed ? (isSeries ? iTotal : (V_total / R1)) : 0;
    const i2 = isSwitchClosed ? (isSeries ? iTotal : (V_total / R2)) : 0;
    const i3 = isSwitchClosed ? (isSeries ? iTotal : (V_total / R3)) : 0;
    const v1 = isSwitchClosed ? (isSeries ? i1 * R1 : V_total) : 0;
    const v2 = isSwitchClosed ? (isSeries ? i2 * R2 : V_total) : 0;
    const v3 = isSwitchClosed ? (isSeries ? i3 * R3 : V_total) : 0;
    return { req, iTotal, i1, i2, i3, v1, v2, v3 };
  }

  function syncControls() {
    const c = calculateCircuit();

    if (isSeries) {
      btnSeries.style.background = 'linear-gradient(135deg, #0ea5e9, #6366f1)';
      btnSeries.style.color = '#ffffff';
      btnSeries.style.boxShadow = '0 0 16px rgba(14,165,233,0.45)';
      btnParallel.style.background = 'transparent';
      btnParallel.style.color = '#94a3b8';
      btnParallel.style.boxShadow = 'none';
    } else {
      btnParallel.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
      btnParallel.style.color = '#ffffff';
      btnParallel.style.boxShadow = '0 0 16px rgba(168,85,247,0.45)';
      btnSeries.style.background = 'transparent';
      btnSeries.style.color = '#94a3b8';
      btnSeries.style.boxShadow = 'none';
    }

    const dot = btnSwitch.querySelector('.switch-dot');
    const lbl = btnSwitch.querySelector('.switch-label');
    if (isSwitchClosed) {
      btnSwitch.style.borderColor = 'rgba(52,211,153,0.45)';
      btnSwitch.style.background = 'rgba(16,185,129,0.16)';
      btnSwitch.style.color = '#34d399';
      dot.style.background = '#34d399';
      dot.style.boxShadow = '0 0 8px #34d399';
      lbl.textContent = 'SWITCH: CLOSED';
    } else {
      btnSwitch.style.borderColor = 'rgba(248,113,113,0.45)';
      btnSwitch.style.background = 'rgba(239,68,68,0.15)';
      btnSwitch.style.color = '#f87171';
      dot.style.background = '#f87171';
      dot.style.boxShadow = '0 0 8px #f87171';
      lbl.textContent = 'SWITCH: OPEN';
    }

    valR1.innerHTML = R1 + ' &Omega;';
    valR2.innerHTML = R2 + ' &Omega;';
    valR3.innerHTML = R3 + ' &Omega;';

    metaR1.innerHTML = '<span>V1: ' + c.v1.toFixed(2) + ' V</span><span>I1: ' + c.i1.toFixed(2) + ' A</span>';
    metaR2.innerHTML = '<span>V2: ' + c.v2.toFixed(2) + ' V</span><span>I2: ' + c.i2.toFixed(2) + ' A</span>';
    metaR3.innerHTML = '<span>V3: ' + c.v3.toFixed(2) + ' V</span><span>I3: ' + c.i3.toFixed(2) + ' A</span>';
  }

  function fillRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();
  }

  function drawBackground() {
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.55, 10, W * 0.5, H * 0.55, Math.max(W, H) * 0.65);
    glow.addColorStop(0, isSeries ? 'rgba(14, 165, 233, 0.12)' : 'rgba(168, 85, 247, 0.12)');
    glow.addColorStop(1, 'rgba(11, 18, 32, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 1;
    const grid = 28;
    ctx.beginPath();
    for (let x = 0; x < W; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
  }

  function drawLiveOverlay(c) {
    ctx.save();
    const padX = 12;
    const padY = 10;
    const isNarrow = W < 540;
    const hudW = Math.min(W - padX * 2, 680);
    const hudH = isNarrow ? 56 : 50;
    const hudX = (W - hudW) * 0.5;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    ctx.strokeStyle = isSeries ? 'rgba(56, 189, 248, 0.4)' : 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = isSeries ? 'rgba(56, 189, 248, 0.25)' : 'rgba(192, 132, 252, 0.25)';
    ctx.shadowBlur = 14;
    fillRoundRect(hudX, padY, hudW, hudH, 12);
    ctx.shadowBlur = 0;

    const colW = hudW / 4;
    const cy = padY + hudH * 0.5;

    // Metric 1: Battery Voltage
    ctx.textAlign = 'center';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('BATTERY (V)', hudX + colW * 0.5, cy - 5);
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText(V_total.toFixed(1) + ' V', hudX + colW * 0.5, cy + 12);

    // Metric 2: Total Equivalent Resistance (Req)
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('EQUIVALENT (Req)', hudX + colW * 1.5, cy - 5);
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(c.req.toFixed(2) + ' \u03A9', hudX + colW * 1.5, cy + 12);

    // Metric 3: Total Current (I = V/Req)
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL CURRENT (I)', hudX + colW * 2.5, cy - 5);
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(c.iTotal.toFixed(2) + ' A', hudX + colW * 2.5, cy + 12);

    // Metric 4: Active Formula
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(isSeries ? 'SERIES FORMULA' : 'PARALLEL FORMULA', hudX + colW * 3.5, cy - 5);
    ctx.font = '800 10px system-ui, sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.fillText(isSeries ? 'Req = R1+R2+R3' : '1/Req = 1/R1+1/R2+1/R3', hudX + colW * 3.5, cy + 12);

    // Subtle dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(hudX + colW * i, padY + 9);
      ctx.lineTo(hudX + colW * i, padY + hudH - 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWireSegment(x1, y1, x2, y2, glowColor) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isSwitchClosed) {
      ctx.strokeStyle = glowColor || 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = isSwitchClosed ? '#334155' : '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = isSwitchClosed ? '#94a3b8' : '#475569';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawResistorSymbol(cx, cy, halfW, name, rVal, vVal, iVal, color, compact) {
    const leftX = cx - halfW;
    const rightX = cx + halfW;
    const boxH = compact ? 26 : 32;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = color;
    ctx.shadowBlur = isSwitchClosed ? 12 : 4;
    fillRoundRect(leftX - 4, cy - boxH * 0.5, halfW * 2 + 8, boxH, 8);

    const peaks = 6;
    const step = (halfW * 2) / peaks;
    const amp = compact ? 6.5 : 8.5;

    ctx.beginPath();
    ctx.moveTo(leftX, cy);
    for (let i = 0; i < peaks; i++) {
      ctx.lineTo(leftX + (i + 0.25) * step, cy - amp);
      ctx.lineTo(leftX + (i + 0.75) * step, cy + amp);
      ctx.lineTo(leftX + (i + 1) * step, cy);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(leftX, cy, 3, 0, Math.PI * 2);
    ctx.arc(rightX, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = (compact ? '800 10px' : '800 11px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(name + ' = ' + rVal + ' \u03A9', cx, cy - boxH * 0.5 - 5);

    ctx.font = (compact ? '700 9px' : '700 10px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const readout = isSeries
      ? ('V = ' + vVal.toFixed(1) + 'V | I = ' + iVal.toFixed(2) + 'A')
      : ('I = ' + iVal.toFixed(2) + 'A | V = ' + vVal.toFixed(0) + 'V');
    ctx.fillText(readout, cx, cy + boxH * 0.5 + (compact ? 11 : 13));
    ctx.restore();
  }

  function drawBatterySymbol(cx, cy) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
    ctx.lineWidth = 1.5;
    fillRoundRect(cx - 34, cy - 22, 68, 44, 10);

    const gap = 9;
    // Long positive plates
    ctx.strokeStyle = '#f87171';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - gap * 1.5, cy - 14);
    ctx.lineTo(cx - gap * 1.5, cy + 14);
    ctx.moveTo(cx + gap * 0.5, cy - 14);
    ctx.lineTo(cx + gap * 0.5, cy + 14);
    ctx.stroke();

    // Short thick negative plates
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - gap * 0.5, cy - 8);
    ctx.lineTo(cx - gap * 0.5, cy + 8);
    ctx.moveTo(cx + gap * 1.5, cy - 8);
    ctx.lineTo(cx + gap * 1.5, cy + 8);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.fillText('+', cx - 24, cy - 7);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('\u2212', cx + 24, cy - 7);

    ctx.font = '800 10.5px system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('12V Battery', cx, cy + 34);
    ctx.restore();
  }

  function drawSwitchSymbol(cx, cy) {
    switchHitbox = { x: cx, y: cy, r: 34 };
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = isSwitchClosed ? 'rgba(52, 211, 153, 0.45)' : 'rgba(248, 113, 113, 0.45)';
    ctx.lineWidth = 1.5;
    fillRoundRect(cx - 34, cy - 22, 68, 44, 10);

    const lx = cx - 20;
    const rx = cx + 20;

    ctx.strokeStyle = isSwitchClosed ? '#34d399' : '#f87171';
    ctx.shadowColor = isSwitchClosed ? '#34d399' : '#f87171';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx, cy);
    if (isSwitchClosed) {
      ctx.lineTo(rx, cy);
    } else {
      ctx.lineTo(rx - 4, cy - 13);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(lx, cy, 3.8, 0, Math.PI * 2);
    ctx.arc(rx, cy, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 10.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSwitchClosed ? '#34d399' : '#f87171';
    ctx.fillText(isSwitchClosed ? 'Switch (Closed)' : 'Switch (Open)', cx, cy + 34);
    ctx.restore();
  }

  function drawElectronsOnPath(segments, currentPhase, spacing) {
    if (!isSwitchClosed) return;

    let totalLen = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      seg.len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
      totalLen += seg.len;
    }
    if (totalLen < 10) return;

    const numDots = Math.max(6, Math.floor(totalLen / spacing));
    const stepDist = totalLen / numDots;

    ctx.save();
    for (let k = 0; k < numDots; k++) {
      let d = (k * stepDist + (currentPhase % stepDist) + stepDist) % totalLen;
      let px = segments[0].x1;
      let py = segments[0].y1;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (d <= seg.len || i === segments.length - 1) {
          const t = seg.len > 0 ? (d / seg.len) : 0;
          px = seg.x1 + (seg.x2 - seg.x1) * t;
          py = seg.y1 + (seg.y2 - seg.y1) * t;
          break;
        }
        d -= seg.len;
      }

      // Outer glowing halo
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.26)';
      ctx.fill();

      // Bright yellow electron dot
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fill();

      // White-yellow hot core
      ctx.beginPath();
      ctx.arc(px, py, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#fef9c3';
      ctx.shadowBlur = 0;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNode(x, y) {
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    drawBackground();
    const c = calculateCircuit();
    drawLiveOverlay(c);

    const topOffset = W < 540 ? 78 : 72;
    const bottomPad = 42;
    const availH = Math.max(155, H - topOffset - bottomPad);
    const availW = Math.max(260, W - 44);

    const loopW = Math.min(availW, 640);
    const leftX = (W - loopW) * 0.5;
    const rightX = leftX + loopW;
    const bottomY = topOffset + availH;

    const batX = leftX + loopW * 0.30;
    const swX = leftX + loopW * 0.70;

    if (isSeries) {
      const topY = topOffset + Math.max(28, availH * 0.22);
      const resHalfW = Math.min(44, loopW * 0.105);

      const r1X = leftX + loopW * 0.20;
      const r2X = leftX + loopW * 0.50;
      const r3X = leftX + loopW * 0.80;

      // Series circuit loop wires
      drawWireSegment(leftX, bottomY, leftX, topY, 'rgba(56, 189, 248, 0.25)');
      drawWireSegment(leftX, topY, rightX, topY, 'rgba(56, 189, 248, 0.25)');
      drawWireSegment(rightX, topY, rightX, bottomY, 'rgba(56, 189, 248, 0.25)');
      drawWireSegment(rightX, bottomY, leftX, bottomY, 'rgba(56, 189, 248, 0.25)');

      // Moving yellow electrons along series path
      const seriesPath = [
        { x1: batX - 34, y1: bottomY, x2: leftX, y2: bottomY },
        { x1: leftX, y1: bottomY, x2: leftX, y2: topY },
        { x1: leftX, y1: topY, x2: rightX, y2: topY },
        { x1: rightX, y1: topY, x2: rightX, y2: bottomY },
        { x1: rightX, y1: bottomY, x2: swX + 34, y2: bottomY },
        { x1: swX - 34, y1: bottomY, x2: batX + 34, y2: bottomY }
      ];
      drawElectronsOnPath(seriesPath, phase, 32);

      // 3 Resistors end-to-end
      drawResistorSymbol(r1X, topY, resHalfW, 'R1', R1, c.v1, c.i1, '#38bdf8', false);
      drawResistorSymbol(r2X, topY, resHalfW, 'R2', R2, c.v2, c.i2, '#c084fc', false);
      drawResistorSymbol(r3X, topY, resHalfW, 'R3', R3, c.v3, c.i3, '#34d399', false);

      drawBatterySymbol(batX, bottomY);
      drawSwitchSymbol(swX, bottomY);
    } else {
      // Parallel branches layout
      const y1 = topOffset + availH * 0.14;
      const y2 = topOffset + availH * 0.41;
      const y3 = topOffset + availH * 0.68;
      const splitLeftX = leftX + loopW * 0.16;
      const splitRightX = rightX - loopW * 0.16;
      const midX = (leftX + rightX) * 0.5;
      const resHalfW = Math.min(50, (splitRightX - splitLeftX) * 0.25);

      // Main trunk wires
      drawWireSegment(leftX, bottomY, leftX, y2, 'rgba(192, 132, 252, 0.25)');
      drawWireSegment(leftX, y2, splitLeftX, y2, 'rgba(192, 132, 252, 0.25)');
      drawWireSegment(splitRightX, y2, rightX, y2, 'rgba(192, 132, 252, 0.25)');
      drawWireSegment(rightX, y2, rightX, bottomY, 'rgba(192, 132, 252, 0.25)');
      drawWireSegment(rightX, bottomY, leftX, bottomY, 'rgba(192, 132, 252, 0.25)');

      // Parallel rails & 3 branches
      drawWireSegment(splitLeftX, y1, splitLeftX, y3, 'rgba(56, 189, 248, 0.22)');
      drawWireSegment(splitRightX, y1, splitRightX, y3, 'rgba(56, 189, 248, 0.22)');
      drawWireSegment(splitLeftX, y1, splitRightX, y1, 'rgba(56, 189, 248, 0.24)');
      drawWireSegment(splitLeftX, y2, splitRightX, y2, 'rgba(192, 132, 252, 0.24)');
      drawWireSegment(splitLeftX, y3, splitRightX, y3, 'rgba(52, 211, 153, 0.24)');

      // Main trunk electrons (speed proportional to total current I)
      const trunkLeft = [
        { x1: batX - 34, y1: bottomY, x2: leftX, y2: bottomY },
        { x1: leftX, y1: bottomY, x2: leftX, y2: y2 },
        { x1: leftX, y1: y2, x2: splitLeftX, y2: y2 }
      ];
      const trunkRight = [
        { x1: splitRightX, y1: y2, x2: rightX, y2: y2 },
        { x1: rightX, y1: y2, x2: rightX, y2: bottomY },
        { x1: rightX, y1: bottomY, x2: swX + 34, y2: bottomY },
        { x1: swX - 34, y1: bottomY, x2: batX + 34, y2: bottomY }
      ];
      drawElectronsOnPath(trunkLeft, phase, 28);
      drawElectronsOnPath(trunkRight, phase, 28);

      // Branch electrons
      const b1 = [
        { x1: splitLeftX, y1: y2, x2: splitLeftX, y2: y1 },
        { x1: splitLeftX, y1: y1, x2: splitRightX, y2: y1 },
        { x1: splitRightX, y1: y1, x2: splitRightX, y2: y2 }
      ];
      const b2 = [
        { x1: splitLeftX, y1: y2, x2: splitRightX, y2: y2 }
      ];
      const b3 = [
        { x1: splitLeftX, y1: y2, x2: splitLeftX, y2: y3 },
        { x1: splitLeftX, y1: y3, x2: splitRightX, y2: y3 },
        { x1: splitRightX, y1: y3, x2: splitRightX, y2: y2 }
      ];
      drawElectronsOnPath(b1, branchPhase1, 34);
      drawElectronsOnPath(b2, branchPhase2, 34);
      drawElectronsOnPath(b3, branchPhase3, 34);

      drawNode(splitLeftX, y2);
      drawNode(splitRightX, y2);

      const compact = availH < 245;
      drawResistorSymbol(midX, y1, resHalfW, 'R1', R1, c.v1, c.i1, '#38bdf8', compact);
      drawResistorSymbol(midX, y2, resHalfW, 'R2', R2, c.v2, c.i2, '#c084fc', compact);
      drawResistorSymbol(midX, y3, resHalfW, 'R3', R3, c.v3, c.i3, '#34d399', compact);

      drawBatterySymbol(batX, bottomY);
      drawSwitchSymbol(swX, bottomY);
    }
  }

  function loop() {
    if (!isRunning) return;
    try {
      const c = calculateCircuit();
      if (isSwitchClosed) {
        const speedFactor = 1.65;
        phase += Math.min(14, c.iTotal * speedFactor);
        branchPhase1 += Math.min(12, c.i1 * speedFactor);
        branchPhase2 += Math.min(12, c.i2 * speedFactor);
        branchPhase3 += Math.min(12, c.i3 * speedFactor);
      }
      draw();
    } catch (e) {
      console.error(e);
    }
    animId = requestAnimationFrame(loop);
  }

  function onSeriesClick() {
    isSeries = true;
    syncControls();
  }

  function onParallelClick() {
    isSeries = false;
    syncControls();
  }

  function onSwitchClick() {
    isSwitchClosed = !isSwitchClosed;
    syncControls();
  }

  function onSliderInput() {
    R1 = Number(sliderR1.value) || 5;
    R2 = Number(sliderR2.value) || 10;
    R3 = Number(sliderR3.value) || 15;
    syncControls();
  }

  function onResetClick() {
    isSeries = true;
    isSwitchClosed = true;
    R1 = 5;
    R2 = 10;
    R3 = 15;
    sliderR1.value = '5';
    sliderR2.value = '10';
    sliderR3.value = '15';
    syncControls();
  }

  function onCanvasPointerDown(e) {
    const fallbackW = canvasHost.clientWidth || window.innerWidth || 320;
    const fallbackH = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5) || 400;
    const px = typeof e.offsetX === 'number' ? e.offsetX : fallbackW * 0.5;
    const py = typeof e.offsetY === 'number' ? e.offsetY : fallbackH * 0.5;
    if (Math.hypot(px - switchHitbox.x, py - switchHitbox.y) <= switchHitbox.r) {
      isSwitchClosed = !isSwitchClosed;
      syncControls();
    }
  }

  function onBackClick() {
    if (typeof window.goBack === 'function') window.goBack();
  }

  btnSeries.addEventListener('click', onSeriesClick);
  btnParallel.addEventListener('click', onParallelClick);
  btnSwitch.addEventListener('click', onSwitchClick);
  sliderR1.addEventListener('input', onSliderInput);
  sliderR2.addEventListener('input', onSliderInput);
  sliderR3.addEventListener('input', onSliderInput);
  resetBtn.addEventListener('click', onResetClick);
  canvas.addEventListener('pointerdown', onCanvasPointerDown);
  backBtn.addEventListener('click', onBackClick);

  window.addEventListener('resize', resize);
  resize();
  syncControls();
  requestAnimationFrame(() => resize());
  setTimeout(() => resize(), 100);

  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    btnSeries.removeEventListener('click', onSeriesClick);
    btnParallel.removeEventListener('click', onParallelClick);
    btnSwitch.removeEventListener('click', onSwitchClick);
    sliderR1.removeEventListener('input', onSliderInput);
    sliderR2.removeEventListener('input', onSliderInput);
    sliderR3.removeEventListener('input', onSliderInput);
    resetBtn.removeEventListener('click', onResetClick);
    canvas.removeEventListener('pointerdown', onCanvasPointerDown);
    backBtn.removeEventListener('click', onBackClick);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

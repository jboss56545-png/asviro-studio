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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Potentiometer</div>
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
        <div id="statusBanner" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.38);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="statusDot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#fbbf24;box-shadow:0 0 10px #fbbf24;"></span>
            <span id="statusTitle" style="font-size:11px;font-weight:900;color:#fbbf24;letter-spacing:0.4px;text-transform:uppercase;">Searching for Null Point...</span>
          </div>
          <div id="ratioReadout" style="font-size:12px;font-weight:800;color:#f1f5f9;font-family:monospace;">
            Galvanometer: Deflecting
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="jockeySlider" style="font-size:11px;font-weight:800;color:#e2e8f0;">Jockey Pos (l)</label>
              <span id="jockeyVal" style="font-size:11px;font-weight:900;color:#38bdf8;">50.0 cm</span>
            </div>
            <input id="jockeySlider" type="range" min="0" max="100" step="0.5" value="50" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label for="emfSlider" style="font-size:11px;font-weight:800;color:#e2e8f0;">Test EMF (E1)</label>
              <span id="emfVal" style="font-size:11px;font-weight:900;color:#a855f7;">2.0 V</span>
            </div>
            <input id="emfSlider" type="range" min="1" max="5" step="0.1" value="2" style="width:100%;accent-color:#a855f7;cursor:pointer;height:5px;" />
          </div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const jockeySlider = wrap.querySelector('#jockeySlider');
  const emfSlider = wrap.querySelector('#emfSlider');
  const jockeyVal = wrap.querySelector('#jockeyVal');
  const emfVal = wrap.querySelector('#emfVal');
  const statusBanner = wrap.querySelector('#statusBanner');
  const statusDot = wrap.querySelector('#statusDot');
  const statusTitle = wrap.querySelector('#statusTitle');
  const ratioReadout = wrap.querySelector('#ratioReadout');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let jockeyPos = 0.5, E1 = 2.0, E_driver = 5.0;
  let isBalanced = false;
  let targetNeedleAngle = 0, needleAngle = 0;
  
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
    jockeyPos = parseFloat(jockeySlider.value) / 100;
    E1 = parseFloat(emfSlider.value);

    jockeyVal.textContent = (jockeyPos * 100).toFixed(1) + ' cm';
    emfVal.textContent = E1.toFixed(1) + ' V';

    // Potential gradient k = E_driver / 100 (assuming wire is 100cm)
    let k = E_driver / 1.0; // V/m
    let V_measured = k * jockeyPos; // Potential at jockey

    let diff = V_measured - E1;
    isBalanced = Math.abs(diff) < 0.05;

    if (isBalanced) {
      statusBanner.style.background = 'rgba(52,211,153,0.12)';
      statusBanner.style.borderColor = 'rgba(52,211,153,0.4)';
      statusDot.style.background = '#34d399'; statusDot.style.boxShadow = '0 0 10px #34d399';
      statusTitle.style.color = '#34d399'; statusTitle.textContent = 'Null Point Found! (Balanced)';
      ratioReadout.innerHTML = 'E1 = k·l  =>  ' + E1.toFixed(2) + 'V = ' + V_measured.toFixed(2) + 'V';
      targetNeedleAngle = 0;
    } else {
      statusBanner.style.background = 'rgba(251,191,36,0.1)';
      statusBanner.style.borderColor = 'rgba(251,191,36,0.38)';
      statusDot.style.background = '#fbbf24'; statusDot.style.boxShadow = '0 0 10px #fbbf24';
      statusTitle.style.color = '#fbbf24'; statusTitle.textContent = 'Unbalanced (Deflecting)';
      ratioReadout.innerHTML = 'E1 ≠ k·l  (Deflect ' + (diff > 0 ? 'Left' : 'Right') + ')';
      targetNeedleAngle = Math.max(-0.8, Math.min(0.8, -diff * 0.5));
    }
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

    const wireY = H * 0.7;
    const wireX1 = W * 0.15, wireX2 = W * 0.85;
    
    // Draw Main Wire
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillRect(wireX1, wireY - 3, wireX2 - wireX1, 6);
    
    // Draw Scale ticks
    ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
        let x = wireX1 + (wireX2 - wireX1) * (i/10);
        ctx.fillRect(x-1, wireY + 5, 2, 5);
        ctx.fillText((i*10).toString(), x, wireY + 20);
    }

    // Draw Driver Circuit (Top Loop)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wireX1, wireY - 3); ctx.lineTo(wireX1, H*0.2); ctx.lineTo(wireX2, H*0.2); ctx.lineTo(wireX2, wireY - 3); ctx.stroke();
    
    // Driver Battery
    ctx.fillStyle = '#1e293b'; ctx.fillRect(W*0.5 - 25, H*0.2 - 12, 50, 24);
    ctx.strokeStyle = '#38bdf8'; ctx.strokeRect(W*0.5 - 25, H*0.2 - 12, 50, 24);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('E = 5V', W*0.5, H*0.2 - 18);

    // Jockey Position
    let jX = wireX1 + (wireX2 - wireX1) * jockeyPos;
    
    // Secondary Circuit (Test Cell & Galvanometer)
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.7)' : 'rgba(251, 191, 36, 0.7)';
    ctx.beginPath(); ctx.moveTo(jX, wireY - 3); ctx.lineTo(jX, H*0.45); ctx.stroke();
    
    // Galvanometer at Middle of vertical wire
    let gy = H * 0.45;
    ctx.beginPath(); ctx.arc(jX, gy, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.stroke();
    
    // Needle
    ctx.save(); ctx.translate(jX, gy); ctx.rotate(needleAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16);
    ctx.strokeStyle = isBalanced ? '#34d399' : '#fb7185'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('G', jX, gy+4);

    // Jockey Contact
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.moveTo(jX, wireY - 3); ctx.lineTo(jX - 8, wireY - 18); ctx.lineTo(jX + 8, wireY - 18); ctx.fill();

    // Draw Test Battery E1
    ctx.fillStyle = '#1e293b'; ctx.fillRect(jX - 40, H*0.65, 80, 30);
    ctx.strokeStyle = '#a855f7'; ctx.strokeRect(jX - 40, H*0.65, 80, 30);
    ctx.fillStyle = '#a855f7'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('E1=' + E1.toFixed(1), jX, H*0.65+18);

    // Overlays
    let fCardX = 16, fCardY = 12, fCardW = 240, fCardH = 75;
    ctx.save();
    drawRoundedRect(fCardX, fCardY, fCardW, fCardH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'; ctx.fill();
    ctx.strokeStyle = isBalanced ? 'rgba(52, 211, 153, 0.4)' : 'rgba(244, 63, 94, 0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
    drawRoundedRect(fCardX + 7, fCardY + 9, 4, fCardH - 18, 2);
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24'; ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 9.5px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('POTENTIOMETER PRINCIPLE', fCardX + 18, fCardY + 20);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 14px system-ui';
    ctx.fillText('E1 = k · l', fCardX + 18, fCardY + 43);
    ctx.fillStyle = isBalanced ? '#34d399' : '#fbbf24'; ctx.font = '700 11px system-ui';
    ctx.fillText(isBalanced ? 'Null Point Achieved' : 'V = ' + (5 * jockeyPos).toFixed(2) + 'V', fCardX + 18, fCardY + 65);
    ctx.restore();

    needleAngle += (targetNeedleAngle - needleAngle) * 0.15;
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  jockeySlider.addEventListener('input', updatePhysics);
  emfSlider.addEventListener('input', updatePhysics);
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { jockeySlider.value = 50; emfSlider.value = 2; updatePhysics(); });

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

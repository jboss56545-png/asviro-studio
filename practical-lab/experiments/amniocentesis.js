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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Amniocentesis</div>
        <div style="font-size:9px;color:#64748b;">Class 12 Bio - Ch 3</div>
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
        
        <div id="resultBox" style="display:none; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.35); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:12px; font-weight:900; color:#34d399;" id="resultTitle">Karyotype Normal</div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px;" id="resultDesc">23 pairs of chromosomes found. No abnormalities detected.</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Insert Needle</label>
              <span id="needleVal" style="font-size:11px;font-weight:900;color:#38bdf8;">0%</span>
            </div>
            <input id="needleSlider" type="range" min="0" max="100" step="1" value="0" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>
          
          <div style="display:flex; align-items:center;">
             <button id="testBtn" style="flex:1; padding:12px; border-radius:12px; background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; font-weight:900; font-size:11px; cursor:pointer; transition:0.2s;">Extract & Test Cells</button>
          </div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const needleSlider = wrap.querySelector('#needleSlider');
  const needleVal = wrap.querySelector('#needleVal');
  const testBtn = wrap.querySelector('#testBtn');
  const resultBox = wrap.querySelector('#resultBox');
  const resultTitle = wrap.querySelector('#resultTitle');
  const resultDesc = wrap.querySelector('#resultDesc');
  
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let needleDepth = 0;
  let extracted = false;
  let cells = [];
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
    needleDepth = parseFloat(needleSlider.value);
    needleVal.textContent = needleDepth + '%';
    if (needleDepth < 50) {
      extracted = false;
      resultBox.style.display = 'none';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.02;

    // Draw Womb / Amniotic Sac
    ctx.beginPath(); ctx.ellipse(cx, cy+20, W*0.35, H*0.35, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'; ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 4; ctx.stroke();

    // Fetus
    ctx.beginPath(); ctx.arc(cx - W*0.1, cy + H*0.1, 30, 0, Math.PI*2);
    ctx.fillStyle = '#fbbf24'; ctx.fill();

    // Needle (Comes from Top Left)
    let angle = Math.PI / 4;
    let startX = cx - W*0.4;
    let startY = cy - H*0.4;
    let needleLength = Math.min(W,H) * 0.8;
    
    // Move needle based on slider (0 to 100%)
    let moveDist = (needleDepth / 100) * needleLength;

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    
    // Needle Body
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, -4, moveDist, 8);
    // Needle Tip
    ctx.beginPath(); ctx.moveTo(moveDist, -4); ctx.lineTo(moveDist+20, 0); ctx.lineTo(moveDist, 4);
    ctx.fillStyle = '#f8fafc'; ctx.fill();

    ctx.restore();

    // Extracted Fluid droplets
    if (needleDepth > 50 && !extracted) {
      ctx.beginPath();
      let dropX = startX + Math.cos(angle)*moveDist - 10;
      let dropY = startY + Math.sin(angle)*moveDist - 10;
      ctx.arc(dropX, dropY, 8 + Math.sin(phase*10)*2, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)'; ctx.fill();
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  needleSlider.addEventListener('input', updatePhysics);
  
  testBtn.addEventListener('click', () => {
    if (needleDepth < 50) {
      alert("Needle must reach the amniotic sac first! Move the slider.");
      return;
    }
    extracted = true;
    resultBox.style.display = 'block';
    // Random outcome for simulation
    let isNormal = Math.random() > 0.3; 
    if (isNormal) {
      resultBox.style.background = 'rgba(52,211,153,0.1)'; resultBox.style.borderColor = 'rgba(52,211,153,0.35)';
      resultTitle.textContent = 'Karyotype Normal (46, XX or 46, XY)'; resultTitle.style.color = '#34d399';
      resultDesc.textContent = '23 pairs of chromosomes found. No chromosomal abnormalities detected.';
    } else {
      resultBox.style.background = 'rgba(244,63,94,0.1)'; resultBox.style.borderColor = 'rgba(244,63,94,0.35)';
      resultTitle.textContent = 'Trisomy 21 Detected (Down Syndrome)'; resultTitle.style.color = '#f43f5e';
      resultDesc.textContent = 'An extra copy of chromosome 21 was found in the fetal cells.';
    }
  });

  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { 
    needleSlider.value = 0; extracted = false; resultBox.style.display = 'none'; updatePhysics(); 
  });

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

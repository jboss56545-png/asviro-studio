export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="flex:1;text-align:center;min-width:0;"><div style="font-size:12px;font-weight:900;color:#f1f5f9;">Rate Law Lab</div><div style="font-size:9px;color:#64748b;">Chem 12 - Ch 3</div></div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-rotate-left"></i></button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Initial Concentration [A]₀</label>
            <span id="concVal" style="font-size:11px;font-weight:900;color:#38bdf8;">1.0 M</span>
          </div>
          <input id="concSlider" type="range" min="0.1" max="2.0" step="0.1" value="1" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const concSlider = wrap.querySelector('#concSlider');
  const concVal = wrap.querySelector('#concVal');
  
  let W = 0, H = 0, animId = null, isRunning = true;
  let initialConc = 1.0, k = 1.0;
  let time = 0;
  let data = [];

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
    initialConc = parseFloat(concSlider.value);
    concVal.textContent = initialConc.toFixed(1) + ' M';
    time = 0;
    data = [];
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    
    // Physics update
    if (time < 10) {
      time += 0.05;
      // First order reaction: [A] = [A]0 * e^(-kt)
      let conc = initialConc * Math.exp(-k * time);
      data.push({t: time, c: conc});
    }

    // Draw Graph
    let graphX = W * 0.1, graphY = H * 0.8, graphW = W * 0.8, graphH = H * 0.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(graphX, graphY); ctx.lineTo(graphX, graphY - graphH); ctx.lineTo(graphX + graphW, graphY - graphH); ctx.stroke(); // Axes

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      let px = graphX + (data[i].t / 10) * graphW;
      let py = graphY - (data[i].c / 2.0) * graphH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4;
    ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;

    // Labels inside graph
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Time (s) →', graphX + graphW/2, graphY + 20);
    ctx.save(); ctx.translate(graphX - 20, graphY - graphH/2); ctx.rotate(-Math.PI/2); ctx.fillText('[A] (M) →', 0, 0); ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  concSlider.addEventListener('input', updatePhysics);
  wrap.querySelector('.back-btn').addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  wrap.querySelector('.reset-btn').addEventListener('click', () => { concSlider.value = 1; updatePhysics(); });

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

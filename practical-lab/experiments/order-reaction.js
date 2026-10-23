export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="flex:1;text-align:center;min-width:0;"><div style="font-size:12px;font-weight:900;color:#f1f5f9;">Order of Reaction</div><div style="font-size:9px;color:#64748b;">Chem 12 - Ch 3</div></div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-rotate-left"></i></button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex; gap:8px; background:rgba(15,23,42,0.6); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <button id="tabZero" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#030712; background:#38bdf8; border:none; cursor:pointer; transition:0.2s;">Zero Order</button>
          <button id="tabFirst" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">First Order</button>
          <button id="tabSecond" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Second Order</button>
        </div>
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div id="orderTitle" style="font-size:13px; font-weight:900; color:#38bdf8; margin-bottom:4px;">Zero Order Reaction</div>
          <div id="orderDesc" style="font-size:11px; color:#cbd5e1; line-height:1.5;">Rate = k. The concentration decreases linearly with time. Slope = -k.</div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const tabZero = wrap.querySelector('#tabZero');
  const tabFirst = wrap.querySelector('#tabFirst');
  const tabSecond = wrap.querySelector('#tabSecond');
  const orderTitle = wrap.querySelector('#orderTitle');
  const orderDesc = wrap.querySelector('#orderDesc');
  
  let W = 0, H = 0, animId = null, isRunning = true;
  let currentOrder = 0;
  let time = 0;
  let k = 0.5;

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
  }

  function switchOrder(order) {
    currentOrder = order;
    [tabZero, tabFirst, tabSecond].forEach(t => { t.style.background = 'transparent'; t.style.color = '#94a3b8'; });
    time = 0;

    if (order === 0) {
      tabZero.style.background = '#38bdf8'; tabZero.style.color = '#030712';
      orderTitle.textContent = 'Zero Order Reaction'; orderTitle.style.color = '#38bdf8';
      orderDesc.textContent = 'Rate = k. The concentration decreases linearly with time. [A] = [A]₀ - kt';
    } else if (order === 1) {
      tabFirst.style.background = '#10b981'; tabFirst.style.color = '#030712';
      orderTitle.textContent = 'First Order Reaction'; orderTitle.style.color = '#10b981';
      orderDesc.textContent = 'Rate = k[A]. Concentration decays exponentially. [A] = [A]₀e^(-kt)';
    } else {
      tabSecond.style.background = '#a855f7'; tabSecond.style.color = '#fff';
      orderTitle.textContent = 'Second Order Reaction'; orderTitle.style.color = '#a855f7';
      orderDesc.textContent = 'Rate = k[A]². Concentration drops sharply. 1/[A] = 1/[A]₀ + kt';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    time += 0.02;

    // Calculate Concentration
    let conc = 1.0;
    if (time < 10) {
      if (currentOrder === 0) conc = 1.0 - k * time; // [A] = [A]0 - kt
      else if (currentOrder === 1) conc = Math.exp(-k * time); // [A] = e^-kt
      else conc = 1 / (1 + k * time); // 1/[A] = 1/[A]0 + kt
    } else conc = 0;
    if (conc < 0) conc = 0;

    // Draw Graph
    let graphX = W * 0.1, graphY = H * 0.8, graphW = W * 0.8, graphH = H * 0.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(graphX, graphY); ctx.lineTo(graphX, graphY - graphH); ctx.lineTo(graphX + graphW, graphY - graphH); ctx.stroke();

    // Moving Dot representing current state
    let px = graphX + (time / 10) * graphW;
    let py = graphY - conc * graphH;
    
    // Plot moving path
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2);
    let col = currentOrder === 0 ? '#38bdf8' : currentOrder === 1 ? '#10b981' : '#a855f7';
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Time (s) →', graphX + graphW/2, graphY + 20);
    ctx.save(); ctx.translate(graphX - 20, graphY - graphH/2); ctx.rotate(-Math.PI/2); ctx.fillText('[A] →', 0, 0); ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tabZero.addEventListener('click', () => switchOrder(0));
  tabFirst.addEventListener('click', () => switchOrder(1));
  tabSecond.addEventListener('click', () => switchOrder(2));
  wrap.querySelector('.back-btn').addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });

  window.addEventListener('resize', resize);
  switchOrder(0); resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
  }

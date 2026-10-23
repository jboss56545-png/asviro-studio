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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Contraception Methods</div>
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
        
        <!-- Method Tabs -->
        <div style="display:flex; gap:8px; background:rgba(15,23,42,0.6); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <button id="tabBarrier" class="method-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#030712; background:#38bdf8; border:none; cursor:pointer; transition:0.2s;">Barrier</button>
          <button id="tabHormonal" class="method-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Hormonal</button>
          <button id="tabIUD" class="method-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">IUD</button>
        </div>

        <!-- Info Panel -->
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div id="methodName" style="font-size:13px; font-weight:900; color:#38bdf8; margin-bottom:4px;">Condoms (Barrier)</div>
          <div id="methodDesc" style="font-size:11px; color:#cbd5e1; line-height:1.5;">Prevents sperm from reaching the egg. Also protects against STDs. High effectiveness when used correctly.</div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const tabBarrier = wrap.querySelector('#tabBarrier');
  const tabHormonal = wrap.querySelector('#tabHormonal');
  const tabIUD = wrap.querySelector('#tabIUD');
  const methodName = wrap.querySelector('#methodName');
  const methodDesc = wrap.querySelector('#methodDesc');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let currentMethod = 'barrier'; // barrier, hormonal, iud
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

  function switchMethod(method) {
    currentMethod = method;
    const tabs = [tabBarrier, tabHormonal, tabIUD];
    tabs.forEach(t => {
      t.style.background = 'transparent';
      t.style.color = '#94a3b8';
    });

    if (method === 'barrier') {
      tabBarrier.style.background = '#38bdf8'; tabBarrier.style.color = '#030712';
      methodName.textContent = 'Condoms (Barrier)'; methodName.style.color = '#38bdf8';
      methodDesc.textContent = 'Prevents sperm from reaching the egg. Also protects against STDs like HIV. High effectiveness when used correctly.';
    } else if (method === 'hormonal') {
      tabHormonal.style.background = '#a855f7'; tabHormonal.style.color = '#fff';
      methodName.textContent = 'Oral Pills (Hormonal)'; methodName.style.color = '#a855f7';
      methodDesc.textContent = 'Contains progesterone/estrogen. Prevents ovulation and thickens cervical mucus to block sperm. Very high effectiveness (>99%).';
    } else {
      tabIUD.style.background = '#f43f5e'; tabIUD.style.color = '#fff';
      methodName.textContent = 'Copper-T (IUD)'; methodName.style.color = '#f43f5e';
      methodDesc.textContent = 'Inserted into the uterus. Copper ions are toxic to sperm. Can last 5-10 years. Highly effective long-term method.';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.03;

    ctx.save();
    ctx.translate(cx, cy);

    if (currentMethod === 'barrier') {
      // Draw Condom
      ctx.rotate(-Math.PI / 6);
      // Main body
      ctx.beginPath(); ctx.roundRect(-40, -80, 80, 160, 20);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.stroke();
      // Reservoir tip
      ctx.beginPath(); ctx.arc(0, -80, 20, Math.PI, 0);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'; ctx.fill(); ctx.stroke();
      // Ring at base
      ctx.beginPath(); ctx.ellipse(0, 80, 40, 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.stroke();
      
    } else if (currentMethod === 'hormonal') {
      // Draw Blister Pack
      ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-80, -60, 160, 120, 15); ctx.fill(); ctx.stroke();
      
      // Pills (3x4 grid)
      for(let r=0; r<3; r++) {
        for(let c=0; c<4; c++) {
          ctx.beginPath(); ctx.arc(-55 + c*38, -35 + r*35, 12, 0, Math.PI*2);
          ctx.fillStyle = '#f8fafc'; ctx.fill();
          ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      
    } else {
      // Draw Copper T (IUD)
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      // Vertical stem
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.stroke();
      // Horizontal arms
      ctx.beginPath(); ctx.moveTo(-40, -60); ctx.lineTo(0, -60); ctx.lineTo(40, -60); ctx.stroke();
      // Copper coils (simulated)
      for (let i = -40; i <= 40; i += 20) {
        if (i === 0) continue;
        ctx.beginPath(); ctx.moveTo(i, -70); ctx.lineTo(i, -50); 
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); // Ring at bottom
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.stroke();
    }

    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tabBarrier.addEventListener('click', () => switchMethod('barrier'));
  tabHormonal.addEventListener('click', () => switchMethod('hormonal'));
  tabIUD.addEventListener('click', () => switchMethod('iud'));
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => switchMethod('barrier'));

  window.addEventListener('resize', resize);
  switchMethod('barrier');
  resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Population Control</div>
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
        
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px; display:flex; justify-content:space-between;">
          <div style="color:#cbd5e1; font-size:11px;">Current Population: <span id="popCount" style="color:#10b981; font-weight:900; font-size:14px;">1000</span></div>
          <div style="color:#cbd5e1; font-size:11px;">Growth Rate: <span id="growthRate" style="color:#fbbf24; font-weight:900; font-size:14px;">+1.5%</span></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Birth Rate</label>
              <span id="birthVal" style="font-size:11px;font-weight:900;color:#38bdf8;">20 / 1000</span>
            </div>
            <input id="birthSlider" type="range" min="5" max="40" step="1" value="20" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
          </div>
          <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Death Rate</label>
              <span id="deathVal" style="font-size:11px;font-weight:900;color:#f43f5e;">10 / 1000</span>
            </div>
            <input id="deathSlider" type="range" min="5" max="40" step="1" value="10" style="width:100%;accent-color:#f43f5e;cursor:pointer;height:5px;" />
          </div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const birthSlider = wrap.querySelector('#birthSlider');
  const deathSlider = wrap.querySelector('#deathSlider');
  const birthVal = wrap.querySelector('#birthVal');
  const deathVal = wrap.querySelector('#deathVal');
  const popCount = wrap.querySelector('#popCount');
  const growthRate = wrap.querySelector('#growthRate');
  
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let birthRate = 20, deathRate = 10;
  let population = 1000;
  let history = [];
  let dots = [];
  let time = 0;

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    initDots();
  }

  function initDots() {
    dots = [];
    for(let i=0; i<150; i++) {
      dots.push({ x: Math.random()*W, y: Math.random()*H, r: 1+Math.random()*2 });
    }
  }

  function updatePhysics() {
    birthRate = parseFloat(birthSlider.value);
    deathRate = parseFloat(deathSlider.value);
    birthVal.textContent = birthRate + ' / 1000';
    deathVal.textContent = deathRate + ' / 1000';
    
    let rate = ((birthRate - deathRate) / 1000).toFixed(3);
    growthRate.textContent = (rate > 0 ? '+' : '') + (rate * 100).toFixed(1) + '%';
    growthRate.style.color = rate > 0 ? '#fbbf24' : '#10b981';
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    time += 1;

    // Update Population (every 30 frames)
    if (time % 30 === 0) {
      let change = Math.round(population * (birthRate - deathRate) / 1000);
      population += change;
      if (population < 0) population = 0;
      popCount.textContent = population;
      
      history.push(population);
      if (history.length > 100) history.shift();
    }

    // Draw Background Dots
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    dots.forEach(d => {
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2); ctx.fill();
    });

    // Draw Graph
    if (history.length > 1) {
      let maxPop = Math.max(...history, 100);
      let minPop = Math.min(...history, 0);
      let range = maxPop - minPop || 1;

      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        let x = (i / 99) * W;
        let y = H - ((history[i] - minPop) / range) * H * 0.7 - H * 0.15;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4;
      ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      
      // Gradient fill under graph
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      let grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad; ctx.fill();
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  birthSlider.addEventListener('input', updatePhysics);
  deathSlider.addEventListener('input', updatePhysics);
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { 
    birthSlider.value = 20; deathSlider.value = 10; 
    population = 1000; history = []; time = 0; updatePhysics(); 
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

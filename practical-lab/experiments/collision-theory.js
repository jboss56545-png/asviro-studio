export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Collision Theory</div>
      <div style="width:60px;"></div>
    </div>
    <div id="canvasHost" style="position:relative;flex:1;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;">
      <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Temperature (K)</label>
          <span id="tempVal" style="font-size:11px;font-weight:900;color:#fbbf24;">300 K</span>
        </div>
        <input id="tempSlider" type="range" min="200" max="600" step="10" value="300" style="width:100%;accent-color:#fbbf24;cursor:pointer;" />
      </div>
      <div id="statusText" style="text-align:center;font-size:11px;color:#38bdf8;margin-top:10px;font-weight:bold;">Effective Collisions: 0</div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const tempSlider = wrap.querySelector('#tempSlider');
  const tempVal = wrap.querySelector('#tempVal');
  const statusText = wrap.querySelector('#statusText');

  let W = 0, H = 0, animId = null, isRunning = true;
  let T = 300;
  let particles = [];
  let collisions = 0;

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    initParticles();
  }

  function initParticles() {
    particles = [];
    for(let i=0; i<40; i++) {
      particles.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, active: Math.random()>0.5 });
    }
  }

  function updatePhysics() {
    T = parseFloat(tempSlider.value);
    tempVal.textContent = T + ' K';
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let speedMult = T / 300; 
    collisions = 0;

    for(let i=0; i<particles.length; i++) {
      let p = particles[i];
      p.x += p.vx * speedMult; p.y += p.vy * speedMult;
      if(p.x < 0 || p.x > W) p.vx *= -1;
      if(p.y < 0 || p.y > H) p.vy *= -1;

      // Collision detection
      for(let j=i+1; j<particles.length; j++) {
        let p2 = particles[j];
        let dx = p.x - p2.x, dy = p.y - p2.y;
        if(dx*dx + dy*dy < 400) { // Distance < 20
           p.vx *= -1; p.vy *= -1; p2.vx *= -1; p2.vy *= -1;
           if (T > 400) collisions++; // Only count effective collisions at high temp
        }
      }
    }
    statusText.textContent = 'Effective Collisions: ' + collisions;

    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
      ctx.fillStyle = p.active && T > 400 ? '#f43f5e' : '#38bdf8';
      if(p.active && T > 400) { ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 10; }
      ctx.fill(); ctx.shadowBlur = 0;
    });
  }

  function loop() { if (!isRunning) return; try { draw(); } catch (e) {} animId = requestAnimationFrame(loop); }
  tempSlider.addEventListener('input', updatePhysics);
  wrap.querySelector('.back-btn').addEventListener('click', () => window.goBack ? window.goBack() : null);
  window.addEventListener('resize', resize);
  updatePhysics(); resize(); requestAnimationFrame(resize); animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId); window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.body.style.overflow = prevOverflow;
  };
                               }

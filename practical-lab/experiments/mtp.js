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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">Medical Termination of Pregnancy</div>
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
        
        <div id="statusBox" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); border-radius:12px; padding:10px; text-align:center;">
          <div style="font-size:11px; font-weight:900; color:#10b981; text-transform:uppercase;" id="mtpStatus">Legal & Safe (First Trimester)</div>
          <div style="font-size:10px; color:#cbd5e1; margin-top:4px;" id="mtpDesc">MTP is safe up to 12 weeks of pregnancy.</div>
        </div>

        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 11px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <label style="font-size:11px;font-weight:800;color:#e2e8f0;">Weeks of Pregnancy</label>
            <span id="weekVal" style="font-size:11px;font-weight:900;color:#38bdf8;">8 Weeks</span>
          </div>
          <input id="weekSlider" type="range" min="1" max="40" step="1" value="8" style="width:100%;accent-color:#38bdf8;cursor:pointer;height:5px;" />
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const weekSlider = wrap.querySelector('#weekSlider');
  const weekVal = wrap.querySelector('#weekVal');
  const statusBox = wrap.querySelector('#statusBox');
  const mtpStatus = wrap.querySelector('#mtpStatus');
  const mtpDesc = wrap.querySelector('#mtpDesc');
  
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let week = 8;
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
    week = parseInt(weekSlider.value);
    weekVal.textContent = week + ' Weeks';

    if (week <= 12) {
      statusBox.style.background = 'rgba(16,185,129,0.1)'; statusBox.style.borderColor = 'rgba(16,185,129,0.35)';
      mtpStatus.style.color = '#10b981'; mtpStatus.textContent = 'Legal & Safe (First Trimester)';
      mtpDesc.textContent = 'MTP is relatively safe and legally allowed up to 12 weeks.';
    } else if (week <= 20) {
      statusBox.style.background = 'rgba(251,191,36,0.1)'; statusBox.style.borderColor = 'rgba(251,191,36,0.35)';
      mtpStatus.style.color = '#fbbf24'; mtpStatus.textContent = 'Requires Doctor Consultation';
      mtpDesc.textContent = 'Allowed up to 20 weeks, but requires the opinion of 2 medical practitioners.';
    } else if (week <= 24) {
      statusBox.style.background = 'rgba(244,63,94,0.1)'; statusBox.style.borderColor = 'rgba(244,63,94,0.35)';
      mtpStatus.style.color = '#f43f5e'; mtpStatus.textContent = 'Only for Fetal Abnormalities';
      mtpDesc.textContent = 'Up to 24 weeks allowed ONLY if the fetus has severe abnormalities (Rape victims, minors, etc.).';
    } else {
      statusBox.style.background = 'rgba(244,63,94,0.2)'; statusBox.style.borderColor = 'rgba(244,63,94,0.5)';
      mtpStatus.style.color = '#f43f5e'; mtpStatus.textContent = 'Illegal (Except to Save Mother)';
      mtpDesc.textContent = 'MTP is generally illegal after 24 weeks, unless it is immediately necessary to save the mother\'s life.';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.02;

    // Draw Uterus
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.min(W,H)*0.35, Math.min(W,H)*0.4, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)'; ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)'; ctx.lineWidth = 4; ctx.stroke();

    // Fetus size scaling based on weeks
    let scale = Math.max(0.1, week / 40) * Math.min(W,H) * 0.4;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Fetus shape (head + body + cord)
    ctx.beginPath();
    // Body (curled)
    ctx.ellipse(0, scale*0.2, scale*0.4, scale*0.2, -Math.PI/4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'; ctx.fill();
    // Head
    ctx.beginPath(); ctx.arc(-scale*0.2, -scale*0.1, scale*0.2, 0, Math.PI*2);
    ctx.fillStyle = '#fbbf24'; ctx.fill();
    
    // Pulsing effect for heartbeat
    if (week > 4) {
      let pulse = 1 + Math.sin(phase*5)*0.05;
      ctx.beginPath(); ctx.arc(-scale*0.2, -scale*0.1, scale*0.2 * pulse, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Umbilical cord
    if (week > 6) {
      ctx.beginPath(); ctx.moveTo(scale*0.2, scale*0.1); ctx.bezierCurveTo(scale*0.6, scale*0.4, scale*0.8, -scale*0.4, scale*0.9, 0);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'; ctx.lineWidth = 3; ctx.stroke();
    }

    // Features (eyes) if > 12 weeks
    if (week > 12) {
      ctx.fillStyle = '#030712';
      ctx.beginPath(); ctx.arc(-scale*0.25, -scale*0.15, 2, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  weekSlider.addEventListener('input', updatePhysics);
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => { weekSlider.value = 8; updatePhysics(); });

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

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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">STDs Explorer</div>
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
        
        <div style="display:flex; gap:8px; background:rgba(15,23,42,0.6); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <button id="tabHIV" class="std-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#fff; background:#f43f5e; border:none; cursor:pointer; transition:0.2s;">HIV</button>
          <button id="tabSyphilis" class="std-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Syphilis</button>
          <button id="tabGonorrhea" class="std-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Gonorrhea</button>
        </div>

        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div id="pathogenType" style="font-size:10px; font-weight:900; text-transform:uppercase; color:#f43f5e; margin-bottom:2px;">Virus (Retrovirus)</div>
          <div id="stdName" style="font-size:13px; font-weight:900; color:#f8fafc; margin-bottom:4px;">Human Immunodeficiency Virus</div>
          <div id="stdDesc" style="font-size:11px; color:#cbd5e1; line-height:1.5;">Attacks the immune system (CD4+ T-cells). Transmitted via unprotected sex, blood transfusions, or mother-to-child. No permanent cure, but ART manages it.</div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const tabHIV = wrap.querySelector('#tabHIV');
  const tabSyphilis = wrap.querySelector('#tabSyphilis');
  const tabGonorrhea = wrap.querySelector('#tabGonorrhea');
  const pathogenType = wrap.querySelector('#pathogenType');
  const stdName = wrap.querySelector('#stdName');
  const stdDesc = wrap.querySelector('#stdDesc');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let currentStd = 'hiv'; 
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

  function switchStd(std) {
    currentStd = std;
    [tabHIV, tabSyphilis, tabGonorrhea].forEach(t => { t.style.background = 'transparent'; t.style.color = '#94a3b8'; });

    if (std === 'hiv') {
      tabHIV.style.background = '#f43f5e'; tabHIV.style.color = '#fff';
      pathogenType.textContent = 'Virus (Retrovirus)'; pathogenType.style.color = '#f43f5e';
      stdName.textContent = 'Human Immunodeficiency Virus (HIV)';
      stdDesc.textContent = 'Attacks the immune system (CD4+ T-cells). Transmitted via unprotected sex, blood, or mother-to-child. No cure, but ART manages it.';
    } else if (std === 'syphilis') {
      tabSyphilis.style.background = '#a855f7'; tabSyphilis.style.color = '#fff';
      pathogenType.textContent = 'Bacteria (Spirochete)'; pathogenType.style.color = '#a855f7';
      stdName.textContent = 'Treponema pallidum';
      stdDesc.textContent = 'Causes Syphilis. Characterized by painless sores (chancres). Curable with antibiotics (penicillin). Can cause severe damage if untreated.';
    } else {
      tabGonorrhea.style.background = '#38bdf8'; tabGonorrhea.style.color = '#030712';
      pathogenType.textContent = 'Bacteria (Diplococcus)'; pathogenType.style.color = '#38bdf8';
      stdName.textContent = 'Neisseria gonorrhoeae';
      stdDesc.textContent = 'Causes Gonorrhea. Symptoms include burning during urination and discharge. Curable with antibiotics, but resistance is increasing.';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.05;

    if (currentStd === 'hiv') {
      // Draw HIV Virus (Icosahedral with spikes)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(phase * 0.5);
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
      // Core
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fillStyle = 'rgba(244, 63, 94, 0.2)'; ctx.fill(); ctx.stroke();
      // Spikes
      for (let i = 0; i < 12; i++) {
        let ang = (i / 12) * Math.PI * 2;
        let sx = Math.cos(ang) * 40; let sy = Math.sin(ang) * 40;
        let ex = Math.cos(ang) * 60; let ey = Math.sin(ang) * 60;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI*2); ctx.fillStyle = '#f43f5e'; ctx.fill();
      }
      // RNA inside
      ctx.beginPath(); ctx.moveTo(-15, -10); ctx.bezierCurveTo(-5, -20, 10, 20, 15, 10);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();

    } else if (currentStd === 'syphilis') {
      // Draw Spiral Bacteria
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = -100; i < 100; i += 2) {
        let y = i + Math.sin(i * 0.1 + phase * 5) * 20;
        let x = i;
        if (i === -100) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Flagella
      ctx.beginPath(); ctx.moveTo(-100, Math.sin(-10+phase*5)*20);
      ctx.bezierCurveTo(-120, 20, -130, -20, -150, 0);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'; ctx.lineWidth = 2; ctx.stroke();

    } else {
      // Draw Diplococci (two circles)
      let offset = Math.sin(phase) * 10;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx - 15 - offset, cy, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 15 + offset, cy, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Nucleoid
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(cx - 15 - offset, cy, 8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 15 + offset, cy, 8, 0, Math.PI*2); ctx.fill();
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tabHIV.addEventListener('click', () => switchStd('hiv'));
  tabSyphilis.addEventListener('click', () => switchStd('syphilis'));
  tabGonorrhea.addEventListener('click', () => switchStd('gonorrhea'));
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => switchStd('hiv'));

  window.addEventListener('resize', resize);
  switchStd('hiv');
  resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
                                            }

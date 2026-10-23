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
        <div style="font-size:12px;font-weight:900;color:#f1f5f9;">ART Techniques</div>
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
          <button id="tabIVF" class="art-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#030712; background:#10b981; border:none; cursor:pointer; transition:0.2s;">IVF</button>
          <button id="tabZIFT" class="art-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">ZIFT</button>
          <button id="tabGIFT" class="art-tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">GIFT</button>
        </div>

        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div id="artName" style="font-size:13px; font-weight:900; color:#10b981; margin-bottom:4px;">In Vitro Fertilization</div>
          <div id="artDesc" style="font-size:11px; color:#cbd5e1; line-height:1.5;">Fertilization occurs outside the body in a petri dish. The zygote (or early embryo) is then implanted into the uterus.</div>
        </div>

      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  
  const tabIVF = wrap.querySelector('#tabIVF');
  const tabZIFT = wrap.querySelector('#tabZIFT');
  const tabGIFT = wrap.querySelector('#tabGIFT');
  const artName = wrap.querySelector('#artName');
  const artDesc = wrap.querySelector('#artDesc');
  const backBtn = wrap.querySelector('.back-btn');
  const resetBtn = wrap.querySelector('.reset-btn');

  let W = 0, H = 0, animId = null, isRunning = true;
  let currentArt = 'ivf'; 
  let phase = 0;
  let sperms = [];

  function resize() {
    let w = canvasHost.clientWidth || window.innerWidth;
    let h = canvasHost.clientHeight || Math.max(250, window.innerHeight * 0.5);
    if (w < 10) w = 320; if (h < 10) h = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    initSperms();
  }

  function initSperms() {
    sperms = [];
    for(let i=0; i<5; i++) {
      sperms.push({ x: Math.random()*W, y: Math.random()*H, vx: 0, vy: 0, seed: Math.random()*100 });
    }
  }

  function switchArt(art) {
    currentArt = art;
    [tabIVF, tabZIFT, tabGIFT].forEach(t => { t.style.background = 'transparent'; t.style.color = '#94a3b8'; });

    if (art === 'ivf') {
      tabIVF.style.background = '#10b981'; tabIVF.style.color = '#030712';
      artName.textContent = 'In Vitro Fertilization (IVF)'; artName.style.color = '#10b981';
      artDesc.textContent = 'Fertilization occurs outside the body in a petri dish. The zygote (or early embryo up to 8-cell stage) is transferred to the uterus.';
    } else if (art === 'zift') {
      tabZIFT.style.background = '#38bdf8'; tabZIFT.style.color = '#030712';
      artName.textContent = 'Zygote Intrafallopian Transfer'; artName.style.color = '#38bdf8';
      artDesc.textContent = 'Zygote (up to 8 blastomeres) is transferred directly into the fallopian tube. Fertilization is in-vitro.';
    } else {
      tabGIFT.style.background = '#a855f7'; tabGIFT.style.color = '#fff';
      artName.textContent = 'Gamete Intrafallopian Transfer'; artName.style.color = '#a855f7';
      artDesc.textContent = 'Transfer of an ovum collected from a donor into the fallopian tube of another female who cannot produce one. Fertilization occurs in-vivo.';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.05;

    // Draw target area based on ART
    if (currentArt === 'ivf') {
      // Petri Dish
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W,H)*0.3, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; ctx.fill();

      // Egg
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fillStyle = '#fbbf24'; ctx.fill();

      // Moving Sperms towards egg
      for(let i=0; i<5; i++) {
        let angle = (i / 5) * Math.PI * 2 + phase;
        let dist = 100 + Math.sin(phase*2 + i)*20;
        let sx = cx + Math.cos(angle) * dist;
        let sy = cy + Math.sin(angle) * dist;
        ctx.beginPath(); ctx.ellipse(sx, sy, 6, 3, angle, 0, Math.PI*2); ctx.fillStyle = '#10b981'; ctx.fill();
        // Tail
        ctx.beginPath(); ctx.moveTo(sx, sy); 
        ctx.lineTo(sx + Math.cos(angle+0.5)*10, sy + Math.sin(angle+0.5)*10);
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1; ctx.stroke();
      }
    } else if (currentArt === 'zift') {
      // Fallopian tube
      ctx.beginPath(); ctx.moveTo(W*0.1, cy); ctx.bezierCurveTo(W*0.3, cy-100, W*0.7, cy+100, W*0.9, cy);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 26; ctx.stroke();

      // Zygote inside tube
      let tx = W*0.5 + Math.sin(phase)*20, ty = cy;
      ctx.beginPath(); ctx.arc(tx, ty, 15, 0, Math.PI*2); 
      ctx.fillStyle = '#38bdf8'; ctx.fill();
      ctx.fillStyle = '#030712'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('8-cell', tx, ty);

    } else {
      // GIFT (Fallopian tube with gametes)
      ctx.beginPath(); ctx.moveTo(W*0.1, cy); ctx.bezierCurveTo(W*0.3, cy-100, W*0.7, cy+100, W*0.9, cy);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 26; ctx.stroke();

      // Egg + Sperm in tube
      let tx = W*0.5, ty = cy;
      ctx.beginPath(); ctx.arc(tx-15, ty, 15, 0, Math.PI*2); ctx.fillStyle = '#fbbf24'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(tx+15, ty, 6, 3, 0, 0, Math.PI*2); ctx.fillStyle = '#a855f7'; ctx.fill();
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tabIVF.addEventListener('click', () => switchArt('ivf'));
  tabZIFT.addEventListener('click', () => switchArt('zift'));
  tabGIFT.addEventListener('click', () => switchArt('gift'));
  backBtn.addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });
  resetBtn.addEventListener('click', () => switchArt('ivf'));

  window.addEventListener('resize', resize);
  switchArt('ivf');
  resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

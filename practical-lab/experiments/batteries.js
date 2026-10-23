export function mount(host) {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:100;background:#030712;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);flex-shrink:0;backdrop-filter:blur(20px);">
      <button type="button" class="back-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div style="flex:1;text-align:center;min-width:0;"><div style="font-size:12px;font-weight:900;color:#f1f5f9;">Batteries & Fuel Cells</div><div style="font-size:9px;color:#64748b;">Chem 12 - Ch 2</div></div>
      <button type="button" class="reset-btn" style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fa-solid fa-rotate-left"></i></button>
    </div>
    <div id="canvasHost" style="position:relative;flex:1 1 auto;min-height:250px;background:#0b1220;overflow:hidden;">
      <canvas style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;"></canvas>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.1);padding:16px;flex-shrink:0;max-height:42vh;overflow-y:auto;backdrop-filter:blur(20px);">
      <div style="max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex; gap:8px; background:rgba(15,23,42,0.6); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
          <button id="tabPrimary" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#030712; background:#10b981; border:none; cursor:pointer; transition:0.2s;">Primary (Dry Cell)</button>
          <button id="tabSecondary" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Secondary (Lead Acid)</button>
          <button id="tabFuel" class="tab" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:900; color:#94a3b8; background:transparent; border:none; cursor:pointer; transition:0.2s;">Fuel Cell</button>
        </div>
        <div style="background:rgba(15,23,42,0.68);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div id="batTitle" style="font-size:13px; font-weight:900; color:#10b981; margin-bottom:4px;">Leclanché Cell (Dry Cell)</div>
          <div id="batDesc" style="font-size:11px; color:#cbd5e1; line-height:1.5;">Anode: Zn | Cathode: Carbon rod | Electrolyte: NH4Cl + ZnCl2. Cannot be recharged. Used in remote controls, clocks.</div>
        </div>
      </div>
    </div>
  `;
  host.appendChild(wrap);

  const canvas = wrap.querySelector('canvas');
  const canvasHost = wrap.querySelector('#canvasHost');
  const ctx = canvas.getContext('2d');
  const tabPrimary = wrap.querySelector('#tabPrimary');
  const tabSecondary = wrap.querySelector('#tabSecondary');
  const tabFuel = wrap.querySelector('#tabFuel');
  const batTitle = wrap.querySelector('#batTitle');
  const batDesc = wrap.querySelector('#batDesc');
  
  let W = 0, H = 0, animId = null, isRunning = true;
  let currentTab = 'primary';
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

  function switchTab(tab) {
    currentTab = tab;
    [tabPrimary, tabSecondary, tabFuel].forEach(t => { t.style.background = 'transparent'; t.style.color = '#94a3b8'; });
    
    if (tab === 'primary') {
      tabPrimary.style.background = '#10b981'; tabPrimary.style.color = '#030712';
      batTitle.textContent = 'Leclanché Cell (Dry Cell)'; batTitle.style.color = '#10b981';
      batDesc.textContent = 'Anode: Zn | Cathode: Carbon rod | Electrolyte: NH4Cl + ZnCl2. Cannot be recharged. Used in remote controls, clocks.';
    } else if (tab === 'secondary') {
      tabSecondary.style.background = '#38bdf8'; tabSecondary.style.color = '#030712';
      batTitle.textContent = 'Lead Storage Battery'; batTitle.style.color = '#38bdf8';
      batDesc.textContent = 'Anode: Pb | Cathode: PbO2 | Electrolyte: 38% H2SO4. Can be recharged. Used in vehicles and inverters.';
    } else {
      tabFuel.style.background = '#a855f7'; tabFuel.style.color = '#fff';
      batTitle.textContent = 'H2-O2 Fuel Cell'; batTitle.style.color = '#a855f7';
      batDesc.textContent = 'Continuously produces electricity from H2 and O2. Byproduct is pure water. Used in spacecraft (Apollo).';
    }
  }

  function draw() {
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
    let cx = W / 2, cy = H / 2;
    phase += 0.02;

    if (currentTab === 'primary') {
      // Draw Dry Cell
      let w = 120, h = 220;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, 10); ctx.fill(); ctx.stroke();
      // Carbon rod
      ctx.fillStyle = '#1e293b'; ctx.fillRect(cx - 10, cy - h/2 - 20, 20, h + 40);
      // Cap
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cx, cy - h/2 - 20, 10, 0, Math.PI*2); ctx.fill();
      // Paste
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'; ctx.fillRect(cx - w/2 + 10, cy - h/2 + 20, w - 20, h - 40);
      // Zn casing
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6; ctx.strokeRect(cx - w/2, cy - h/2, w, h);

    } else if (currentTab === 'secondary') {
      // Draw Lead Acid
      let w = 200, h = 160;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, 10); ctx.fill(); ctx.stroke();
      // Electrolyte level
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)'; ctx.fillRect(cx - w/2 + 4, cy - h/2 + 40, w - 8, h - 44);
      // Plates
      for (let i=0; i<4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#475569'; // Pb vs PbO2
        ctx.fillRect(cx - w/2 + 30 + i*40, cy - h/2 + 10, 20, h - 20);
      }
      
    } else {
      // Draw Fuel Cell
      ctx.fillStyle = 'rgba(168, 85, 247, 0.1)'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx - 100, cy - 60, 200, 120, 10); ctx.fill(); ctx.stroke();
      // Electrodes
      ctx.fillStyle = '#1e293b'; ctx.fillRect(cx - 70, cy - 50, 20, 100); ctx.fillRect(cx + 50, cy - 50, 20, 100);
      // Gas flows
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('H₂ In', cx - 60, cy - 70);
      ctx.fillStyle = '#f43f5e'; ctx.fillText('O₂ In', cx + 60, cy - 70);
      ctx.fillStyle = '#10b981'; ctx.fillText('H₂O Out', cx, cy + 85);
    }
  }

  function loop() {
    if (!isRunning) return;
    try { draw(); } catch (e) { console.error(e); }
    animId = requestAnimationFrame(loop);
  }

  tabPrimary.addEventListener('click', () => switchTab('primary'));
  tabSecondary.addEventListener('click', () => switchTab('secondary'));
  tabFuel.addEventListener('click', () => switchTab('fuel'));
  wrap.querySelector('.back-btn').addEventListener('click', () => { if (typeof window.goBack === 'function') window.goBack(); });

  window.addEventListener('resize', resize);
  switchTab('primary'); resize(); requestAnimationFrame(resize); setTimeout(resize, 100);
  animId = requestAnimationFrame(loop);

  return function cleanup() {
    isRunning = false; if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    document.body.style.overflow = prevOverflow;
  };
}

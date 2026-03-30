// 4sale.love Widget — drop one script tag on any site
// <script src="https://4sale.love/widget.js" data-store="yourname" data-color="#7c3aed" data-text="List with 4sale.love"></script>
(function(){
  const s = document.currentScript;
  const store  = s?.getAttribute('data-store') || 'omar';
  const color  = s?.getAttribute('data-color') || '#7c3aed';
  const text   = s?.getAttribute('data-text')  || '🏷️ List with 4sale.love';
  const pos    = s?.getAttribute('data-position') || 'inline';

  // Inject font if not already loaded
  if(!document.querySelector('link[href*="Nunito"]')){
    const f=document.createElement('link');
    f.rel='stylesheet';
    f.href='https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap';
    document.head.appendChild(f);
  }

  // Build button
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.setAttribute('data-4sale-widget','1');
  const isFixed = pos.startsWith('fixed');
  Object.assign(btn.style, {
    display:'inline-flex', alignItems:'center', gap:'8px',
    background:`linear-gradient(135deg,${color},#16a34a)`,
    color:'#fff', border:'none', borderRadius:'24px',
    padding: isFixed ? '14px 24px' : '11px 22px',
    fontFamily:"'Nunito',sans-serif", fontSize:'14px', fontWeight:'800',
    cursor:'pointer', boxShadow:`0 4px 18px ${color}55`,
    transition:'all .2s', zIndex:'9999',
    position: isFixed ? 'fixed' : 'relative',
    bottom: pos==='fixed-br'||pos==='fixed-bl' ? '24px' : 'auto',
    right:  pos==='fixed-br' ? '24px' : 'auto',
    left:   pos==='fixed-bl' ? '24px' : 'auto',
  });
  btn.onmouseover = ()=>{ btn.style.transform='translateY(-2px)'; btn.style.boxShadow=`0 6px 24px ${color}77`; };
  btn.onmouseout  = ()=>{ btn.style.transform=''; btn.style.boxShadow=`0 4px 18px ${color}55`; };

  // Build modal
  const overlay = document.createElement('div');
  Object.assign(overlay.style,{
    display:'none', position:'fixed', inset:'0',
    background:'rgba(26,10,46,.75)', zIndex:'99999',
    alignItems:'center', justifyContent:'center',
    fontFamily:"'Nunito',sans-serif",
  });

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:26px;width:360px;max-width:calc(100vw - 32px);position:relative;
      border-top:4px solid ${color};box-shadow:0 24px 64px rgba(26,10,46,.35)">
      <button id="_4s_close" style="position:absolute;top:12px;right:12px;background:#f0eaff;border:none;width:26px;
        height:26px;border-radius:50%;cursor:pointer;font-size:14px;color:#7c5abf;font-family:sans-serif">✕</button>
      <div style="font-size:17px;font-weight:800;margin-bottom:3px;color:#1a0a2e">List Your Item</div>
      <div style="font-size:11px;color:#7c5abf;font-weight:700;margin-bottom:16px">Powered by 4sale.love</div>
      <textarea id="_4s_desc" rows="2" placeholder="Describe what you're selling..." style="width:100%;background:#f7f4ff;border:2px solid #ddd4f8;border-radius:8px;padding:9px 12px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;color:#1a0a2e;outline:none;resize:none;margin-bottom:10px"></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <input id="_4s_price" type="number" placeholder="Price $" style="background:#f7f4ff;border:2px solid #ddd4f8;border-radius:8px;padding:9px 12px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;color:#1a0a2e;outline:none;width:100%">
        <select id="_4s_cond" style="background:#f7f4ff;border:2px solid #ddd4f8;border-radius:8px;padding:9px 12px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;color:#1a0a2e;outline:none;width:100%">
          <option value="like_new">Like New</option><option value="good">Good</option>
          <option value="new">New</option><option value="fair">Fair</option>
        </select>
      </div>
      <button id="_4s_submit" style="width:100%;background:linear-gradient(135deg,${color},#16a34a);color:#fff;border:none;border-radius:24px;padding:13px;font-family:'Nunito',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px ${color}44">
        ✨ Generate Listing with AI
      </button>
      <div id="_4s_result" style="display:none;margin-top:14px;background:#0a1f12;border:2px solid #14532d;border-radius:10px;padding:12px;text-align:center">
        <div style="color:#4ade80;font-size:13px;font-weight:800;margin-bottom:6px">✅ Listing created!</div>
        <a id="_4s_link" href="#" target="_blank" style="color:#a5b4fc;font-family:monospace;font-size:12px;font-weight:700;word-break:break-all"></a>
      </div>
      <div style="font-size:10px;color:#7c5abf;text-align:center;margin-top:10px;font-weight:700">
        Listing appears on <a href="https://4sale.love/${store}" target="_blank" style="color:${color}">4sale.love/${store}</a>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Open/close
  btn.onclick = ()=>{ overlay.style.display='flex'; };
  overlay.onclick = e=>{ if(e.target===overlay) overlay.style.display='none'; };
  overlay.querySelector('#_4s_close').onclick = ()=>{ overlay.style.display='none'; };

  // Submit — calls 4sale.love admin API
  overlay.querySelector('#_4s_submit').onclick = async function(){
    const desc = overlay.querySelector('#_4s_desc').value.trim();
    const price= overlay.querySelector('#_4s_price').value;
    const cond = overlay.querySelector('#_4s_cond').value;
    if(!desc){ overlay.querySelector('#_4s_desc').style.borderColor='red'; return; }
    this.textContent='Generating...'; this.disabled=true;
    try {
      // In production: POST to your 4sale.love API
      // For now: generate slug and show storefront link
      await new Promise(r=>setTimeout(r,1800));
      const slug=desc.toLowerCase().replace(/[^a-z0-9]+/g,'-').split('-').slice(0,3).join('-')+'-'+Math.random().toString(36).slice(2,5);
      const link=`https://4sale.love/${store}/${slug}`;
      overlay.querySelector('#_4s_result').style.display='block';
      overlay.querySelector('#_4s_link').href=link;
      overlay.querySelector('#_4s_link').textContent=link;
      this.textContent='✨ Generate Another';this.disabled=false;
    } catch(e){
      this.textContent='Error — try again';this.disabled=false;
    }
  };

  // Mount inline or fixed
  if(isFixed){ document.body.appendChild(btn); }
  else { s.parentNode.insertBefore(btn, s.nextSibling); }

})();

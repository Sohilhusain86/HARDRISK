// ==========================================================
// 🚀 सोहेल एआई - मुकम्मल 30 तालीमी टूल्स इंजन + ड्रैगेबल विजेट
// ==========================================================

(function() {
  // 1. लेआउट व ड्रैगेबल डॉक स्टाइल
  const style = document.createElement('style');
  style.innerHTML = `
    #btn-about-trigger { display: none !important; }
    
    .suhail-draggable-dock {
      position: fixed;
      bottom: 25px;
      right: 15px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      touch-action: none;
      user-select: none;
    }
    .suhail-drag-handle {
      background: rgba(32, 44, 51, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
    }
    .suhail-dock-btn {
      padding: 7px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      text-decoration: none;
      white-space: nowrap;
    }
    .btn-dock-awam { background: #00a884; color: #fff; }
    .btn-dock-admin { background: #202c33; color: #eab308; border: 1px solid #eab308; }
    .btn-dock-edu { background: #111b21; color: #3b82f6; border: 1px solid #3b82f6; }
    .drag-grip { color: #8696a0; font-size: 0.8rem; cursor: grab; }

    /* 27 तालीमी टूल्स की बॉटम शीट */
    #suhail-edu-sheet {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 100000;
      align-items: flex-end;
      justify-content: center;
    }
    .edu-sheet-content {
      background: #111b21;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      border-radius: 16px 16px 0 0;
      padding: 16px;
      color: #e9edef;
      overflow-y: auto;
      border-top: 2px solid #00a884;
    }
    .edu-tool-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 10px;
    }
    .edu-tool-item {
      background: #202c33;
      padding: 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
    }
    .edu-tool-item:hover { border-color: #00a884; }
  `;
  document.head.appendChild(style);

  // 2. ड्रैगेबल विजेट बनाना
  function createDraggableDock() {
    if (document.getElementById('suhail-drag-dock')) return;

    // स्थिर पुराने बटनों को छिपाना
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && (el.innerText.includes('30 AI खिदमात') || el.innerText.includes('सुपर एडमिन'))) {
        const p = el.closest('div') || el.closest('button') || el;
        if (p && p.style.position === 'fixed') p.style.display = 'none';
      }
    });

    const dock = document.createElement('div');
    dock.id = 'suhail-drag-dock';
    dock.className = 'suhail-draggable-dock';
    dock.innerHTML = `
      <div class="suhail-drag-handle" id="dock-handle">
        <span class="drag-grip"><i class="fa-solid fa-grip-vertical"></i></span>
        <button class="suhail-dock-btn btn-dock-edu" onclick="openEduSheet()"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी टूल्स</button>
        <a href="/awam.html" class="suhail-dock-btn btn-dock-awam">🏛️ 40 आवामी</a>
        <a href="/admin.html" class="suhail-dock-btn btn-dock-admin">🛡️ एडमिन</a>
      </div>
    `;
    document.body.appendChild(dock);

    // टच ड्रैग
    let isDragging = false, startX, startY, initLeft, initTop;
    const handle = document.getElementById('dock-handle');

    handle.addEventListener('touchstart', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const rect = dock.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      dock.style.bottom = 'auto'; dock.style.right = 'auto';
      dock.style.left = initLeft + 'px'; dock.style.top = initTop + 'px';
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      dock.style.left = Math.max(10, Math.min(window.innerWidth - dock.offsetWidth - 10, initLeft + dx)) + 'px';
      dock.style.top = Math.max(10, Math.min(window.innerHeight - dock.offsetHeight - 10, initTop + dy)) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', () => isDragging = false);
  }

  // 3. 30 तालीमी टूल्स की मुकम्मल शीट बनाना
  function createEduSheet() {
    if (document.getElementById('suhail-edu-sheet')) return;

    const sheet = document.createElement('div');
    sheet.id = 'suhail-edu-sheet';
    sheet.innerHTML = `
      <div class="edu-sheet-content">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <h3 style="color:#00a884; font-size:0.95rem;"><i class="fa-solid fa-graduation-cap"></i> सोहेल एआई: 30 तालीमी व नह्वी टूल्स</h3>
          <button onclick="closeEduSheet()" style="background:none; border:none; color:#8696a0; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <div style="margin-top:10px;">
          <textarea id="edu-input-text" rows="2" style="width:100%; background:#202c33; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:8px; font-size:0.85rem;" placeholder="यहाँ अरबी/उर्दू इबारत या लफ़्ज़ लिखें..."></textarea>
        </div>
        <div class="edu-tool-grid">
          <div class="edu-tool-item" onclick="runEduTool('suhail_nahw_irab')">1. नह्वी ए'राब विश्लेषक</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_bab_gardan')">2. बाब व गर्दान जनरेटर</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_root_detector')">3. कलिमा माद्दा (मूल अक्षर)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_murakkab_izafi')">4. मुज़ाफ़-इलैह चेकर</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_full_tashkeel')">5. मुकम्मल तश्कील (ए'राब)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_balaghat_maani')">6. बलाग़त व मआनी</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_mantiq_qaziya')">7. मंतिक़ (तर्कशास्त्र) काज़िया</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_usul_fiqh')">8. उसूल-ए-फ़िक़्ह क़ायदा</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_mutala_prep')">9. मुताला तैयारी नोट्स</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_fasih_dialogue')">10. फ़सीह अरबी संवाद</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_mutaradifat')">11. मुतरादिफ़ात (पर्यायवाची)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_maktoob_writing')">12. अरबी खत व मकतूब</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_tazkir_tanis')">13. मुज़क्कर-मुअनस गाइड</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_kitabi_tarjuma')">14. किताबी इल्मी तर्जुमा</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_islamic_english')">15. इस्लामिक अंग्रेज़ी तर्जुमा</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_gharib_alfaz')">16. दुर्लभ शब्द (ग़रीब-उल-अलफ़ाज़)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_author_history')">17. किताब व मुसन्निफ़ संदर्भ</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_sharh_mushkil')">18. कठिन इबारत की शर्ह</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_arbi_urooz')">19. अरबी बहर व तक़्तीअ</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_ikhtilaf_nahw')">20. बसरिय्यीन vs कूफ़िय्यीन</div>
        </div>
        <div id="edu-output-box" style="display:none; background:#182229; border-left:3px solid #00a884; padding:10px; margin-top:12px; border-radius:6px; font-size:0.85rem; line-height:1.5; white-space:pre-wrap;"></div>
      </div>
    `;
    document.body.appendChild(sheet);
  }

  window.openEduSheet = function() {
    createEduSheet();
    document.getElementById('suhail-edu-sheet').style.display = 'flex';
  };
  window.closeEduSheet = function() {
    document.getElementById('suhail-edu-sheet').style.display = 'none';
  };

  window.runEduTool = async function(taskName) {
    const input = document.getElementById('edu-input-text');
    const out = document.getElementById('edu-output-box');
    const val = input.value.trim();
    if (!val) return alert("कृपया पहले ऊपर इबारत या लफ़्ज़ लिखें!");

    out.style.display = 'block';
    out.innerText = "⏳ सोहेल एआई विश्लेषण कर रहा है...";

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName, prompt: val })
      });
      const d = await res.json();
      out.innerText = d.reply || d.text || "जवाब प्राप्त नहीं हो सका।";
    } catch(e) {
      out.innerText = "एरर: " + e.message;
    }
  };

  // 4. टाइपिंग सुझाव व लाइव बैज
  function initHelpers() {
    createDraggableDock();
    createEduSheet();

    // लाइव स्टार और बैज
    const db = window.db || (typeof firebase !== 'undefined' && firebase.apps.length ? firebase.database() : null);
    if (db) {
      db.ref('users').on('value', snap => {
        snap.forEach(child => {
          const u = child.val() || {};
          const roll = String(u.roll || u.rollNumber || child.key).trim();
          if (u.star || u.badge) {
            document.querySelectorAll('div, p, span, h4').forEach(el => {
              if (el.children.length <= 1 && el.innerText && el.innerText.includes(`रोल: ${roll}`)) {
                if (!el.getAttribute('data-badge-done')) {
                  el.setAttribute('data-badge-done', 'true');
                  const star = u.star ? '<span style="color:#eab308; margin-right:3px;">⭐</span>' : '';
                  const badge = u.badge ? `<span style="background:rgba(234,179,8,0.18); color:#eab308; border:1px solid #eab308; padding:1px 5px; border-radius:4px; font-size:0.7rem; margin-right:4px; font-weight:bold;">${u.badge}</span>` : '';
                  el.innerHTML = `${star}${badge} ${el.innerHTML}`;
                }
              }
            });
          }
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', initHelpers);
  setTimeout(initHelpers, 1200);
})();

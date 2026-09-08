// ==========================================================
// 🚀 सोहेल एआई - मुकम्मल UI, लाइव बैज व खंभों वाला लीडरबोर्ड
// ==========================================================

(function() {
  // 1. स्टाइलिंग (Image 3 जैसा डार्क व चमकता हुआ 4-खंभा चार्ट)
  const style = document.createElement('style');
  style.innerHTML = `
    #btn-about-trigger { display: none !important; }
    
    /* ड्रैगेबल डॉक */
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

    /* 📊 4 खंभों वाला लीडरबोर्ड (Image 3 स्टाइल) */
    .suhail-pillar-card {
      background: radial-gradient(circle at 50% 120%, #1c272e 0%, #0b141a 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 14px;
      padding: 16px 12px 12px;
      margin: 20px 10px 80px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .pillar-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
      font-weight: 700;
      color: #e9edef;
      margin-bottom: 35px;
    }
    .pillar-head span { color: #8696a0; font-size: 0.72rem; font-weight: normal; }

    /* ऊपर चढ़ता हुआ तीर (Image 3 जैसा ग्रोथ कर्व) */
    .pillar-svg-curve {
      position: absolute;
      top: 55px;
      left: 15px;
      width: calc(100% - 30px);
      height: 110px;
      pointer-events: none;
      z-index: 1;
      opacity: 0.9;
    }

    .pillar-stage {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 165px;
      position: relative;
      z-index: 2;
      border-bottom: 2px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 2px;
    }
    .pillar-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 65px;
      justify-content: flex-end;
      height: 100%;
    }
    .pillar-details {
      text-align: center;
      font-size: 0.65rem;
      color: #e9edef;
      margin-bottom: 6px;
      line-height: 1.2;
    }
    .pillar-details .stu-name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; }
    .pillar-details .stu-roll { color: #8696a0; font-size: 0.58rem; }
    .pillar-details .stu-xp { color: #eab308; font-weight: 800; font-size: 0.72rem; }

    .pillar-bar-shape {
      width: 78%;
      background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 100%);
      border-top: 2px solid #ffffff;
      border-radius: 5px 5px 0 0;
      box-shadow: 0 0 16px rgba(255, 255, 255, 0.15);
      transition: height 0.8s ease;
    }

    /* तालीमी 30 टूल्स बॉटम शीट */
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
    .edu-tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px; }
    .edu-tool-item { background: #202c33; padding: 10px; border-radius: 8px; font-size: 0.78rem; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; }
  `;
  document.head.appendChild(style);

  // 2. ड्रैगेबल विजेट बनाना
  function createDraggableDock() {
    if (document.getElementById('suhail-drag-dock')) return;

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

  // 3. 30 टूल्स की बॉटम शीट
  function createEduSheet() {
    if (document.getElementById('suhail-edu-sheet')) return;
    const sheet = document.createElement('div');
    sheet.id = 'suhail-edu-sheet';
    sheet.innerHTML = `
      <div class="edu-sheet-content">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <h3 style="color:#00a884; font-size:0.95rem;"><i class="fa-solid fa-graduation-cap"></i> सोहेल एआई: 30 तालीमी टूल्स</h3>
          <button onclick="closeEduSheet()" style="background:none; border:none; color:#8696a0; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <div style="margin-top:10px;">
          <textarea id="edu-input-text" rows="2" style="width:100%; background:#202c33; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:8px; font-size:0.85rem;" placeholder="यहाँ अरबी/उर्दू इबारत या लफ़्ज़ लिखें..."></textarea>
        </div>
        <div class="edu-tool-grid">
          <div class="edu-tool-item" onclick="runEduTool('suhail_nahw_irab')">1. नह्वी ए'राब विश्लेषक</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_bab_gardan')">2. बाब व गर्दान जनरेटर</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_root_detector')">3. कलिमा माद्दा (मूल अक्षर)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_full_tashkeel')">4. मुकम्मल तश्कील (ए'राब)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_balaghat_maani')">5. बलाग़त व मआनी</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_mantiq_qaziya')">6. मंतिक़ (तर्कशास्त्र) काज़िया</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_usul_fiqh')">7. उसूल-ए-फ़िक़्ह क़ायदा</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_kitabi_tarjuma')">8. किताबी इल्मी तर्जुमा</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_mutaradifat')">9. मुतरादिफ़ात (समानार्थी)</div>
          <div class="edu-tool-item" onclick="runEduTool('suhail_sharh_mushkil')">10. कठिन इबारत की शर्ह</div>
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
    if (!val) return alert("कृपया पहले ऊपर इबारत लिखें!");
    out.style.display = 'block';
    out.innerText = "⏳ सोहेल एआई विश्लेषण कर रहा है...";
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName, prompt: val })
      });
      const d = await res.json();
      out.innerText = d.reply || d.text || "जवाब प्राप्त नहीं हुआ।";
    } catch(e) { out.innerText = "एरर: " + e.message; }
  };

  // 4. खंभों वाले लीडरबोर्ड का निर्माण (Image 3 स्टाइल)
  function renderPillars(users) {
    let container = document.getElementById('suhail-pillar-leaderboard');
    if (!container) {
      container = document.createElement('div');
      container.id = 'suhail-pillar-leaderboard';
      container.className = 'suhail-pillar-card';
      container.innerHTML = `
        <div class="pillar-head">
          <div><i class="fa-solid fa-chart-simple" style="color:#eab308; margin-right:6px;"></i> तालीमी तरक़्क़ी व इल्मी मुक़ाबला</div>
          <span>Live Rank ⚡</span>
        </div>
        <svg class="pillar-svg-curve" viewBox="0 0 300 110" preserveAspectRatio="none">
          <path d="M 20,100 Q 150,75 280,12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <polyline points="268,12 280,12 280,24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <div class="pillar-stage" id="pillar-stage-box"></div>
      `;
      // छात्र लिस्ट के ठीक नीचे जोड़ें
      const chatArea = document.querySelector('#chats') || document.querySelector('.chat-list') || document.body;
      chatArea.appendChild(container);
    }

    const sorted = Object.values(users || {}).sort((a, b) => (parseInt(b.xp) || 0) - (parseInt(a.xp) || 0));
    // 4 खंभे (चढ़ते क्रम में: 4थी रैंक -> 3री -> 2री -> 1ली)
    const displayList = [sorted[3], sorted[2], sorted[1], sorted[0]];
    const heights = ['38px', '70px', '108px', '148px'];

    const box = document.getElementById('pillar-stage-box');
    if (!box) return;
    box.innerHTML = '';

    displayList.forEach((stu, i) => {
      const name = stu ? (stu.name || 'तालिब') : '-';
      const roll = stu ? (stu.roll || stu.rollNumber || '') : '';
      const xp = stu ? (stu.xp || 0) : 0;
      box.innerHTML += `
        <div class="pillar-column">
          <div class="pillar-details">
            <div class="stu-xp">⚡ ${xp}</div>
            <div class="stu-name">${name}</div>
            <div class="stu-roll">${roll ? 'रोल: ' + roll : ''}</div>
          </div>
          <div class="pillar-bar-shape" style="height:${stu ? heights[i] : '15px'};"></div>
        </div>
      `;
    });
  }

  // 5. लाइव स्टार, बैज और मेडल रिप्लेसर
  function liveSyncBadgesAndPillars() {
    const db = window.db || (typeof firebase !== 'undefined' && firebase.apps.length ? firebase.database() : null);
    if (!db) return;

    db.ref('users').on('value', snap => {
      const users = snap.val() || {};
      renderPillars(users);

      snap.forEach(child => {
        const u = child.val() || {};
        const roll = String(u.roll || u.rollNumber || child.key).trim();

        if (u.star || u.badge) {
          // स्क्रीन पर मौजूद रोल नंबर ढूँढें
          document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && el.innerText && el.innerText.includes(`रोल: ${roll}`)) {
              const row = el.closest('div[class*="chat"]') || el.parentElement;
              if (row && !row.getAttribute('data-badge-applied')) {
                row.setAttribute('data-badge-applied', 'true');

                // पुराने 🥈 या 🥇 मेडल को हटाकर असली स्टार और बैज लगाना
                let html = el.innerHTML;
                html = html.replace(/[🥇🥈🥉]/g, ''); // पुराना मेडल साफ़

                const starIcon = u.star ? '<span style="color:#eab308; font-size:0.95rem; margin-right:4px;">⭐</span>' : '';
                const badgePill = u.badge ? `<span style="background:rgba(234,179,8,0.2); color:#eab308; border:1px solid #eab308; padding:2px 6px; border-radius:6px; font-size:0.68rem; font-weight:bold; margin-right:5px;">${u.badge}</span>` : '';

                el.innerHTML = `${starIcon}${badgePill}${html.trim()}`;
              }
            }
          });
        }
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    createDraggableDock();
    createEduSheet();
    liveSyncBadgesAndPillars();
  });
  setInterval(liveSyncBadgesAndPillars, 2000);
})();

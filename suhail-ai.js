// ==========================================================
// 🚀 सोहेल एआई - इमरजेंसी नोटिस, चैट लिस्ट कार्ड्स व खंभों वाला चार्ट
// ==========================================================

(function() {
  // 1. स्टाइलिंग
  const style = document.createElement('style');
  style.innerHTML = `
    /* नीचे के पुराने फिक्स्ड बटनों को स्क्रीन से हटाना (चैट में कार्ड के रूप में बदलेंगे) */
    body > div > a[href*="admin"], 
    body > div > button:has-text("सुपर एडमिन"),
    div[style*="position: fixed"][style*="bottom"] {
      /* पुराना क्लटर साफ़ */
    }

    /* 📢 24 घंटे का इमरजेंसी स्टार नोटिस बैनर */
    #suhail-emergency-banner {
      background: linear-gradient(90deg, #1c1917 0%, #292524 50%, #1c1917 100%);
      border: 1px solid #eab308;
      border-left: 5px solid #eab308;
      border-radius: 8px;
      padding: 10px 14px;
      margin: 10px 12px 14px;
      color: #fef08a;
      font-size: 0.82rem;
      display: none;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 18px rgba(234, 179, 8, 0.2);
      animation: pulseGlow 2s infinite ease-in-out;
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 10px rgba(234, 179, 8, 0.2); }
      50% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.45); }
    }

    /* 💬 चैट लिस्ट के अंदर लगने वाले दो नए कार्ड्स */
    .suhail-chat-card {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      margin: 8px 12px;
      background: #111b21;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      text-decoration: none;
      color: #e9edef;
      cursor: pointer;
      transition: background 0.2s;
    }
    .suhail-chat-card:hover { background: #182229; }
    .card-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .card-details h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; }
    .card-details p { font-size: 0.75rem; color: #8696a0; }

    /* 📊 4 खंभों वाला लीडरबोर्ड (Image 3 स्टाइल) */
    .suhail-pillar-card {
      background: radial-gradient(circle at 50% 120%, #1c272e 0%, #0b141a 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 14px;
      padding: 18px 12px 14px;
      margin: 20px 12px 90px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    }
    .pillar-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: #e9edef;
      margin-bottom: 35px;
    }
    .pillar-head span { color: #8696a0; font-size: 0.72rem; font-weight: normal; }

    /* सफ़ेद ग्रोथ कर्व (तीर) */
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

    /* ड्रैगेबल फ्लोटिंग डॉक */
    .suhail-draggable-dock {
      position: fixed;
      bottom: 25px;
      right: 15px;
      z-index: 9999;
      display: flex;
      gap: 6px;
      touch-action: none;
      user-select: none;
      background: rgba(32, 44, 51, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 6px 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
    }
    .suhail-dock-btn {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.76rem;
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
    .drag-grip { color: #8696a0; font-size: 0.8rem; cursor: grab; align-self: center; padding: 0 4px; }
  `;
  document.head.appendChild(style);

  // 2. नीचे के पुराने फिक्स्ड बटनों को छिपाना
  function hideOldFixedButtons() {
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && (el.innerText === '30 AI खिदमात' || el.innerText === 'सुपर एडमिन')) {
        const p = el.closest('div') || el.closest('button') || el;
        if (p && (window.getComputedStyle(p).position === 'fixed' || p.style.position === 'fixed')) {
          p.style.display = 'none';
        }
      }
    });
  }

  // 3. चैट लिस्ट में दोनों बटनों को चैट कार्ड बनाकर लगाना
  function insertChatCards() {
    if (document.getElementById('card-awam-chat')) return;

    // AI उस्ताद वाले कार्ड के नीचे या स्टेटस के नीचे जगह तलाशें
    const searchBar = document.querySelector('input[placeholder*="चैट या सबक"]') || document.querySelector('.search-bar');
    const filterRow = document.querySelector('.filter-chips') || document.querySelector('.chat-filters');
    const target = filterRow ? filterRow.nextElementSibling : (searchBar ? searchBar.nextElementSibling : null);

    const cardContainer = document.createElement('div');
    cardContainer.id = 'card-awam-chat';
    cardContainer.innerHTML = `
      <!-- कार्ड 1: 40 आवामी खिदमात -->
      <a href="/awam.html" class="suhail-chat-card">
        <div class="card-icon-box" style="background:rgba(0,168,132,0.15); color:#00a884;">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <div class="card-details">
          <h4>🏛️ 40 आवामी व सामाजिक खिदमात <span style="font-size:0.68rem; background:#00a884; color:#fff; padding:1px 6px; border-radius:10px;">पोर्टल</span></h4>
          <p>सरकारी योजनाएँ, दुकानदारी खाता-बही, प्राथमिक उपचार व टेक हेल्प</p>
        </div>
      </a>

      <!-- कार्ड 2: सुपर एडमिन हब -->
      <a href="/admin.html" class="suhail-chat-card">
        <div class="card-icon-box" style="background:rgba(234,179,8,0.15); color:#eab308;">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div class="card-details">
          <h4>🛡️ सुपर एडमिन कंट्रोल पैनल <span style="font-size:0.68rem; background:#eab308; color:#000; padding:1px 6px; border-radius:10px;">एडमिन</span></h4>
          <p>तलबा हाज़िरी, स्टार व बैज, स्ट्राइक, क्लास चैट व AI इम्तिहान</p>
        </div>
      </a>
    `;

    if (target && target.parentNode) {
      target.parentNode.insertBefore(cardContainer, target);
    } else {
      const chatArea = document.querySelector('#chats') || document.querySelector('.chat-list') || document.body;
      chatArea.prepend(cardContainer);
    }
  }

  // 4. 24 घंटे का इमरजेंसी स्टार नोटिस बैनर
  function setupEmergencyBanner(users) {
    let banner = document.getElementById('suhail-emergency-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'suhail-emergency-banner';
      const topPlacement = document.querySelector('.top-header') || document.querySelector('nav') || document.body;
      topPlacement.parentNode.insertBefore(banner, topPlacement.nextSibling);
    }

    // ऐसा छात्र ढूँढें जिसके पास हाल ही में स्टार या बैज लगा हो
    let latestStarUser = null;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 घंटे

    Object.values(users || {}).forEach(u => {
      if (u.star || u.badge) {
        // यदि 24 घंटे के अंदर अपडेट हुआ हो (या सीधा स्टार हो)
        if (!u.updatedAt || (now - u.updatedAt < ONE_DAY)) {
          latestStarUser = u;
        }
      }
    });

    if (latestStarUser) {
      const roll = latestStarUser.roll || latestStarUser.rollNumber || '';
      const name = latestStarUser.name || 'तालिब';
      const badge = latestStarUser.badge || 'मुमताज़ तालिब-ए-इल्म 🌟';
      banner.innerHTML = `
        <span style="font-size:1.3rem;">📢</span>
        <div>
          <strong>शाही इल्मी एज़ाज़ (24 घंटे का शाही नोटिस):</strong><br>
          मुबारकबाद! रोल <strong>${roll}</strong> (${name}) को उस्ताद की तरफ़ से <strong>⭐ ${badge}</strong> से नवाज़ा गया है!
        </div>
      `;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  // 5. 4 खंभों वाला लीडरबोर्ड (Image 3 हू-ब-हू)
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
      const chatArea = document.querySelector('#chats') || document.querySelector('.chat-list') || document.body;
      chatArea.appendChild(container);
    }

    const sorted = Object.values(users || {}).sort((a, b) => (parseInt(b.xp) || 0) - (parseInt(a.xp) || 0));
    // 4 खंभे चढ़ते क्रम में (Rank 4 -> Rank 3 -> Rank 2 -> Rank 1)
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

  // 6. ड्रैगेबल फ्लोटिंग कैप्सूल
  function createDraggableDock() {
    if (document.getElementById('suhail-drag-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'suhail-drag-dock';
    dock.className = 'suhail-draggable-dock';
    dock.innerHTML = `
      <span class="drag-grip" id="dock-grip"><i class="fa-solid fa-grip-vertical"></i></span>
      <button class="suhail-dock-btn btn-dock-edu" onclick="openEduSheet()"><i class="fa-solid fa-graduation-cap"></i> 30 टूल्स</button>
      <a href="/awam.html" class="suhail-dock-btn btn-dock-awam">🏛️ आवामी</a>
      <a href="/admin.html" class="suhail-dock-btn btn-dock-admin">🛡️ एडमिन</a>
    `;
    document.body.appendChild(dock);

    let isDragging = false, startX, startY, initLeft, initTop;
    const grip = document.getElementById('dock-grip');

    dock.addEventListener('touchstart', (e) => {
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

  // 7. डेटाबेस सिंक
  function initSync() {
    hideOldFixedButtons();
    insertChatCards();
    createDraggableDock();

    const db = window.db || (typeof firebase !== 'undefined' && firebase.apps.length ? firebase.database() : null);
    if (!db) return;

    db.ref('users').on('value', snap => {
      const users = snap.val() || {};
      setupEmergencyBanner(users);
      renderPillars(users);

      // अगर किसी छात्र को स्टार मिला है तो उसके नाम के आगे ⭐ और बैज लाइव लगाना
      snap.forEach(child => {
        const u = child.val() || {};
        const roll = String(u.roll || u.rollNumber || child.key).trim();
        if (u.star || u.badge) {
          document.querySelectorAll('div, p, span, h4').forEach(el => {
            if (el.children.length <= 1 && el.innerText && el.innerText.includes(`रोल: ${roll}`)) {
              if (!el.getAttribute('data-badge-done')) {
                el.setAttribute('data-badge-done', 'true');
                let html = el.innerHTML.replace(/[🥇🥈🥉]/g, '');
                const star = u.star ? '<span style="color:#eab308; margin-right:3px;">⭐</span>' : '';
                const badge = u.badge ? `<span style="background:rgba(234,179,8,0.2); color:#eab308; border:1px solid #eab308; padding:1px 5px; border-radius:4px; font-size:0.7rem; margin-right:4px; font-weight:bold;">${u.badge}</span>` : '';
                el.innerHTML = `${star}${badge} ${html.trim()}`;
              }
            }
          });
        }
      });
    });
  }

  window.addEventListener('DOMContentLoaded', initSync);
  setTimeout(initSync, 1000);
  setInterval(hideOldFixedButtons, 2000);
})();

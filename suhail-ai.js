// ==========================================================
// 🚀 सोहेल एआई: मुकम्मल 5-बटन डॉक + शाही नोटिस + सनद बोर्ड
// ==========================================================

(function () {
  "use strict";

  // 1. पुरानी किसी भी साइडबार/टूटे हुए लेआउट को स्क्रीन से तुरंत हटाना
  var oldBoard = document.getElementById('suhail-awards-board');
  if (oldBoard && oldBoard.parentElement === document.body) {
    oldBoard.remove();
  }

  // 2. स्टाइलिंग (स्क्रीन कभी दो फाड़ नहीं होगी)
  var style = document.createElement('style');
  style.id = 'suhail-perfect-style';
  style.innerHTML = `
    /* स्क्रीन को हमेशा 100% चौड़ा और सीधा रखना */
    html, body {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }

    /* कोने वाले पुराने दोनों बटनों को हमेशा के लिए छिपाना */
    body > div:has(> a[href*="admin"]),
    body > div:has(> button[onclick*="admin"]),
    button:has(.fa-book):not(.suhail-mini-btn),
    a:has(.fa-book):not(.suhail-mini-btn) {
      display: none !important;
    }

    /* 🎮 पहला वाला: 5-बटन ड्रैगेबल विजेट (सुरक्षित व चालू) */
    #suhail-5btn-dock {
      position: fixed !important;
      bottom: 20px !important;
      right: 10px !important;
      z-index: 2147483640 !important;
      display: flex !important;
      align-items: center;
      gap: 4px;
      background: rgba(17, 27, 33, 0.96) !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      border-radius: 25px !important;
      padding: 3px 6px !important;
      box-shadow: 0 4px 18px rgba(0,0,0,0.7) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      touch-action: none;
      user-select: none;
      max-width: 95vw;
    }
    .suhail-drag-handle { color: #8696a0; font-size: 0.8rem; cursor: grab; padding: 0 4px; }
    .suhail-mini-btn {
      padding: 4px 7px;
      border-radius: 12px;
      font-size: 0.65rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      text-decoration: none;
      white-space: nowrap;
      line-height: 1;
    }
    .btn-m-old30 { background: #00a884; color: #fff; }
    .btn-m-awam  { background: rgba(0, 168, 132, 0.2); color: #00a884; border: 1px solid rgba(0,168,132,0.4); }
    .btn-m-edu   { background: #182229; color: #3b82f6; border: 1px solid rgba(59,130,246,0.4); }
    .btn-m-info  { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.35); }
    .btn-m-admin { background: #202c33; color: #eab308; border: 1px solid #eab308; display: none; }

    /* 📜 तीसरा: अब्दुल गफ़्फ़ार के नीचे सनद बोर्ड (सीधी लिस्ट में) */
    #suhail-awards-board {
      width: calc(100% - 20px) !important;
      max-width: 100% !important;
      margin: 15px auto 95px !important;
      background: #111b21 !important;
      border: 1px solid rgba(234, 179, 8, 0.35) !important;
      border-radius: 14px !important;
      padding: 16px 14px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5) !important;
      box-sizing: border-box !important;
      display: block !important;
      clear: both !important;
    }
    .awards-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .award-student-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #182229;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
  `;
  document.head.appendChild(style);

  // 3. पहला वाला: 5-बटन ड्रैगेबल विजेट बनाना
  function buildDock() {
    if (document.getElementById('suhail-5btn-dock')) return;

    var dock = document.createElement('div');
    dock.id = 'suhail-5btn-dock';
    dock.innerHTML = `
      <div class="suhail-drag-handle" id="dock-grip"><i class="fa-solid fa-grip-vertical"></i></div>
      <a href="/awam.html" class="suhail-mini-btn btn-m-old30"><i class="fa-solid fa-book"></i> 30 AI</a>
      <a href="/awam.html" class="suhail-mini-btn btn-m-awam"><i class="fa-solid fa-layer-group"></i> 40 आवामी</a>
      <button class="suhail-mini-btn btn-m-edu" onclick="alert('30 इल्मी टूल्स: नह्व, सर्फ़, गर्दान व तश्कील टूल्स सक्रिय हैं!')"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी</button>
      <button class="suhail-mini-btn btn-m-info" onclick="alert('📖 जमात ऊला: क्विज़ से XP कमाएँ। 3 स्ट्राइक पर आईडी ब्लॉक होगी।')"><i class="fa-solid fa-circle-info"></i> गाइड</button>
      <a href="/admin.html" class="suhail-mini-btn btn-m-admin" id="dock-admin-link"><i class="fa-solid fa-shield-halved"></i> एडमिन</a>
    `;
    document.body.appendChild(dock);

    // एडमिन बटन सिर्फ़ रोल 7877 के लिए दृश्य
    var bodyText = document.body.innerText || '';
    if (bodyText.indexOf('7877') !== -1 || localStorage.getItem('roll') === '7877') {
      var aBtn = document.getElementById('dock-admin-link');
      if (aBtn) aBtn.style.display = 'flex';
    }

    // टच ड्रैग लॉजिक (उंगली से जहाँ चाहें खिसकाएँ)
    var isDragging = false, startX, startY, initLeft, initTop;
    dock.addEventListener('touchstart', function(e) {
      if (e.target.closest('button') || e.target.closest('a')) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      var rect = dock.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      dock.style.bottom = 'auto'; dock.style.right = 'auto';
      dock.style.left = initLeft + 'px'; dock.style.top = initTop + 'px';
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      dock.style.left = Math.max(5, Math.min(window.innerWidth - dock.offsetWidth - 5, initLeft + dx)) + 'px';
      dock.style.top = Math.max(5, Math.min(window.innerHeight - dock.offsetHeight - 5, initTop + dy)) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', function() { isDragging = false; });
  }

  // 4. दूसरा: 24 घंटे का शाही नोटिस पॉपअप
  var noticeDone = false;
  function showAwardNotice() {
    if (noticeDone || document.getElementById('suhail-notice-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'suhail-notice-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:18px;';
    modal.innerHTML = `
      <div style="background:linear-gradient(145deg, #1c1917, #261f0d, #111b21); border:2px solid #eab308; border-radius:16px; max-width:390px; width:100%; padding:22px 18px; color:#fef08a; text-align:center; box-shadow:0 10px 30px rgba(234,179,8,0.35); box-sizing:border-box;">
        <div style="font-size:2.4rem; margin-bottom:6px;">🌟</div>
        <h3 style="color:#fde68a; font-size:1.05rem; margin-bottom:8px; font-weight:800;">📢 उस्ताद की जानिब से शाही इल्मी नोटिस</h3>
        <p style="font-size:0.82rem; color:#e9edef; line-height:1.6; margin-bottom:10px;">
          मुबारकबाद! मोहतमिम व उस्ताद <strong>(Suhail Husain)</strong> की तरफ़ से:<br>
          <strong>Kaif raza qadri</strong> (रोल नंबर: <strong>6975</strong>)
        </p>
        <div style="display:inline-block; background:rgba(234,179,8,0.2); border:1px solid #eab308; color:#fef08a; padding:5px 14px; border-radius:20px; font-size:0.86rem; font-weight:800; margin-bottom:12px;">⭐ मुमताज़ तालिब-ए-इल्म 🌟</div>
        <p style="font-size:0.75rem; color:#8696a0; margin-bottom:14px;">उम्दा पढ़ाई और बेहतरीन तालीमी लगन पर यह एज़ाज़ अता किया गया है।</p>
        <button id="btn-close-notice" style="background:#eab308; color:#000; border:none; padding:9px 24px; border-radius:20px; font-weight:800; font-size:0.85rem; cursor:pointer;">माशाअल्लाह (क़बूल करें)</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-notice').onclick = function() {
      modal.remove();
    };
    noticeDone = true;
  }

  // 5. तीसरा: तफ़सीली सनद बोर्ड (सीधे अब्दुल गफ़्फ़ार के नीचे, कोई साइडबार नहीं)
  function insertAwardsBoard() {
    if (document.getElementById('suhail-awards-board')) return;

    // अब्दुल गफ़्फ़ार (रोल 6989) का कार्ड तलाशें
    var all = document.querySelectorAll('div, li, a');
    var abdulGaffarCard = null;
    for (var i = 0; i < all.length; i++) {
      var t = all[i].textContent || '';
      if (t.indexOf('6989') !== -1 && t.indexOf('abdul gaffar') !== -1) {
        if (all[i].children.length < 8) {
          abdulGaffarCard = all[i];
        }
      }
    }

    var board = document.createElement('div');
    board.id = 'suhail-awards-board';
    board.innerHTML = `
      <div class="awards-header">
        <div style="color:#eab308; font-size:0.88rem; font-weight:800;"><i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड</div>
        <span style="font-size:0.68rem; color:#8696a0;">उस्ताद की सनद</span>
      </div>
      <div style="font-size:0.72rem; color:#8696a0; margin-bottom:10px; text-align:left;">
        उस्ताद (Suhail Husain) की जानिब से नवाज़े गए मुमताज़ तलबा की मुकम्मल तफ़सील:
      </div>
      <div>
        <div class="award-student-card">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">Kaif raza qadri (रोल: 6975)</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">350 XP</strong></span>
          </div>
          <div style="background:rgba(234,179,8,0.15); border:1px solid #eab308; color:#fef08a; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">⭐ मुमताज़ तालिब-ए-इल्म 🌟</div>
        </div>
        <div class="award-student-card">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">Suhail Husain (रोल: 7877)</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">480 XP</strong></span>
          </div>
          <div style="background:rgba(59,130,246,0.15); border:1px solid #3b82f6; color:#93c5fd; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">👑 मोहतमिम व उस्ताद</div>
        </div>
      </div>
    `;

    // इसे सीधे अब्दुल गफ़्फ़ार के ठीक बाद उसी लिस्ट के अंदर जोड़ें
    if (abdulGaffarCard && abdulGaffarCard.parentNode) {
      abdulGaffarCard.parentNode.appendChild(board);
    } else {
      var c = document.querySelector('#chats') || document.querySelector('.chat-list');
      if (c) c.appendChild(board);
    }
  }

  // 6. पुराने कोने वाले बटनों को छिपाना
  function hideOldButtons() {
    var all = document.querySelectorAll('button, a');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.closest && el.closest('#suhail-5btn-dock')) continue;
      var t = (el.innerText || el.textContent || '').trim();
      if (t === '📚 30 AI खिदमात' || t === '30 AI खिदमात' || t === '🛡️ सुपर एडमिन' || t === 'सुपर एडमिन') {
        var p = el.parentElement;
        if (p && p !== document.body && window.getComputedStyle(p).position === 'fixed') {
          p.style.display = 'none';
        }
        el.style.display = 'none';
      }
    }
  }

  // 7. सब कुछ शुरू करना
  function start() {
    hideOldButtons();
    buildDock();
    insertAwardsBoard();
    showAwardNotice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  setInterval(function () {
    hideOldButtons();
    if (!document.getElementById('suhail-awards-board')) insertAwardsBoard();
  }, 1200);
})();

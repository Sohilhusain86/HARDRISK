// ==========================================================
// 🚀 सोहेल एआई: 5-बटन डॉक + शाही नोटिस + सनद बोर्ड (Zero Screen Break)
// ==========================================================

(function () {
  "use strict";

  // 1. स्टाइलिंग (स्क्रीन कभी दो फाड़ नहीं होगी)
  var style = document.createElement('style');
  style.id = 'suhail-clean-system-style';
  style.innerHTML = `
    /* 📜 अब्दुल गफ़्फ़ार के ठीक नीचे सनद बोर्ड (चैट लिस्ट के अंदर) */
    #suhail-awards-board {
      width: calc(100% - 16px) !important;
      margin: 14px 8px 85px !important;
      background: #111b21 !important;
      border: 1px solid rgba(234, 179, 8, 0.35) !important;
      border-radius: 12px !important;
      padding: 14px 12px !important;
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
      padding-bottom: 7px;
      margin-bottom: 10px;
    }
    .awards-title {
      color: #eab308;
      font-size: 0.88rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .award-student-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #182229;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 9px 11px;
      margin-bottom: 7px;
    }
    .award-tag {
      background: rgba(234, 179, 8, 0.15);
      border: 1px solid #eab308;
      color: #fef08a;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 0.7rem;
      font-weight: bold;
      white-space: nowrap;
    }

    /* 🎮 पहला वाला: 5-बटन ड्रैगेबल विजेट */
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
  `;
  document.head.appendChild(style);

  // 2. पहला वाला: 5-बटन ड्रैगेबल विजेट
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

    // टच ड्रैग
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

  // 3. दूसरा: 24 घंटे का शाही नोटिस पॉपअप
  var noticeOpened = false;
  function showAwardNotice() {
    if (noticeOpened || document.getElementById('suhail-notice-modal')) return;

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
    noticeOpened = true;
  }

  // 4. तीसरा: तफ़सीली सनद बोर्ड (अब्दुल गफ़्फ़ार के नीचे ही सुरक्षित लगाना)
  function insertAwardsBoard() {
    if (document.getElementById('suhail-awards-board')) return;

    // अब्दुल गफ़्फ़ार (रोल 6989) का कार्ड ढूँढकर सीधे उसी की लिस्ट में जोड़ना
    var abdulGaffarCard = null;
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = all[i].textContent || '';
      if (t.indexOf('6989') !== -1 && t.indexOf('abdul gaffar') !== -1) {
        if (all[i].children.length < 8) {
          abdulGaffarCard = all[i];
        }
      }
    }

    if (!abdulGaffarCard || !abdulGaffarCard.parentElement) return;

    var board = document.createElement('div');
    board.id = 'suhail-awards-board';
    board.innerHTML = `
      <div class="awards-header">
        <div class="awards-title"><i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड</div>
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
          <div class="award-tag">⭐ मुमताज़ तालिब-ए-इल्म 🌟</div>
        </div>
        <div class="award-student-card">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">Suhail Husain (रोल: 7877)</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">480 XP</strong></span>
          </div>
          <div class="award-tag" style="border-color:#3b82f6; color:#93c5fd; background:rgba(59,130,246,0.15);">👑 मोहतमिम व उस्ताद</div>
        </div>
      </div>
    `;

    abdulGaffarCard.parentElement.appendChild(board);
  }

  // 5. कैफ़ रज़ा के आगे बैज लगाना
  function updateKaifBadge() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length > 2) continue;
      if (el.closest && (el.closest('#suhail-5btn-dock') || el.closest('#suhail-awards-board') || el.closest('#suhail-notice-modal'))) continue;

      var t = (el.innerText || el.textContent || '').trim();
      if (t.indexOf('6975') !== -1 && t.indexOf('Kaif') !== -1) {
        if (!el.getAttribute('data-badge-applied')) {
          el.setAttribute('data-badge-applied', 'true');
          el.innerHTML = '<span style="color:#eab308; font-size:1rem; margin-right:4px;">⭐</span><span style="background:rgba(234,179,8,0.22); color:#fef08a; border:1px solid #eab308; padding:1px 6px; border-radius:5px; font-size:0.7rem; font-weight:bold; margin-right:5px;">मुमताज़ तालिब-ए-इल्म 🌟</span>' + el.innerHTML.replace(/🥈/g, '').trim();
        }
        break;
      }
    }
  }

  // रन
  function boot() {
    buildDock();
    insertAwardsBoard();
    updateKaifBadge();
    setTimeout(showAwardNotice, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  setInterval(function () {
    insertAwardsBoard();
    updateKaifBadge();
  }, 1000);
})();

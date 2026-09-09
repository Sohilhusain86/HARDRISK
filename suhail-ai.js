// ==========================================================
// 🚀 सोहेल एआई: असली टूल्स मोडल + लाइव फ़ायरबेस + डायनामिक सनद बोर्ड
// ==========================================================

(function () {
  "use strict";

  // 1. स्टाइलिंग (प्रीमियम डार्क/गोल्ड थीम)
  var style = document.createElement('style');
  style.id = 'suhail-core-style';
  style.innerHTML = `
    /* 🎮 5-बटन ड्रैगेबल स्लिम विजेट */
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
      padding: 5px 8px;
      border-radius: 12px;
      font-size: 0.65rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      white-space: nowrap;
      line-height: 1;
    }
    .btn-m-old30 { background: #00a884; color: #fff; }
    .btn-m-awam  { background: rgba(0, 168, 132, 0.2); color: #00a884; border: 1px solid rgba(0,168,132,0.4); }
    .btn-m-edu   { background: #182229; color: #3b82f6; border: 1px solid rgba(59,130,246,0.4); }
    .btn-m-info  { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.35); }
    .btn-m-admin { background: #202c33; color: #eab308; border: 1px solid #eab308; display: none; }

    /* 📜 डायनामिक तालीमी सनद बोर्ड */
    #suhail-awards-board {
      width: calc(100% - 16px) !important;
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

    /* 🌟 प्रीमियम शाही नोटिस मोडल */
    #suhail-notice-modal, #suhail-guide-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      box-sizing: border-box;
    }
    .suhail-pop-box {
      background: linear-gradient(145deg, #1c1917, #261f0d, #111b21);
      border: 2px solid #eab308;
      border-radius: 16px;
      max-width: 400px;
      width: 100%;
      padding: 22px 18px;
      color: #fef08a;
      text-align: center;
      box-shadow: 0 10px 30px rgba(234,179,8,0.35);
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);

  // 2. असली 30 टूल्स मोडल खोलने का फ़ंक्शन
  window.openOriginalToolsModal = function () {
    var modal = document.getElementById('ai-toolkit-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.zIndex = '2147483645';
    } else {
      window.location.href = '/awam.html';
    }
  };

  // 3. प्रीमियम गाइड मोडल (बिना किसी भद्दे ब्राउज़र अलर्ट के)
  window.openCustomGuide = function () {
    var oldGuide = document.getElementById('suhail-guide-modal');
    if (oldGuide) oldGuide.remove();

    var gModal = document.createElement('div');
    gModal.id = 'suhail-guide-modal';
    gModal.innerHTML = `
      <div class="suhail-pop-box" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(234,179,8,0.3); padding-bottom:8px; margin-bottom:12px;">
          <h3 style="margin:0; font-size:1.05rem; color:#fde68a;">📖 तालीमी रहनुमाई व उसूल</h3>
          <span onclick="document.getElementById('suhail-guide-modal').remove()" style="cursor:pointer; font-size:1.2rem; color:#8696a0;">✕</span>
        </div>
        <ul style="font-size:0.8rem; color:#e9edef; line-height:1.7; padding-left:18px; margin:0 0 15px 0;">
          <li><strong>क्विज़ व मुताला:</strong> रोज़ाना सवालात के सही जवाब देकर XP और रैंक बढ़ाएँ।</li>
          <li><strong>एज़ाज़ात व सनद:</strong> उम्दा कारकर्दगी पर उस्ताद (Suhail Husain) की तरफ़ से स्टार व बैज दिए जाते हैं।</li>
          <li><strong>ज़ब्त व क़ानून:</strong> क्लासरूम में गैर-तालीमी बातचीत पर स्ट्राइक मिलेगी। 3 स्ट्राइक पर आईडी ब्लॉक होगी।</li>
        </ul>
        <button onclick="document.getElementById('suhail-guide-modal').remove()" style="width:100%; background:#eab308; color:#000; border:none; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">समझ गया (वापस जाएँ)</button>
      </div>
    `;
    document.body.appendChild(gModal);
  };

  // 4. 5-बटन ड्रैगेबल विजेट बनाना
  function buildDock() {
    if (document.getElementById('suhail-5btn-dock')) return;

    var dock = document.createElement('div');
    dock.id = 'suhail-5btn-dock';
    dock.innerHTML = `
      <div class="suhail-drag-handle" id="dock-grip"><i class="fa-solid fa-grip-vertical"></i></div>
      <button class="suhail-mini-btn btn-m-old30" onclick="window.openOriginalToolsModal()"><i class="fa-solid fa-book"></i> 30 AI</button>
      <a href="/awam.html" class="suhail-mini-btn btn-m-awam"><i class="fa-solid fa-layer-group"></i> 40 आवामी</a>
      <button class="suhail-mini-btn btn-m-edu" onclick="window.openOriginalToolsModal()"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी</button>
      <button class="suhail-mini-btn btn-m-info" onclick="window.openCustomGuide()"><i class="fa-solid fa-circle-info"></i> गाइड</button>
      <a href="/admin.html" class="suhail-mini-btn btn-m-admin" id="dock-admin-link"><i class="fa-solid fa-shield-halved"></i> एडमिन</a>
    `;
    document.body.appendChild(dock);

    // सिर्फ़ एडमिन (7877) को एडमिन बटन दिखेगा
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

  // 5. लाइव शाही नोटिस (डेटाबेस से असली स्टार वाले छात्र के लिए)
  var lastNotifiedRoll = null;
  function showLiveNotice(student) {
    if (!student || lastNotifiedRoll === student.roll) return;
    if (document.getElementById('suhail-notice-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'suhail-notice-modal';
    modal.innerHTML = `
      <div class="suhail-pop-box">
        <div style="font-size:2.4rem; margin-bottom:6px;">🌟</div>
        <h3 style="color:#fde68a; font-size:1.05rem; margin-bottom:8px; font-weight:800;">📢 उस्ताद की जानिब से शाही इल्मी नोटिस</h3>
        <p style="font-size:0.82rem; color:#e9edef; line-height:1.6; margin-bottom:10px;">
          मुबारकबाद! मोहतमिम व उस्ताद <strong>(Suhail Husain)</strong> की तरफ़ से:<br>
          <strong>${student.name}</strong> (रोल नंबर: <strong>${student.roll}</strong>)
        </p>
        <div style="display:inline-block; background:rgba(234,179,8,0.2); border:1px solid #eab308; color:#fef08a; padding:5px 14px; border-radius:20px; font-size:0.86rem; font-weight:800; margin-bottom:12px;">
          ⭐ ${student.badge || 'मुमताज़ तालिब-ए-इल्म 🌟'}
        </div>
        <p style="font-size:0.75rem; color:#8696a0; margin-bottom:14px;">उम्दा पढ़ाई और बेहतरीन तालीमी लगन पर यह एज़ाज़ अता किया गया है।</p>
        <button onclick="document.getElementById('suhail-notice-modal').remove()" style="background:#eab308; color:#000; border:none; padding:9px 24px; border-radius:20px; font-weight:800; font-size:0.85rem; cursor:pointer;">माशाअल्लाह (क़बूल करें)</button>
      </div>
    `;
    document.body.appendChild(modal);
    lastNotifiedRoll = student.roll;
  }

  // 6. असली लाइव डेटा से सनद बोर्ड बनाना (कोई डमी नहीं)
  function renderLiveAwardsBoard(usersList) {
    var board = document.getElementById('suhail-awards-board');
    if (!board) {
      board = document.createElement('div');
      board.id = 'suhail-awards-board';

      // अब्दुल गफ़्फ़ार के कार्ड के नीचे जोड़ना
      var target = null;
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = all[i].textContent || '';
        if (t.indexOf('6989') !== -1 && t.indexOf('abdul gaffar') !== -1) {
          if (all[i].children.length < 8) { target = all[i]; break; }
        }
      }
      if (target && target.parentElement) {
        target.parentElement.appendChild(board);
      } else {
        var c = document.querySelector('#chats') || document.querySelector('.chat-list') || document.body;
        c.appendChild(board);
      }
    }

    // सिर्फ़ उन छात्रों को शामिल करें जिन्हें स्टार/बैज/XP मिला है
    var awarded = usersList.filter(function(u) {
      return u && (u.star || u.badge || (parseInt(u.xp) > 0));
    });
    awarded.sort(function(a, b) { return (parseInt(b.xp) || 0) - (parseInt(a.xp) || 0); });

    var cardsHtml = '';
    awarded.forEach(function(st) {
      var isMaster = (String(st.roll) === '7877');
      var badgeText = st.badge || (st.star ? 'मुमताज़ तालिब-ए-इल्म 🌟' : 'इल्मी मुताला');
      var tagStyle = isMaster ? 'border-color:#3b82f6; color:#93c5fd; background:rgba(59,130,246,0.15);' : 'border-color:#eab308; color:#fef08a; background:rgba(234,179,8,0.15);';
      var tagIcon = isMaster ? '👑' : '⭐';

      cardsHtml += `
        <div class="award-student-card">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">${st.name} (रोल: ${st.roll})</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">${st.xp || 0} XP</strong></span>
          </div>
          <div style="${tagStyle} border:1px solid; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">
            ${tagIcon} ${badgeText}
          </div>
        </div>
      `;
    });

    board.innerHTML = `
      <div class="awards-header">
        <div style="color:#eab308; font-size:0.88rem; font-weight:800;"><i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड</div>
        <span style="font-size:0.68rem; color:#8696a0;">उस्ताद की सनद</span>
      </div>
      <div style="font-size:0.72rem; color:#8696a0; margin-bottom:10px; text-align:left;">
        उस्ताद (Suhail Husain) की जानिब से नवाज़े गए मुमताज़ तलबा की लाइव सनद:
      </div>
      <div>${cardsHtml || '<p style="color:#8696a0; font-size:0.75rem; text-align:center;">अभी कोई सनद जारी नहीं हुई है।</p>'}</div>
    `;
  }

  // 7. छात्र लिस्ट में लाइव बैज लगाना
  function updateLiveBadgesInList(usersList) {
    usersList.forEach(function(u) {
      if (!u || (!u.star && !u.badge)) return;
      var roll = String(u.roll).trim();
      var all = document.querySelectorAll('h4, span, div');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.children.length > 2) continue;
        if (el.closest && (el.closest('#suhail-5btn-dock') || el.closest('#suhail-awards-board') || el.closest('#suhail-notice-modal'))) continue;

        var t = (el.innerText || el.textContent || '').trim();
        if (t.indexOf(roll) !== -1) {
          if (!el.getAttribute('data-badge-applied')) {
            el.setAttribute('data-badge-applied', 'true');
            var badgeTitle = u.badge || 'मुमताज़ तालिब-ए-इल्म 🌟';
            el.innerHTML = '<span style="color:#eab308; font-size:1rem; margin-right:4px;">⭐</span><span style="background:rgba(234,179,8,0.22); color:#fef08a; border:1px solid #eab308; padding:1px 6px; border-radius:5px; font-size:0.7rem; font-weight:bold; margin-right:5px;">' + badgeTitle + '</span>' + el.innerHTML.replace(/[🥈🥇🥉]/g, '').trim();
          }
        }
      }
    });
  }

  // 8. लाइव फ़ायरबेस कनेक्टर (लगातार डेटा सिंक)
  function connectFirebaseSync() {
    var rdb = (window.db && typeof window.db.ref === 'function') ? window.db : null;
    if (!rdb && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try { rdb = firebase.database(); } catch(e) {}
    }

    if (rdb) {
      rdb.ref('users').on('value', function(snap) {
        var val = snap.val() || {};
        var list = [];
        Object.keys(val).forEach(function(k) {
          var item = val[k];
          if (item) {
            item.roll = item.roll || item.rollNumber || k;
            list.push(item);
          }
        });

        // लाइव डेटा से सब कुछ रेंडर करना
        renderLiveAwardsBoard(list);
        updateLiveBadgesInList(list);

        // जिस छात्र को स्टार/बैज मिला हो, उसके लिए शाही नोटिस खोलना
        var starred = list.find(function(u) { return u.star || (u.badge && String(u.roll) !== '7877'); });
        if (starred) {
          showLiveNotice(starred);
        }
      });
    } else {
      setTimeout(connectFirebaseSync, 500);
    }
  }

  function start() {
    buildDock();
    connectFirebaseSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

(function () {
  "use strict";

  // 1. स्टाइलिंग (प्रीमियम थीम और नो-स्प्लिट लेआउट)
  var style = document.createElement('style');
  style.id = 'suhail-core-style';
  style.innerHTML = `
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
  `;
  document.head.appendChild(style);

  // 2. असली 30 टूल्स का मोडल खोलना (No Dummy Alert)
  window.openRealToolkit = function () {
    var modal = document.getElementById('ai-toolkit-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.zIndex = '2147483647';
    } else {
      window.location.href = '/awam.html'; 
    }
  };

  // 3. खूबसूरत इन-ऐप गाइड विंडो (तुम्हारा पुराना प्रीमियम डिज़ाइन)
  window.openGuideDialog = function () {
    var old = document.getElementById('suhail-guide-modal');
    if (old) old.remove();

    var div = document.createElement('div');
    div.id = 'suhail-guide-modal';
    div.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:18px;';
    div.innerHTML = `
      <div style="background:linear-gradient(145deg, #1c1917, #261f0d, #111b21); border:2px solid #eab308; border-radius:16px; max-width:390px; width:100%; padding:24px 20px; color:#fef08a; text-align:left; box-shadow:0 10px 30px rgba(234,179,8,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(234,179,8,0.3); padding-bottom:10px; margin-bottom:15px;">
          <h3 style="margin:0; color:#fde68a; font-size:1.1rem; font-weight:800;">📖 जमात ऊला: तालीमी उसूल</h3>
          <span onclick="document.getElementById('suhail-guide-modal').remove()" style="cursor:pointer; font-size:1.3rem; color:#8696a0;">✕</span>
        </div>
        <div style="font-size:0.85rem; color:#e9edef; line-height:1.7;">
          <div style="margin-bottom:10px;"><strong>⚡ XP और तरक़्क़ी:</strong><br>रोज़ाना क्विज़ और सवालात के सही जवाब देकर अपनी XP बढ़ाएँ।</div>
          <div style="margin-bottom:10px;"><strong>🌟 एज़ाज़ात:</strong><br>बेहतरीन पढ़ाई पर उस्ताद की तरफ़ से स्टार (⭐) और शाही बैज दिए जाते हैं, जो सीधे चैट लिस्ट में दिखेंगे।</div>
          <div style="margin-bottom:15px;"><strong>⚠️ ज़ब्त व क़ानून:</strong><br>क्लासरूम में गैर-ज़रूरी बातचीत पर स्ट्राइक मिलेगी। <span style="color:#ef4444; font-weight:bold;">3 स्ट्राइक पर आईडी हमेशा के लिए ब्लॉक कर दी जाएगी।</span></div>
        </div>
        <button onclick="document.getElementById('suhail-guide-modal').remove()" style="width:100%; background:#eab308; color:#000; border:none; padding:10px; border-radius:10px; font-weight:800; font-size:0.9rem; cursor:pointer;">जी, मैं समझ गया</button>
      </div>
    `;
    document.body.appendChild(div);
  };

  // 4. डॉक तैयार करना
  function setupDock() {
    if (document.getElementById('suhail-5btn-dock')) return;

    var dock = document.createElement('div');
    dock.id = 'suhail-5btn-dock';
    dock.innerHTML = `
      <div class="suhail-drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
      <button class="suhail-mini-btn btn-m-old30" onclick="window.openRealToolkit()"><i class="fa-solid fa-book"></i> 30 AI</button>
      <a href="/awam.html" class="suhail-mini-btn btn-m-awam"><i class="fa-solid fa-layer-group"></i> 40 आवामी</a>
      <button class="suhail-mini-btn btn-m-edu" onclick="window.openRealToolkit()"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी</button>
      <button class="suhail-mini-btn btn-m-info" onclick="window.openGuideDialog()"><i class="fa-solid fa-circle-info"></i> गाइड</button>
      <a href="/admin.html" class="suhail-mini-btn btn-m-admin" id="dock-admin-link"><i class="fa-solid fa-shield-halved"></i> एडमिन</a>
    `;
    document.body.appendChild(dock);

    // एडमिन बटन सिर्फ़ रोल 7877 के लिए
    if ((document.body.innerText || '').indexOf('7877') !== -1 || localStorage.getItem('roll') === '7877') {
      var a = document.getElementById('dock-admin-link');
      if (a) a.style.display = 'flex';
    }

    // टच ड्रैग लॉजिक
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

  // 5. फ़ायरबेस से असली लाइव सनद बोर्ड बनाना
  function updateAwardsFromFirebase(usersData) {
    var board = document.getElementById('suhail-awards-board');
    if (!board) {
      board = document.createElement('div');
      board.id = 'suhail-awards-board';
      
      // अब्दुल गफ़्फ़ार वाले कार्ड को ढूँढकर उसके नीचे जोड़ना
      var targetList = document.querySelector('.chat-list') || document.querySelector('#chats') || document.body;
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = all[i].textContent || '';
        if (t.indexOf('6989') !== -1 && t.toLowerCase().indexOf('abdul gaffar') !== -1) {
          if (all[i].children.length < 8) {
            targetList = all[i].closest('li')?.parentElement || all[i].parentElement?.parentElement || targetList;
            break;
          }
        }
      }
      targetList.appendChild(board);
    }

    var list = [];
    Object.keys(usersData || {}).forEach(function(k) {
      var u = usersData[k];
      if (u) {
        u.roll = u.roll || u.rollNumber || k;
        if (u.star || u.badge || parseInt(u.xp) > 0) list.push(u);
      }
    });

    // XP के हिसाब से रैंकिंग
    list.sort(function(a, b) { return (parseInt(b.xp) || 0) - (parseInt(a.xp) || 0); });

    var itemsHtml = '';
    list.forEach(function(st) {
      var isMaster = (String(st.roll) === '7877');
      var badgeText = st.badge || (st.star ? 'मुमताज़ तालिब-ए-इल्म 🌟' : 'इल्मी मुताला');
      var bColor = isMaster ? '#3b82f6' : '#eab308';
      var bgTag = isMaster ? 'rgba(59,130,246,0.15)' : 'rgba(234,179,8,0.15)';
      var icon = isMaster ? '👑' : '⭐';

      itemsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#182229; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">${st.name || 'तालिब-ए-इल्म'} (रोल: ${st.roll})</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">${st.xp || 0} XP</strong></span>
          </div>
          <div style="background:${bgTag}; border:1px solid ${bColor}; color:${bColor}; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">
            ${icon} ${badgeText}
          </div>
        </div>
      `;
    });

    board.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:12px;">
        <div style="color:#eab308; font-size:0.88rem; font-weight:800;"><i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड</div>
        <span style="font-size:0.68rem; color:#8696a0;">लाइव अपडेट</span>
      </div>
      <div>${itemsHtml || '<p style="color:#8696a0; font-size:0.75rem; text-align:center;">अभी कोई सनद जारी नहीं हुई है।</p>'}</div>
    `;
  }

  // 6. चैट लिस्ट में छात्रों के बैज लाइव अपडेट करना
  function updateLiveBadgesInChat(usersData) {
    Object.keys(usersData || {}).forEach(function(k) {
      var u = usersData[k];
      if (!u || (!u.star && !u.badge)) return;
      var roll = String(u.roll || u.rollNumber || k).trim();
      
      var allEls = document.querySelectorAll('h4, span, div, p');
      for (var i = 0; i < allEls.length; i++) {
        var el = allEls[i];
        if (el.children.length > 2) continue;
        if (el.closest && (el.closest('#suhail-5btn-dock') || el.closest('#suhail-awards-board') || el.closest('#suhail-guide-modal') || el.closest('#suhail-notice-modal'))) continue;

        var t = (el.innerText || el.textContent || '').trim();
        // अगर चैट लिस्ट में उस छात्र का रोल नंबर मिल जाए
        if (t.indexOf(roll) !== -1 || t.indexOf('रोल: ' + roll) !== -1) {
          
          if (!el.getAttribute('data-live-badge-set')) {
             el.setAttribute('data-live-badge-set', 'true');
             var cleanHtml = el.innerHTML.replace(/[🥇🥈🥉⭐👑]/g, '').replace(/मुमताज़ तालिब-ए-इल्म 🌟/g, '').replace(/मोहतमिम व उस्ताद/g, '');
             
             var badgeText = u.badge || 'मुमताज़ तालिब-ए-इल्म 🌟';
             var isMaster = (roll === '7877');
             var bColor = isMaster ? '#3b82f6' : '#eab308';
             var bgTag = isMaster ? 'rgba(59,130,246,0.22)' : 'rgba(234,179,8,0.22)';
             var icon = isMaster ? '👑' : '⭐';

             el.innerHTML = '<span style="color:' + bColor + '; font-size:0.95rem; margin-right:4px;">' + icon + '</span><span style="background:' + bgTag + '; color:' + (isMaster?'#93c5fd':'#fef08a') + '; border:1px solid ' + bColor + '; padding:1px 6px; border-radius:5px; font-size:0.7rem; font-weight:bold; margin-right:5px;">' + badgeText + '</span>' + cleanHtml.trim();
          }
        }
      }
    });
  }

  // 7. लाइव शाही नोटिस (डेटाबेस से टॉप स्टूडेंट के लिए)
  var noticeShown = false;
  function showLiveNotice(student) {
    if (noticeShown || document.getElementById('suhail-notice-modal')) return;
    
    var modal = document.createElement('div');
    modal.id = 'suhail-notice-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:18px;';
    modal.innerHTML = `
      <div style="background:linear-gradient(145deg, #1c1917, #261f0d, #111b21); border:2px solid #eab308; border-radius:16px; max-width:390px; width:100%; padding:22px 18px; color:#fef08a; text-align:center; box-shadow:0 10px 30px rgba(234,179,8,0.35); box-sizing:border-box;">
        <div style="font-size:2.4rem; margin-bottom:6px;">🌟</div>
        <h3 style="color:#fde68a; font-size:1.05rem; margin-bottom:8px; font-weight:800;">📢 उस्ताद की जानिब से शाही इल्मी नोटिस</h3>
        <p style="font-size:0.82rem; color:#e9edef; line-height:1.6; margin-bottom:10px;">
          मुबारकबाद! मोहतमिम व उस्ताद <strong>(Suhail Husain)</strong> की तरफ़ से:<br>
          <strong>${student.name || 'तालिब-ए-इल्म'}</strong> (रोल नंबर: <strong>${student.roll}</strong>)
        </p>
        <div style="display:inline-block; background:rgba(234,179,8,0.2); border:1px solid #eab308; color:#fef08a; padding:5px 14px; border-radius:20px; font-size:0.86rem; font-weight:800; margin-bottom:12px;">
          ⭐ ${student.badge || 'मुमताज़ तालिब-ए-इल्म 🌟'}
        </div>
        <p style="font-size:0.75rem; color:#8696a0; margin-bottom:14px;">उम्दा पढ़ाई और बेहतरीन तालीमी लगन पर यह एज़ाज़ अता किया गया है।</p>
        <button onclick="document.getElementById('suhail-notice-modal').remove()" style="background:#eab308; color:#000; border:none; padding:9px 24px; border-radius:20px; font-weight:800; font-size:0.85rem; cursor:pointer;">माशाअल्लाह (क़बूल करें)</button>
      </div>
    `;
    document.body.appendChild(modal);
    noticeShown = true;
  }

  // 8. असली लाइव फ़ायरबेस कनेक्शन
  function listenToFirebase() {
    var db = window.db || (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length ? firebase.database() : null);
    if (db) {
      db.ref('users').on('value', function(snap) {
        var users = snap.val() || {};
        
        // डेटाबेस बदलते ही दोनों चीज़ें तुरंत अपडेट होंगी
        updateAwardsFromFirebase(users);
        updateLiveBadgesInChat(users);
        
        // नोटिस के लिए सबसे अच्छे स्टूडेंट को खोजना
        var bestStudent = null;
        Object.keys(users).forEach(function(k) {
           var u = users[k];
           if (u && (u.star || u.badge) && String(u.roll) !== '7877') {
               bestStudent = u;
               bestStudent.roll = u.roll || u.rollNumber || k;
           }
        });
        if (bestStudent) showLiveNotice(bestStudent);
      });
    } else {
      setTimeout(listenToFirebase, 600); // अगर फ़ायरबेस लोड नहीं हुआ है, तो 600ms बाद दोबारा चेक करेगा
    }
  }

  // 9. कोड स्टार्ट
  function boot() {
    setupDock();
    listenToFirebase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// ==========================================================
// 🛠️ स्टेटस वीडियो ब्लैक स्क्रीन फिक्स (Status Video Fix)
// ==========================================================
(function() {
  "use strict";

  // 1. वीडियो को ज़बरदस्ती सामने लाना और टेक्स्ट के बैकग्राउंड को पारदर्शी (Transparent) करना
  var statusFixStyle = document.createElement('style');
  statusFixStyle.innerHTML = `
    /* वीडियो को स्क्रीन पर पूरा फिट करना और सामने लाना */
    video {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      object-fit: contain !important; /* वीडियो कटेगी नहीं, पूरी दिखेगी */
      background: #000 !important;
      z-index: 10 !important;
    }
    
    /* स्टेटस के टेक्स्ट वाले बैकग्राउंड को पारदर्शी (Transparent) बनाना ताकि पीछे की वीडियो दिखे */
    .status-text, [id*="status"] div, .text-overlay {
      background-color: transparent !important;
      z-index: 20 !important; /* टेक्स्ट को वीडियो के ऊपर रखना */
      text-shadow: 1px 1px 4px rgba(0,0,0,0.9) !important;
    }
  `;
  document.head.appendChild(statusFixStyle);

  // 2. वीडियो को ब्लॉक होने से बचाना (Browser Autoplay Fix)
  // जैसे ही यूज़र स्क्रीन पर कहीं भी क्लिक करेगा, रुकी हुई वीडियो अपने आप चल पड़ेगी
  document.addEventListener('click', function() {
    var vids = document.querySelectorAll('video');
    for (var i = 0; i < vids.length; i++) {
      if (vids[i].paused) {
        var playPromise = vids[i].play();
        if (playPromise !== undefined) {
          playPromise.catch(function(error) {
            console.log("वीडियो प्ले करने में ब्राउज़र ने रोका: ", error);
          });
        }
      }
    }
  });
})();

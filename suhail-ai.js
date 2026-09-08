// ==========================================================
// 🚀 सोहेल एआई - अल्ट्रा-कॉम्पैक्ट 5-बटन डॉक (एडमिन प्रोटेक्शन सहित)
// ==========================================================

(function () {
  "use strict";

  // 1. स्टाइलिंग (सुपर स्लिम व मिनी डिज़ाइन)
  const style = document.createElement("style");
  style.id = "suhail-compact-style";
  style.textContent = `
    /* कोने में चिपके पुराने दोनों बटनों को हमेशा के लिए छिपाना */
    body > div:has(> a[href*="admin"]),
    body > div:has(> button[onclick*="admin"]),
    .fixed-bottom-btns {
      display: none !important;
    }

    /* 🎮 अल्ट्रा-कॉम्पैक्ट मिनी डॉक (स्क्रीन नहीं घेरेगा) */
    #suhail-5btn-dock {
      position: fixed;
      bottom: 18px;
      right: 8px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(17, 27, 33, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 25px;
      padding: 3px 6px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      touch-action: none;
      user-select: none;
      max-width: 95vw;
    }

    .suhail-drag-handle {
      color: #8696a0;
      font-size: 0.75rem;
      cursor: grab;
      padding: 0 3px;
      display: flex;
      align-items: center;
    }

    /* छोटे और पतले बटन्स */
    .suhail-mini-btn {
      padding: 4px 7px;
      border-radius: 14px;
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
      transition: transform 0.1s;
    }
    .suhail-mini-btn:active { transform: scale(0.92); }

    .btn-m-old30  { background: #00a884; color: #fff; }
    .btn-m-awam   { background: rgba(0, 168, 132, 0.2); color: #00a884; border: 1px solid rgba(0,168,132,0.4); }
    .btn-m-edu    { background: #182229; color: #3b82f6; border: 1px solid rgba(59,130,246,0.4); }
    .btn-m-info   { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.35); }
    .btn-m-admin  { background: #202c33; color: #eab308; border: 1px solid #eab308; display: none; /* डिफ़ॉल्ट रूप से बंद (सिर्फ़ आपको दिखेगा) */ }

    /* 📢 24 घंटे का स्टार नोटिस */
    #suhail-star-emergency {
      width: calc(100% - 24px);
      margin: 8px 12px;
      padding: 9px 12px;
      display: none;
      align-items: flex-start;
      gap: 8px;
      background: linear-gradient(135deg, #211d0c 0%, #29230c 50%, #17140a 100%);
      border: 1px solid rgba(234,179,8,0.55);
      border-left: 4px solid #eab308;
      border-radius: 9px;
      color: #fef3c7;
      box-sizing: border-box;
      animation: suhailGlow 2.5s infinite ease-in-out;
    }
    @keyframes suhailGlow {
      0%, 100% { box-shadow: 0 0 8px rgba(234,179,8,0.15); }
      50% { box-shadow: 0 0 16px rgba(234,179,8,0.35); }
    }

    /* 📊 4 खंभों वाला लीडरबोर्ड */
    #suhail-pillar-leaderboard {
      width: calc(100% - 24px);
      box-sizing: border-box;
      margin: 15px 12px 75px;
      padding: 14px 12px 10px;
      background: radial-gradient(circle at 50% 120%, #1d2930 0%, #0b141a 70%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 18px rgba(0,0,0,0.4);
    }
    .suhail-pillar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #e9edef;
    }
    .suhail-pillar-chart { position: relative; height: 160px; }
    .suhail-growth-svg { position: absolute; left: 3%; top: 8px; width: 94%; height: 100px; z-index: 1; pointer-events: none; opacity: 0.8; }
    .suhail-pillar-stage { position: absolute; left: 0; right: 0; bottom: 0; height: 145px; display: flex; align-items: flex-end; justify-content: space-around; border-bottom: 1px solid rgba(255,255,255,0.15); z-index: 2; }
    .suhail-pillar-column { width: 22%; max-width: 60px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
    .suhail-pillar-details { width: 100%; text-align: center; margin-bottom: 4px; line-height: 1.15; }
    .suhail-pillar-xp { color: #eab308; font-size: 0.68rem; font-weight: 900; }
    .suhail-pillar-name { color: #e9edef; font-size: 0.62rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .suhail-pillar-roll { color: #8696a0; font-size: 0.55rem; }
    .suhail-pillar-bar {
      width: 74%;
      background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 100%);
      border-top: 2px solid #fff;
      border-radius: 4px 4px 0 0;
      box-shadow: 0 0 12px rgba(255,255,255,0.12);
      transition: height 0.7s ease;
    }

    /* मॉडल्स */
    #suhail-guide-modal, #suhail-edu-modal {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100000; align-items: center; justify-content: center; padding: 14px;
    }
    .suhail-modal-box {
      background: #111b21; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; width: 100%; max-width: 450px; max-height: 85vh; overflow-y: auto; color: #e9edef; padding: 16px;
    }
  `;
  document.head.appendChild(style);

  // 2. कोने वाले पुराने बटनों की सफ़ाई
  function cleanOldButtons() {
    document.querySelectorAll("button, a, div").forEach((el) => {
      if (el.closest("#suhail-5btn-dock")) return;
      const t = (el.innerText || "").trim();
      if (t === "30 AI खिदमात" || t === "सुपर एडमिन") {
        const p = el.closest('div[style*="fixed"]') || el;
        p.style.setProperty("display", "none", "important");
      }
    });
  }

  // 3. गाइड व 30 इल्मी मॉडल्स
  function ensureModals() {
    if (!document.getElementById("suhail-guide-modal")) {
      const g = document.createElement("div");
      g.id = "suhail-guide-modal";
      g.innerHTML = `
        <div class="suhail-modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:12px;">
            <h3 style="color:#eab308; font-size:0.95rem;"><i class="fa-solid fa-circle-info"></i> जमात ऊला - इल्मी रहनुमाई</h3>
            <button onclick="document.getElementById('suhail-guide-modal').style.display='none'" style="background:none; border:none; color:#8696a0; font-size:1.2rem; cursor:pointer;">✕</button>
          </div>
          <div style="margin-bottom:12px;">
            <h4 style="color:#00a884; font-size:0.85rem; margin-bottom:2px;">📖 हमारे बारे में</h4>
            <p style="font-size:0.75rem; color:#8696a0; line-height:1.4;">यह जमात ऊला का हाई-टेक क्लासरूम है जहाँ 70 सोहेल एआई टूल्स के साथ इल्मी पढ़ाई और अवामी सहूलियतें दी जाती हैं।</p>
          </div>
          <div style="margin-bottom:12px;">
            <h4 style="color:#eab308; font-size:0.85rem; margin-bottom:2px;">⚡ XP कैसे कमाएँ?</h4>
            <ul style="font-size:0.75rem; color:#8696a0; padding-left:15px; line-height:1.5;">
              <li>क्विज़ में सही जवाब: <strong>+10 से +50 XP</strong>।</li>
              <li>रोज़ाना क्लास हाज़िरी व मुताला: <strong>+20 XP</strong>।</li>
              <li>उस्ताद से बेहतरीन पढ़ाई पर: <strong>⭐ स्टार व इल्मी लक़ब</strong>।</li>
            </ul>
          </div>
          <div>
            <h4 style="color:#ef4444; font-size:0.85rem; margin-bottom:2px;">⚠️ नियम व स्ट्राइक</h4>
            <p style="font-size:0.75rem; color:#8696a0; line-height:1.4;">अनुचित चैट पर स्ट्राइक मिलेगी। <strong>3 स्ट्राइक</strong> पर आईडी खुद म्यूट व ब्लॉक हो जाएगी।</p>
          </div>
        </div>
      `;
      document.body.appendChild(g);
    }

    if (!document.getElementById("suhail-edu-modal")) {
      const e = document.createElement("div");
      e.id = "suhail-edu-modal";
      e.innerHTML = `
        <div class="suhail-modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <h3 style="color:#00a884; font-size:0.92rem;"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी व नह्वी टूल्स</h3>
            <button onclick="document.getElementById('suhail-edu-modal').style.display='none'" style="background:none; border:none; color:#8696a0; font-size:1.2rem; cursor:pointer;">✕</button>
          </div>
          <textarea id="edu-quick-input" rows="2" style="width:100%; background:#202c33; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:7px; font-size:0.82rem; margin-top:8px;" placeholder="इबारत या लफ़्ज़ लिखें..."></textarea>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:5px; margin-top:8px;">
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_nahw_irab')">1. नह्वी ए'राब</button>
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_bab_gardan')">2. बाब व गर्दान</button>
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_root_detector')">3. मूल माद्दा</button>
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_full_tashkeel')">4. तश्कील (ए'राब)</button>
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_balaghat_maani')">5. बलाग़त</button>
            <button class="suhail-mini-btn btn-m-old30" onclick="runEduApi('suhail_mantiq_qaziya')">6. मंतिक़</button>
          </div>
          <div id="edu-quick-output" style="display:none; background:#182229; border-left:3px solid #00a884; padding:8px; margin-top:8px; border-radius:5px; font-size:0.8rem; white-space:pre-wrap;"></div>
        </div>
      `;
      document.body.appendChild(e);
    }
  }

  window.runEduApi = async function(task) {
    const txt = document.getElementById("edu-quick-input").value.trim();
    const out = document.getElementById("edu-quick-output");
    if (!txt) return alert("कृपया पहले इबारत लिखें!");
    out.style.display = "block";
    out.innerText = "⏳ सोहेल एआई विश्लेषण कर रहा है...";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, prompt: txt })
      });
      const d = await res.json();
      out.innerText = d.reply || d.text || "जवाब प्राप्त नहीं हुआ।";
    } catch (e) { out.innerText = "एरर: " + e.message; }
  };

  // 4. सुरक्षा जाँच: क्या वर्तमान यूज़र एडमिन (रोल 7877) है?
  function checkAdminPrivilege() {
    let currentRoll = localStorage.getItem('roll') || localStorage.getItem('user_roll') || localStorage.getItem('currentRoll') || "";
    
    // अगर लोकल स्टोरेज में नहीं मिला, तो स्क्रीन के हेडर/प्रोफाइल से ढूँढें
    if (!currentRoll) {
      document.querySelectorAll('*').forEach(el => {
        const txt = el.innerText || "";
        if (txt.includes('7877') || txt.includes('Suhail')) {
          currentRoll = '7877';
        }
      });
    }

    // अगर रोल 7877 है, तभी एडमिन बटन दिखाएँ
    const adminBtn = document.getElementById("dock-btn-admin");
    if (adminBtn) {
      if (currentRoll === '7877' || localStorage.getItem('isAdmin') === 'true') {
        adminBtn.style.display = 'flex'; // सिर्फ़ आपको दिखेगा
      } else {
        adminBtn.style.display = 'none'; // बाक़ी तलबा के लिए बिल्कुल बंद
      }
    }
  }

  // 5. 5-बटन ड्रैगेबल स्लिम विजेट बनाना
  function createMiniDock() {
    if (document.getElementById("suhail-5btn-dock")) return;

    const dock = document.createElement("div");
    dock.id = "suhail-5btn-dock";
    dock.innerHTML = `
      <div class="suhail-drag-handle" id="dock-drag-grip" title="उंगली से खिसकाएँ">
        <i class="fa-solid fa-grip-vertical"></i>
      </div>
      <button class="suhail-mini-btn btn-m-old30" id="btn-dock-trigger-30">
        <i class="fa-solid fa-book"></i> 30 AI
      </button>
      <a href="/awam.html" class="suhail-mini-btn btn-m-awam">
        <i class="fa-solid fa-layer-group"></i> 40 आवामी
      </a>
      <button class="suhail-mini-btn btn-m-edu" onclick="document.getElementById('suhail-edu-modal').style.display='flex'">
        <i class="fa-solid fa-graduation-cap"></i> 30 इल्मी
      </button>
      <button class="suhail-mini-btn btn-m-info" onclick="document.getElementById('suhail-guide-modal').style.display='flex'">
        <i class="fa-solid fa-circle-info"></i> गाइड
      </button>
      <a href="/admin.html" class="suhail-mini-btn btn-m-admin" id="dock-btn-admin">
        <i class="fa-solid fa-shield-halved"></i> एडमिन
      </a>
    `;
    document.body.appendChild(dock);

    // पुराने 30 AI बटन से लिंक
    document.getElementById("btn-dock-trigger-30").onclick = function() {
      let originalBtn = null;
      document.querySelectorAll("button, a").forEach(b => {
        if (b !== this && (b.innerText || "").includes("30 AI खिदमात")) originalBtn = b;
      });
      if (originalBtn) originalBtn.click();
      else window.location.href = "/awam.html";
    };

    // टच ड्रैग
    let isDragging = false, startX, startY, initLeft, initTop;
    dock.addEventListener("touchstart", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const rect = dock.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      dock.style.bottom = "auto";
      dock.style.right = "auto";
      dock.style.left = initLeft + "px";
      dock.style.top = initTop + "px";
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      dock.style.left = Math.max(5, Math.min(window.innerWidth - dock.offsetWidth - 5, initLeft + dx)) + "px";
      dock.style.top = Math.max(5, Math.min(window.innerHeight - dock.offsetHeight - 5, initTop + dy)) + "px";
    }, { passive: true });

    document.addEventListener("touchend", () => { isDragging = false; });
  }

  // 6. 24 घंटे का स्टार नोटिस
  function syncStarNotice(users) {
    let notice = document.getElementById("suhail-star-emergency");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "suhail-star-emergency";
      notice.innerHTML = `
        <div style="font-size:1.2rem;">⭐</div>
        <div style="flex:1;">
          <div style="color:#fde68a; font-size:0.75rem; font-weight:800; margin-bottom:2px;">📢 इल्मी एज़ाज़ — 24 घंटे का नोटिस</div>
          <div id="suhail-star-msg" style="font-size:0.7rem; line-height:1.35;"></div>
          <span id="suhail-star-timer" style="display:inline-block; margin-top:3px; color:#a8a29e; font-size:0.6rem;"></span>
        </div>
      `;
      const chatArea = document.querySelector("#chats") || document.querySelector(".chat-list") || document.body;
      chatArea.prepend(notice);
    }

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    let latestUser = null;

    Object.values(users || {}).forEach(u => {
      if (u && u.star) {
        const time = Number(u.updatedAt || u.starAwardedAt || u.starTime || 0);
        if (!time || (now - time < ONE_DAY)) {
          if (!latestUser || time > (latestUser._t || 0)) {
            latestUser = { ...u, _t: time };
          }
        }
      }
    });

    if (latestUser) {
      const roll = latestUser.roll || latestUser.rollNumber || "";
      const name = latestUser.name || "तालिब";
      const badge = latestUser.badge || "मुमताज़ तालिब-ए-इल्म 🌟";

      document.getElementById("suhail-star-msg").innerHTML = `मुबारकबाद! रोल <strong>${roll}</strong> (${name}) को उस्ताद की तरफ़ से <strong>⭐ ${badge}</strong> से नवाज़ा गया है।`;
      
      const timerEl = document.getElementById("suhail-star-timer");
      if (latestUser._t) {
        const rem = Math.max(0, (latestUser._t + ONE_DAY) - now);
        const hrs = Math.floor(rem / 3600000);
        const mins = Math.floor((rem % 3600000) / 60000);
        timerEl.innerText = `बाक़ी समय: ${hrs} घंटे ${mins} मिनट`;
      } else {
        timerEl.innerText = `24 घंटे का इल्मी एज़ाज़ नोटिस`;
      }
      notice.style.display = "flex";
    } else {
      notice.style.display = "none";
    }
  }

  // 7. 4 खंभों वाला लीडरबोर्ड
  function renderPillars(users) {
    let board = document.getElementById("suhail-pillar-leaderboard");
    if (!board) {
      board = document.createElement("div");
      board.id = "suhail-pillar-leaderboard";
      board.innerHTML = `
        <div class="suhail-pillar-header">
          <div><i class="fa-solid fa-chart-simple" style="color:#eab308; margin-right:5px;"></i> तालीमी तरक़्क़ी व इल्मी मुक़ाबला</div>
          <div style="color:#8696a0; font-size:0.6rem;">LIVE XP ⚡</div>
        </div>
        <div class="suhail-pillar-chart">
          <svg class="suhail-growth-svg" viewBox="0 0 300 110" preserveAspectRatio="none">
            <path d="M 15,98 Q 100,88 155,60 Q 215,34 278,10" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
            <polyline points="266,10 278,10 278,23" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="suhail-pillar-stage" id="suhail-pillar-stage"></div>
        </div>
      `;
      const chatArea = document.querySelector("#chats") || document.querySelector(".chat-list") || document.body;
      chatArea.appendChild(board);
    }

    const sorted = Object.values(users || {}).sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));
    const topFour = sorted.slice(0, 4).reverse();
    const heights = [40, 70, 100, 132];

    const stage = document.getElementById("suhail-pillar-stage");
    if (!stage) return;
    stage.innerHTML = "";

    topFour.forEach((st, idx) => {
      const col = document.createElement("div");
      col.className = "suhail-pillar-column";
      col.innerHTML = `
        <div class="suhail-pillar-details">
          <div class="suhail-pillar-xp">⚡ ${Number(st.xp) || 0}</div>
          <div class="suhail-pillar-name">${st.name || "तालिब"}</div>
          <div class="suhail-pillar-roll">${st.roll ? "रोल: " + st.roll : ""}</div>
        </div>
        <div class="suhail-pillar-bar" style="height:${heights[idx] || 40}px;"></div>
        <div style="color:#8696a0; font-size:0.55rem; margin-top:3px;">Rank ${4 - idx}</div>
      `;
      stage.appendChild(col);
    });
  }

  // 8. इनिशियलाइज़
  function init() {
    cleanOldButtons();
    ensureModals();
    createMiniDock();
    checkAdminPrivilege();

    const db = window.db || (typeof firebase !== "undefined" && firebase.apps?.length ? firebase.database() : null);
    if (db) {
      db.ref("users").on("value", (snap) => {
        const users = snap.val() || {};
        syncStarNotice(users);
        renderPillars(users);
        checkAdminPrivilege();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  setInterval(() => {
    cleanOldButtons();
    checkAdminPrivilege();
  }, 2000);
})();

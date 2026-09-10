// 🚀 जामिआ मैसेंजर: 100% ओरिजिनल UI व मैसेज रिस्टोरर
(function () {
  "use strict";

  // 1. मैसेज भेजने का इंजन (मैसेज तुरंत ग्रुप व प्राइवेट चैट में जाएगा)
  window.sendFirebaseMessage = function (roomId, name, phone, displayName, role, text, userLocation, isGhost, ghostDuration, scheduleTime) {
    if (!text || !text.trim()) return null;
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);
    const now = new Date();
    const nodePath = (roomId === 'group') ? 'messages/group' : `messages_private/${roomId}`;

    const payload = {
      sender: name || window.currentUser?.name || "User",
      senderPhone: phone || window.currentUser?.phone || "0000000000",
      displayName: displayName || window.currentUser?.displayName || name || "User",
      role: role || window.currentUser?.role || "student",
      text: text.trim(),
      location: userLocation || window.currentUser?.location || "India",
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    try {
      if (typeof push === 'function' && typeof ref === 'function') {
        const newRef = push(ref(db, nodePath), payload);
        return newRef.key;
      } else if (db && db.ref) {
        const newRef = db.ref(nodePath).push();
        newRef.set(payload);
        return newRef.key;
      }
    } catch (e) {
      console.warn("Message send error:", e);
    }
    return null;
  };

  // 2. लेआउट का ढाँचा स्क्रीनशॉट जैसा सेट करना
  function buildExactLayout() {
    const chatsArea = document.getElementById('tab-content-chats');
    if (!chatsArea) return;

    // अंदर का पूरा ढाँचा स्क्रीनशॉट के अनुसार री-ऑर्डर करें
    chatsArea.innerHTML = `
      <!-- स्टेटस ट्रे -->
      <div id="status-tray" class="status-tray-wrapper" style="display:flex; gap:12px; padding:10px 14px; overflow-x:auto; background:#111b21; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; scrollbar-width:none;">
        <div class="status-circle-item" onclick="document.getElementById('create-status-modal')?.classList.add('active')" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; width:56px;">
          <div class="status-ring my-status" style="width:50px; height:50px; border-radius:50%; border:2px dashed #8696a0; display:flex; align-items:center; justify-content:center;">
            <div style="width:100%; height:100%; border-radius:50%; background:#202c33; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.1rem;"><i class="fa-solid fa-plus"></i></div>
          </div>
          <div style="font-size:0.68rem; color:#8696a0; margin-top:4px;">मेरा स्टेटस</div>
        </div>
        <div id="peer-statuses-dock" style="display:flex; gap:12px;"></div>
      </div>

      <!-- सर्च बार -->
      <div class="contact-search-box" style="margin:10px 12px 6px 12px; position:relative;">
        <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#8696a0; font-size:0.85rem;"></i>
        <input type="text" id="contact-search-input-field" placeholder="चैट या सबक खोजें..." oninput="window.filterContactsSearch(this.value)" style="width:100%; background:#202c33; border:none; border-radius:8px; padding:8px 12px 8px 36px; color:#e9edef; font-size:0.85rem; outline:none; box-sizing:border-box;">
      </div>

      <!-- फ़िल्टर बार -->
      <div id="wa-filter-bar" style="display:flex; gap:8px; padding:6px 12px 10px 12px; background:#111b21; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
        <button class="filter-pill active" onclick="window.applyChatFilter('all', this)" style="background:#00a884; color:#111b21; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:bold; cursor:pointer;">सभी</button>
        <button class="filter-pill" onclick="window.applyChatFilter('unread', this)" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">अपठित</button>
        <button class="filter-pill" onclick="window.applyChatFilter('groups', this)" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">ग्रुप्स</button>
        <button class="filter-pill" onclick="window.openStarredMessagesModal?.()" style="background:#202c33; border:none; border-radius:18px; padding:5px 12px; cursor:pointer;"><i class="fa-solid fa-star" style="color:#facc15;"></i></button>
        <button class="filter-pill" onclick="window.openBookExchangeModal?.()" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">📚 एक्सचेंज</button>
        <button class="filter-pill" onclick="window.openNoticeBoardModal?.()" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">📌 नोटिस बोर्ड</button>
      </div>

      <!-- छात्रों की सूची -->
      <div id="users-dynamic-list" style="padding-bottom:6px;"></div>

      <!-- 🎗️ तालिमी एज़ाज़ात व सनद बोर्ड -->
      <div class="sanad-board-card" style="margin:14px 12px 85px 12px; background:#111b21; border:1px solid rgba(250, 204, 21, 0.25); border-radius:12px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="color:#facc15; font-weight:bold; font-size:0.92rem;"><i class="fa-solid fa-award"></i> तालिमी एज़ाज़ात व सनद बोर्ड</span>
          <span style="font-size:0.72rem; color:#8696a0;">लाइव रिकॉर्ड</span>
        </div>
        <div id="sanad-board-list"></div>
      </div>
    `;
  }

  // 3. छात्रों की लिस्ट और सनद बोर्ड (100% स्क्रीनशॉट जैसा लुक)
  window.renderAllUsersList = function (usersMap) {
    window.lastUsersMap = usersMap;
    const container = document.getElementById('users-dynamic-list');
    const sanadContainer = document.getElementById('sanad-board-list');

    if (!container || !sanadContainer) {
      buildExactLayout();
    }

    const targetContainer = document.getElementById('users-dynamic-list');
    const targetSanad = document.getElementById('sanad-board-list');
    if (targetContainer) targetContainer.innerHTML = "";
    if (targetSanad) targetSanad.innerHTML = "";

    const sortedKeys = Object.keys(usersMap || {}).sort((a, b) => {
      return (usersMap[b]?.xp || 0) - (usersMap[a]?.xp || 0);
    });

    let rank = 1;
    sortedKeys.forEach((phone) => {
      const u = usersMap[phone];
      if (!u || !u.name) return;

      const isOnline = u.status === 'online';
      const xpCount = u.xp || 0;
      const streakCount = u.streak || 1;
      const rollText = u.roll ? `(रोल: ${u.roll})` : "";
      const fullDisplayName = `${u.name} ${rollText}`.trim();

      // पदक आइकॉन
      let medalIcon = "";
      if (rank === 1) medalIcon = `<span style="color:#facc15; margin-right:4px;">🥇</span>`;
      else if (rank === 2) medalIcon = `<span style="color:#94a3b8; margin-right:4px;">🥈</span>`;
      else if (rank === 3) medalIcon = `<span style="color:#d97706; margin-right:4px;">🥉</span>`;

      // 1. छात्रों की मुख्य लिस्ट का कार्ड
      if (targetContainer) {
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.style.cssText = "display:flex; align-items:center; padding:12px 16px; gap:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; background:#111b21;";
        item.onclick = () => window.openPrivateChat(phone, fullDisplayName, u.dpUrl);

        let avatarStyle = u.dpUrl ? `background-image:url('${u.dpUrl}');` : "";
        let avatarContent = u.dpUrl ? "" : (u.name || "उ").charAt(0);

        item.innerHTML = `
          <div class="item-avatar" style="width:46px; height:46px; border-radius:50%; background:#202c33; color:#00a884; display:flex; align-items:center; justify-content:center; font-size:1.1rem; position:relative; overflow:hidden; background-size:cover; background-position:center; flex-shrink:0; ${avatarStyle}">
            ${avatarContent}
            <div style="width:12px; height:12px; background:${isOnline ? '#22c55e' : '#64748b'}; border:2px solid #111b21; border-radius:50%; position:absolute; bottom:0; right:0;"></div>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <span style="font-size:0.95rem; font-weight:bold; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${medalIcon}${fullDisplayName}
              </span>
              <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
                <span style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; font-weight:bold; font-size:0.68rem; padding:1px 6px; border-radius:10px;">🔥 ${streakCount}</span>
                <span style="background:#f59e0b; color:#000; font-weight:bold; font-size:0.68rem; padding:1px 6px; border-radius:10px;">⚡ ${xpCount} XP</span>
                <span style="color:#8696a0; font-size:0.75rem;"><i class="fa-solid fa-thumbtack"></i></span>
              </div>
            </div>
            <div style="font-size:0.78rem; color:#8696a0;">طالب علم - जमात ऊला</div>
          </div>
        `;
        targetContainer.appendChild(item);
      }

      // 2. सनद बोर्ड के टॉप 3 कार्ड्स
      if (targetSanad && rank <= 3) {
        const sanadCard = document.createElement('div');
        sanadCard.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#182229; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px 14px; margin-bottom:8px;";
        sanadCard.innerHTML = `
          <div>
            <div style="font-weight:bold; font-size:0.92rem; color:#fff;">${medalIcon}${fullDisplayName}</div>
            <div style="font-size:0.74rem; color:#facc15; margin-top:3px;">इल्मी तरक्की: ⚡ ${xpCount} XP</div>
          </div>
          <div style="border:1px solid rgba(250, 204, 21, 0.4); background:rgba(250, 204, 21, 0.1); color:#facc15; font-weight:bold; padding:4px 10px; border-radius:6px; font-size:0.75rem;">
            रैंक #${rank}
          </div>
        `;
        targetSanad.appendChild(sanadCard);
      }

      rank++;
    });
  };

  // 4. फ़िल्टर और सर्च फंक्शनैलिटी
  window.filterContactsSearch = function (q) {
    const val = (q || "").toLowerCase().trim();
    document.querySelectorAll('#users-dynamic-list .chat-item').forEach((item) => {
      const text = item.innerText.toLowerCase();
      item.style.display = text.includes(val) ? "flex" : "none";
    });
  };

  window.applyChatFilter = function (type, btn) {
    document.querySelectorAll('#wa-filter-bar .filter-pill').forEach((b) => {
      b.style.background = "#202c33";
      b.style.color = "#8696a0";
      b.classList.remove('active');
    });
    if (btn) {
      btn.style.background = "#00a884";
      btn.style.color = "#111b21";
      btn.classList.add('active');
    }
    if (type === 'groups') {
      window.openChatRoom('group', 'जमात ऊला अलिफ़ (ग्रुप)', 'मुख्य क्लासरूम');
    }
  };

  // 5. Firebase लिसनर से लाइव डेटा फेच करना
  function initLiveSync() {
    buildExactLayout();

    const fetchUsers = () => {
      if (typeof db !== 'undefined' && typeof ref === 'function' && typeof onValue === 'function') {
        onValue(ref(db, 'users'), (snap) => {
          const val = snap.val();
          if (val) window.renderAllUsersList(val);
        });
      } else if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('users').on('value', (snap) => {
          const val = snap.val();
          if (val) window.renderAllUsersList(val);
        });
      }
    };

    fetchUsers();
    // यदि डेटाबेस लोड होने में 1 सेकंड ले
    setTimeout(fetchUsers, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveSync);
  } else {
    initLiveSync();
  }
})();

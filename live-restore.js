// 🚀 100% ओरिजिनल स्क्रीनशॉट लुक + लाइव मैसेजिंग
(function () {
  "use strict";

  // 1. मैसेज सेंडर (ग्रुप व प्राइवेट चैट दोनों के लिए)
  window.sendFirebaseMessage = function (roomId, name, phone, displayName, role, text, userLocation) {
    if (!text || !text.trim()) return null;
    const db = window.db;
    if (!db || !window.push || !window.ref) return null;

    const nodePath = (roomId === 'group') ? 'messages/group' : `messages_private/${roomId}`;
    const payload = {
      sender: name || window.currentUser?.name || "User",
      senderPhone: phone || window.currentUser?.phone || "0000000000",
      displayName: displayName || window.currentUser?.displayName || name || "User",
      role: role || window.currentUser?.role || "student",
      text: text.trim(),
      location: userLocation || window.currentUser?.location || "India",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    const newRef = window.push(window.ref(db, nodePath), payload);
    return newRef.key;
  };

  // 2. लेआउट री-ऑर्डर (स्क्रीनशॉट के अनुसार)
  function buildExactLayout() {
    const area = document.getElementById('tab-content-chats');
    if (!area) return;

    area.innerHTML = `
      <div id="status-tray" class="status-tray-wrapper" style="display:flex; gap:12px; padding:10px 14px; overflow-x:auto; background:#111b21; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap;">
        <div class="status-circle-item" onclick="document.getElementById('create-status-modal')?.classList.add('active')" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; width:56px;">
          <div class="status-ring my-status" style="width:50px; height:50px; border-radius:50%; border:2px dashed #8696a0; display:flex; align-items:center; justify-content:center;">
            <div style="width:100%; height:100%; border-radius:50%; background:#202c33; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.1rem;"><i class="fa-solid fa-plus"></i></div>
          </div>
          <div style="font-size:0.68rem; color:#8696a0; margin-top:4px;">मेरा स्टेटस</div>
        </div>
        <div id="peer-statuses-dock" style="display:flex; gap:12px;"></div>
      </div>

      <div class="contact-search-box" style="margin:10px 12px 6px 12px; position:relative;">
        <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#8696a0; font-size:0.85rem;"></i>
        <input type="text" placeholder="चैट या सबक खोजें..." oninput="window.filterContactsSearch(this.value)" style="width:100%; background:#202c33; border:none; border-radius:8px; padding:8px 12px 8px 36px; color:#e9edef; font-size:0.85rem; outline:none; box-sizing:border-box;">
      </div>

      <div id="wa-filter-bar" style="display:flex; gap:8px; padding:6px 12px 10px 12px; background:#111b21; overflow-x:auto; white-space:nowrap;">
        <button class="filter-pill active" onclick="window.applyChatFilter('all', this)" style="background:#00a884; color:#111b21; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:bold; cursor:pointer;">सभी</button>
        <button class="filter-pill" onclick="window.applyChatFilter('unread', this)" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">अपठित</button>
        <button class="filter-pill" onclick="window.applyChatFilter('groups', this)" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">ग्रुप्स</button>
        <button class="filter-pill" onclick="window.openStarredMessagesModal?.()" style="background:#202c33; border:none; border-radius:18px; padding:5px 12px; cursor:pointer;"><i class="fa-solid fa-star" style="color:#facc15;"></i></button>
        <button class="filter-pill" onclick="window.openBookExchangeModal?.()" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">📚 एक्सचेंज</button>
        <button class="filter-pill" onclick="window.openNoticeBoardModal?.()" style="background:#202c33; color:#8696a0; border:none; border-radius:18px; padding:5px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">📌 नोटिस बोर्ड</button>
      </div>

      <div id="users-dynamic-list"></div>

      <div class="sanad-board-card" style="margin:14px 12px 85px 12px; background:#111b21; border:1px solid rgba(250, 204, 21, 0.25); border-radius:12px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="color:#facc15; font-weight:bold; font-size:0.92rem;"><i class="fa-solid fa-award"></i> तालिमी एज़ाज़ात व सनद बोर्ड</span>
          <span style="font-size:0.72rem; color:#8696a0;">लाइव रिकॉर्ड</span>
        </div>
        <div id="sanad-board-list"></div>
      </div>
    `;
  }

  // 3. छात्र और सनद बोर्ड भरना (स्क्रीनशॉट 3 व 4 के समान)
  window.renderAllUsersList = function (usersMap) {
    window.lastUsersMap = usersMap;
    const container = document.getElementById('users-dynamic-list');
    const sanadContainer = document.getElementById('sanad-board-list');

    if (!container || !sanadContainer) buildExactLayout();

    const tContainer = document.getElementById('users-dynamic-list');
    const tSanad = document.getElementById('sanad-board-list');
    if (tContainer) tContainer.innerHTML = "";
    if (tSanad) tSanad.innerHTML = "";

    const sorted = Object.keys(usersMap || {}).sort((a, b) => (usersMap[b]?.xp || 0) - (usersMap[a]?.xp || 0));

    let rank = 1;
    sorted.forEach((phone) => {
      const u = usersMap[phone];
      if (!u || !u.name) return;

      const isOnline = u.status === 'online';
      const xp = u.xp || 0;
      const streak = u.streak || 1;
      const fullName = `${u.name} ${u.roll ? `(रोल: ${u.roll})` : ''}`.trim();
      const medal = rank === 1 ? "🥇 " : rank === 2 ? "🥈 " : rank === 3 ? "🥉 " : "";

      if (tContainer) {
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.style.cssText = "display:flex; align-items:center; padding:12px 16px; gap:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;";
        item.onclick = () => window.openPrivateChat(phone, fullName, u.dpUrl);

        item.innerHTML = `
          <div class="item-avatar" style="width:46px; height:46px; border-radius:50%; background:#202c33; color:#00a884; display:flex; align-items:center; justify-content:center; font-size:1.1rem; position:relative; overflow:hidden; background-size:cover; flex-shrink:0; ${u.dpUrl ? `background-image:url('${u.dpUrl}');` : ''}">
            ${u.dpUrl ? '' : (u.name || "उ").charAt(0)}
            <div style="width:12px; height:12px; background:${isOnline ? '#22c55e' : '#64748b'}; border:2px solid #111b21; border-radius:50%; position:absolute; bottom:0; right:0;"></div>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <span style="font-size:0.95rem; font-weight:bold; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${medal}${fullName}
              </span>
              <div style="display:flex; gap:6px; align-items:center;">
                <span style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444; font-weight:bold; font-size:0.68rem; padding:1px 6px; border-radius:10px;">🔥 ${streak}</span>
                <span style="background:#f59e0b; color:#000; font-weight:bold; font-size:0.68rem; padding:1px 6px; border-radius:10px;">⚡ ${xp} XP</span>
                <span style="color:#8696a0; font-size:0.75rem;"><i class="fa-solid fa-thumbtack"></i></span>
              </div>
            </div>
            <div style="font-size:0.78rem; color:#8696a0;">طالب علم - जमात ऊला</div>
          </div>
        `;
        tContainer.appendChild(item);
      }

      if (tSanad && rank <= 3) {
        const sCard = document.createElement('div');
        sCard.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#182229; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px 14px; margin-bottom:8px;";
        sCard.innerHTML = `
          <div>
            <div style="font-weight:bold; font-size:0.92rem; color:#fff;">${medal}${fullName}</div>
            <div style="font-size:0.74rem; color:#facc15; margin-top:3px;">इल्मी तरक्की: ⚡ ${xp} XP</div>
          </div>
          <div style="border:1px solid rgba(250, 204, 21, 0.4); background:rgba(250, 204, 21, 0.1); color:#facc15; font-weight:bold; padding:4px 10px; border-radius:6px; font-size:0.75rem;">
            रैंक #${rank}
          </div>
        `;
        tSanad.appendChild(sCard);
      }

      rank++;
    });
  };

  // 4. लाइव डेटा लोड
  function startSync() {
    buildExactLayout();
    const tryListen = () => {
      if (window.db && window.onValue && window.ref) {
        window.onValue(window.ref(window.db, 'users'), (snap) => {
          const val = snap.val();
          if (val) window.renderAllUsersList(val);
        });
      } else {
        setTimeout(tryListen, 300);
      }
    };
    tryListen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startSync);
  else startSync();
})();

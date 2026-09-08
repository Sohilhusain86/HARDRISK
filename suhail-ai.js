// ==========================================================
// 🚀 सोहेल एआई - टच-ड्रैगेबल विजेट व लेआउट प्रोटेक्टर
// ==========================================================

(function() {
  // 1. क्राउन (👑) को आज़ाद करना और ख़राब फिक्स बटनों को हटाना
  const oldRogueBtn = document.getElementById('btn-about-trigger');
  if (oldRogueBtn) oldRogueBtn.remove();

  // 2. ड्रैगेबल डॉक स्टाइल
  const style = document.createElement('style');
  style.innerHTML = `
    /* हेडर और क्राउन को ओवरलैप से बचाना */
    #btn-about-trigger { display: none !important; }
    
    /* ड्रैगेबल कंट्रोलर बॉक्स */
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
    .btn-dock-about { background: #111b21; color: #3b82f6; border: 1px solid #3b82f6; }
    .drag-grip { color: #8696a0; font-size: 0.8rem; cursor: grab; padding: 0 2px; }

    /* कीबोर्ड खुलते ही या टाइप करते ही डॉक को पारदर्शी/किनारे करना */
    .dock-minimized {
      opacity: 0.25;
      transform: scale(0.85);
    }
  `;
  document.head.appendChild(style);

  // 3. ड्रैगेबल डॉक बनाना (स्क्रीन पर कहीं भी ले जाने योग्य)
  function createDraggableDock() {
    if (document.getElementById('suhail-drag-dock')) return;

    // पुराने स्थिर बटनों को छिपाना ताकि चैट इनपुट साफ़ हो जाए
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
        <a href="/awam.html" class="suhail-dock-btn btn-dock-awam">🏛️ 40 खिदमात</a>
        <a href="/admin.html" class="suhail-dock-btn btn-dock-admin">🛡️ एडमिन</a>
        <button class="suhail-dock-btn btn-dock-about" onclick="document.getElementById('about-guide-modal').style.display='flex'">ℹ️ गाइड</button>
      </div>
    `;
    document.body.appendChild(dock);

    // 4. टच ड्रैग लॉजिक (मोबाइल पर उंगली से सरकाना)
    let isDragging = false;
    let startX, startY, initLeft, initTop;

    const handle = document.getElementById('dock-handle');

    function onTouchStart(e) {
      if (e.target.closest('a') || e.target.closest('button')) return; // बटनों पर क्लिक काम करे
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      const rect = dock.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      dock.style.bottom = 'auto';
      dock.style.right = 'auto';
      dock.style.left = initLeft + 'px';
      dock.style.top = initTop + 'px';
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      let newLeft = Math.max(10, Math.min(window.innerWidth - dock.offsetWidth - 10, initLeft + dx));
      let newTop = Math.max(10, Math.min(window.innerHeight - dock.offsetHeight - 10, initTop + dy));

      dock.style.left = newLeft + 'px';
      dock.style.top = newTop + 'px';
    }

    function onTouchEnd() {
      isDragging = false;
    }

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    // 5. टाइपिंग के समय इनपुट बॉक्स को साफ़ रखना
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(inp => {
      inp.addEventListener('focus', () => dock.classList.add('dock-minimized'));
      inp.addEventListener('blur', () => dock.classList.remove('dock-minimized'));
    });
  }

  // 6. लाइव स्टार और बैज को सही रेंडर करना
  function syncLiveBadges() {
    const db = window.db || (typeof firebase !== 'undefined' && firebase.apps.length ? firebase.database() : null);
    if (!db) return;

    db.ref('users').on('value', snap => {
      snap.forEach(child => {
        const u = child.val() || {};
        const roll = String(u.roll || u.rollNumber || child.key).trim();
        if (u.star || u.badge) {
          document.querySelectorAll('div, p, span, h4').forEach(el => {
            if (el.children.length <= 1 && el.innerText && el.innerText.includes(`रोल: ${roll}`)) {
              if (!el.getAttribute('data-badge-synced')) {
                el.setAttribute('data-badge-synced', 'true');
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

  window.addEventListener('DOMContentLoaded', () => {
    createDraggableDock();
    syncLiveBadges();
  });
  setTimeout(() => {
    createDraggableDock();
    syncLiveBadges();
  }, 1000);
})();

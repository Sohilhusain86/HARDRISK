/**
 * ============================================================================
 * 🚀 SUHAIL LIVE SYSTEM — SAFE MODULAR ENGINE
 * File: suhail-live-system.js
 * Architecture: Zero-Conflict Client Extension & Security Hardening
 * ============================================================================
 */

(function () {
  "use strict";

  // 1. DUPLICATE PROTECTION: दो बार लोड होने से रोकें
  if (window.__SUHAIL_LIVE_SYSTEM_INITIALIZED__) {
    console.warn("[SuhailLiveSystem] Duplicate initialization prevented.");
    return;
  }
  window.__SUHAIL_LIVE_SYSTEM_INITIALIZED__ = true;

  // 2. XSS SAFETY: यूनिवर्सल HTML Entity Encoder
  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 3. XP-BASED VIDEO DURATION CALCULATION
  function getAllowedVideoDuration() {
    const user = window.currentUser || {};
    if (user.role === "admin") {
      return 300; // एडमिन को 5 मिनट (300s) की अनुमति
    }
    const xp = parseInt(user.xp, 10) || 0;
    if (xp >= 2000) return 300; // 5 मिनट
    if (xp >= 1000) return 120; // 2 मिनट
    if (xp >= 500) return 60;   // 1 मिनट
    if (xp >= 200) return 30;   // 30 सेकंड
    return 15;                  // 0–199 XP = 15 सेकंड
  }

  // 4. CSS STYLING (Scoped & Non-Breaking)
  function injectStyles() {
    if (document.getElementById("suhail-live-styles")) return;
    const style = document.createElement("style");
    style.id = "suhail-live-styles";
    style.textContent = `
      /* 🎮 5-Button Floating Draggable Dock */
      #suhail-floating-dock {
        position: fixed !important;
        bottom: 20px !important;
        right: 12px !important;
        z-index: 2147483640 !important;
        display: flex !important;
        align-items: center;
        gap: 5px;
        background: rgba(17, 27, 33, 0.96) !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        border-radius: 25px !important;
        padding: 4px 8px !important;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.75) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        touch-action: none;
        user-select: none;
        max-width: 95vw;
        box-sizing: border-box;
      }
      .suhail-dock-drag {
        color: #8696a0;
        font-size: 0.8rem;
        cursor: grab;
        padding: 0 4px;
        display: flex;
        align-items: center;
      }
      .suhail-dock-btn {
        padding: 6px 10px;
        border-radius: 14px;
        font-size: 0.68rem;
        font-weight: 700;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
        white-space: nowrap;
        text-decoration: none;
        transition: transform 0.1s ease;
      }
      .suhail-dock-btn:active {
        transform: scale(0.95);
      }
      .dock-btn-ai   { background: #00a884; color: #ffffff; }
      .dock-btn-awam { background: rgba(0, 168, 132, 0.2); color: #00a884; border: 1px solid rgba(0, 168, 132, 0.4); }
      .dock-btn-edu  { background: #182229; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
      .dock-btn-info { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35); }
      .dock-btn-adm  { background: #202c33; color: #ef4444; border: 1px solid #ef4444; display: none; }

      /* 📜 Live Sanad & Awards Board */
      #suhail-live-awards-board {
        width: calc(100% - 24px) !important;
        margin: 14px auto 35px auto !important;
        background: #111b21 !important;
        border: 1px solid rgba(250, 204, 21, 0.35) !important;
        border-radius: 12px !important;
        padding: 14px 12px !important;
        box-sizing: border-box !important;
        display: block !important;
        clear: both !important;
      }
      .sanad-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 6px;
        margin-bottom: 10px;
      }
      .sanad-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #182229;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // 5. FEATURE 1: 5-BUTTON FLOATING DOCK
  function initFloatingDock() {
    if (document.getElementById("suhail-floating-dock")) return;

    const dock = document.createElement("div");
    dock.id = "suhail-floating-dock";
    dock.innerHTML = `
      <div class="suhail-dock-drag" id="suhail-dock-handle"><i class="fa-solid fa-grip-vertical"></i></div>
      <button type="button" class="suhail-dock-btn dock-btn-ai" id="dock-btn-ai"><i class="fa-solid fa-book"></i> 30 AI</button>
      <button type="button" class="suhail-dock-btn dock-btn-awam" id="dock-btn-awam"><i class="fa-solid fa-layer-group"></i> 40 आवामी</button>
      <button type="button" class="suhail-dock-btn dock-btn-edu" id="dock-btn-edu"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी</button>
      <button type="button" class="suhail-dock-btn dock-btn-info" id="dock-btn-info"><i class="fa-solid fa-circle-info"></i> गाइड</button>
      <button type="button" class="suhail-dock-btn dock-btn-adm" id="dock-btn-adm"><i class="fa-solid fa-shield-halved"></i> एडमिन</button>
    `;
    document.body.appendChild(dock);

    // Existing Modal Openers (No Dummy Alert, Reusing Existing Elements)
    document.getElementById("dock-btn-ai").addEventListener("click", () => openAiToolkitModal("edu"));
    document.getElementById("dock-btn-edu").addEventListener("click", () => openAiToolkitModal("edu"));
    document.getElementById("dock-btn-awam").addEventListener("click", () => openAiToolkitModal("awam"));
    document.getElementById("dock-btn-info").addEventListener("click", openExistingGuideModal);
    document.getElementById("dock-btn-adm").addEventListener("click", openExistingAdminPanel);

    updateAdminDockVisibility();
    makeDockDraggable(dock);
  }

  function openAiToolkitModal(category) {
    const modal = document.getElementById("ai-toolkit-modal");
    if (!modal) return;
    modal.style.display = "flex";
    modal.style.zIndex = "2147483645";

    const select = document.getElementById("sel-ai-task");
    if (select) {
      if (category === "awam") {
        const awamOpt = select.querySelector('optgroup[label*="NVIDIA"] option, optgroup[label*="आवामी"] option');
        if (awamOpt) select.value = awamOpt.value;
      } else {
        const eduOpt = select.querySelector('optgroup[label*="Groq"] option, optgroup[label*="तालीमी"] option');
        if (eduOpt) select.value = eduOpt.value;
      }
    }
  }

  function openExistingGuideModal() {
    const guide = document.getElementById("quick-solver-modal");
    if (guide) {
      guide.classList.add("active");
    }
  }

  function openExistingAdminPanel() {
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
      adminPanel.classList.add("open");
      return;
    }
    const adminMaster = document.getElementById("admin-master-modal");
    if (adminMaster) {
      adminMaster.style.display = "block";
    }
  }

  function updateAdminDockVisibility() {
    const btn = document.getElementById("dock-btn-adm");
    if (!btn) return;
    if (window.currentUser && window.currentUser.role === "admin") {
      btn.style.display = "inline-flex";
    }
  }

  function makeDockDraggable(el) {
    let isDragging = false;
    let startX, startY, initLeft, initTop;

    el.addEventListener("touchstart", (e) => {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const rect = el.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      el.style.bottom = "auto";
      el.style.right = "auto";
      el.style.left = `${initLeft}px`;
      el.style.top = `${initTop}px`;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      const maxLeft = window.innerWidth - el.offsetWidth - 8;
      const maxTop = window.innerHeight - el.offsetHeight - 8;

      const newLeft = Math.max(8, Math.min(maxLeft, initLeft + dx));
      const newTop = Math.max(8, Math.min(maxTop, initTop + dy));

      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    }, { passive: true });

    document.addEventListener("touchend", () => {
      isDragging = false;
    });
  }

  // 6. FEATURE 2: LIVE SANAD / AWARDS BOARD (Safe DOM Rendering)
  function renderLiveAwardsBoard(usersMap) {
    const chatTab = document.getElementById("tab-content-chats");
    if (!chatTab) return;

    let board = document.getElementById("suhail-live-awards-board");
    if (!board) {
      board = document.createElement("div");
      board.id = "suhail-live-awards-board";
      chatTab.appendChild(board);
    }

    const usersList = Object.keys(usersMap || {})
      .map((key) => {
        const u = usersMap[key];
        return u ? { ...u, userKey: key } : null;
      })
      .filter((u) => u && u.name && ((parseInt(u.xp, 10) > 0) || u.role === "admin" || u.star))
      .sort((a, b) => (parseInt(b.xp, 10) || 0) - (parseInt(a.xp, 10) || 0))
      .slice(0, 5);

    // Header Safe DOM
    board.innerHTML = `
      <div class="sanad-header">
        <div style="color:#facc15; font-size:0.86rem; font-weight:bold;">
          <i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड
        </div>
        <span style="font-size:0.68rem; color:#8696a0;">लाइव रिकॉर्ड</span>
      </div>
      <div id="suhail-sanad-list"></div>
    `;

    const listContainer = board.querySelector("#suhail-sanad-list");

    if (usersList.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.cssText = "color:#8696a0; font-size:0.75rem; text-align:center; padding:6px;";
      emptyMsg.textContent = "अभी कोई इल्मी रिकॉर्ड उपलब्ध नहीं है।";
      listContainer.appendChild(emptyMsg);
      return;
    }

    usersList.forEach((st, idx) => {
      const row = document.createElement("div");
      row.className = "sanad-row";

      const isAdmin = st.role === "admin";
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐";
      const tagText = isAdmin ? "उस्ताद / एडमिन" : `रैंक #${idx + 1}`;
      const tagColor = isAdmin ? "#38bdf8" : "#facc15";

      const infoDiv = document.createElement("div");
      infoDiv.style.textAlign = "left";

      const nameDiv = document.createElement("div");
      nameDiv.style.cssText = "font-size:0.84rem; font-weight:bold; color:#fff;";
      nameDiv.textContent = `${medal} ${st.displayName || st.name}`;

      const xpDiv = document.createElement("div");
      xpDiv.style.cssText = "font-size:0.7rem; color:#8696a0;";
      xpDiv.innerHTML = `इल्मी तरक़्क़ी: <strong style="color:#facc15;">⚡ ${escapeHTML(st.xp || 0)} XP</strong>`;

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(xpDiv);

      const badgeDiv = document.createElement("div");
      badgeDiv.style.cssText = `background:rgba(255,255,255,0.05); border:1px solid ${tagColor}44; color:${tagColor}; padding:3px 8px; border-radius:6px; font-size:0.7rem; font-weight:bold; white-space:nowrap;`;
      badgeDiv.textContent = tagText;

      row.appendChild(infoDiv);
      row.appendChild(badgeDiv);
      listContainer.appendChild(row);
    });
  }

  // 7. FEATURE 3: STATUS VIDEO SAFE ENHANCEMENT
  function enhanceStatusVideoPlayback() {
    const video = document.getElementById("status-view-video");
    if (!video) return;

    // Attributes required by mobile autoplay policies
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.controls = true;
    video.style.width = "100%";
    video.style.maxHeight = "65vh";
    video.style.objectFit = "contain";
    video.style.backgroundColor = "#000";

    // Playback safety handler
    video.addEventListener("error", (e) => {
      console.warn("[SuhailLiveSystem] Status video playback error:", e);
    });
  }

  // 8. FEATURE 4 & 5: DURATION VALIDATION & RAW BASE64 VIDEO BLOCK
  function setupStatusUploadGuards() {
    const videoInput = document.getElementById("status-file-video");
    if (videoInput && !videoInput.getAttribute("data-suhail-guarded")) {
      videoInput.setAttribute("data-suhail-guarded", "true");

      videoInput.addEventListener("change", function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const maxSeconds = getAllowedVideoDuration();
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";

        tempVideo.onloadedmetadata = function () {
          window.URL.revokeObjectURL(tempVideo.src);
          const duration = Math.round(tempVideo.duration || 0);

          if (duration > maxSeconds) {
            alert(
              `⚠️ वीडियो अवधि सीमा से अधिक है!\n\nआपकी XP (${window.currentUser?.xp || 0}) के अनुसार अधिकतम अनुमति: ${maxSeconds} सेकंड है।\nचुनी गई वीडियो: ${duration} सेकंड की है।\n\nकृपया छोटी वीडियो चुनें।`
            );
            videoInput.value = "";
            if (typeof window.clearStatusMediaPreview === "function") {
              window.clearStatusMediaPreview();
            }
          }
        };

        tempVideo.onerror = function () {
          window.URL.revokeObjectURL(tempVideo.src);
        };

        tempVideo.src = URL.createObjectURL(file);
      }, true);
    }

    // Wrap status submission to PREVENT raw base64 video in Firebase
    if (typeof window.submitEnhancedStatus === "function" && !window.__SUBMIT_ENHANCED_WRAPPED__) {
      window.__SUBMIT_ENHANCED_WRAPPED__ = true;
      const originalSubmit = window.submitEnhancedStatus;

      window.submitEnhancedStatus = async function () {
        const vidFile = document.getElementById("status-file-video")?.files?.[0];
        const postBtn = document.getElementById("btn-post-status-submit");

        // If a video is selected, verify Cloudinary URL before Firebase submission
        if (vidFile) {
          if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-spin"></i> वीडियो अपलोड हो रही है...`;
          }

          try {
            if (typeof window.uploadToCloudinary !== "function") {
              throw new Error("अपलोड सेवा उपलब्ध नहीं है।");
            }

            const cloudUrl = await window.uploadToCloudinary(vidFile, "video");
            if (!cloudUrl || typeof cloudUrl !== "string" || !cloudUrl.startsWith("http")) {
              throw new Error("क्लाउडिनरी से मान्य वीडियो लिंक नहीं मिला।");
            }

            window.tempStatusMedia = {
              type: "video",
              base64: cloudUrl // HTTP CDN URL (Not raw base64)
            };
          } catch (err) {
            alert(
              `❌ वीडियो अपलोड विफल रहा: ${err.message}\nडेटाबेस सुरक्षा के लिए स्टेटस रोक दिया गया है।`
            );
            if (postBtn) {
              postBtn.disabled = false;
              postBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> 24 घंटे के लिए पोस्ट करें`;
            }
            return; // Abort: Never save raw Base64 video to Firebase
          }
        }

        // Proceed to original submission for text/photos/verified CDN video
        originalSubmit.apply(this, arguments);
      };
    }
  }

  // 9. INTEGRATION: Hook into Existing Firebase Users Renderer
  function hookExistingUsersRenderer() {
    if (typeof window.renderAllUsersList === "function" && !window.__USERS_RENDERER_HOOKED__) {
      window.__USERS_RENDERER_HOOKED__ = true;
      const previousRenderer = window.renderAllUsersList;

      window.renderAllUsersList = function (usersMap) {
        previousRenderer.apply(this, arguments);
        renderLiveAwardsBoard(usersMap);
        updateAdminDockVisibility();
      };
    }

    // If data was already cached on previous renders
    if (window.lastUsersMap) {
      renderLiveAwardsBoard(window.lastUsersMap);
    }
  }

  // 10. SYSTEM BOOTSTRAP
  function bootstrap() {
    injectStyles();
    initFloatingDock();
    enhanceStatusVideoPlayback();
    setupStatusUploadGuards();
    hookExistingUsersRenderer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  // Periodic safety check for dynamic login or tab changes
  setInterval(() => {
    updateAdminDockVisibility();
    setupStatusUploadGuards();
    enhanceStatusVideoPlayback();
  }, 2500);

})();

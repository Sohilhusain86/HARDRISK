/**
 * ============================================================================
 * 🚀 SUHAIL LIVE SYSTEM — DISTINCT 5-FEATURE ENGINE (100% REAL / NO DUMMY)
 * File: suhail-live-system.js
 * ============================================================================
 */

(function () {
  "use strict";

  if (window.__SUHAIL_LIVE_SYSTEM_INITIALIZED__) return;
  window.__SUHAIL_LIVE_SYSTEM_INITIALIZED__ = true;

  // 1. XSS Escaper
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 2. XP Video Duration Calculator
  function getAllowedVideoDuration() {
    const user = window.currentUser || {};
    if (user.role === "admin") return 300;
    const xp = parseInt(user.xp, 10) || 0;
    if (xp >= 2000) return 300;
    if (xp >= 1000) return 120;
    if (xp >= 500) return 60;
    if (xp >= 200) return 30;
    return 15;
  }

  // 3. UI Styles
  function injectStyles() {
    if (document.getElementById("suhail-live-styles")) return;
    const style = document.createElement("style");
    style.id = "suhail-live-styles";
    style.textContent = `
      #suhail-floating-dock {
        position: fixed !important;
        bottom: 18px !important;
        right: 10px !important;
        z-index: 2147483640 !important;
        display: flex !important;
        align-items: center;
        gap: 4px;
        background: rgba(17, 27, 33, 0.96) !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        border-radius: 25px !important;
        padding: 3px 6px !important;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.75) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        touch-action: none;
        user-select: none;
        max-width: 96vw;
        box-sizing: border-box;
      }
      .suhail-dock-drag {
        color: #8696a0;
        font-size: 0.8rem;
        cursor: grab;
        padding: 0 3px;
        display: flex;
        align-items: center;
      }
      .suhail-dock-btn {
        padding: 6px 9px;
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
      }
      .dock-btn-ai   { background: #00a884; color: #fff; }
      .dock-btn-awam { background: rgba(0, 168, 132, 0.2); color: #00a884; border: 1px solid rgba(0, 168, 132, 0.4); }
      .dock-btn-edu  { background: #182229; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
      .dock-btn-info { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35); }
      .dock-btn-adm  { background: #202c33; color: #ef4444; border: 1px solid #ef4444; }

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

      /* कार्ड्स आधारित 30 AI इंटरफ़ेस स्टाइल */
      .ai-feature-card {
        background: #182229;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: 0.15s;
      }
      .ai-feature-card:hover {
        border-color: #00a884;
        background: #202c33;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================================================
  // 4. फ़ीचर 1: "30 AI" — कार्ड-ग्रिड डैशबोर्ड (अलग डिज़ाइन व डायरेक्ट फ़ंक्शन)
  // ==========================================================================
  window.open30AiSuiteModal = function () {
    let modal = document.getElementById("suhail-30ai-cards-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "suhail-30ai-cards-modal";
      modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:15px;";
      modal.innerHTML = `
        <div style="background:#111b21; border:1px solid #00a884; border-radius:12px; max-width:440px; width:100%; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 30px rgba(0,168,132,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.1);">
            <h3 style="color:#00a884; font-size:1.05rem; margin:0; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> 30 AI सुपर असिस्टेंट
            </h3>
            <button onclick="document.getElementById('suhail-30ai-cards-modal').style.display='none'" style="background:none; border:none; color:#8696a0; font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div style="padding:14px; overflow-y:auto; flex:1;">
            <p style="color:#8696a0; font-size:0.78rem; margin:0 0 10px 0;">सीधे किसी भी AI टूल पर क्लिक करें:</p>
            
            <!-- त्वरित कार्ड्स -->
            <div class="ai-feature-card" onclick="window.runDirect30AiTool('cerebras_tarkib', 'अरबी इबारत की नह्वी तरकीब')">
              <div>
                <b style="color:#38bdf8; font-size:0.85rem;">📐 नह्वी तरकीब सॉल्वर</b>
                <div style="color:#8696a0; font-size:0.72rem;">इबारत की तरकीब, ए'राब और अमिल-मामूल का विश्लेषण</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:#8696a0; font-size:0.8rem;"></i>
            </div>

            <div class="ai-feature-card" onclick="window.runDirect30AiTool('groq_nahw_sarf_quick', 'कलिमा पहचान (इस्म, फे़ल, हर्फ़)')">
              <div>
                <b style="color:#facc15; font-size:0.85rem;">⚡ कलिमा व सेग़ा पहचान</b>
                <div style="color:#8696a0; font-size:0.72rem;">इस्म, फे़ल, हर्फ़ व हफ़्त अक़्साम की फ़ौरी पहचान</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:#8696a0; font-size:0.8rem;"></i>
            </div>

            <div class="ai-feature-card" onclick="window.runDirect30AiTool('sambanova_class_summary', 'दरस व क्लास का खुलासा')">
              <div>
                <b style="color:#00a884; font-size:0.85rem;">📝 आज के सबक का खुलासा</b>
                <div style="color:#8696a0; font-size:0.72rem;">क्लास की बातचीत और सबक की बुलेट-पॉइंट समरी</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:#8696a0; font-size:0.8rem;"></i>
            </div>

            <div class="ai-feature-card" onclick="window.runDirect30AiTool('mistral_tashkeel', 'अरबी इबारत पर एराब लगाना')">
              <div>
                <b style="color:#a78bfa; font-size:0.85rem;">✏️ ए'राब (Tashkeel) व इमला सुधार</b>
                <div style="color:#8696a0; font-size:0.72rem;">बे-एराब इबारत पर सही ज़बर-ज़ेर-पेश लगाना</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:#8696a0; font-size:0.8rem;"></i>
            </div>

            <div class="ai-feature-card" onclick="window.runDirect30AiTool('openrouter_translation', 'अरबी-उर्दू-हिंदी तर्जुमा')">
              <div>
                <b style="color:#fb7185; font-size:0.85rem;">🌐 मुफ़्रदात व शुद्ध तर्जुमा</b>
                <div style="color:#8696a0; font-size:0.72rem;">सटीक इल्मी व बामुहावरा तर्जुमा</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:#8696a0; font-size:0.8rem;"></i>
            </div>

            <!-- इनपुट व नतीजा बॉक्स -->
            <div id="direct-ai-input-section" style="margin-top:14px; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; display:none;">
              <span id="direct-ai-active-label" style="color:#00a884; font-size:0.82rem; font-weight:bold; display:block; margin-bottom:6px;"></span>
              <textarea id="direct-ai-input-text" rows="3" placeholder="यहाँ अपनी इबारत या सवाल लिखें..." style="width:100%; padding:9px; background:#202c33; border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:6px; font-size:0.88rem; box-sizing:border-box; margin-bottom:8px;"></textarea>
              <button id="direct-ai-run-btn" onclick="window.executeDirect30AiQuery()" style="width:100%; background:#00a884; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">
                🚀 जवाब हासिल करें
              </button>
              <div id="direct-ai-result-box" style="display:none; background:#0b141a; border:1px dashed rgba(255,255,255,0.2); border-radius:6px; padding:10px; margin-top:10px; font-size:0.85rem; color:#e9edef; line-height:1.5; max-height:160px; overflow-y:auto; white-space:pre-wrap;"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = "flex";
  };

  let activeDirectTaskKey = "";
  window.runDirect30AiTool = function (taskKey, taskLabel) {
    activeDirectTaskKey = taskKey;
    const sec = document.getElementById("direct-ai-input-section");
    const lbl = document.getElementById("direct-ai-active-label");
    const resBox = document.getElementById("direct-ai-result-box");
    if (sec && lbl) {
      sec.style.display = "block";
      lbl.innerText = "🎯 चुना गया टूल: " + taskLabel;
      if (resBox) resBox.style.display = "none";
      document.getElementById("direct-ai-input-text").focus();
    }
  };

  window.executeDirect30AiQuery = async function () {
    const input = document.getElementById("direct-ai-input-text").value.trim();
    const btn = document.getElementById("direct-ai-run-btn");
    const resBox = document.getElementById("direct-ai-result-box");
    if (!input) return alert("कृपया इबारत या सवाल लिखें!");

    btn.disabled = true;
    btn.innerText = "⏳ AI जवाब तैयार कर रहा है...";
    resBox.style.display = "block";
    resBox.innerText = "तैयार किया जा रहा है...";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: activeDirectTaskKey, prompt: input })
      });
      const data = await res.json();
      resBox.innerText = data.reply || data.text || "जवाब प्राप्त नहीं हो सका।";
    } catch (e) {
      resBox.innerText = "त्रुटि: " + e.message;
    } finally {
      btn.disabled = false;
      btn.innerText = "🚀 जवाब हासिल करें";
    }
  };

  // ==========================================================================
  // 5. फ़ीचर 2 & 3: "30 इल्मी" व "40 आवामी" (फ़ोटो 4, 5, 6 वाला ड्रॉपडाउन मोडल)
  // ==========================================================================
  function openDropdownAiModal(mode) {
    const modal = document.getElementById("ai-toolkit-modal");
    const select = document.getElementById("sel-ai-task");
    if (!modal || !select) return;

    const headerTitle = modal.querySelector("h3");
    const optgroups = select.querySelectorAll("optgroup");

    if (mode === "awam") {
      // 🏛️ 40 आवामी खिदमात (विकल्प 31 से 70)
      if (headerTitle) headerTitle.innerHTML = `<i class="fa-solid fa-layer-group"></i> 40 AI आवामी खिदमात (Suhail AI)`;
      optgroups.forEach((og) => {
        const lbl = og.getAttribute("label") || "";
        const isAwam = lbl.includes("NVIDIA") || lbl.includes("Cloudflare") || lbl.includes("Gemini") || lbl.includes("Cohere");
        og.style.display = isAwam ? "" : "none";
      });
      select.value = "nv_govt_scheme"; // 31. सरकारी योजना
    } else {
      // 📚 30 इल्मी खिदमात (विकल्प 1 से 30)
      if (headerTitle) headerTitle.innerHTML = `<i class="fa-solid fa-book-bookmark"></i> 30 AI इल्मी खिदमात (Suhail AI)`;
      optgroups.forEach((og) => {
        const lbl = og.getAttribute("label") || "";
        const isEdu = lbl.includes("Groq") || lbl.includes("Cerebras") || lbl.includes("SambaNova") || lbl.includes("Mistral") || lbl.includes("OpenRouter") || lbl.includes("HuggingFace");
        og.style.display = isEdu ? "" : "none";
      });
      select.value = "groq_nahw_sarf_quick"; // 1. कलिमा पहचान
    }

    modal.style.display = "flex";
    modal.style.zIndex = "2147483645";
  }

  // ==========================================================================
  // 6. फ़ीचर 4: "गाइड" — शुद्ध तालीमी रहनुमाई व उसूल (नो गणित / इंग्लिश / हिंदी)
  // ==========================================================================
  function openRealAppGuideModal() {
    const old = document.getElementById("suhail-guide-modal-real");
    if (old) old.remove();

    const gModal = document.createElement("div");
    gModal.id = "suhail-guide-modal-real";
    gModal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:18px;";
    gModal.innerHTML = `
      <div style="background:linear-gradient(145deg, #1c1917, #261f0d, #111b21); border:2px solid #facc15; border-radius:16px; max-width:400px; width:100%; padding:22px 18px; color:#fef08a; text-align:left; box-shadow:0 10px 30px rgba(250,204,21,0.3); box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(250,204,21,0.3); padding-bottom:8px; margin-bottom:14px;">
          <h3 style="margin:0; font-size:1.05rem; color:#fde68a; font-weight:800;">
            <i class="fa-solid fa-circle-info"></i> तालीमी रहनुमाई व उसूल
          </h3>
          <span onclick="document.getElementById('suhail-guide-modal-real').remove()" style="cursor:pointer; font-size:1.3rem; color:#8696a0;">✕</span>
        </div>
        
        <div style="font-size:0.82rem; color:#e9edef; line-height:1.7; margin-bottom:16px;">
          <div style="margin-bottom:10px;">
            <b style="color:#facc15;">⚡ XP व इल्मी तरक़्क़ी:</b><br>
            रोज़ाना क्विज़ मुकाबला, तक़रार और मुताला में हिस्सा लेकर अपनी XP बढ़ाएँ। टॉप छात्रों के नाम सीधे सनद बोर्ड पर आते हैं।
          </div>
          <div style="margin-bottom:10px;">
            <b style="color:#38bdf8;">⭐ उस्ताद की सनद व एज़ाज़:</b><br>
            बेहतरीन पढ़ाई और लगन पर मोहतमिम व उस्ताद (Suhail Husain) की जानिब से मुमताज़ तलबा को स्टार और शाही बैज अता किए जाते हैं।
          </div>
          <div style="margin-bottom:10px;">
            <b style="color:#ef4444;">⚠️ क्लासरूम ज़ब्त व क़ानून:</b><br>
            क्लासरूम में गैर-तालीमी बातचीत पर स्ट्राइक मिलेगी। <b>3 स्ट्राइक होने पर छात्र की आईडी हमेशा के लिए ब्लॉक कर दी जाएगी।</b>
          </div>
          <div>
            <b style="color:#00a884;">🤖 Suhail AI खिदमात:</b><br>
            30 इल्मी व 40 आवामी टूल्स 24 घंटे पढ़ाई और सामाजिक कार्यों में रहनुमाई के लिए उपलब्ध हैं।
          </div>
        </div>

        <button onclick="document.getElementById('suhail-guide-modal-real').remove()" style="width:100%; background:#facc15; color:#000; border:none; padding:10px; border-radius:10px; font-weight:bold; font-size:0.88rem; cursor:pointer;">
          जी, समझ गया (वापस जाएँ)
        </button>
      </div>
    `;
    document.body.appendChild(gModal);
  }

  // ==========================================================================
  // 7. फ़ीचर 5: "एडमिन" — मास्टर एडमिन कंट्रोल सेंटर (फ़ोटो 2)
  // ==========================================================================
  function openMasterAdminModal() {
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

  // 8. डॉक तैयार करना
  function buildDock() {
    if (document.getElementById("suhail-floating-dock")) return;

    const dock = document.createElement("div");
    dock.id = "suhail-floating-dock";
    dock.innerHTML = `
      <div class="suhail-dock-drag"><i class="fa-solid fa-grip-vertical"></i></div>
      <button type="button" class="suhail-dock-btn dock-btn-ai" id="dock-btn-ai"><i class="fa-solid fa-wand-magic-sparkles"></i> 30 AI</button>
      <button type="button" class="suhail-dock-btn dock-btn-awam" id="dock-btn-awam"><i class="fa-solid fa-layer-group"></i> 40 आवामी</button>
      <button type="button" class="suhail-dock-btn dock-btn-edu" id="dock-btn-edu"><i class="fa-solid fa-graduation-cap"></i> 30 इल्मी</button>
      <button type="button" class="suhail-dock-btn dock-btn-info" id="dock-btn-info"><i class="fa-solid fa-circle-info"></i> गाइड</button>
      <button type="button" class="suhail-dock-btn dock-btn-adm" id="dock-btn-adm"><i class="fa-solid fa-shield-halved"></i> एडमिन</button>
    `;
    document.body.appendChild(dock);

    // अलग-अलग फ़ंक्शंस से जोड़ना
    document.getElementById("dock-btn-ai").onclick = window.open30AiSuiteModal;      // कार्ड ग्रिड
    document.getElementById("dock-btn-edu").onclick = () => openDropdownAiModal("edu"); // 30 इल्मी ड्रॉपडाउन
    document.getElementById("dock-btn-awam").onclick = () => openDropdownAiModal("awam"); // 40 आवामी ड्रॉपडाउन
    document.getElementById("dock-btn-info").onclick = openRealAppGuideModal;          // तालीमी उसूल
    document.getElementById("dock-btn-adm").onclick = openMasterAdminModal;            // मास्टर एडमिन

    // टच ड्रैग लॉजिक
    let isDragging = false, startX, startY, initLeft, initTop;
    dock.addEventListener("touchstart", (e) => {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const rect = dock.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      dock.style.bottom = "auto";
      dock.style.right = "auto";
      dock.style.left = `${initLeft}px`;
      dock.style.top = `${initTop}px`;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      const maxLeft = window.innerWidth - dock.offsetWidth - 8;
      const maxTop = window.innerHeight - dock.offsetHeight - 8;
      dock.style.left = `${Math.max(8, Math.min(maxLeft, initLeft + dx))}px`;
      dock.style.top = `${Math.max(8, Math.min(maxTop, initTop + dy))}px`;
    }, { passive: true });

    document.addEventListener("touchend", () => { isDragging = false; });
  }

  // 9. लाइव सनद बोर्ड (फ़ोटो 1)
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
      .map((k) => (usersMap[k] ? { ...usersMap[k], userKey: k } : null))
      .filter((u) => u && u.name)
      .sort((a, b) => (parseInt(b.xp, 10) || 0) - (parseInt(a.xp, 10) || 0))
      .slice(0, 5);

    board.innerHTML = `
      <div class="sanad-header">
        <div style="color:#facc15; font-size:0.86rem; font-weight:bold;">
          <i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड
        </div>
        <span style="font-size:0.68rem; color:#8696a0;">लाइव रिकॉर्ड</span>
      </div>
      <div id="suhail-sanad-list"></div>
    `;

    const listEl = board.querySelector("#suhail-sanad-list");

    usersList.forEach((st, idx) => {
      const row = document.createElement("div");
      row.className = "sanad-row";
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐";
      const tagText = `रैंक #${idx + 1}`;

      row.innerHTML = `
        <div style="text-align:left;">
          <div style="font-size:0.84rem; font-weight:bold; color:#fff;">
            ${medal} ${escapeHTML(st.displayName || st.name)}
          </div>
          <div style="font-size:0.7rem; color:#8696a0;">
            इल्मी तरक़्क़ी: <strong style="color:#facc15;">⚡ ${escapeHTML(st.xp || 0)} XP</strong>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(250,204,21,0.3); color:#facc15; padding:3px 8px; border-radius:6px; font-size:0.7rem; font-weight:bold;">
          ${tagText}
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  // 10. स्टेटस वीडियो ऑटोप्ले फिक्स
  function patchStatusVideo() {
    const v = document.getElementById("status-view-video");
    if (!v) return;
    v.muted = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.controls = true;
    v.style.width = "100%";
    v.style.maxHeight = "65vh";
    v.style.objectFit = "contain";
    v.style.backgroundColor = "#000";
  }

  // 11. Base64 वीडियो को डेटाबेस में जाने से रोकना
  function setupUploadGuards() {
    if (typeof window.submitEnhancedStatus === "function" && !window.__SUBMIT_WRAPPED__) {
      window.__SUBMIT_WRAPPED__ = true;
      const originalSubmit = window.submitEnhancedStatus;

      window.submitEnhancedStatus = async function () {
        const vidFile = document.getElementById("status-file-video")?.files?.[0];
        const postBtn = document.getElementById("btn-post-status-submit");

        if (vidFile) {
          if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-spin"></i> वीडियो अपलोड हो रही है...`;
          }
          try {
            const cloudUrl = await window.uploadToCloudinary(vidFile, "video");
            if (!cloudUrl || typeof cloudUrl !== "string" || !cloudUrl.startsWith("http")) {
              throw new Error("क्लाउड लिंक नहीं मिला");
            }
            window.tempStatusMedia = { type: "video", base64: cloudUrl };
          } catch (err) {
            alert("❌ वीडियो अपलोड विफल: " + err.message);
            if (postBtn) {
              postBtn.disabled = false;
              postBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> 24 घंटे के लिए पोस्ट करें`;
            }
            return;
          }
        }
        originalSubmit.apply(this, arguments);
      };
    }
  }

  // 12. सिस्टम स्टार्ट
  function init() {
    injectStyles();
    buildDock();
    patchStatusVideo();
    setupUploadGuards();

    if (typeof window.renderAllUsersList === "function" && !window.__USERS_HOOKED__) {
      window.__USERS_HOOKED__ = true;
      const prevRender = window.renderAllUsersList;
      window.renderAllUsersList = function (usersMap) {
        prevRender.apply(this, arguments);
        renderLiveAwardsBoard(usersMap);
      };
    }

    if (window.lastUsersMap) {
      renderLiveAwardsBoard(window.lastUsersMap);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  setInterval(() => {
    patchStatusVideo();
    setupUploadGuards();
  }, 2500);
})();

/**
 * ============================================================================
 * 🚀 SOHEL CORE SYSTEM — APPLICATION CORE & MODULAR BRIDGE
 * File: SohelCoreSystem.js
 * Architecture: Clean Modular Extension (Zero Auth/Login Interference)
 * Dependencies: index.html -> SohelLiveSystem.js -> SohelCoreSystem.js
 * ============================================================================
 */

(function () {
  "use strict";

  // 1. DUPLICATE INITIALIZATION GUARD
  if (window.__SOHEL_CORE_SYSTEM_INITIALIZED__) {
    console.warn("[SohelCoreSystem] Already initialized.");
    return;
  }
  window.__SOHEL_CORE_SYSTEM_INITIALIZED__ = true;

  // 2. UNIVERSAL XSS SANITIZER
  function sanitizeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  window.sanitizeSohelText = sanitizeHTML;

  // 3. ADMIN ROLL-TO-PHONE RESOLVER (Fixes Critical Path Mismatch)
  // समस्या: एडमिन कोड users/${roll} में लिखता था, जबकि छात्र users/${phone} में सेव हैं।
  // हल: रोल नंबर से छात्र का असली फोन नंबर खोजकर सही नोड अपडेट करना।
  function resolvePhoneFromRoll(rollNumber) {
    if (!rollNumber) return null;
    const cleanRoll = String(rollNumber).trim();
    const usersMap = window.lastUsersMap || {};

    for (const phone in usersMap) {
      const u = usersMap[phone];
      if (u && (String(u.roll).trim() === cleanRoll || String(u.rollNumber).trim() === cleanRoll)) {
        return phone.replace(/[^0-9]/g, "");
      }
    }
    return null;
  }

  // एडमिन XP रिवॉर्ड का सुरक्षित रैपर (बिना index.html बदले)
  window.rewardStudentXP = function (points) {
    const rollInput = document.getElementById("admin-reward-roll");
    const roll = rollInput ? rollInput.value.trim() : "";
    if (!roll) return alert("छात्र का रोल नंबर दर्ज करें!");

    const targetPhone = resolvePhoneFromRoll(roll);
    if (!targetPhone) {
      return alert(`❌ रोल नंबर ${roll} से जुड़ा कोई छात्र नहीं मिला। कृपया सही रोल नंबर जांचें।`);
    }

    if (typeof window.awardXP === "function") {
      window.awardXP(targetPhone, points, "Admin Reward");
      alert(`✅ रोल नंबर ${roll} (${targetPhone}) को +${points} XP सफलतापूर्वक दिए गए!`);
      if (rollInput) rollInput.value = "";
    } else {
      alert("XP सर्विस अभी उपलब्ध नहीं है।");
    }
  };

  // एडमिन वेरिफिकेशन का सुरक्षित रैपर
  window.verifyStudentAdmin = function () {
    const rollInput = document.getElementById("admin-verify-roll");
    const roll = rollInput ? rollInput.value.trim() : "";
    if (!roll) return alert("रोल नंबर दर्ज करें!");

    const targetPhone = resolvePhoneFromRoll(roll);
    if (!targetPhone) {
      return alert(`❌ रोल नंबर ${roll} का छात्र डेटाबेस में नहीं मिला!`);
    }

    const db = window.db || (typeof firebase !== "undefined" && firebase.apps?.length ? firebase.database() : null);
    if (!db) return alert("डेटाबेस कनेक्शन उपलब्ध नहीं है।");

    const updatePayload = { verified: true, role: "verified_talib" };
    if (typeof db.ref === "function") {
      db.ref(`users/${targetPhone}`).update(updatePayload, (err) => {
        if (!err) alert(`✔️ रोल नंबर ${roll} (${targetPhone}) वेरिफाई हो गया!`);
        else alert("त्रुटि: " + err.message);
      });
    }
  };

  // एडमिन बैन का सुरक्षित रैपर
  window.banStudentAdmin = function () {
    const rollInput = document.getElementById("admin-verify-roll");
    const roll = rollInput ? rollInput.value.trim() : "";
    if (!roll) return alert("रोल नंबर दर्ज करें!");

    const targetPhone = resolvePhoneFromRoll(roll);
    if (!targetPhone) {
      return alert(`❌ रोल नंबर ${roll} का छात्र नहीं मिला!`);
    }

    if (confirm(`क्या आप वाकई रोल नंबर ${roll} (${targetPhone}) को ब्लॉक करना चाहते हैं?`)) {
      if (typeof window.banUserPermanently === "function") {
        window.banUserPermanently(targetPhone, `Roll ${roll}`);
      }
    }
  };

  // 4. SECURE AI CALLER BRIDGE (No Frontend Leaked Keys)
  // फ्रंटएंड में खुले AI_VAULT के बजाय सर्वरलेस /api/chat के ज़रिए सुरक्षित रूटिंग
  window.callSmartAI = async function (prompt, systemInstruction = "Concise academic helper") {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "assistant",
          prompt: `${systemInstruction}\n\n${prompt}`,
          level: 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.reply || data.text || "जवाब तैयार नहीं हो सका।";
      }
    } catch (err) {
      console.warn("[SohelCoreSystem] AI Bridge fallback to Gemini endpoint:", err);
    }

    // सर्वरलेस फ़ॉलबैक (/api/gemini)
    try {
      const gRes = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }]
        })
      });
      const gData = await gRes.json();
      return gData.text || "माफ़ कीजिएगा, AI नेटवर्क अभी व्यस्त है।";
    } catch (e) {
      return "नेटवर्क समस्या: AI से संपर्क नहीं हो सका।";
    }
  };

  // 5. CHAT SEARCH & FILTERING STABILIZER
  window.filterContactsSearch = function (query) {
    const q = (query || "").toLowerCase().trim();
    const items = document.querySelectorAll("#users-dynamic-list .chat-item");
    items.forEach((item) => {
      const nameEl = item.querySelector(".item-name");
      const nameText = nameEl ? nameEl.textContent.toLowerCase() : "";
      item.style.display = nameText.includes(q) ? "flex" : "none";
    });
  };

  // 6. QUIZ ARENA STABILITY BRIDGE (Deduplication)
  // startSoloQuizMode को मेमोरी-लीक और DOM टूटने से सुरक्षित करना
  const originalStartSoloQuiz = window.startSoloQuizMode;
  window.startSoloQuizMode = function (mode = "bot") {
    const playView = document.getElementById("quiz-battle-play-view");
    const modeSelect = document.getElementById("quiz-mode-select-view");
    if (!playView || !modeSelect) return;

    // ढाँचा सुनिश्चित करना
    if (!document.getElementById("quiz-options-container")) {
      playView.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span id="quiz-player-tag" style="color:#00a884; font-size:0.82rem; font-weight:bold;"></span>
          <span id="quiz-timer-badge" style="background:#ef4444; color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">⏱️ 15s</span>
        </div>
        <div style="background:#111b21; padding:14px; border-radius:8px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <p id="quiz-active-question" style="color:#fff; font-size:0.95rem; margin:0; line-height:1.45; flex:1;"></p>
            <button onclick="window.speakText && window.speakText(document.getElementById('quiz-active-question').innerText)" style="background:none; border:none; color:#00a884; font-size:1.2rem; cursor:pointer; margin-left:8px;" title="बोलकर सुनाएँ">🔊</button>
          </div>
        </div>
        <div id="quiz-options-container"></div>
        <div id="quiz-result-banner" style="font-size:0.88rem; text-align:center; margin-top:10px; font-weight:bold;"></div>
      `;
    }

    if (typeof originalStartSoloQuiz === "function") {
      originalStartSoloQuiz(mode);
    }
  };

  // 7. STATUS STORY VIEWERS SAFE DRAWER
  window.showViewersDrawer = function () {
    const currentStatus = window.currentViewingStatus;
    if (!currentStatus || !currentStatus.viewers) return;

    const drawer = document.getElementById("status-viewers-drawer");
    const listDiv = document.getElementById("viewers-name-list");
    if (!drawer || !listDiv) return;

    const vData = currentStatus.viewers;
    const keys = Object.keys(vData);

    if (keys.length === 0) {
      listDiv.innerHTML = "<p style='margin:6px 0; color:#8696a0;'>अभी किसी ने नहीं देखा।</p>";
    } else {
      listDiv.innerHTML = keys
        .map((k) => {
          const entry = vData[k];
          const name = typeof entry === "object" ? entry.name : entry;
          const time = typeof entry === "object" && entry.time
            ? new Date(entry.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";
          return `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:#e9edef;">
              <span><i class="fa-solid fa-user-check" style="color:#00a884; margin-right:6px;"></i> ${sanitizeHTML(name)}</span>
              <small style="color:#8696a0;">${sanitizeHTML(time)}</small>
            </div>
          `;
        })
        .join("");
    }
    drawer.classList.add("active");
  };

  // 8. WEBRTC AUDIO & CLEANUP SAFETY
  // कॉल कटने पर माइक व ऑडियो ट्रैक पूरी तरह बंद करना
  const originalCleanupCall = window.cleanupCall;
  window.cleanupCall = function () {
    const remoteAudio = document.getElementById("remote-audio");
    if (remoteAudio) {
      remoteAudio.pause();
      remoteAudio.srcObject = null;
    }
    if (typeof originalCleanupCall === "function") {
      originalCleanupCall();
    }
  };

})();

cat > /home/workdir/artifacts/SohelMsg91AuthSystem-fixed.js << 'ENDOFFILE'
/**
 * ============================================================================
 * 🔐 SOHEL MSG91 AUTH SYSTEM — SERVER-SIDE ONLY (NO CLIENT SDK)
 * File: SohelMsg91AuthSystem.js
 * Fixes: "sendOtp उपलब्ध नहीं है" by completely removing client widget SDK
 * ============================================================================
 */

import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

(() => {
  "use strict";

  if (window.__SOHEL_MSG91_AUTH_INITIALIZED__) {
    console.warn("[SohelMsg91Auth] Already initialized");
    return;
  }
  window.__SOHEL_MSG91_AUTH_INITIALIZED__ = true;

  let activePhone10 = "";
  let activeReqId = null;
  let isOtpPhase = false;

  const firebaseConfig = {
    apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
    authDomain: "ula-alif.firebaseapp.com",
    databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
    projectId: "ula-alif",
    storageBucket: "ula-alif.firebasestorage.app",
    messagingSenderId: "693272422991",
    appId: "1:693272422991:web:081c07b083e3549b0dd83a"
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(msg) {
    console.error("[MSG91]", msg);
    try { alert(msg); } catch (_) {}
  }

  function cleanPhone(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text) throw new Error("Server ने खाली response दिया।");
    try {
      return JSON.parse(text);
    } catch {
      console.error("[MSG91] Invalid JSON:", text);
      throw new Error("Server ने valid JSON नहीं दिया।");
    }
  }

  /* -------------------------------------------------------
     SEND OTP via your own /api/msg91/send (NO client SDK)
  ------------------------------------------------------- */
  async function sendRealOtp() {
    const phoneInput = $("user-phone");
    const nameInput = $("user-name");
    const otpSection = $("otp-section");
    const otpInput = $("otp-input");
    const button = $("btn-action-auth");

    if (!phoneInput || !button) {
      showMessage("Login controls नहीं मिले।");
      return;
    }

    const phone10 = cleanPhone(phoneInput.value);
    if (phone10.length !== 10) {
      showMessage("कृपया 10 अंकों का सही मोबाइल नंबर डालें।");
      return;
    }

    if (nameInput && !nameInput.value.trim()) {
      showMessage("कृपया अपना नाम दर्ज करें!");
      return;
    }

    activePhone10 = phone10;
    activeReqId = null;

    button.disabled = true;
    button.textContent = "⏳ OTP भेजा जा रहा है...";

    try {
      const response = await fetch("/api/msg91/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ phone: phone10 })
      });

      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "OTP भेजने में विफल");
      }

      activeReqId = data.reqId || data.request_id || data.req_id || null;

      if (!activeReqId) {
        console.warn("[MSG91] reqId missing in response:", data);
      }

      isOtpPhase = true;

      if (otpSection) otpSection.style.display = "block";
      if (otpInput) {
        otpInput.value = "";
        otpInput.focus();
      }
      if (phoneInput) phoneInput.disabled = true;

      button.disabled = false;
      button.textContent = "✓ OTP verify करें";

      showMessage(`✅ आपके नंबर (+91${phone10}) पर OTP भेज दिया गया है।`);
    } catch (err) {
      console.error("[MSG91] Send error:", err);
      button.disabled = false;
      button.textContent = "OTP भेजें (Send OTP)";
      showMessage("OTP भेजने में विफल:\n" + (err.message || String(err)));
    }
  }

  /* -------------------------------------------------------
     VERIFY OTP via /api/msg91/verify (server-side)
  ------------------------------------------------------- */
  async function verifyRealOtp() {
    const otpInput = $("otp-input");
    const button = $("btn-action-auth");
    const nameInput = $("user-name");
    const rollInput = $("user-roll");

    if (!otpInput) {
      showMessage("OTP input नहीं मिला।");
      return;
    }

    const otp = String(otpInput.value || "").replace(/\D/g, "").slice(0, 6);
    if (otp.length < 4) {
      showMessage("कृपया सही OTP दर्ज करें।");
      return;
    }

    if (!activePhone10) {
      showMessage("पहले OTP भेजें।");
      return;
    }

    button.disabled = true;
    button.textContent = "⏳ OTP verify हो रहा है...";

    try {
      const response = await fetch("/api/msg91/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          phone: activePhone10,
          otp: otp,
          reqId: activeReqId
        })
      });

      const data = await readJson(response);

      if (!response.ok || !data.success || !data.customToken) {
        throw new Error(data.error || "OTP verification विफल");
      }

      // Firebase Custom Token Login
      await signInWithCustomToken(auth, data.customToken);

      const name = nameInput?.value?.trim() || "";
      const roll = rollInput?.value?.trim() || "";

      await saveUserToDatabase({
        phone: activePhone10,
        name,
        roll
      });

      await finishLogin(activePhone10, name, roll);

    } catch (err) {
      console.error("[MSG91] Verify error:", err);
      button.disabled = false;
      button.textContent = "OTP verify करें";
      showMessage("OTP verification विफल:\n" + (err.message || String(err)));
    }
  }

  async function saveUserToDatabase({ phone, name, roll }) {
    const userRef = ref(db, "users/" + phone);
    const snapshot = await get(userRef);
    const oldUser = snapshot.exists() ? snapshot.val() : {};

    const userData = {
      ...oldUser,
      phone,
      name: name || oldUser.name || "",
      roll: roll || oldUser.roll || "",
      displayName: name || oldUser.displayName || phone,
      role: oldUser.role || "student",
      provider: "msg91",
      status: "online",
      lastLogin: Date.now(),
      lastSeen: Date.now()
    };

    await set(userRef, userData);

    // onDisconnect
    onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

    window.currentUser = {
      ...(window.currentUser || {}),
      ...userData,
      uid: auth.currentUser?.uid || `msg91_${phone}`
    };
  }

  async function finishLogin(phone, name, roll) {
    window.currentUser = window.currentUser || {};
    window.currentUser.phone = phone;
    window.currentUser.name = name || window.currentUser.name || "";
    window.currentUser.displayName = name || window.currentUser.displayName || phone;
    window.currentUser.roll = roll || window.currentUser.roll || "";
    window.currentUser.role = window.currentUser.role || "student";
    window.currentUser.provider = "msg91";

    document.body.classList.add("logged-in");

    const loginScreen = $("login-screen");
    if (loginScreen) loginScreen.style.display = "none";

    const homeScreen = $("screen-home");
    if (homeScreen) homeScreen.style.display = "flex";

    if (typeof window.showScreen === "function") {
      try { window.showScreen("screen-home"); } catch (_) {}
    }
    if (typeof window.updateUserUI === "function") {
      try { window.updateUserUI(); } catch (_) {}
    }
    if (typeof window.connectScaleDrone === "function") {
      try { window.connectScaleDrone(); } catch (_) {}
    }
    if (typeof window.listenForIncomingCalls === "function") {
      try { window.listenForIncomingCalls(); } catch (_) {}
    }

    localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

    console.log("[MSG91] LOGIN COMPLETE");
    showMessage("माशाअल्लाह! आपका खाता सफलतापूर्वक सत्यापित हो गया।");
  }

  function replaceOldAuthButton() {
    const oldButton = $("btn-action-auth");
    if (!oldButton) throw new Error("btn-action-auth नहीं मिला।");

    const newButton = oldButton.cloneNode(true);
    oldButton.replaceWith(newButton);
    return newButton;
  }

  function setupLoginButton() {
    const button = replaceOldAuthButton();

    const otpSection = $("otp-section");
    if (otpSection) otpSection.style.display = "none";

    isOtpPhase = false;

    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isOtpPhase) {
        await sendRealOtp();
      } else {
        await verifyRealOtp();
      }
    });

    // Also support Enter key on OTP input
    const otpInput = $("otp-input");
    if (otpInput) {
      otpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && isOtpPhase) {
          e.preventDefault();
          verifyRealOtp();
        }
      });
    }
  }

  // Restore session if already logged in
  function initAuthState() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const phone = (user.phoneNumber || "").replace(/\D/g, "").slice(-10) ||
                      (user.uid || "").replace("msg91_", "");
        if (phone) {
          try {
            const snap = await get(ref(db, "users/" + phone));
            const data = snap.exists() ? snap.val() : {};
            window.currentUser = {
              uid: user.uid,
              phone,
              name: data.name || "छात्र",
              roll: data.roll || "",
              displayName: data.displayName || data.name || phone,
              role: data.role || "student",
              provider: "msg91"
            };
            document.body.classList.add("logged-in");
            const loginScreen = $("login-screen");
            if (loginScreen) loginScreen.style.display = "none";
            if (typeof window.updateUserUI === "function") window.updateUserUI();
          } catch (e) {
            console.warn("[MSG91] Session restore:", e);
          }
        }
      }
    });
  }

  function start() {
    try {
      setupLoginButton();
      initAuthState();
      console.log("[MSG91] Server-side auth system loaded successfully.");
    } catch (err) {
      console.error("[MSG91] Startup error:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
ENDOFFILE
echo "Client fixed auth written"
/**
 * SohelAuthSystem.js
 * Dummy Mobile OTP (असली जैसा) + Real Email OTP
 */
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";
  if (window.__SOHEL_AUTH_OK__) return;
  window.__SOHEL_AUTH_OK__ = true;

  const firebaseConfig = {
    apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
    authDomain: "ula-alif.firebaseapp.com",
    databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
    projectId: "ula-alif",
    storageBucket: "ula-alif.firebasestorage.app",
    messagingSenderId: "693272422991",
    appId: "1:693272422991:web:081c07b083e3549b0dd83a"
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  let mode = "mobile";
  let otpPhase = false;
  let dummyOtp = null;
  let activePhone = "";
  let activeEmail = "";

  const $ = (id) => document.getElementById(id);

  function alertMsg(m) { try { alert(m); } catch(e) {} }

  function cleanPhone(v) {
    return String(v || "").replace(/\D/g, "").slice(-10);
  }

  // ----- UI: Mobile / Email switch -----
  function buildUI() {
    if ($("auth-mode-bar")) return;

    const phone = $("user-phone");
    if (!phone || !phone.parentNode) return;

    const bar = document.createElement("div");
    bar.id = "auth-mode-bar";
    bar.style.cssText = "display:flex;gap:8px;margin:8px 0 12px 0;";
    bar.innerHTML = `
      <button type="button" id="mode-mobile" style="flex:1;padding:9px;border:none;border-radius:8px;background:#00a884;color:#fff;font-weight:700;cursor:pointer;">📱 मोबाइल</button>
      <button type="button" id="mode-email" style="flex:1;padding:9px;border:1px solid #00a884;border-radius:8px;background:transparent;color:#00a884;font-weight:700;cursor:pointer;">✉️ ईमेल</button>
    `;
    phone.parentNode.insertBefore(bar, phone);

    const email = document.createElement("input");
    email.type = "email";
    email.id = "user-email";
    email.className = phone.className || "login-input";
    email.placeholder = "अपना ईमेल डालें";
    email.style.display = "none";
    email.style.width = "100%";
    email.style.marginBottom = "12px";
    phone.parentNode.insertBefore(email, phone.nextSibling);

    $("mode-mobile").onclick = () => switchMode("mobile");
    $("mode-email").onclick = () => switchMode("email");
  }

  function switchMode(m) {
    mode = m;
    otpPhase = false;
    dummyOtp = null;

    const phone = $("user-phone");
    const email = $("user-email");
    const otpSec = $("otp-section");
    const btn = $("btn-action-auth");

    if (m === "mobile") {
      if (phone) { phone.style.display = "block"; phone.disabled = false; }
      if (email) email.style.display = "none";
      if (btn) btn.textContent = "OTP भेजें (Send OTP)";
      $("mode-mobile").style.background = "#00a884";
      $("mode-mobile").style.color = "#fff";
      $("mode-email").style.background = "transparent";
      $("mode-email").style.color = "#00a884";
    } else {
      if (phone) phone.style.display = "none";
      if (email) email.style.display = "block";
      if (btn) btn.textContent = "ईमेल पर OTP भेजें";
      $("mode-email").style.background = "#00a884";
      $("mode-email").style.color = "#fff";
      $("mode-mobile").style.background = "transparent";
      $("mode-mobile").style.color = "#00a884";
    }
    if (otpSec) otpSec.style.display = "none";
  }

  // ----- Mobile Dummy OTP -----
  async function sendMobile() {
    const name = ($("user-name") || {}).value?.trim() || "";
    const phone = cleanPhone(($("user-phone") || {}).value);
    const btn = $("btn-action-auth");

    if (!name) return alertMsg("कृपया नाम दर्ज करें!");
    if (phone.length !== 10) return alertMsg("सही 10 अंकों का मोबाइल नंबर डालें!");

    activePhone = phone;
    btn.disabled = true;
    btn.textContent = "⏳ SMS OTP भेजा जा रहा है...";

    await new Promise(r => setTimeout(r, 1600));

    dummyOtp = String(Math.floor(100000 + Math.random() * 900000));
    console.log("%c[DEV] Dummy OTP = " + dummyOtp, "color:#00a884;font-weight:bold;font-size:14px");

    otpPhase = true;
    const otpSec = $("otp-section");
    const otpIn = $("otp-input");
    if (otpSec) otpSec.style.display = "block";
    if (otpIn) { otpIn.value = ""; otpIn.focus(); }
    if ($("user-phone")) $("user-phone").disabled = true;

    btn.disabled = false;
    btn.textContent = "OTP सत्यापित करें";
    alertMsg("✅ आपके नंबर (+91" + phone + ") पर OTP भेज दिया गया है।");
  }

  async function verifyMobile() {
    const entered = ($("otp-input") || {}).value?.trim() || "";
    const btn = $("btn-action-auth");

    if (entered.length !== 6) return alertMsg("6 अंकों का OTP डालें!");

    btn.disabled = true;
    btn.textContent = "सत्यापन हो रहा है...";
    await new Promise(r => setTimeout(r, 900));

    if (entered !== dummyOtp) {
      btn.disabled = false;
      btn.textContent = "OTP सत्यापित करें";
      return alertMsg("गलत OTP! सही कोड डालें।");
    }

    const name = ($("user-name") || {}).value?.trim() || "छात्र";
    const roll = ($("user-roll") || {}).value?.trim() || "";
    const pass = ($("user-pass") || {}).value?.trim() || "";

    await doLogin({
      phone: activePhone,
      email: "",
      name,
      roll,
      role: pass === "razavi123" ? "admin" : "student",
      provider: "mobile-dummy"
    });
  }

  // ----- Email Real OTP -----
  async function sendEmail() {
    const name = ($("user-name") || {}).value?.trim() || "";
    const email = ($("user-email") || {}).value?.trim().toLowerCase() || "";
    const btn = $("btn-action-auth");

    if (!name) return alertMsg("कृपया नाम दर्ज करें!");
    if (!email || !email.includes("@")) return alertMsg("सही ईमेल डालें!");

    activeEmail = email;
    btn.disabled = true;
    btn.textContent = "⏳ ईमेल पर OTP भेजा जा रहा है...";

    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "ईमेल भेजने में विफल");

      otpPhase = true;
      const otpSec = $("otp-section");
      const otpIn = $("otp-input");
      if (otpSec) otpSec.style.display = "block";
      if (otpIn) { otpIn.value = ""; otpIn.focus(); }

      btn.disabled = false;
      btn.textContent = "OTP सत्यापित करें";
      alertMsg("✅ आपके ईमेल पर OTP भेज दिया गया है।");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "ईमेल पर OTP भेजें";
      alertMsg("ईमेल OTP विफल:\n" + err.message);
    }
  }

  async function verifyEmail() {
    const entered = ($("otp-input") || {}).value?.trim() || "";
    const btn = $("btn-action-auth");

    if (entered.length < 4) return alertMsg("सही OTP डालें!");

    btn.disabled = true;
    btn.textContent = "सत्यापन हो रहा है...";

    try {
      const res = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, otp: entered })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "गलत OTP");

      const name = ($("user-name") || {}).value?.trim() || data.name || "छात्र";
      const roll = ($("user-roll") || {}).value?.trim() || "";
      const pass = ($("user-pass") || {}).value?.trim() || "";

      await doLogin({
        phone: "",
        email: activeEmail,
        name,
        roll,
        role: pass === "razavi123" ? "admin" : "student",
        provider: "email"
      });
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "OTP सत्यापित करें";
      alertMsg(err.message);
    }
  }

  // ----- Final Login -----
  async function doLogin(u) {
    try {
      try { await signInAnonymously(auth); } catch (e) {}

      const uid = auth.currentUser?.uid || ("u_" + Date.now());
      const key = u.phone || u.email.replace(/[^a-z0-9]/gi, "_");

      const userData = {
        uid,
        name: u.name,
        phone: u.phone || "",
        email: u.email || "",
        roll: u.roll || "",
        displayName: u.roll ? u.name + " (रोल: " + u.roll + ")" : u.name,
        role: u.role || "student",
        provider: u.provider,
        status: "online",
        lastSeen: Date.now(),
        createdAt: Date.now()
      };

      const userRef = ref(db, "users/" + key);
      const snap = await get(userRef);
      if (snap.exists()) {
        await update(userRef, { ...userData, createdAt: snap.val().createdAt || Date.now() });
      } else {
        await set(userRef, userData);
      }
      onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

      window.currentUser = userData;
      localStorage.setItem("jamia_chat_saved_user", JSON.stringify(userData));
      document.body.classList.add("logged-in");

      const login = $("login-screen");
      if (login) login.style.display = "none";

      if (typeof window.updateUserUI === "function") window.updateUserUI();
      if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
      if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();

      alertMsg("माशाअल्लाह! लॉगिन सफल हो गया।");
    } catch (err) {
      alertMsg("लॉगिन समस्या: " + err.message);
    }
  }

  // ----- Bind Button -----
  function bindButton() {
    const old = $("btn-action-auth");
    if (!old) return;

    const btn = old.cloneNode(true);
    old.parentNode.replaceChild(btn, old);

    btn.onclick = async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (mode === "mobile") {
        if (!otpPhase) await sendMobile();
        else await verifyMobile();
      } else {
        if (!otpPhase) await sendEmail();
        else await verifyEmail();
      }
    };
  }

  function start() {
    buildUI();
    switchMode("mobile");
    bindButton();

    // पुराना सेशन
    try {
      const saved = localStorage.getItem("jamia_chat_saved_user");
      if (saved) {
        window.currentUser = JSON.parse(saved);
        document.body.classList.add("logged-in");
        const login = $("login-screen");
        if (login) login.style.display = "none";
        if (typeof window.updateUserUI === "function") window.updateUserUI();
      }
    } catch (e) {}

    console.log("[SohelAuth] Ready — Dummy Mobile + Real Email");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
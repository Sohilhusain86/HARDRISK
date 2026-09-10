/**
 * ============================================================================
 * 🔐 SOHEL AUTH SYSTEM — Dummy Mobile OTP + Real Email OTP
 * ============================================================================
 */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  if (window.__SOHEL_AUTH_SYSTEM_INITIALIZED__) return;
  window.__SOHEL_AUTH_SYSTEM_INITIALIZED__ = true;

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

  // ========== STATE ==========
  let loginMode = "mobile";          // "mobile" | "email"
  let isOtpPhase = false;
  let generatedMobileOtp = null;     // Dummy OTP
  let activePhone = "";
  let activeEmail = "";

  function $(id) { return document.getElementById(id); }

  function cleanPhone(v) {
    return String(v || "").replace(/\D/g, "").slice(-10);
  }

  function showAlert(msg) {
    try { alert(msg); } catch(e) {}
  }

  // ========== UI: Login Mode Switch ==========
  function ensureEmailField() {
    // अगर ईमेल इनपुट नहीं है तो बना दो
    if ($("user-email")) return;

    const phoneInput = $("user-phone");
    if (!phoneInput) return;

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.id = "user-email";
    emailInput.className = "login-input";
    emailInput.placeholder = "ईमेल (Email OTP के लिए)";
    emailInput.style.display = "none";
    phoneInput.parentNode.insertBefore(emailInput, phoneInput.nextSibling);

    // Mode switch buttons
    const switchDiv = document.createElement("div");
    switchDiv.style.cssText = "display:flex; gap:8px; margin:10px 0; justify-content:center;";
    switchDiv.innerHTML = `
      <button type="button" id="btn-mode-mobile" style="flex:1; padding:8px; border-radius:8px; border:none; background:#00a884; color:#fff; font-weight:bold; cursor:pointer;">📱 मोबाइल</button>
      <button type="button" id="btn-mode-email" style="flex:1; padding:8px; border-radius:8px; border:1px solid #00a884; background:transparent; color:#00a884; font-weight:bold; cursor:pointer;">✉️ ईमेल</button>
    `;
    phoneInput.parentNode.insertBefore(switchDiv, phoneInput);

    $("btn-mode-mobile").onclick = () => setMode("mobile");
    $("btn-mode-email").onclick = () => setMode("email");
  }

  function setMode(mode) {
    loginMode = mode;
    isOtpPhase = false;
    generatedMobileOtp = null;

    const phoneInput = $("user-phone");
    const emailInput = $("user-email");
    const otpSection = $("otp-section");
    const btn = $("btn-action-auth");

    if (mode === "mobile") {
      if (phoneInput) phoneInput.style.display = "block";
      if (emailInput) emailInput.style.display = "none";
      if (btn) btn.textContent = "OTP भेजें (Send OTP)";
      $("btn-mode-mobile").style.background = "#00a884";
      $("btn-mode-mobile").style.color = "#fff";
      $("btn-mode-email").style.background = "transparent";
      $("btn-mode-email").style.color = "#00a884";
    } else {
      if (phoneInput) phoneInput.style.display = "none";
      if (emailInput) emailInput.style.display = "block";
      if (btn) btn.textContent = "ईमेल पर OTP भेजें";
      $("btn-mode-email").style.background = "#00a884";
      $("btn-mode-email").style.color = "#fff";
      $("btn-mode-mobile").style.background = "transparent";
      $("btn-mode-mobile").style.color = "#00a884";
    }

    if (otpSection) otpSection.style.display = "none";
  }

  // ========== MOBILE DUMMY OTP (असली जैसा) ==========
  async function sendMobileOtp() {
    const nameInput = $("user-name");
    const phoneInput = $("user-phone");
    const btn = $("btn-action-auth");
    const otpSection = $("otp-section");
    const otpInput = $("otp-input");

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = cleanPhone(phoneInput ? phoneInput.value : "");

    if (!name) return showAlert("कृपया अपना नाम दर्ज करें!");
    if (phone.length !== 10) return showAlert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!");

    activePhone = phone;
    btn.disabled = true;
    btn.textContent = "⏳ SMS OTP भेजा जा रहा है...";

    // असली जैसा delay
    await new Promise(r => setTimeout(r, 1800));

    // Dummy 6-digit OTP generate
    generatedMobileOtp = String(Math.floor(100000 + Math.random() * 900000));
    console.log("%c[DEV] Mobile Dummy OTP:", "color: #00a884; font-weight:bold", generatedMobileOtp);

    isOtpPhase = true;
    if (otpSection) otpSection.style.display = "block";
/**
 * ============================================================================
 * 🔐 SOHEL AUTH SYSTEM — GENUINE FIREBASE PHONE AUTHENTICATION ENGINE
 * File: SohelAuthSystem.js
 * Architecture: Firebase Auth (SMS OTP) + Secure Session + ID Token Dispatcher
 * ============================================================================
 */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  onDisconnect 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  // 1. DUPLICATE GUARD
  if (window.__SOHEL_AUTH_SYSTEM_INITIALIZED__) {
    console.warn("[SohelAuthSystem] Already initialized.");
    return;
  }
  window.__SOHEL_AUTH_SYSTEM_INITIALIZED__ = true;

  // 2. FIREBASE INSTANCE SHARING
  const firebaseConfig = {
    apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
    authDomain: "ula-alif.firebaseapp.com",
    databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
    projectId: "ula-alif",
    storageBucket: "ula-alif.firebasestorage.app",
    messagingSenderId: "693272422991",
    appId: "1:693272422991:web:081c07b083e3549b0dd83a"
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  // 3. FAKE SMS POPUP CLEANUP (डेटाबेस व स्क्रीन से डमी OTP हटाना)
  function purgeFakeOtpUI() {
    const fakePopup = document.getElementById("sms-popup");
    if (fakePopup) {
      fakePopup.remove(); // डमी एसएमएस पॉपअप हमेशा के लिए हटाया
    }
  }

  // 4. PHONE NUMBER NORMALIZATION (भारत का +91 E.164 फ़ॉर्मेट)
  function normalizeIndianPhone(input) {
    const digitsOnly = String(input || "").replace(/[^0-9]/g, "");
    if (digitsOnly.length === 10) return `+91${digitsOnly}`;
    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) return `+${digitsOnly}`;
    if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) return `+91${digitsOnly.slice(1)}`;
    return `+91${digitsOnly}`;
  }

  function getClean10Digit(phoneWithCountry) {
    const digits = String(phoneWithCountry || "").replace(/[^0-9]/g, "");
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
  }

  // 5. RECAPTCHA VERIFIER (सुरक्षित सिंगल इंस्टेंस)
  let recaptchaVerifier = null;
  function ensureRecaptchaContainer() {
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      const loginCard = document.querySelector("#login-screen .login-card") || document.body;
      loginCard.appendChild(container);
    }
    return container;
  }

  function initRecaptcha() {
    ensureRecaptchaContainer();
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA सॉल्व होने पर आगे का फ्लो
        },
        "expired-callback": () => {
          alert("reCAPTCHA की समय सीमा समाप्त हो गई, कृपया पुनः प्रयास करें।");
        }
      });
    }
  }

  // 6. ID TOKEN HELPER & AUTHENTICATED FETCH
  window.getAuthenticatedIdToken = async function (forceRefresh = false) {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.error("[SohelAuthSystem] Failed to fetch ID Token:", err);
      return null;
    }
  };

  window.authenticatedFetch = async function (url, options = {}) {
    const token = await window.getAuthenticatedIdToken();
    const headers = options.headers ? { ...options.headers } : {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  // 7. REAL FIREBASE PHONE AUTH LOGIN FLOW
  let confirmationResultSession = null;

  function bindSecureAuthUI() {
    purgeFakeOtpUI();

    const oldBtn = document.getElementById("btn-action-auth");
    if (!oldBtn) return;

    // पुराने डमी Math.random() इवेंट लिसनर्स को हटाने के लिए नोड क्लोन
    const authBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(authBtn, oldBtn);

    const nameInput = document.getElementById("user-name");
    const phoneInput = document.getElementById("user-phone");
    const rollInput = document.getElementById("user-roll");
    const passInput = document.getElementById("user-pass");
    const otpInput = document.getElementById("otp-input");
    const otpSection = document.getElementById("otp-section");

    let isOtpPhase = false;

    authBtn.addEventListener("click", async () => {
      const name = nameInput ? nameInput.value.trim() : "";
      const rawPhone = phoneInput ? phoneInput.value.trim() : "";
      const roll = rollInput ? rollInput.value.trim() : "";
      const pass = passInput ? passInput.value.trim() : "";

      const cleanPhone10 = getClean10Digit(rawPhone);
      if (cleanPhone10.length !== 10) {
        alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!");
        return;
      }

      // ──────────────────────────────────────────────────────────
      // चरण 1: असली SMS OTP भेजना (Firebase Auth)
      // ──────────────────────────────────────────────────────────
      if (!isOtpPhase) {
        if (!name) {
          alert("कृपया अपना नाम दर्ज करें!");
          return;
        }

        const e164Phone = normalizeIndianPhone(rawPhone);
        authBtn.disabled = true;
        authBtn.textContent = "⏳ SMS OTP भेजा जा रहा है...";

        try {
          initRecaptcha();
          confirmationResultSession = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier);

          // असली SMS भेजा गया
          isOtpPhase = true;
          if (otpSection) otpSection.style.display = "block";
          if (phoneInput) phoneInput.disabled = true; // नंबर बदलने से रोकें
          authBtn.disabled = false;
          authBtn.textContent = "OTP सत्यापित करें (Verify & Login)";
          alert(`✅ आपके नंबर (${e164Phone}) पर वास्तविक SMS OTP भेज दिया गया है।`);
        } catch (err) {
          console.error("[SohelAuthSystem] SMS Dispatch Error:", err);
          authBtn.disabled = false;
          authBtn.textContent = "OTP भेजें (Send OTP)";
          
          if (recaptchaVerifier) {
            try { recaptchaVerifier.render().then(wId => grecaptcha.reset(wId)); } catch (e) {}
          }

          if (err.code === "auth/invalid-phone-number") {
            alert("अमान्य मोबाइल नंबर! कृपया नंबर जांचें।");
          } else if (err.code === "auth/too-many-requests") {
            alert("बहुत अधिक प्रयास! कृपया कुछ समय बाद प्रयास करें।");
          } else {
            alert("SMS भेजने में विफलता: " + (err.message || "कृपया इंटरनेट जांचें।"));
          }
        }
        return;
      }

      // ──────────────────────────────────────────────────────────
      // चरण 2: वास्तविक OTP सत्यापन और ऑथेंटिकेटेड सेशन
      // ──────────────────────────────────────────────────────────
      const enteredOtp = otpInput ? otpInput.value.trim() : "";
      if (enteredOtp.length !== 6) {
        alert("कृपया 6 अंकों का OTP दर्ज करें!");
        return;
      }

      if (!confirmationResultSession) {
        alert("सत्र समाप्त हो गया है। कृपया पेज रिफ्रेश करके पुनः OTP भेजें।");
        return;
      }

      authBtn.disabled = true;
      authBtn.textContent = "सत्यापन जारी है...";

      try {
        const userCredential = await confirmationResultSession.confirm(enteredOtp);
        const firebaseUser = userCredential.user;

        // सत्यापित फ़ोन नंबर
        const verifiedPhone = getClean10Digit(firebaseUser.phoneNumber || rawPhone);

        // डेटाबेस प्रोफ़ाइल को प्रमाणित UID के साथ जोड़ना
        const userRef = ref(db, `users/${verifiedPhone}`);
        const snap = await get(userRef);
        let finalName = name;
        let finalRoll = roll;

        if (snap.exists()) {
          const old = snap.val();
          finalName = old.name || name;
          finalRoll = old.roll || roll;
          await update(userRef, {
            uid: firebaseUser.uid,
            status: "online",
            lastSeen: Date.now()
          });
        } else {
          await set(userRef, {
            uid: firebaseUser.uid,
            name: finalName,
            phone: verifiedPhone,
            roll: finalRoll,
            displayName: finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName,
            status: "online",
            createdAt: Date.now(),
            lastSeen: Date.now()
          });
        }

        // लोकल स्टेट सेट करना (UI कम्पैटिबिलिटी)
        window.currentUser = {
          uid: firebaseUser.uid,
          name: finalName,
          phone: verifiedPhone,
          roll: finalRoll,
          displayName: finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName,
          role: (pass === "razavi123") ? "admin" : "student",
          location: window.currentUser?.location || "India",
          dpUrl: window.currentUser?.dpUrl || ""
        };

        localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

        // UI रिफ्रेश व स्क्रीन क्लोज
        if (typeof window.updateUserUI === "function") window.updateUserUI();
        const loginScreen = document.getElementById("login-screen");
        if (loginScreen) loginScreen.style.display = "none";

        // स्केलड्रोन व कॉलिंग लिसनर कनेक्ट
        if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
        if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();

        alert("माशाअल्लाह! आपका खाता सफलतापूर्वक सत्यापित और सुरक्षित हो गया।");
      } catch (err) {
        console.error("[SohelAuthSystem] Verification Error:", err);
        authBtn.disabled = false;
        authBtn.textContent = "OTP सत्यापित करें और लॉगिन करें";

        if (err.code === "auth/invalid-verification-code") {
          alert("गलत OTP कोड! कृपया SMS में आया सही कोड दर्ज करें।");
        } else if (err.code === "auth/code-expired") {
          alert("OTP की समय सीमा समाप्त हो गई है। कृपया नया कोड मंगाएँ।");
        } else {
          alert("लॉगिन असफल: " + err.message);
        }
      }
    });
  }

  // 8. SESSION RESTORATION VIA FIREBASE AUTH STATE (Source of Truth)
  function initAuthStateSync() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      const loginScreen = document.getElementById("login-screen");

      if (firebaseUser) {
        // असली प्रमाणित उपयोगकर्ता सत्र मौजूद है
        const verifiedPhone = getClean10Digit(firebaseUser.phoneNumber);
        const userRef = ref(db, `users/${verifiedPhone}`);

        try {
          const snap = await get(userRef);
          const userData = snap.exists() ? snap.val() : {};

          window.currentUser = {
            uid: firebaseUser.uid,
            phone: verifiedPhone,
            name: userData.name || "छात्र",
            roll: userData.roll || "",
            displayName: userData.displayName || userData.name || verifiedPhone,
            role: userData.role || (localStorage.getItem("roll") === "7877" ? "admin" : "student"),
            location: userData.location || "India",
            dpUrl: userData.dpUrl || ""
          };

          // ऑनलाइन उपस्थिति मार्क करना
          update(userRef, { status: "online", lastSeen: Date.now(), uid: firebaseUser.uid });
          onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

          if (loginScreen) loginScreen.style.display = "none";
          if (typeof window.updateUserUI === "function") window.updateUserUI();
          if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
          if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();
        } catch (e) {
          console.warn("[SohelAuthSystem] Profile restore warning:", e);
        }
      } else {
        // उपयोगकर्ता लॉगआउट है — लॉगिन स्क्रीन दिखाएँ
        if (loginScreen) loginScreen.style.display = "flex";
        window.currentUser = { name: "", phone: "", roll: "", displayName: "", role: "student" };
      }
    });
  }

  // 9. SECURE LOGOUT (Firebase Auth SignOut Integration)
  window.logoutApp = async function () {
    if (confirm("क्या आप वाकई लॉगआउट करना चाहते हैं?")) {
      try {
        if (window.currentUser?.phone) {
          const uRef = ref(db, `users/${window.currentUser.phone}`);
          await update(uRef, { status: "offline", lastSeen: Date.now() });
        }
        await signOut(auth);
      } catch (e) {
        console.warn("SignOut notice:", e);
      }
      localStorage.removeItem("jamia_chat_saved_user");
      location.reload();
    }
  };

  // 10. INITIALIZATION
  function start() {
    bindSecureAuthUI();
    initAuthStateSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();

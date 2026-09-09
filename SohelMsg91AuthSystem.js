/**
 * ============================================================================
 * 📲 SOHEL MSG91 AUTH SYSTEM — OFFICIAL OTP WIDGET CLIENT INTEGRATION
 * File: SohelMsg91AuthSystem.js
 * Architecture: MSG91 Web SDK -> Backend Custom Token -> Firebase Auth Session
 * ============================================================================
 */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithCustomToken, 
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

  if (window.__SOHEL_MSG91_AUTH_INITIALIZED__) {
    console.warn("[SohelMsg91Auth] Already initialized.");
    return;
  }
  window.__SOHEL_MSG91_AUTH_INITIALIZED__ = true;

  // 1. FIREBASE CONFIGURATION (Reusing existing config)
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

  // 2. MSG91 OTP WIDGET CONFIGURATION
  // Widget ID और Widget Token (Jamia) यहाँ सेट करें (Authkey यहाँ कभी न डालें)
  const MSG91_WIDGET_CONFIG = {
    widgetId: window.MSG91_WIDGET_ID || "36616a623133343135313330", // अपना Widget ID डालें
    tokenAuth: window.MSG91_WIDGET_TOKEN || "Jamia",                 // Widget Token (नाम: Jamia)
    exposeMethods: true,
  };

  let msg91WidgetReady = false;
  let isOtpStepActive = false;
  let activeMobileNumber = "";

  // 3. CLEAN UP FAKE POPUPS & INLINE WARNINGS
  function cleanObsoleteDom() {
    const fakePopup = document.getElementById("sms-popup");
    if (fakePopup) fakePopup.remove();
  }

  // 4. DYNAMIC MSG91 SDK LOADER
  function loadMsg91Sdk() {
    return new Promise((resolve) => {
      if (typeof window.initSendOTP === "function") {
        initMsg91Widget();
        return resolve(true);
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://verify.msg91.com/otp-provider.js";
      script.onload = () => {
        initMsg91Widget();
        resolve(true);
      };
      script.onerror = () => {
        console.error("[MSG91] Failed to load otp-provider.js");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  function initMsg91Widget() {
    if (typeof window.initSendOTP === "function" && !msg91WidgetReady) {
      window.initSendOTP({
        widgetId: MSG91_WIDGET_CONFIG.widgetId,
        tokenAuth: MSG91_WIDGET_CONFIG.tokenAuth,
        exposeMethods: true,
        success: (data) => {
          handleMsg91VerificationSuccess(data);
        },
        failure: (error) => {
          console.error("[MSG91 Widget Failure]:", error);
        },
      });
      msg91WidgetReady = true;
    }
  }

  // 5. HELPER: CLEAN 10-DIGIT MOBILE NUMBER
  function extractIndian10Digits(input) {
    const digits = String(input || "").replace(/[^0-9]/g, "");
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
  }

  // 6. PROCESS MSG91 ACCESS TOKEN & SIGN IN WITH CUSTOM TOKEN
  async function handleMsg91VerificationSuccess(data) {
    const authBtn = document.getElementById("btn-action-auth");
    if (authBtn) {
      authBtn.disabled = true;
      authBtn.textContent = "सत्र सत्यापित हो रहा है...";
    }

    // MSG91 विभिन्न रिटर्न प्रारूपों में से access-token ढूँढना
    const accessToken =
      (typeof data === "string" ? data : null) ||
      data?.["access-token"] ||
      data?.accessToken ||
      data?.data?.["access-token"] ||
      data?.message;

    if (!accessToken) {
      alert("❌ त्रुटि: MSG91 सत्यापन टोकन प्राप्त नहीं हुआ।");
      if (authBtn) {
        authBtn.disabled = false;
        authBtn.textContent = "OTP सत्यापित करें और लॉगिन करें";
      }
      return;
    }

    try {
      // बैकएंड से Firebase Custom Token प्राप्त करना
      const verifyRes = await fetch("/api/msg91/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok || !result.success || !result.customToken) {
        throw new Error(result.error || "सर्वर सत्यापन अस्वीकृत।");
      }

      // 7. FIREBASE AUTH SIGN-IN WITH CUSTOM TOKEN
      const userCredential = await signInWithCustomToken(auth, result.customToken);
      const firebaseUser = userCredential.user;
      const verifiedPhone = result.phone || activeMobileNumber;

      // 8. RTDB USER PROFILE MAPPING
      const nameInput = document.getElementById("user-name");
      const rollInput = document.getElementById("user-roll");
      const passInput = document.getElementById("user-pass");

      const name = nameInput ? nameInput.value.trim() : "";
      const roll = rollInput ? rollInput.value.trim() : "";
      const pass = passInput ? passInput.value.trim() : "";

      const userRef = ref(db, `users/${verifiedPhone}`);
      const userSnap = await get(userRef);

      let finalName = name;
      let finalRoll = roll;

      if (userSnap.exists()) {
        const oldData = userSnap.val();
        finalName = oldData.name || name;
        finalRoll = oldData.roll || roll;
        await update(userRef, {
          uid: firebaseUser.uid,
          status: "online",
          lastSeen: Date.now(),
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
          lastSeen: Date.now(),
        });
      }

      // लोकल स्टेट सिंक (UI कम्पैटिबिलिटी)
      window.currentUser = {
        uid: firebaseUser.uid,
        name: finalName,
        phone: verifiedPhone,
        roll: finalRoll,
        displayName: finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName,
        role: pass === "razavi123" ? "admin" : "student",
        location: window.currentUser?.location || "India",
        dpUrl: window.currentUser?.dpUrl || "",
      };

      localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

      if (typeof window.updateUserUI === "function") window.updateUserUI();
      const loginScreen = document.getElementById("login-screen");
      if (loginScreen) loginScreen.style.display = "none";

      if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
      if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();

      alert("माशाअल्लाह! MSG91 OTP द्वारा लॉगिन सफल रहा।");
    } catch (err) {
      console.error("[Msg91Auth] Login Error:", err);
      alert("लॉगिन असफल: " + err.message);
      if (authBtn) {
        authBtn.disabled = false;
        authBtn.textContent = "OTP सत्यापित करें और लॉगिन करें";
      }
    }
  }

  // 9. WIRE EXISTING LOGIN UI
  function wireLoginUI() {
    cleanObsoleteDom();

    const oldAuthBtn = document.getElementById("btn-action-auth");
    if (!oldAuthBtn) return;

    // पुराने लिसनर हटाने के लिए क्लोन
    const authBtn = oldAuthBtn.cloneNode(true);
    oldAuthBtn.parentNode.replaceChild(authBtn, oldAuthBtn);

    const nameInput = document.getElementById("user-name");
    const phoneInput = document.getElementById("user-phone");
    const otpInput = document.getElementById("otp-input");
    const otpSection = document.getElementById("otp-section");

    isOtpStepActive = false;

    authBtn.addEventListener("click", async () => {
      const rawPhone = phoneInput ? phoneInput.value.trim() : "";
      const cleanPhone10 = extractIndian10Digits(rawPhone);

      if (cleanPhone10.length !== 10) {
        alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!");
        return;
      }
      activeMobileNumber = cleanPhone10;

      // ──────────────────────────────────────────────────────────
      // चरण 1: MSG91 से असली SMS OTP भेजना
      // ──────────────────────────────────────────────────────────
      if (!isOtpStepActive) {
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) {
          alert("कृपया अपना नाम दर्ज करें!");
          return;
        }

        authBtn.disabled = true;
        authBtn.textContent = "⏳ MSG91 OTP भेजा जा रहा है...";

        const fullIndianNumber = "91" + cleanPhone10;

        if (typeof window.sendOtp === "function") {
          window.sendOtp(
            fullIndianNumber,
            (res) => {
              authBtn.disabled = false;
              authBtn.textContent = "OTP सत्यापित करें (Verify & Login)";
              isOtpStepActive = true;
              if (otpSection) otpSection.style.display = "block";
              if (phoneInput) phoneInput.disabled = true;
              alert(`✅ मोबाइल नंबर (+91 ${cleanPhone10}) पर SMS OTP भेज दिया गया है।`);
            },
            (err) => {
              authBtn.disabled = false;
              authBtn.textContent = "OTP भेजें (Send OTP)";
              alert("OTP भेजने में विफलता: " + (err?.message || JSON.stringify(err)));
            }
          );
        } else {
          // SDK बैकअप इनिशियलाइज़ेशन
          await loadMsg91Sdk();
          if (typeof window.sendOtp === "function") {
            window.sendOtp(fullIndianNumber, () => {
              authBtn.disabled = false;
              authBtn.textContent = "OTP सत्यापित करें (Verify & Login)";
              isOtpStepActive = true;
              if (otpSection) otpSection.style.display = "block";
            }, (err) => {
              authBtn.disabled = false;
              authBtn.textContent = "OTP भेजें (Send OTP)";
              alert("विफलता: " + (err?.message || "MSG91 कनेक्ट नहीं हुआ"));
            });
          } else {
            authBtn.disabled = false;
            authBtn.textContent = "OTP भेजें (Send OTP)";
            alert("MSG91 विजेट लोड हो रहा है, कृपया 2 सेकंड बाद पुनः क्लिक करें।");
          }
        }
        return;
      }

      // ──────────────────────────────────────────────────────────
      // चरण 2: MSG91 OTP सत्यापन
      // ──────────────────────────────────────────────────────────
      const enteredOtp = otpInput ? otpInput.value.trim() : "";
      if (enteredOtp.length < 4) {
        alert("कृपया सही OTP दर्ज करें!");
        return;
      }

      authBtn.disabled = true;
      authBtn.textContent = "OTP जांचा जा रहा है...";

      if (typeof window.verifyOtp === "function") {
        window.verifyOtp(
          enteredOtp,
          (res) => {
            handleMsg91VerificationSuccess(res);
          },
          (err) => {
            authBtn.disabled = false;
            authBtn.textContent = "OTP सत्यापित करें और लॉगिन करें";
            alert("❌ गलत या समाप्त हुआ OTP! कृपया सही कोड डालें।");
          }
        );
      } else {
        alert("सत्यापन विजेट सक्रिय नहीं है। कृपया पेज रिफ्रेश करें।");
        authBtn.disabled = false;
      }
    });
  }

  // 10. SESSION RESTORATION (Firebase Auth Source of Truth)
  function setupAuthSessionSync() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      const loginScreen = document.getElementById("login-screen");

      if (firebaseUser) {
        const verifiedPhone = extractIndian10Digits(firebaseUser.phoneNumber || firebaseUser.uid);
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
            dpUrl: userData.dpUrl || "",
          };

          update(userRef, { status: "online", lastSeen: Date.now(), uid: firebaseUser.uid });
          onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

          if (loginScreen) loginScreen.style.display = "none";
          if (typeof window.updateUserUI === "function") window.updateUserUI();
          if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
          if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();
        } catch (e) {
          console.warn("[SohelMsg91Auth] Profile restore notice:", e);
        }
      } else {
        if (loginScreen) loginScreen.style.display = "flex";
      }
    });
  }

  // 11. LOGOUT HANDLER
  window.logoutApp = async function () {
    if (confirm("क्या आप वाकई लॉगआउट करना चाहते हैं?")) {
      try {
        if (window.currentUser?.phone) {
          const uRef = ref(db, `users/${window.currentUser.phone}`);
          await update(uRef, { status: "offline", lastSeen: Date.now() });
        }
        await signOut(auth);
      } catch (e) {}
      localStorage.removeItem("jamia_chat_saved_user");
      location.reload();
    }
  };

  // 12. BOOTSTRAP
  async function start() {
    cleanObsoleteDom();
    wireLoginUI();
    setupAuthSessionSync();
    await loadMsg91Sdk();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
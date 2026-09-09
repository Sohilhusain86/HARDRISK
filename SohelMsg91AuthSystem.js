/**
 * ============================================================================
 * 📲 SOHEL MSG91 AUTH & DP SYSTEM — PRODUCTION ENGINE
 * File: SohelMsg91AuthSystem.js
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

  if (window.__SOHEL_MSG91_AUTH_INITIALIZED__) return;
  window.__SOHEL_MSG91_AUTH_INITIALIZED__ = true;

  // 1. FIREBASE CONFIG
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

  // 2. MSG91 WIDGET CONFIG RESOLVER
  function getMsg91Config() {
    const cfg = window.MSG91_CONFIG || {};
    return {
      widgetId: cfg.widgetId || window.MSG91_WIDGET_ID || "",
      tokenAuth: cfg.tokenAuth || window.MSG91_WIDGET_TOKEN || "",
      exposeMethods: true
    };
  }

  let msg91WidgetReady = false;
  let isOtpStepActive = false;
  let activeMobileNumber = "";
  window.selectedDpUrl = "";

  // 3. IMAGE COMPRESSION & NATIVE CLOUDINARY UPLOAD
window.compressAndUploadImage = async function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = async function () {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let w = img.width, h = img.height;

        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);

        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error("इमेज कंप्रेशन विफल रहा।"));
          const compressedFile = new File([blob], `dp_${Date.now()}.jpg`, { type: "image/jpeg" });

          try {
            // 1. प्रोजेक्ट के मौजूदा असली Cloudinary फ़ंक्शन का प्राथमिक उपयोग
            if (typeof window.uploadToCloudinary === "function") {
              const cdnUrl = await window.uploadToCloudinary(compressedFile, "image");
              if (cdnUrl) return resolve(cdnUrl);
            }
            
            // 2. फ़ॉलबैक: आपके बनाए हुए Unsigned Preset 'jamia_dp' के साथ सीधा अपलोड
            const preset = window.CLOUDINARY_PRESET || "jamia_dp";
            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("upload_preset", preset);

            const res = await fetch("https://api.cloudinary.com/v1_1/xgkhockl/image/upload", {
              method: "POST",
              body: formData
            });
            const json = await res.json();
            if (json.secure_url) {
              resolve(json.secure_url);
            } else {
              reject(new Error(json.error?.message || "क्लाउडिनरी अपलोड अस्वीकृत"));
            }
          } catch (err) {
            reject(err);
          }
        }, "image/jpeg", 0.75);
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

  // 4. BIND DP UPLOAD INPUTS
  function setupDpHandlers() {
    // A. लॉगिन स्क्रीन डीपी
    const dpFileInput = document.getElementById("dp-file-input");
    const dpPreviewBox = document.getElementById("dp-preview-box");
    const dpCameraIcon = document.getElementById("dp-camera-icon");

    if (dpFileInput && !dpFileInput.getAttribute("data-bound")) {
      dpFileInput.setAttribute("data-bound", "true");
      dpFileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // तुरंत स्क्रीन पर लोकल प्रीव्यू दिखाएं
        const localPreviewUrl = URL.createObjectURL(file);
        if (dpPreviewBox) {
          dpPreviewBox.style.backgroundImage = `url('${localPreviewUrl}')`;
          dpPreviewBox.style.opacity = "0.5";
        }
        if (dpCameraIcon) dpCameraIcon.style.display = "none";

        try {
          const cdnUrl = await window.compressAndUploadImage(file);
          window.selectedDpUrl = cdnUrl;
          if (dpPreviewBox) {
            dpPreviewBox.style.backgroundImage = `url('${cdnUrl}')`;
            dpPreviewBox.style.opacity = "1";
          }
        } catch (err) {
          alert("डीपी अपलोड में समस्या आई: " + err.message);
          if (dpPreviewBox) dpPreviewBox.style.opacity = "1";
        }
      });
    }

    // B. मुख्य ऐप हेडर डीपी चेंज
    const dpUpdateInput = document.getElementById("dp-update-file");
    if (dpUpdateInput && !dpUpdateInput.getAttribute("data-bound")) {
      dpUpdateInput.setAttribute("data-bound", "true");
      dpUpdateInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        alert("प्रोफाइल फोटो अपलोड हो रही है, कृपया प्रतीक्षा करें...");
        try {
          const cdnUrl = await window.compressAndUploadImage(file);
          if (window.currentUser && window.currentUser.phone) {
            window.currentUser.dpUrl = cdnUrl;
            localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));
            await update(ref(db, `users/${window.currentUser.phone}`), { dpUrl: cdnUrl });
            if (typeof window.updateUserUI === "function") window.updateUserUI();
            alert("प्रोफाइल फोटो सफलतापूर्वक बदल गई!");
          }
        } catch (err) {
          alert("अपलोड विफल: " + err.message);
        }
      });
    }
  }

  // 5. DYNAMIC MSG91 SDK LOADER
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
    const config = getMsg91Config();
    if (!config.widgetId || !config.tokenAuth) return;

    if (typeof window.initSendOTP === "function" && !msg91WidgetReady) {
      window.initSendOTP({
        widgetId: config.widgetId,
        tokenAuth: config.tokenAuth,
        exposeMethods: true,
        success: (data) => {
          handleMsg91VerificationSuccess(data);
        },
        failure: (error) => {
          console.error("[MSG91 Widget Failure]:", error);
        }
      });
      msg91WidgetReady = true;
    }
  }

  function extractIndian10Digits(input) {
    const digits = String(input || "").replace(/[^0-9]/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  // 6. PROCESS MSG91 ACCESS TOKEN & CUSTOM TOKEN SIGN IN
  async function handleMsg91VerificationSuccess(data) {
    const authBtn = document.getElementById("btn-action-auth");
    if (authBtn) {
      authBtn.disabled = true;
      authBtn.textContent = "सत्र सत्यापित हो रहा है...";
    }

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
      const verifyRes = await fetch("/api/msg91/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken })
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok || !result.success || !result.customToken) {
        throw new Error(result.error || "सर्वर सत्यापन अस्वीकृत।");
      }

      // Firebase Custom Token Sign In
      const userCredential = await signInWithCustomToken(auth, result.customToken);
      const firebaseUser = userCredential.user;
      const verifiedPhone = result.phone || activeMobileNumber;

      // RTDB प्रोफ़ाइल सिंक (डीपी URL सहित)
      const nameInput = document.getElementById("user-name");
      const rollInput = document.getElementById("user-roll");
      const passInput = document.getElementById("user-pass");

      const name = nameInput ? nameInput.value.trim() : "";
      const roll = rollInput ? rollInput.value.trim() : "";
      const pass = passInput ? passInput.value.trim() : "";
      const finalDp = window.selectedDpUrl || "";

      const userRef = ref(db, `users/${verifiedPhone}`);
      const userSnap = await get(userRef);

      let finalName = name;
      let finalRoll = roll;

      if (userSnap.exists()) {
        const oldData = userSnap.val();
        finalName = oldData.name || name;
        finalRoll = oldData.roll || roll;
        const updatePayload = {
          uid: firebaseUser.uid,
          status: "online",
          lastSeen: Date.now()
        };
        if (finalDp) updatePayload.dpUrl = finalDp;
        await update(userRef, updatePayload);
      } else {
        await set(userRef, {
          uid: firebaseUser.uid,
          name: finalName,
          phone: verifiedPhone,
          roll: finalRoll,
          dpUrl: finalDp,
          displayName: finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName,
          status: "online",
          createdAt: Date.now(),
          lastSeen: Date.now()
        });
      }

      window.currentUser = {
        uid: firebaseUser.uid,
        name: finalName,
        phone: verifiedPhone,
        roll: finalRoll,
        displayName: finalRoll ? `${finalName} (रोल: ${finalRoll})` : finalName,
        role: pass === "razavi123" ? "admin" : "student",
        location: window.currentUser?.location || "India",
        dpUrl: finalDp || window.currentUser?.dpUrl || ""
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

  // 7. LOGIN UI BINDING
  function wireLoginUI() {
    const fakePopup = document.getElementById("sms-popup");
    if (fakePopup) fakePopup.remove();

    const oldAuthBtn = document.getElementById("btn-action-auth");
    if (!oldAuthBtn) return;

    const authBtn = oldAuthBtn.cloneNode(true);
    oldAuthBtn.parentNode.replaceChild(authBtn, oldAuthBtn);

    const nameInput = document.getElementById("user-name");
    const phoneInput = document.getElementById("user-phone");
    const otpInput = document.getElementById("otp-input");
    const otpSection = document.getElementById("otp-section");

    isOtpStepActive = false;

    authBtn.addEventListener("click", async () => {
      const config = getMsg91Config();

      // कॉन्फ़िगरेशन मिसमैच रोकथाम
      if (!config.widgetId || !config.tokenAuth) {
        alert("⚠️ MSG91 कॉन्फ़िगरेशन अनुपलब्ध है। कृपया index.html में Widget ID व Token Auth दर्ज करें।");
        return;
      }
      if (config.tokenAuth.toLowerCase() === "jamia") {
        alert("⚠️ कॉन्फ़िगरेशन त्रुटि: 'Jamia' केवल टोकन का नाम है!\n\nकृपया MSG91 डैशबोर्ड में जाकर 'Jamia' टोकन के सामने दिख रही लंबी 'Token Value' कॉपी करके tokenAuth में पेस्ट करें।");
        return;
      }

      const rawPhone = phoneInput ? phoneInput.value.trim() : "";
      const cleanPhone10 = extractIndian10Digits(rawPhone);

      if (cleanPhone10.length !== 10) {
        alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!");
        return;
      }
      activeMobileNumber = cleanPhone10;

      // चरण 1: OTP भेजें
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
            () => {
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
              const errMsg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
              alert("OTP भेजने में विफलता: " + errMsg);
            }
          );
        } else {
          await loadMsg91Sdk();
          if (typeof window.sendOtp === "function") {
            window.sendOtp(
              fullIndianNumber,
              () => {
                authBtn.disabled = false;
                authBtn.textContent = "OTP सत्यापित करें (Verify & Login)";
                isOtpStepActive = true;
                if (otpSection) otpSection.style.display = "block";
              },
              (err) => {
                authBtn.disabled = false;
                authBtn.textContent = "OTP भेजें (Send OTP)";
                alert("विफलता: " + (err?.message || JSON.stringify(err)));
              }
            );
          } else {
            authBtn.disabled = false;
            authBtn.textContent = "OTP भेजें (Send OTP)";
            alert("MSG91 विजेट लोड हो रहा है, कृपया 2 सेकंड बाद पुनः क्लिक करें।");
          }
        }
        return;
      }

      // चरण 2: OTP सत्यापित करें
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
          () => {
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

  // 8. SESSION RESTORATION
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
            dpUrl: userData.dpUrl || ""
          };

          update(userRef, { status: "online", lastSeen: Date.now(), uid: firebaseUser.uid });
          onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

          if (loginScreen) loginScreen.style.display = "none";
          if (typeof window.updateUserUI === "function") window.updateUserUI();
          if (typeof window.connectScaleDrone === "function") window.connectScaleDrone();
          if (typeof window.listenForIncomingCalls === "function") window.listenForIncomingCalls();
        } catch (e) {
          console.warn("[SohelMsg91Auth] Session restore notice:", e);
        }
      } else {
        if (loginScreen) loginScreen.style.display = "flex";
      }
    });
  }

  // 9. LOGOUT
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

  // 10. BOOTSTRAP
  async function start() {
    setupDpHandlers();
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
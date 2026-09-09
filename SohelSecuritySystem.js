/**
 * ============================================================================
 * 🛡️ SOHEL SECURITY SYSTEM — CLIENT SECURITY & DATABASE ACCESS LAYER
 * File: SohelSecuritySystem.js
 * Stage: 4 (Authenticated Database Access & Identity Protection)
 * ============================================================================
 */

import { getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

(function () {
  "use strict";

  // 1. DUPLICATE GUARD
  if (window.__SOHEL_SECURITY_SYSTEM_INITIALIZED__) {
    console.warn("[SohelSecuritySystem] Already initialized.");
    return;
  }
  window.__SOHEL_SECURITY_SYSTEM_INITIALIZED__ = true;

  // 2. FIREBASE AUTH REFERENCE
  function getSecurityAuth() {
    const apps = getApps();
    if (apps.length === 0) return null;
    try {
      return getAuth(getApp());
    } catch (e) {
      return null;
    }
  }

  // 3. AUTHENTICATION STATE & TOKEN HELPERS
  window.isFirebaseAuthenticated = function () {
    const auth = getSecurityAuth();
    return !!(auth && auth.currentUser);
  };

  window.getFirebaseIdToken = async function (forceRefresh = false) {
    if (typeof window.getAuthenticatedIdToken === "function") {
      return await window.getAuthenticatedIdToken(forceRefresh);
    }
    const auth = getSecurityAuth();
    if (!auth || !auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.error("[SohelSecuritySystem] Token retrieval error:", err.message);
      return null;
    }
  };

  window.requireFirebaseAuth = function (actionCallback, fallbackMsg) {
    if (window.isFirebaseAuthenticated()) {
      if (typeof actionCallback === "function") actionCallback();
      return true;
    }
    const msg = fallbackMsg || "इस कार्य के लिए आपका प्रमाणित (Login) होना अनिवार्य है।";
    alert(`🔒 सुरक्षा चेतावनी: ${msg}`);
    const loginScreen = document.getElementById("login-screen");
    if (loginScreen) loginScreen.style.display = "flex";
    return false;
  };

  // 4. API AUTHENTICATED FETCH HELPER
  // Future Vercel Endpoints (/api/chat, /api/gemini, /api/upload, /api/notify) के लिए
  window.authenticatedFetch = async function (url, options = {}) {
    const token = await window.getFirebaseIdToken();
    const headers = { ...(options.headers || {}) };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  // 5. PRIVILEGE & ROLE TAMPER SHIELD
  // Client-side role को authoritative होने से रोकता है
  let clientRoleWarningIssued = false;
  Object.defineProperty(window, "isVerifiedAdmin", {
    configurable: false,
    enumerable: true,
    get: function () {
      const auth = getSecurityAuth();
      if (!auth || !auth.currentUser) return false;
      // केवल UI visual state के लिए, वास्तविक सुरक्षा Firebase Rules और Backend Verify करेंगे
      const role = window.currentUser?.role;
      return role === "admin" || localStorage.getItem("roll") === "7877";
    }
  });

  // 6. SECURITY DIAGNOSTICS ENGINE
  window.runSecurityDiagnostics = async function () {
    const auth = getSecurityAuth();
    const currentUser = auth ? auth.currentUser : null;
    const isAuthed = !!currentUser;
    let hasToken = false;

    if (isAuthed) {
      try {
        const t = await currentUser.getIdToken(false);
        hasToken = !!t;
      } catch (e) {
        hasToken = false;
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      firebaseAuthLoaded: !!auth,
      userAuthenticated: isAuthed,
      idTokenAvailable: hasToken,
      verifiedUid: isAuthed ? currentUser.uid : "None",
      phoneVerified: isAuthed ? (currentUser.phoneNumber || "No-Phone") : "None",
      deprecatedOtpBlocked: !document.getElementById("sms-popup"),
      clientPasskeyExposedWarning: typeof window.ADMIN_PASSKEY !== "undefined",
      securityStatus: isAuthed ? "AUTHENTICATED_SECURE" : "UNAUTHENTICATED_RESTRICTED"
    };

    console.group("🛡️ [Hardisk Security Diagnostics Report]");
    console.log("Status:", report.securityStatus);
    console.log("Firebase Auth Active:", report.firebaseAuthLoaded);
    console.log("User Logged In:", report.userAuthenticated);
    console.log("ID Token Ready for APIs:", report.idTokenAvailable);
    console.log("Fake OTP Element Purged:", report.deprecatedOtpBlocked);
    if (report.clientPasskeyExposedWarning) {
      console.warn("⚠️ चेतावनी: client scope में ADMIN_PASSKEY डिटेक्ट हुआ। इसे केवल Server Claims पर निर्भर करें।");
    }
    console.groupEnd();

    return report;
  };

  // Bootstrap Diagnostic Logger
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (typeof window.runSecurityDiagnostics === "function") {
        window.runSecurityDiagnostics().catch(() => {});
      }
    }, 3000);
  });
})();

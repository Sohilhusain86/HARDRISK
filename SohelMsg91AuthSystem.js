/* =========================================================
   SohelMsg91AuthSystem.js
   FINAL MSG91 OTP WIDGET INTEGRATION
   ========================================================= */

import {
  getAuth,
  signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

(() => {
  "use strict";

  let msg91Loading = null;
  let msg91Ready = false;
  let activePhone10 = "";
  let activeReqId = null;

  /* -------------------------------------------------------
     Firebase
  ------------------------------------------------------- */

  const firebaseConfig = {
    apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
    authDomain: "ula-alif.firebaseapp.com",
    databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
    projectId: "ula-alif",
    storageBucket: "ula-alif.firebasestorage.app",
    messagingSenderId: "693272422991",
    appId: "1:693272422991:web:081c07b083e3549b0dd83a"
  };

  const app =
    getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const db = getDatabase(app);

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(message) {
    console.error("[MSG91]", message);

    try {
      alert(message);
    } catch (_) {}
  }

  async function readJson(response) {
    const text = await response.text();

    if (!text) {
      throw new Error("Server ने खाली response दिया।");
    }

    try {
      return JSON.parse(text);
    } catch (_) {
      console.error("[MSG91] Invalid JSON:", text);
      throw new Error("Server ने valid JSON response नहीं दिया।");
    }
  }

  function cleanPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.slice(-10);
  }

  function extractReqId(data) {
    if (!data || typeof data !== "object") return null;

    return (
      data.reqId ||
      data.reqID ||
      data.reqid ||
      data.requestId ||
      data.requestID ||
      data.data?.reqId ||
      data.data?.reqID ||
      data.data?.reqid ||
      data.data?.requestId ||
      null
    );
  }

  function extractAccessToken(data) {
    if (!data) return null;

    if (typeof data === "string") {
      const value = data.trim();

      if (
        value.split(".").length === 3 ||
        value.length > 40
      ) {
        return value;
      }

      return null;
    }

    if (typeof data !== "object") return null;

    const direct =
      data.accessToken ||
      data.access_token ||
      data.token ||
      data.jwt ||
      data.jwtToken ||
      data.data?.accessToken ||
      data.data?.access_token ||
      data.data?.token ||
      data.data?.jwt ||
      data.data?.jwtToken;

    if (direct) return String(direct);

    return null;
  }

  /* -------------------------------------------------------
     Load public Widget configuration
  ------------------------------------------------------- */

  async function loadMsg91Config() {
    const response = await fetch("/api/msg91/config", {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    const data = await readJson(response);

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
        "MSG91 Widget configuration नहीं मिली।"
      );
    }

    if (!data.widgetId || !data.tokenAuth) {
      throw new Error(
        "MSG91 Widget ID या Widget Token missing है।"
      );
    }

    return data;
  }

  /* -------------------------------------------------------
     FINAL MSG91 SDK loader
     
     यह MSG91 के official classic-script pattern को
     exactly reproduce करता है:
     
     var configuration = {...}
     <script onload="initSendOTP(configuration)">
  ------------------------------------------------------- */

  async function loadMsg91Widget() {
    if (
      msg91Ready &&
      typeof window.sendOtp === "function" &&
      typeof window.verifyOtp === "function"
    ) {
      return;
    }

    if (msg91Loading) {
      return msg91Loading;
    }

    msg91Loading = (async () => {
      const config = await loadMsg91Config();

      /* Global configuration — MSG91 classic script के लिए */
      window.configuration = {
        widgetId: config.widgetId,
        tokenAuth: config.tokenAuth,
        identifier: "",
        exposeMethods: true,

        /*
         * अगर आपके MSG91 Widget में CAPTCHA enabled है,
         * तो यह container इस्तेमाल किया जाएगा।
         */
        captchaRenderId: "msg91-captcha-container",

        success: (data) => {
          console.log("[MSG91] Global success:", data);
        },

        failure: (error) => {
          console.error("[MSG91] Global failure:", error);
        }
      };

      /*
       * CAPTCHA container dynamically बनाना।
       */
      if (!document.getElementById("msg91-captcha-container")) {
        const captcha = document.createElement("div");
        captcha.id = "msg91-captcha-container";
        captcha.style.position = "fixed";
        captcha.style.left = "-99999px";
        captcha.style.top = "0";
        captcha.style.width = "1px";
        captcha.style.height = "1px";
        captcha.style.overflow = "hidden";

        document.body.appendChild(captcha);
      }

      /*
       * अगर provider पहले से loaded है तो उसे दोबारा
       * inject नहीं करेंगे।
       */
      if (typeof window.initSendOTP !== "function") {
        await new Promise((resolve, reject) => {
          const existing =
            document.querySelector(
              'script[data-jamia-msg91-provider="true"]'
            );

          if (existing) {
            existing.addEventListener("load", resolve, {
              once: true
            });

            existing.addEventListener("error", () => {
              reject(
                new Error(
                  "MSG91 Web SDK load नहीं हो सका।"
                )
              );
            }, {
              once: true
            });

            return;
          }

          /*
           * IMPORTANT:
           * यही official MSG91 pattern है:
           *
           * onload="initSendOTP(configuration)"
           */
          const script =
            document.createElement("script");

          script.type = "text/javascript";
          script.src =
            "https://verify.msg91.com/otp-provider.js";

          script.setAttribute(
            "data-jamia-msg91-provider",
            "true"
          );

          script.setAttribute(
            "onload",
            "initSendOTP(configuration)"
          );

          script.onload = () => {
            console.log(
              "[MSG91] otp-provider.js loaded."
            );
            resolve();
          };

          script.onerror = () => {
            reject(
              new Error(
                "MSG91 otp-provider.js load नहीं हुआ।"
              )
            );
          };

          document.head.appendChild(script);
        });
      } else {
        /*
         * यदि provider पहले से मौजूद है तो initialization
         * explicitly कर दें।
         */
        try {
          window.initSendOTP(window.configuration);
        } catch (error) {
          console.warn(
            "[MSG91] Existing SDK initialization:",
            error
          );
        }
      }

      /*
       * sendOtp / verifyOtp expose होने तक wait।
       */
      const start = Date.now();

      await new Promise((resolve, reject) => {
        const check = () => {
          const ready =
            typeof window.sendOtp === "function" &&
            typeof window.verifyOtp === "function";

          if (ready) {
            msg91Ready = true;

            console.log(
              "[MSG91] FINAL SDK READY",
              {
                sendOtp:
                  typeof window.sendOtp,
                verifyOtp:
                  typeof window.verifyOtp,
                retryOtp:
                  typeof window.retryOtp,
                getWidgetData:
                  typeof window.getWidgetData
              }
            );

            resolve();
            return;
          }

          if (Date.now() - start >= 15000) {
            reject(
              new Error(
                "MSG91 sendOtp उपलब्ध नहीं हुआ। Web SDK initialization पूरा नहीं हुआ।"
              )
            );
            return;
          }

          setTimeout(check, 100);
        };

        check();
      });
    })();

    try {
      await msg91Loading;
    } finally {
      msg91Loading = null;
    }
  }

  /* -------------------------------------------------------
     Remove old fake OTP listener
  ------------------------------------------------------- */

  function replaceOldAuthButton() {
    const oldButton = $("btn-action-auth");

    if (!oldButton) {
      throw new Error(
        "btn-action-auth नहीं मिला।"
      );
    }

    /*
     * पुराने index.html listener को हटाने के लिए
     * button clone करते हैं।
     */
    const newButton =
      oldButton.cloneNode(true);

    oldButton.replaceWith(newButton);

    return newButton;
  }

  /* -------------------------------------------------------
     Send OTP
  ------------------------------------------------------- */

  async function sendRealOtp() {
    const phoneInput = $("user-phone");
    const otpSection = $("otp-section");
    const otpInput = $("otp-input");
    const button = $("btn-action-auth");

    if (!phoneInput || !button) {
      throw new Error(
        "Login controls नहीं मिले।"
      );
    }

    const phone10 =
      cleanPhone(phoneInput.value);

    if (phone10.length !== 10) {
      showMessage(
        "कृपया 10 अंकों का सही मोबाइल नंबर डालें।"
      );
      return;
    }

    activePhone10 = phone10;
    activeReqId = null;

    button.disabled = true;
    button.textContent =
      "⏳ OTP भेजा जा रहा है...";

    try {
      await loadMsg91Widget();

      const identifier =
        "91" + phone10;

      console.log(
        "[MSG91] Sending OTP to:",
        identifier
      );

      window.sendOtp(
        identifier,

        (data) => {
          console.log(
            "[MSG91] OTP sent:",
            data
          );

          activeReqId =
            extractReqId(data);

          if (otpSection) {
            otpSection.style.display =
              "block";
          }

          if (otpInput) {
            otpInput.value = "";
            otpInput.focus();
          }

          button.disabled = false;
          button.textContent =
            "✓ OTP verify करें";
        },

        (error) => {
          console.error(
            "[MSG91] Send OTP failure:",
            error
          );

          button.disabled = false;
          button.textContent =
            "OTP भेजें";

          showMessage(
            "OTP भेजने में विफल:\n" +
            (
              error?.message ||
              error?.description ||
              String(error)
            )
          );
        }
      );

    } catch (error) {
      console.error(
        "[MSG91] Send error:",
        error
      );

      button.disabled = false;
      button.textContent =
        "OTP भेजें";

      showMessage(
        "MSG91 शुरू नहीं हो सका:\n" +
        error.message
      );
    }
  }

  /* -------------------------------------------------------
     Verify OTP
  ------------------------------------------------------- */

  async function verifyRealOtp() {
    const otpInput = $("otp-input");
    const button = $("btn-action-auth");

    if (!otpInput) {
      showMessage(
        "OTP input नहीं मिला।"
      );
      return;
    }

    const otp =
      String(otpInput.value || "")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (otp.length < 4) {
      showMessage(
        "कृपया सही OTP दर्ज करें।"
      );
      return;
    }

    if (!activePhone10) {
      showMessage(
        "पहले OTP भेजें।"
      );
      return;
    }

    button.disabled = true;
    button.textContent =
      "⏳ OTP verify हो रहा है...";

    try {
      await loadMsg91Widget();

      const success = async (data) => {
        console.log(
          "[MSG91] OTP verified:",
          data
        );

        const accessToken =
          extractAccessToken(data);

        if (!accessToken) {
          throw new Error(
            "MSG91 ने Access Token नहीं दिया।"
          );
        }

        await completeServerLogin(
          accessToken
        );
      };

      const failure = (error) => {
        console.error(
          "[MSG91] Verify failure:",
          error
        );

        button.disabled = false;
        button.textContent =
          "OTP verify करें";

        showMessage(
          "OTP verification विफल:\n" +
          (
            error?.message ||
            error?.description ||
            String(error)
          )
        );
      };

      /*
       * MSG91 docs के अनुसार reqId optional है,
       * लेकिन अगर Send OTP response ने दिया है
       * तो हम इसे जरूर pass करेंगे।
       */
      if (activeReqId) {
        window.verifyOtp(
          Number(otp),
          success,
          failure,
          activeReqId
        );
      } else {
        window.verifyOtp(
          Number(otp),
          success,
          failure
        );
      }

    } catch (error) {
      console.error(
        "[MSG91] Verify exception:",
        error
      );

      button.disabled = false;
      button.textContent =
        "OTP verify करें";

      showMessage(
        error.message ||
        "OTP verification विफल।"
      );
    }
  }

  /* -------------------------------------------------------
     Server-side Access Token verification
  ------------------------------------------------------- */

  async function completeServerLogin(
    accessToken
  ) {
    const nameInput = $("user-name");
    const rollInput = $("user-roll");

    const phone10 = activePhone10;

    const response = await fetch(
      "/api/msg91/verify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json"
        },

        body: JSON.stringify({
          phone: phone10,
          accessToken: accessToken
        })
      }
    );

    const data =
      await readJson(response);

    if (
      !response.ok ||
      !data.success ||
      !data.customToken
    ) {
      throw new Error(
        data.error ||
        "Server-side MSG91 verification विफल।"
      );
    }

    /* Firebase Custom Token Login */
    await signInWithCustomToken(
      auth,
      data.customToken
    );

    await saveUserToDatabase({
      phone: phone10,
      name:
        nameInput?.value?.trim() || "",
      roll:
        rollInput?.value?.trim() || ""
    });

    await finishLogin(
      phone10,
      nameInput?.value?.trim() || "",
      rollInput?.value?.trim() || ""
    );
  }

  /* -------------------------------------------------------
     Save user
  ------------------------------------------------------- */

  async function saveUserToDatabase({
    phone,
    name,
    roll
  }) {
    const userRef =
      ref(db, "users/" + phone);

    const snapshot =
      await get(userRef);

    const oldUser =
      snapshot.exists()
        ? snapshot.val()
        : {};

    const userData = {
      ...oldUser,

      phone,
      name:
        name ||
        oldUser.name ||
        "",

      roll:
        roll ||
        oldUser.roll ||
        "",

      displayName:
        name ||
        oldUser.displayName ||
        "",

      role:
        oldUser.role ||
        "student",

      provider:
        "msg91",

      lastLogin:
        Date.now()
    };

    await set(
      userRef,
      userData
    );

    window.currentUser =
      window.currentUser || {};

    window.currentUser = {
      ...window.currentUser,
      ...userData
    };
  }

  /* -------------------------------------------------------
     Finish Login
  ------------------------------------------------------- */

  async function finishLogin(
    phone,
    name,
    roll
  ) {
    window.currentUser =
      window.currentUser || {};

    window.currentUser.phone =
      phone;

    window.currentUser.name =
      name ||
      window.currentUser.name ||
      "";

    window.currentUser.displayName =
      name ||
      window.currentUser.displayName ||
      "";

    window.currentUser.roll =
      roll ||
      window.currentUser.roll ||
      "";

    if (!window.currentUser.role) {
      window.currentUser.role =
        "student";
    }

    window.currentUser.provider =
      "msg91";

    document.body.classList.add(
      "logged-in"
    );

    const loginScreen =
      $("login-screen");

    if (loginScreen) {
      loginScreen.style.display =
        "none";
    }

    const homeScreen =
      $("screen-home");

    if (homeScreen) {
      homeScreen.style.display =
        "flex";
    }

    /*
     * अगर existing app में showScreen()
     * उपलब्ध है तो उसे भी इस्तेमाल करें।
     */
    if (
      typeof window.showScreen ===
      "function"
    ) {
      try {
        window.showScreen(
          "screen-home"
        );
      } catch (_) {}
    }

    console.log(
      "[MSG91] LOGIN COMPLETE"
    );
  }

  /* -------------------------------------------------------
     Button
  ------------------------------------------------------- */

  function setupLoginButton() {
    const button =
      replaceOldAuthButton();

    /*
     * OTP section शुरू में hidden रहे।
     */
    const otpSection =
      $("otp-section");

    if (otpSection) {
      otpSection.style.display =
        "none";
    }

    let otpSent = false;

    button.addEventListener(
      "click",
      async (event) => {
        event.preventDefault();

        if (!otpSent) {
          await sendRealOtp();
          otpSent = true;
        } else {
          await verifyRealOtp();
        }
      }
    );
  }

  /* -------------------------------------------------------
     Start
  ------------------------------------------------------- */

  function start() {
    try {
      setupLoginButton();

      console.log(
        "[MSG91] Final auth system loaded."
      );
    } catch (error) {
      console.error(
        "[MSG91] Startup error:",
        error
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }

})();
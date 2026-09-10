/* ============================================================
   SOHEL MSG91 AUTH SYSTEM — FINAL
   Jamia Students Messenger
   MSG91 OTP Widget + Firebase Custom Token
   ============================================================ */

import {
  getAuth,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";


/* ============================================================
   FIREBASE
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
  authDomain: "ula-alif.firebaseapp.com",
  databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
  projectId: "ula-alif",
  storageBucket: "ula-alif.firebasestorage.app",
  messagingSenderId: "693272422991",
  appId: "1:693272422991:web:081c07b083e3549b0dd83a"
};

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);


/* ============================================================
   STATE
   ============================================================ */

let msg91Ready = false;
let msg91Loading = null;
let activePhone = "";
let otpSent = false;


/* ============================================================
   HELPERS
   ============================================================ */

function $(id) {
  return document.getElementById(id);
}

function showError(message) {
  console.error("[MSG91]", message);
  alert(message);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.slice(-10);
}

function setButton(text, disabled = false) {
  const btn = $("btn-action-auth");
  if (!btn) return;

  btn.textContent = text;
  btn.disabled = disabled;
}

function extractAccessToken(data) {
  if (!data) return "";

  if (typeof data === "string") {
    return data;
  }

  return (
    data.accessToken ||
    data.access_token ||
    data["access-token"] ||
    data.token ||
    data.data?.accessToken ||
    data.data?.access_token ||
    data.data?.["access-token"] ||
    data.data?.token ||
    data.response?.accessToken ||
    data.response?.access_token ||
    data.response?.token ||
    ""
  );
}


/* ============================================================
   LOAD MSG91 CONFIG
   ============================================================ */

async function loadMsg91Config() {
  const response = await fetch("/api/msg91/config", {
    method: "GET",
    cache: "no-store"
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "MSG91 config server ने वैध JSON नहीं दिया।"
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "MSG91 configuration load नहीं हुई।"
    );
  }

  if (!data.widgetId || !data.tokenAuth) {
    throw new Error(
      "MSG91 Widget ID या Token उपलब्ध नहीं है।"
    );
  }

  return data;
}


/* ============================================================
   LOAD MSG91 OFFICIAL WEB SDK
   EXACT OFFICIAL GLOBAL CONFIGURATION PATTERN
   ============================================================ */

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

  msg91Loading = new Promise(async (resolve, reject) => {

    try {

      const config = await loadMsg91Config();

      /*
       * IMPORTANT:
       * MSG91 official example uses a GLOBAL variable:
       *
       * var configuration = {...}
       *
       * Therefore we deliberately expose it globally.
       */

      window.configuration = {
        widgetId: config.widgetId,
        tokenAuth: config.tokenAuth,

        exposeMethods: true,

        /*
         * We already have our own OTP UI.
         * No MSG91 popup should be rendered.
         */
        captchaRenderId: "",

        success: function (data) {
          console.log(
            "[MSG91] Widget success:",
            data
          );
        },

        failure: function (error) {
          console.error(
            "[MSG91] Widget failure:",
            error
          );
        }
      };


      /* --------------------------------------------------------
         Remove any previously injected provider script
         -------------------------------------------------------- */

      const oldScripts =
        document.querySelectorAll(
          'script[data-sohel-msg91="1"]'
        );

      oldScripts.forEach(script => script.remove());


      /* --------------------------------------------------------
         Create provider script
         EXACTLY like MSG91's documented pattern:
         
         <script
           onload="initSendOTP(configuration)"
           src="https://verify.msg91.com/otp-provider.js">
         </script>
         -------------------------------------------------------- */

      const script =
        document.createElement("script");

      script.type = "text/javascript";
      script.src =
        "https://verify.msg91.com/otp-provider.js";

      script.async = false;

      script.dataset.sohelMsg91 = "1";

      script.onload = function () {

        console.log(
          "[MSG91] otp-provider.js loaded"
        );

        try {

          if (
            typeof window.initSendOTP !==
            "function"
          ) {
            reject(
              new Error(
                "MSG91 initSendOTP उपलब्ध नहीं है।"
              )
            );
            return;
          }

          /*
           * This is the critical initialization.
           */
          window.initSendOTP(
            window.configuration
          );

        } catch (error) {

          console.error(
            "[MSG91] initSendOTP error:",
            error
          );

          reject(error);
          return;
        }


        /* ------------------------------------------------------
           Wait until MSG91 exposes its methods.
           ------------------------------------------------------ */

        const started = Date.now();

        const waitUntilReady = () => {

          const sendReady =
            typeof window.sendOtp ===
            "function";

          const verifyReady =
            typeof window.verifyOtp ===
            "function";

          console.log(
            "[MSG91] Methods:",
            {
              sendOtp: sendReady,
              verifyOtp: verifyReady
            }
          );

          if (sendReady && verifyReady) {

            msg91Ready = true;

            console.log(
              "[MSG91] ✅ Web SDK READY"
            );

            resolve();
            return;
          }


          if (
            Date.now() - started >
            15000
          ) {

            reject(
              new Error(
                "MSG91 Web SDK ने sendOtp/verifyOtp उपलब्ध नहीं किए।"
              )
            );

            return;
          }

          setTimeout(
            waitUntilReady,
            100
          );
        };

        waitUntilReady();
      };


      script.onerror = function () {

        reject(
          new Error(
            "MSG91 Web SDK load नहीं हो सका।"
          )
        );
      };


      document.head.appendChild(script);

    } catch (error) {

      reject(error);
    }
  });


  try {

    await msg91Loading;

  } finally {

    msg91Loading = null;
  }
}


/* ============================================================
   SEND OTP
   ============================================================ */

function sendMsg91Otp(identifier) {

  return new Promise((resolve, reject) => {

    if (
      typeof window.sendOtp !==
      "function"
    ) {
      reject(
        new Error(
          "MSG91 sendOtp उपलब्ध नहीं है।"
        )
      );
      return;
    }


    console.log(
      "[MSG91] Sending OTP to:",
      identifier
    );


    window.sendOtp(

      identifier,

      function (data) {

        console.log(
          "[MSG91] OTP sent:",
          data
        );

        resolve(data);
      },

      function (error) {

        console.error(
          "[MSG91] OTP send failed:",
          error
        );

        reject(
          new Error(
            typeof error === "string"
              ? error
              : error?.message ||
                error?.type ||
                "OTP भेजने में विफल।"
          )
        );
      }
    );
  });
}


/* ============================================================
   VERIFY OTP
   ============================================================ */

function verifyMsg91Otp(otp) {

  return new Promise((resolve, reject) => {

    if (
      typeof window.verifyOtp !==
      "function"
    ) {
      reject(
        new Error(
          "MSG91 verifyOtp उपलब्ध नहीं है।"
        )
      );
      return;
    }


    console.log(
      "[MSG91] Verifying OTP..."
    );


    window.verifyOtp(

      Number(otp),

      function (data) {

        console.log(
          "[MSG91] OTP verified:",
          data
        );

        resolve(data);
      },

      function (error) {

        console.error(
          "[MSG91] OTP verification failed:",
          error
        );

        reject(
          new Error(
            typeof error === "string"
              ? error
              : error?.message ||
                error?.type ||
                "OTP गलत है या expire हो चुका है।"
          )
        );
      }

    );
  });
}


/* ============================================================
   SEND ACCESS TOKEN TO OUR SERVER
   ============================================================ */

async function verifyAccessTokenOnServer(
  phone,
  accessToken
) {

  const response = await fetch(
    "/api/msg91/verify",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        phone,
        accessToken
      })
    }
  );


  const text =
    await response.text();

  let data;

  try {

    data = JSON.parse(text);

  } catch {

    throw new Error(
      "Server ने वैध verification response नहीं दिया।"
    );
  }


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data.error ||
      "MSG91 access-token verification विफल।"
    );
  }


  return data;
}


/* ============================================================
   SAVE USER
   ============================================================ */

async function saveUser({
  phone,
  name,
  roll,
  dpUrl
}) {

  const userRef =
    ref(db, `users/${phone}`);

  const snapshot =
    await get(userRef);

  const oldUser =
    snapshot.exists()
      ? snapshot.val()
      : {};


  const userData = {

    ...oldUser,

    name:
      name ||
      oldUser.name ||
      "",

    displayName:
      name ||
      oldUser.displayName ||
      "",

    phone,

    roll:
      roll ||
      oldUser.roll ||
      "",

    dpUrl:
      dpUrl ||
      oldUser.dpUrl ||
      "",

    /*
     * Do NOT trust client-side admin
     * credentials here.
     */
    role:
      oldUser.role === "admin"
        ? "admin"
        : "student",

    lastLogin:
      Date.now()
  };


  await set(
    userRef,
    userData
  );


  window.currentUser = {
    ...(window.currentUser || {}),
    ...userData
  };


  return userData;
}


/* ============================================================
   COMPLETE LOGIN
   ============================================================ */

async function completeLogin(
  serverData
) {

  if (!serverData.customToken) {

    throw new Error(
      "Firebase Custom Token प्राप्त नहीं हुआ।"
    );
  }


  const credential =
    await signInWithCustomToken(
      auth,
      serverData.customToken
    );


  console.log(
    "[MSG91] Firebase login successful:",
    credential.user.uid
  );


  const name =
    $("user-name")?.value.trim() ||
    "";

  const roll =
    $("user-roll")?.value.trim() ||
    "";

  const dpUrl =
    window.selectedDpUrl ||
    window.currentUser?.dpUrl ||
    "";


  await saveUser({
    phone: activePhone,
    name,
    roll,
    dpUrl
  });


  const loginScreen =
    $("screen-login");

  if (loginScreen) {

    loginScreen.style.display =
      "none";
  }


  const homeScreen =
    $("screen-home");

  if (homeScreen) {

    homeScreen.style.display =
      "";
  }


  /*
   * Existing app functions, if available.
   */

  try {

    if (
      typeof window.updateProfileUI ===
      "function"
    ) {
      window.updateProfileUI();
    }

  } catch (e) {
    console.warn(
      "[MSG91] updateProfileUI:",
      e
    );
  }


  try {

    if (
      typeof window.showMainApp ===
      "function"
    ) {
      window.showMainApp();
    }

  } catch (e) {
    console.warn(
      "[MSG91] showMainApp:",
      e
    );
  }


  alert(
    "✅ लॉगिन सफल!\n\nजमिया मैसेंजर में आपका स्वागत है।"
  );
}


/* ============================================================
   REPLACE OLD LOGIN BUTTON
   This removes the old fake-OTP listener from index.html.
   ============================================================ */

function installLoginButton() {

  const oldButton =
    $("btn-action-auth");

  if (!oldButton) {

    console.error(
      "[MSG91] Login button नहीं मिला।"
    );

    return;
  }


  /*
   * cloneNode() removes listeners that were attached
   * with addEventListener() in the old index.html.
   */
  const newButton =
    oldButton.cloneNode(true);


  oldButton.replaceWith(
    newButton
  );


  const button =
    $("btn-action-auth");


  button.addEventListener(
    "click",
    handleLoginClick
  );


  console.log(
    "[MSG91] Old login handler removed."
  );
}


/* ============================================================
   LOGIN CLICK
   ============================================================ */

async function handleLoginClick(event) {

  event.preventDefault();
  event.stopPropagation();


  const name =
    $("user-name")?.value.trim() ||
    "";

  const phone =
    normalizePhone(
      $("user-phone")?.value
    );

  const roll =
    $("user-roll")?.value.trim() ||
    "";

  const otpInput =
    $("otp-input");

  const otpSection =
    $("otp-section");


  if (!name) {

    alert(
      "कृपया अपना नाम दर्ज करें।"
    );

    return;
  }


  if (phone.length !== 10) {

    alert(
      "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।"
    );

    return;
  }


  /* ==========================================================
     STEP 1 — SEND OTP
     ========================================================== */

  if (!otpSent) {

    try {

      setButton(
        "⏳ MSG91 से OTP भेजा जा रहा है...",
        true
      );


      await loadMsg91Widget();


      activePhone = phone;


      /*
       * IMPORTANT:
       * MSG91 requires country code without +
       */
      const identifier =
        "91" + phone;


      await sendMsg91Otp(
        identifier
      );


      otpSent = true;


      if (otpSection) {

        otpSection.style.display =
          "block";
      }


      setButton(
        "OTP सत्यापित करें और लॉगिन करें",
        false
      );


      if (otpInput) {

        otpInput.focus();
      }


      console.log(
        "[MSG91] OTP successfully sent."
      );


    } catch (error) {

      console.error(
        "[MSG91] Send OTP error:",
        error
      );


      otpSent = false;


      setButton(
        "OTP भेजें (Send OTP)",
        false
      );


      showError(
        "OTP भेजने में विफल:\n" +
        (error.message ||
          "अज्ञात त्रुटि")
      );
    }


    return;
  }


  /* ==========================================================
     STEP 2 — VERIFY OTP
     ========================================================== */

  const otp =
    String(
      otpInput?.value || ""
    ).replace(/\D/g, "");


  if (otp.length < 4) {

    alert(
      "कृपया प्राप्त OTP दर्ज करें।"
    );

    return;
  }


  try {

    setButton(
      "⏳ OTP सत्यापित हो रहा है...",
      true
    );


    /*
     * MSG91 itself verifies the OTP.
     */
    const verificationResponse =
      await verifyMsg91Otp(
        otp
      );


    console.log(
      "[MSG91] Verification response:",
      verificationResponse
    );


    /*
     * MSG91 returns a JWT access token
     * after successful OTP verification.
     */
    const accessToken =
      extractAccessToken(
        verificationResponse
      );


    if (!accessToken) {

      throw new Error(
        "MSG91 ने access-token नहीं दिया।"
      );
    }


    /*
     * Send ONLY the access token to our
     * secure server for final verification.
     */
    const serverData =
      await verifyAccessTokenOnServer(
        activePhone,
        accessToken
      );


    await completeLogin(
      serverData
    );


    otpSent = false;


  } catch (error) {

    console.error(
      "[MSG91] Login verification error:",
      error
    );


    setButton(
      "OTP सत्यापित करें और लॉगिन करें",
      false
    );


    showError(
      "OTP सत्यापन विफल:\n" +
      (
        error.message ||
        "कृपया OTP दोबारा जाँचें।"
      )
    );
  }
}


/* ============================================================
   LOGOUT
   ============================================================ */

window.sohelMsg91Logout =
  async function () {

    try {

      await signOut(auth);

      console.log(
        "[MSG91] Firebase logout successful."
      );

    } catch (error) {

      console.error(
        "[MSG91] Logout error:",
        error
      );
    }
  };


/* ============================================================
   AUTH STATE
   ============================================================ */

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      console.log(
        "[MSG91] Authenticated:",
        user.uid
      );

    } else {

      console.log(
        "[MSG91] No authenticated Firebase user."
      );
    }
  }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

function initialize() {

  /*
   * Wait for the existing index.html script
   * to finish creating the DOM.
   */
  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      installLoginButton,
      { once: true }
    );

  } else {

    installLoginButton();
  }
}


initialize();


console.log(
  "[SohelMsg91AuthSystem] FINAL system loaded."
);
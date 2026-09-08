// ==========================================================
// 🚀 SUHAIL ASSISTANT UI ENHANCEMENT
// 40 आवामी खिदमात + सुपर एडमिन
// 24 घंटे Star Emergency Notice
// 4-Pillar Growth Chart
// ==========================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // 1. CSS
  // ----------------------------------------------------------

  const style = document.createElement("style");

  style.id = "suhail-ui-enhancement-style";

  style.textContent = `
    /* ======================================================
       CHAT-LIST CARDS
       ====================================================== */

    .suhail-service-cards {
      width: 100%;
      box-sizing: border-box;
      padding: 4px 12px 8px;
    }

    .suhail-service-card {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 13px;
      margin: 7px 0;

      background: #111b21;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 13px;

      color: #e9edef;
      text-decoration: none;
      cursor: pointer;

      box-shadow: 0 3px 12px rgba(0,0,0,0.20);

      transition:
        transform 0.15s ease,
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .suhail-service-card:active {
      transform: scale(0.985);
    }

    .suhail-service-card:hover {
      background: #182229;
      border-color: rgba(255,255,255,0.14);
    }

    .suhail-service-icon {
      width: 48px;
      height: 48px;
      min-width: 48px;

      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 22px;
    }

    .suhail-service-icon.awam {
      background: rgba(0,168,132,0.16);
      color: #00a884;
      border: 1px solid rgba(0,168,132,0.18);
    }

    .suhail-service-icon.admin {
      background: rgba(234,179,8,0.13);
      color: #eab308;
      border: 1px solid rgba(234,179,8,0.18);
    }

    .suhail-service-info {
      min-width: 0;
      flex: 1;
    }

    .suhail-service-title {
      display: flex;
      align-items: center;
      gap: 6px;

      font-size: 0.93rem;
      font-weight: 700;
      line-height: 1.35;

      margin-bottom: 4px;
    }

    .suhail-service-description {
      color: #8696a0;
      font-size: 0.73rem;
      line-height: 1.45;
    }

    .suhail-service-badge {
      flex-shrink: 0;
      padding: 3px 7px;
      border-radius: 10px;

      font-size: 0.62rem;
      font-weight: 800;
      line-height: 1;
    }

    .suhail-service-badge.awam {
      background: #00a884;
      color: #fff;
    }

    .suhail-service-badge.admin {
      background: #eab308;
      color: #111;
    }


    /* ======================================================
       24 HOURS STAR EMERGENCY NOTICE
       ====================================================== */

    #suhail-star-emergency {
      width: calc(100% - 24px);
      box-sizing: border-box;

      margin: 9px 12px 8px;
      padding: 11px 12px;

      display: none;
      align-items: flex-start;
      gap: 10px;

      background:
        linear-gradient(
          135deg,
          #211d0c 0%,
          #29230c 50%,
          #17140a 100%
        );

      border: 1px solid rgba(234,179,8,0.55);
      border-left: 4px solid #eab308;

      border-radius: 12px;

      color: #fef3c7;

      box-shadow:
        0 4px 18px rgba(234,179,8,0.14);

      animation: suhailStarPulse 2.8s ease-in-out infinite;
    }

    @keyframes suhailStarPulse {
      0%, 100% {
        box-shadow: 0 4px 18px rgba(234,179,8,0.10);
      }

      50% {
        box-shadow: 0 4px 24px rgba(234,179,8,0.28);
      }
    }

    .suhail-star-emergency-icon {
      width: 35px;
      height: 35px;
      min-width: 35px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 50%;

      background: rgba(234,179,8,0.14);
      border: 1px solid rgba(234,179,8,0.30);

      font-size: 19px;
    }

    .suhail-star-emergency-content {
      min-width: 0;
      flex: 1;
    }

    .suhail-star-emergency-heading {
      color: #fde68a;
      font-size: 0.79rem;
      font-weight: 800;
      margin-bottom: 3px;
    }

    .suhail-star-emergency-message {
      color: #fef3c7;
      font-size: 0.72rem;
      line-height: 1.5;
    }

    .suhail-star-emergency-time {
      display: inline-block;
      margin-top: 5px;

      color: #a8a29e;
      font-size: 0.62rem;
    }


    /* ======================================================
       4 PILLAR GROWTH CHART
       ====================================================== */

    #suhail-pillar-leaderboard {
      width: calc(100% - 24px);
      box-sizing: border-box;

      margin: 10px 12px 18px;
      padding: 14px 12px 12px;

      background:
        radial-gradient(
          circle at 50% 120%,
          #1d2930 0%,
          #0b141a 70%
        );

      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 14px;

      overflow: hidden;

      box-shadow:
        0 7px 22px rgba(0,0,0,0.35);
    }

    .suhail-pillar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      margin-bottom: 5px;
    }

    .suhail-pillar-title {
      color: #e9edef;
      font-size: 0.82rem;
      font-weight: 800;
    }

    .suhail-pillar-title-icon {
      color: #eab308;
      margin-right: 5px;
    }

    .suhail-pillar-live {
      color: #8696a0;
      font-size: 0.62rem;
    }

    .suhail-pillar-chart {
      position: relative;
      height: 190px;
      margin-top: 4px;
    }

    /* Growth arrow */
    .suhail-growth-svg {
      position: absolute;

      left: 2%;
      top: 8px;

      width: 96%;
      height: 105px;

      z-index: 1;
      pointer-events: none;

      opacity: 0.72;
    }

    .suhail-pillar-stage {
      position: absolute;

      left: 0;
      right: 0;
      bottom: 0;

      height: 158px;

      display: flex;
      align-items: flex-end;
      justify-content: space-around;

      border-bottom: 1px solid rgba(255,255,255,0.13);

      z-index: 2;
    }

    .suhail-pillar-column {
      width: 23%;
      max-width: 70px;
      height: 100%;

      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;

      position: relative;
    }

    .suhail-pillar-details {
      width: 100%;

      text-align: center;

      margin-bottom: 5px;

      line-height: 1.2;
    }

    .suhail-pillar-xp {
      color: #eab308;
      font-size: 0.69rem;
      font-weight: 900;

      margin-bottom: 2px;
    }

    .suhail-pillar-name {
      color: #e9edef;
      font-size: 0.65rem;
      font-weight: 700;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      padding: 0 2px;
    }

    .suhail-pillar-roll {
      color: #8696a0;
      font-size: 0.56rem;

      margin-top: 2px;
    }

    .suhail-pillar-bar {
      width: 72%;
      min-height: 12px;

      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,0.48) 0%,
          rgba(255,255,255,0.15) 48%,
          rgba(255,255,255,0.045) 100%
        );

      border-top: 2px solid #fff;

      border-radius: 5px 5px 0 0;

      box-shadow:
        0 0 14px rgba(255,255,255,0.12);

      transition: height 0.7s ease;
    }

    .suhail-pillar-rank {
      color: #8696a0;
      font-size: 0.55rem;
      margin-top: 4px;
    }


    /* ======================================================
       MOBILE FIX
       ====================================================== */

    @media (max-width: 420px) {

      .suhail-service-card {
        padding: 10px 11px;
        gap: 10px;
      }

      .suhail-service-icon {
        width: 44px;
        height: 44px;
        min-width: 44px;
        font-size: 20px;
      }

      .suhail-service-title {
        font-size: 0.84rem;
      }

      .suhail-service-description {
        font-size: 0.68rem;
      }

      .suhail-service-badge {
        font-size: 0.56rem;
      }

      #suhail-pillar-leaderboard {
        margin-left: 10px;
        margin-right: 10px;
        width: calc(100% - 20px);
      }
    }
  `;

  document.head.appendChild(style);


  // ----------------------------------------------------------
  // 2. Helper: text से original button ढूँढना
  // ----------------------------------------------------------

  function findActionByText(text) {

    const elements = document.querySelectorAll(
      "a, button, [role='button']"
    );

    for (const el of elements) {

      const value = (el.innerText || el.textContent || "")
        .replace(/\s+/g, " ")
        .trim();

      if (value.includes(text)) {
        return el;
      }
    }

    return null;
  }


  // ----------------------------------------------------------
  // 3. Chat-list में नए cards
  //    पुराने buttons को छूना नहीं है
  // ----------------------------------------------------------

  function insertServiceCards() {

    if (document.getElementById("suhail-service-cards")) {
      return;
    }

    /*
      सबसे पहले chat-list ढूँढें।
      आपके वर्तमान interface में .chat-list / #chats
      में से जो मिले, उसे इस्तेमाल करेंगे।
    */

    const chatList =
      document.querySelector("#chats") ||
      document.querySelector(".chat-list") ||
      document.querySelector("#chat-list");

    if (!chatList) {
      return;
    }


    const wrapper = document.createElement("div");

    wrapper.id = "suhail-service-cards";
    wrapper.className = "suhail-service-cards";


    // ------------------------------------------------------
    // Card 1
    // ------------------------------------------------------

    const awamCard = document.createElement("div");

    awamCard.className = "suhail-service-card";

    awamCard.innerHTML = `
      <div class="suhail-service-icon awam">
        <i class="fa-solid fa-layer-group"></i>
      </div>

      <div class="suhail-service-info">

        <div class="suhail-service-title">
          <span>🏛️ 40 आवामी व सामाजिक खिदमात</span>

          <span class="suhail-service-badge awam">
            पोर्टल
          </span>
        </div>

        <div class="suhail-service-description">
          सरकारी योजनाएँ, दुकानदारी खाता-बही,
          प्राथमिक उपचार व टेक हेल्प
        </div>

      </div>
    `;


    // ------------------------------------------------------
    // Card 2
    // ------------------------------------------------------

    const adminCard = document.createElement("div");

    adminCard.className = "suhail-service-card";

    adminCard.innerHTML = `
      <div class="suhail-service-icon admin">
        <i class="fa-solid fa-shield-halved"></i>
      </div>

      <div class="suhail-service-info">

        <div class="suhail-service-title">
          <span>🛡️ सुपर एडमिन कंट्रोल पैनल</span>

          <span class="suhail-service-badge admin">
            एडमिन
          </span>
        </div>

        <div class="suhail-service-description">
          तलबा हाज़िरी, स्टार व बैज, स्ट्राइक,
          क्लास चैट व AI इम्तिहान
        </div>

      </div>
    `;


    // ------------------------------------------------------
    // IMPORTANT:
    // Original buttons remain untouched.
    // New cards only trigger the original buttons.
    // ------------------------------------------------------

    awamCard.addEventListener("click", function () {

      const original =
        findActionByText("30 AI खिदमात") ||
        findActionByText("आवामी");

      if (original) {
        original.click();
      } else {
        window.location.href = "/awam.html";
      }

    });


    adminCard.addEventListener("click", function () {

      const original =
        findActionByText("सुपर एडमिन") ||
        findActionByText("एडमिन");

      if (original) {
        original.click();
      } else {
        window.location.href = "/admin.html";
      }

    });


    wrapper.appendChild(awamCard);
    wrapper.appendChild(adminCard);


    // ------------------------------------------------------
    // कहाँ insert करना है?
    // Search/filter के बाद और students से पहले
    // ------------------------------------------------------

    const filter =
      document.querySelector(".filter-chips") ||
      document.querySelector(".chat-filters");

    if (filter && filter.parentNode) {

      filter.parentNode.insertBefore(
        wrapper,
        filter.nextSibling
      );

      return;
    }


    // Search bar के बाद
    const search =
      document.querySelector(
        'input[placeholder*="चैट या सबक"]'
      ) ||
      document.querySelector(".search-bar");

    if (search) {

      const parent = search.parentNode;

      if (parent) {

        parent.parentNode.insertBefore(
          wrapper,
          parent.nextSibling
        );

        return;
      }
    }


    // Last fallback
    chatList.prepend(wrapper);
  }


  // ----------------------------------------------------------
  // 4. Emergency Star Notice
  // ----------------------------------------------------------

  function setupStarEmergencyNotice(users) {

    let notice =
      document.getElementById("suhail-star-emergency");


    // पहले से नहीं है तो बनायें
    if (!notice) {

      notice = document.createElement("div");

      notice.id = "suhail-star-emergency";

      notice.innerHTML = `
        <div class="suhail-star-emergency-icon">
          ⭐
        </div>

        <div class="suhail-star-emergency-content">

          <div class="suhail-star-emergency-heading">
            📢 इल्मी एज़ाज़ — 24 घंटे का नोटिस
          </div>

          <div
            class="suhail-star-emergency-message"
            id="suhail-star-message"
          ></div>

          <span
            class="suhail-star-emergency-time"
            id="suhail-star-time"
          ></span>

        </div>
      `;


      /*
        Home screen में notice लगाना है।
        Chat list के ऊपर।
      */

      const chatList =
        document.querySelector("#chats") ||
        document.querySelector(".chat-list") ||
        document.querySelector("#chat-list");


      if (chatList && chatList.parentNode) {

        chatList.parentNode.insertBefore(
          notice,
          chatList
        );

      } else {

        const home =
          document.getElementById("screen-home");

        if (home) {
          home.appendChild(notice);
        }
      }
    }


    // ------------------------------------------------------
    // Latest star खोजें
    // ------------------------------------------------------

    const now = Date.now();

    const ONE_DAY =
      24 * 60 * 60 * 1000;


    let latest = null;


    Object.entries(users || {}).forEach(
      ([key, user]) => {

        if (!user) return;

        /*
          अलग-अलग पुराने data structures को support
          करने के लिए कई timestamp names।
        */

        const timestamp =
          Number(
            user.starAwardedAt ||
            user.starUpdatedAt ||
            user.lastStarAt ||
            user.starTime ||
            user.updatedAt ||
            0
          );


        if (!user.star) {
          return;
        }


        /*
          अगर timestamp मौजूद है तो 24 घंटे की सीमा लागू।
          timestamp नहीं है तो fake 24h claim नहीं करेंगे।
        */

        if (
          timestamp &&
          now - timestamp > ONE_DAY
        ) {
          return;
        }


        if (
          !latest ||
          timestamp > latest.timestamp
        ) {

          latest = {
            key,
            user,
            timestamp
          };
        }

      }
    );


    // ------------------------------------------------------
    // कोई valid star नहीं
    // ------------------------------------------------------

    if (!latest) {

      notice.style.display = "none";

      return;
    }


    const user = latest.user;


    const name =
      user.name ||
      user.displayName ||
      "तालिब-ए-इल्म";


    const roll =
      user.roll ||
      user.rollNumber ||
      latest.key ||
      "";


    const badge =
      user.badge ||
      "इल्मी स्टार ⭐";


    const message =
      document.getElementById(
        "suhail-star-message"
      );


    const time =
      document.getElementById(
        "suhail-star-time"
      );


    if (message) {

      message.textContent =
        `मुबारकबाद! रोल ${roll} (${name}) को `
        + `उस्ताद की तरफ़ से ${badge} से नवाज़ा गया है।`;
    }


    if (time) {

      if (latest.timestamp) {

        const expiresAt =
          latest.timestamp + ONE_DAY;

        const remaining =
          Math.max(
            0,
            expiresAt - now
          );


        const hours =
          Math.floor(
            remaining / (60 * 60 * 1000)
          );


        const minutes =
          Math.floor(
            (remaining % (60 * 60 * 1000))
            / (60 * 1000)
          );


        const date =
          new Date(latest.timestamp);


        const hh =
          String(date.getHours()).padStart(2, "0");


        const mm =
          String(date.getMinutes()).padStart(2, "0");


        time.textContent =
          `जारी: ${hh}:${mm} • `
          + `बाक़ी समय: ${hours} घंटे ${minutes} मिनट`;
      }

      else {

        time.textContent =
          "24 घंटे का इल्मी एज़ाज़ नोटिस";
      }
    }


    notice.style.display = "flex";
  }


  // ----------------------------------------------------------
  // 5. 4 Pillar Growth Chart
  // ----------------------------------------------------------

  function renderPillars(users) {

    let container =
      document.getElementById(
        "suhail-pillar-leaderboard"
      );


    // ------------------------------------------------------
    // Container एक ही बार बने
    // ------------------------------------------------------

    if (!container) {

      container =
        document.createElement("div");

      container.id =
        "suhail-pillar-leaderboard";


      container.innerHTML = `
        <div class="suhail-pillar-header">

          <div class="suhail-pillar-title">
            <i
              class="fa-solid fa-chart-simple suhail-pillar-title-icon"
            ></i>

            तालीमी तरक़्क़ी व इल्मी मुक़ाबला
          </div>

          <div class="suhail-pillar-live">
            LIVE RANK ⚡
          </div>

        </div>


        <div class="suhail-pillar-chart">

          <svg
            class="suhail-growth-svg"
            viewBox="0 0 300 110"
            preserveAspectRatio="none"
          >

            <path
              d="
                M 15,98
                Q 100,88
                155,60
                Q 215,34
                278,10
              "
              fill="none"
              stroke="#ffffff"
              stroke-width="2.5"
              stroke-linecap="round"
            />

            <polyline
              points="266,10 278,10 278,23"
              fill="none"
              stroke="#ffffff"
              stroke-width="2.5"
              stroke-linecap="round"
            />

          </svg>


          <div
            class="suhail-pillar-stage"
            id="suhail-pillar-stage"
          ></div>

        </div>
      `;


      /*
        Chart students list के नीचे रहेगा।
      */

      const chatList =
        document.querySelector("#chats") ||
        document.querySelector(".chat-list") ||
        document.querySelector("#chat-list");


      if (chatList) {

        chatList.appendChild(container);

      } else {

        const home =
          document.getElementById("screen-home");

        if (home) {
          home.appendChild(container);
        }
      }
    }


    // ------------------------------------------------------
    // Users sort by XP
    // ------------------------------------------------------

    const list =
      Object.values(users || {})
        .filter(Boolean)
        .sort(
          (a, b) =>
            (Number(b.xp) || 0) -
            (Number(a.xp) || 0)
        );


    /*
      Top 4 students.
      Reference image की तरह:
      Rank 4 → Rank 3 → Rank 2 → Rank 1
    */

    const topFour =
      list.slice(0, 4).reverse();


    const heights = [
      45,
      76,
      108,
      140
    ];


    const stage =
      document.getElementById(
        "suhail-pillar-stage"
      );


    if (!stage) return;


    stage.innerHTML = "";


    topFour.forEach(
      (student, index) => {

        const column =
          document.createElement("div");

        column.className =
          "suhail-pillar-column";


        const details =
          document.createElement("div");

        details.className =
          "suhail-pillar-details";


        const xp =
          document.createElement("div");

        xp.className =
          "suhail-pillar-xp";

        xp.textContent =
          `⚡ ${Number(student.xp) || 0}`;


        const name =
          document.createElement("div");

        name.className =
          "suhail-pillar-name";

        name.textContent =
          student.name ||
          student.displayName ||
          "तालिब";


        const roll =
          document.createElement("div");

        roll.className =
          "suhail-pillar-roll";

        const rollValue =
          student.roll ||
          student.rollNumber ||
          "";


        roll.textContent =
          rollValue
            ? `रोल: ${rollValue}`
            : "";


        details.appendChild(xp);
        details.appendChild(name);
        details.appendChild(roll);


        const bar =
          document.createElement("div");

        bar.className =
          "suhail-pillar-bar";


        bar.style.height =
          `${heights[index] || 45}px`;


        const rank =
          document.createElement("div");

        rank.className =
          "suhail-pillar-rank";

        /*
          क्योंकि topFour reverse है:
          index 0 = Rank 4
          index 3 = Rank 1
        */

        rank.textContent =
          `Rank ${4 - index}`;


        column.appendChild(details);
        column.appendChild(bar);
        column.appendChild(rank);


        stage.appendChild(column);
      }
    );


    // अगर 4 से कम students हैं
    // तो खाली छोटे pillars
    for (
      let i = topFour.length;
      i < 4;
      i++
    ) {

      const column =
        document.createElement("div");

      column.className =
        "suhail-pillar-column";


      const bar =
        document.createElement("div");

      bar.className =
        "suhail-pillar-bar";

      bar.style.height =
        "15px";


      const rank =
        document.createElement("div");

      rank.className =
        "suhail-pillar-rank";

      rank.textContent =
        `Rank ${4 - i}`;


      column.appendChild(bar);
      column.appendChild(rank);


      stage.appendChild(column);
    }
  }


  // ----------------------------------------------------------
  // 6. Firebase sync
  // ----------------------------------------------------------

  function initFirebaseSync() {

    const db =
      window.db ||
      (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
          ? firebase.database()
          : null
      );


    if (!db) {
      return;
    }


    /*
      केवल एक listener
    */

    if (window.__suhailStarPillarListenerAttached) {
      return;
    }

    window.__suhailStarPillarListenerAttached = true;


    db.ref("users").on(
      "value",
      function (snapshot) {

        const users =
          snapshot.val() || {};


        setupStarEmergencyNotice(users);

        renderPillars(users);

      },
      function (error) {

        console.error(
          "Suhail users sync error:",
          error
        );

      }
    );
  }


  // ----------------------------------------------------------
  // 7. UI initialization
  // ----------------------------------------------------------

  function initSuhailUI() {

    /*
      Existing DOM को थोड़ा समय मिलने दें।
    */

    insertServiceCards();

    initFirebaseSync();
  }


  // ----------------------------------------------------------
  // 8. DOM Ready
  // ----------------------------------------------------------

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initSuhailUI,
      { once: true }
    );

  } else {

    initSuhailUI();
  }


  // ----------------------------------------------------------
  // 9. Dynamic DOM protection
  // ----------------------------------------------------------

  /*
    अगर आपकी app chat-list को बाद में Firebase/render
    के दौरान दोबारा बनाती है, तो cards फिर लगाए जा सकें।
  */

  let observerTimer = null;


  const observer =
    new MutationObserver(
      function () {

        clearTimeout(observerTimer);


        observerTimer =
          setTimeout(
            function () {

              insertServiceCards();

            },
            400
          );
      }
    );


  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

})();
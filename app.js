/*
 * ================================================================
 * ISLAMIC DIGITAL PORTAL — CORE APPLICATION CONTROLLER
 * ================================================================
 *
 * یہ فائل پورے پورٹل کی مرکزی JavaScript application layer ہے۔
 * اس کا مقصد مختلف modules کو ایک مرکزی lifecycle، state، event
 * system، routing، accessibility، notifications اور graceful
 * fallback کے ذریعے آپس میں مربوط کرنا ہے۔
 *
 * IMPORTANT:
 * 1. یہ فائل data کا جعلی مواد خود ایجاد نہیں کرتی۔
 * 2. مستقبل کے modules اپنی اصل data files سے مواد لائیں گے۔
 * 3. اگر کوئی module موجود نہ ہو تو پورٹل crash نہیں کرے گا۔
 * 4. ہر module کو اختیاری (optional) رکھا گیا ہے تاکہ development
 *    مرحلہ وار جاری رہ سکے۔
 * 5. DOM میں موجود elements نہ ملنے کی صورت میں safe fallback ہے۔
 *
 * Expected companion modules:
 *   global-search.js
 *   library-engine.js
 *   fatawa-engine.js
 *   quran-tafseer.js
 *   hadith-engine.js
 *   audio-suite.js
 *   tasbeeh-pro.js
 *   card-generator.js
 *   storage.js
 * ================================================================
 */

(() => {
  "use strict";

  /* ================================================================
     01 — APPLICATION CONSTANTS
     ================================================================ */

  const APP = Object.freeze({
    name: "اسلامی ڈیجیٹل پورٹل",
    version: "1.0.0",
    author: "سہیل حسین",
    direction: "rtl",
    defaultRoute: "home",
    storagePrefix: "islamic_portal_",
    eventsNamespace: "IslamicPortal",
    mobileBreakpoint: 768,
    tabletBreakpoint: 1024,
    scrollOffset: 86,
    toastDuration: 3200,
    debounceDelay: 220,
    transitionDuration: 280
  });

  const SELECTORS = Object.freeze({
    body: "body",
    main: "main",
    navbar: ".navbar",
    navLinks: ".nav-link",
    mobileDrawer: "#mobileDrawer",
    mobileMenuButton: "#mobileMenuBtn",
    searchTrigger: "#searchModalTrigger",
    searchModal: "#searchModal",
    searchInput: "#modalSearchInput",
    themeToggle: "#themeToggleBtn",
    toast: "#toastMessage",
    welcome: "#welcomeGateway",
    welcomeEnter: "#welcomeEnterBtn",
    globalSearch: "#globalLiveSearch",
    section: "section[id]"
  });

  const ROUTES = Object.freeze([
    "home",
    "articles",
    "quotes",
    "naat",
    "books",
    "fatawa",
    "quran",
    "hadith",
    "tasbeeh",
    "shajra",
    "asma",
    "milad",
    "about",
    "requests",
    "questions",
    "contact"
  ]);

  const STORAGE_KEYS = Object.freeze({
    theme: `${APP.storagePrefix}theme`,
    language: `${APP.storagePrefix}language`,
    welcomeSeen: `${APP.storagePrefix}welcome_seen`,
    fontScale: `${APP.storagePrefix}font_scale`,
    route: `${APP.storagePrefix}route`,
    accessibility: `${APP.storagePrefix}accessibility`,
    firstVisit: `${APP.storagePrefix}first_visit`
  });

  /* ================================================================
     02 — APPLICATION STATE
     ================================================================ */

  const state = {
    initialized: false,
    domReady: false,
    route: APP.defaultRoute,
    previousRoute: null,
    theme: "dark",
    language: "ur",
    fontScale: 1,
    mobileMenuOpen: false,
    searchOpen: false,
    welcomeOpen: false,
    loading: false,
    online: navigator.onLine,
    reducedMotion: false,
    modules: new Map(),
    moduleErrors: [],
    eventHandlers: new Map(),
    observers: [],
    timers: new Set(),
    dataRegistry: new Map(),
    featureFlags: new Map(),
    routeHistory: [],
    pendingScroll: null
  };

  /* ================================================================
     03 — SAFE STORAGE
     ================================================================ */

  const Storage = {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (error) {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch (error) {
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    },

    getJSON(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        return JSON.parse(value);
      } catch (error) {
        return fallback;
      }
    },

    setJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  /* ================================================================
     04 — DOM UTILITIES
     ================================================================ */

  const DOM = {
    one(selector, root = document) {
      try {
        return root.querySelector(selector);
      } catch (error) {
        return null;
      }
    },

    all(selector, root = document) {
      try {
        return Array.from(root.querySelectorAll(selector));
      } catch (error) {
        return [];
      }
    },

    exists(selector, root = document) {
      return Boolean(this.one(selector, root));
    },

    create(tag, className = "", attributes = {}) {
      const element = document.createElement(tag);

      if (className) {
        element.className = className;
      }

      Object.entries(attributes).forEach(([name, value]) => {
        if (value !== null && value !== undefined) {
          element.setAttribute(name, String(value));
        }
      });

      return element;
    },

    setText(element, text) {
      if (!element) return;
      element.textContent = text == null ? "" : String(text);
    },

    show(element) {
      if (!element) return;
      element.hidden = false;
      element.removeAttribute("aria-hidden");
    },

    hide(element) {
      if (!element) return;
      element.hidden = true;
      element.setAttribute("aria-hidden", "true");
    },

    toggleClass(element, className, force) {
      if (!element) return false;
      return element.classList.toggle(className, force);
    }
  };

  /* ================================================================
     05 — EVENT BUS
     ================================================================ */

  const EventBus = {
    listeners: new Map(),

    on(eventName, callback) {
      if (typeof callback !== "function") return () => {};

      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }

      const bucket = this.listeners.get(eventName);
      bucket.add(callback);

      return () => bucket.delete(callback);
    },

    once(eventName, callback) {
      const unsubscribe = this.on(eventName, (...args) => {
        unsubscribe();
        callback(...args);
      });

      return unsubscribe;
    },

    off(eventName, callback) {
      const bucket = this.listeners.get(eventName);
      if (!bucket) return;
      bucket.delete(callback);

      if (bucket.size === 0) {
        this.listeners.delete(eventName);
      }
    },

    emit(eventName, payload = {}) {
      const bucket = this.listeners.get(eventName);
      if (!bucket) return;

      bucket.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          Logger.error(`Event handler failed: ${eventName}`, error);
        }
      });
    }
  };

  /* ================================================================
     06 — LOGGER
     ================================================================ */

  const Logger = {
    prefix: "[اسلامی پورٹل]",

    info(message, data) {
      if (window.console) {
        console.info(this.prefix, message, data ?? "");
      }
    },

    warn(message, data) {
      if (window.console) {
        console.warn(this.prefix, message, data ?? "");
      }
    },

    error(message, error) {
      if (window.console) {
        console.error(this.prefix, message, error ?? "");
      }
    }
  };

  /* ================================================================
     07 — UTILITIES
     ================================================================ */

  function debounce(callback, delay = APP.debounceDelay) {
    let timeoutId = null;

    return (...args) => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        callback(...args);
      }, delay);

      state.timers.add(timeoutId);
    };
  }

  function throttle(callback, delay = 120) {
    let lastCall = 0;
    let timeoutId = null;

    return (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastCall);

      if (remaining <= 0) {
        lastCall = now;
        callback(...args);
        return;
      }

      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        callback(...args);
      }, remaining);

      state.timers.add(timeoutId);
    };
  }

  function isValidRoute(route) {
    return ROUTES.includes(route);
  }

  function normalizeRoute(route) {
    if (!route) return APP.defaultRoute;

    const cleaned = String(route)
      .replace(/^#/, "")
      .replace(/^\/+/, "")
      .trim()
      .toLowerCase();

    return isValidRoute(cleaned) ? cleaned : APP.defaultRoute;
  }

  function sleep(ms) {
    return new Promise(resolve => {
      const timer = window.setTimeout(resolve, ms);
      state.timers.add(timer);
    });
  }

  function safeCall(callback, fallback = null, ...args) {
    try {
      return typeof callback === "function"
        ? callback(...args)
        : fallback;
    } catch (error) {
      Logger.error("safeCall failed", error);
      return fallback;
    }
  }

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* ================================================================
     08 — MODULE REGISTRY
     ================================================================ */

  const ModuleRegistry = {
    register(name, api = {}) {
      if (!name) return false;

      state.modules.set(name, {
        name,
        api,
        registeredAt: Date.now(),
        status: "registered",
        error: null
      });

      EventBus.emit("module:registered", { name, api });

      return true;
    },

    markReady(name) {
      const module = state.modules.get(name);
      if (!module) return;

      module.status = "ready";
      EventBus.emit("module:ready", { name });
    },

    markFailed(name, error) {
      const module = state.modules.get(name);

      if (module) {
        module.status = "failed";
        module.error = error;
      }

      state.moduleErrors.push({
        name,
        error,
        time: Date.now()
      });

      EventBus.emit("module:failed", { name, error });
    },

    get(name) {
      return state.modules.get(name) || null;
    },

    getAPI(name) {
      return this.get(name)?.api || null;
    },

    has(name) {
      return state.modules.has(name);
    },

    list() {
      return Array.from(state.modules.values());
    }
  };

  /* ================================================================
     09 — FEATURE REGISTRY
     ================================================================ */

  const Features = {
    define(name, enabled = true) {
      state.featureFlags.set(name, Boolean(enabled));
    },

    enable(name) {
      this.define(name, true);
    },

    disable(name) {
      this.define(name, false);
    },

    isEnabled(name) {
      return state.featureFlags.get(name) !== false;
    }
  };

  [
    "welcomeGateway",
    "countdown",
    "globalSearch",
    "library",
    "fatawa",
    "quran",
    "hadith",
    "audio",
    "tasbeeh",
    "shajra",
    "asma",
    "milad",
    "quotes",
    "articles",
    "bookmarks",
    "sharing",
    "greetingCards",
    "accessibility",
    "offlineSupport"
  ].forEach(feature => Features.define(feature, true));

  /* ================================================================
     10 — THEME CONTROLLER
     ================================================================ */

  const ThemeController = {
    init() {
      const stored = Storage.get(STORAGE_KEYS.theme, null);

      if (stored === "dark" || stored === "light") {
        state.theme = stored;
      } else {
        state.theme = "dark";
      }

      this.apply(state.theme, false);

      const button = DOM.one(SELECTORS.themeToggle);

      if (button) {
        button.addEventListener("click", () => {
          this.toggle();
        });
      }

      EventBus.emit("theme:ready", { theme: state.theme });
    },

    apply(theme, announce = true) {
      const normalized = theme === "light" ? "light" : "dark";

      state.theme = normalized;

      document.documentElement.setAttribute("data-theme", normalized);
      document.documentElement.dataset.theme = normalized;

      Storage.set(STORAGE_KEYS.theme, normalized);

      const button = DOM.one(SELECTORS.themeToggle);

      if (button) {
        button.setAttribute(
          "aria-label",
          normalized === "dark"
            ? "روشن تھیم منتخب کریں"
            : "تاریک تھیم منتخب کریں"
        );

        button.setAttribute(
          "title",
          normalized === "dark"
            ? "روشن تھیم"
            : "تاریک تھیم"
        );
      }

      EventBus.emit("theme:changed", { theme: normalized });

      if (announce) {
        Toast.show(
          normalized === "dark"
            ? "تاریک تھیم فعال ہے"
            : "روشن تھیم فعال ہے"
        );
      }
    },

    toggle() {
      this.apply(state.theme === "dark" ? "light" : "dark");
    }
  };

  /* ================================================================
     11 — ACCESSIBILITY CONTROLLER
     ================================================================ */

  const Accessibility = {
    init() {
      state.reducedMotion = prefersReducedMotion();

      this.loadFontScale();
      this.createKeyboardSupport();
      this.createFocusHandling();

      if (window.matchMedia) {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");

        const listener = event => {
          state.reducedMotion = event.matches;
          document.documentElement.classList.toggle(
            "reduce-motion",
            event.matches
          );
        };

        if (media.addEventListener) {
          media.addEventListener("change", listener);
        }
      }

      EventBus.emit("accessibility:ready");
    },

    loadFontScale() {
      const saved = Number(
        Storage.get(STORAGE_KEYS.fontScale, "1")
      );

      state.fontScale = Number.isFinite(saved)
        ? Math.min(1.5, Math.max(0.85, saved))
        : 1;

      this.applyFontScale(false);
    },

    applyFontScale(announce = true) {
      document.documentElement.style.setProperty(
        "--portal-font-scale",
        String(state.fontScale)
      );

      document.documentElement.dataset.fontScale =
        String(state.fontScale);

      Storage.set(
        STORAGE_KEYS.fontScale,
        state.fontScale
      );

      EventBus.emit("accessibility:fontScale", {
        value: state.fontScale
      });

      if (announce) {
        Toast.show("فونٹ کا سائز تبدیل کر دیا گیا");
      }
    },

    increaseFont() {
      state.fontScale = Math.min(
        1.5,
        Number((state.fontScale + 0.1).toFixed(2))
      );

      this.applyFontScale();
    },

    decreaseFont() {
      state.fontScale = Math.max(
        0.85,
        Number((state.fontScale - 0.1).toFixed(2))
      );

      this.applyFontScale();
    },

    resetFont() {
      state.fontScale = 1;
      this.applyFontScale();
    },

    createKeyboardSupport() {
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          MobileMenu.close();
          ModalController.closeAll();
          SearchController.close();
          WelcomeGateway.close();
        }

        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          SearchController.open();
        }
      });
    },

    createFocusHandling() {
      document.addEventListener("focusin", event => {
        const target = event.target;

        if (
          target instanceof HTMLElement &&
          target.matches("button, a, input, textarea, select")
        ) {
          target.classList.add("keyboard-focus-ready");
        }
      });

      document.addEventListener("focusout", event => {
        const target = event.target;

        if (target instanceof HTMLElement) {
          target.classList.remove("keyboard-focus-ready");
        }
      });
    }
  };

  /* ================================================================
     12 — TOAST / NOTIFICATION SYSTEM
     ================================================================ */

  const Toast = {
    timer: null,

    getElement() {
      return DOM.one(SELECTORS.toast);
    },

    show(message, options = {}) {
      const element = this.getElement();

      if (!element) {
        Logger.info(message);
        return;
      }

      const {
        duration = APP.toastDuration,
        type = "default"
      } = options;

      element.textContent = message;
      element.dataset.type = type;
      element.classList.add("show");
      element.setAttribute("role", "status");
      element.setAttribute("aria-live", "polite");

      window.clearTimeout(this.timer);

      this.timer = window.setTimeout(() => {
        element.classList.remove("show");
      }, duration);

      state.timers.add(this.timer);
    },

    success(message) {
      this.show(message, { type: "success" });
    },

    error(message) {
      this.show(message, { type: "error" });
    },

    info(message) {
      this.show(message, { type: "info" });
    }
  };

  /* ================================================================
     13 — MODAL CONTROLLER
     ================================================================ */

  const ModalController = {
    open(modal) {
      const element =
        typeof modal === "string"
          ? DOM.one(modal)
          : modal;

      if (!element) return false;

      element.classList.add("open");
      element.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("modal-open");

      const focusTarget =
        DOM.one(
          "input, textarea, button, [tabindex]:not([tabindex='-1'])",
          element
        );

      if (focusTarget) {
        window.setTimeout(() => {
          try {
            focusTarget.focus();
          } catch (error) {}
        }, 50);
      }

      EventBus.emit("modal:open", { modal: element });

      return true;
    },

    close(modal) {
      const element =
        typeof modal === "string"
          ? DOM.one(modal)
          : modal;

      if (!element) return false;

      element.classList.remove("open");
      element.setAttribute("aria-hidden", "true");

      if (!DOM.all(".modal-overlay.open").length) {
        document.documentElement.classList.remove("modal-open");
      }

      EventBus.emit("modal:close", { modal: element });

      return true;
    },

    closeAll() {
      DOM.all(".modal-overlay.open").forEach(modal => {
        this.close(modal);
      });
    },

    init() {
      document.addEventListener("click", event => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        if (target.matches("[data-modal-open]")) {
          const selector = target.getAttribute("data-modal-open");
          this.open(selector);
        }

        if (target.matches("[data-modal-close]")) {
          const selector = target.getAttribute("data-modal-close");

          if (selector) {
            this.close(selector);
          } else {
            const modal = target.closest(".modal-overlay");
            this.close(modal);
          }
        }

        if (target.classList.contains("modal-overlay")) {
          this.close(target);
        }
      });

      EventBus.emit("modal:ready");
    }
  };

  /* ================================================================
     14 — MOBILE NAVIGATION
     ================================================================ */

  const MobileMenu = {
    button: null,
    drawer: null,

    init() {
      this.button = DOM.one(SELECTORS.mobileMenuButton);
      this.drawer = DOM.one(SELECTORS.mobileDrawer);

      if (!this.button || !this.drawer) return;

      this.button.addEventListener("click", () => {
        this.toggle();
      });

      DOM.all(".mobile-nav-link", this.drawer).forEach(link => {
        link.addEventListener("click", () => {
          this.close();
        });
      });

      window.addEventListener(
        "resize",
        debounce(() => {
          if (window.innerWidth > APP.mobileBreakpoint) {
            this.close();
          }
        }, 120)
      );

      EventBus.emit("mobileMenu:ready");
    },

    open() {
      if (!this.drawer) return;

      this.drawer.classList.add("open");
      this.button?.setAttribute("aria-expanded", "true");

      state.mobileMenuOpen = true;

      EventBus.emit("mobileMenu:open");
    },

    close() {
      if (!this.drawer) return;

      this.drawer.classList.remove("open");
      this.button?.setAttribute("aria-expanded", "false");

      state.mobileMenuOpen = false;

      EventBus.emit("mobileMenu:close");
    },

    toggle() {
      state.mobileMenuOpen
        ? this.close()
        : this.open();
    }
  };

  /* ================================================================
     15 — WELCOME GATEWAY
     ================================================================ */

  const WelcomeGateway = {
    element: null,

    init() {
      if (!Features.isEnabled("welcomeGateway")) return;

      this.element = DOM.one(SELECTORS.welcome);

      if (!this.element) {
        return;
      }

      const seen = Storage.get(
        STORAGE_KEYS.welcomeSeen,
        "false"
      ) === "true";

      const enterButton = DOM.one(
        SELECTORS.welcomeEnter,
        this.element
      );

      if (enterButton) {
        enterButton.addEventListener("click", () => {
          this.close(true);
        });
      }

      if (!seen) {
        this.open();
      } else {
        this.close(false);
      }

      EventBus.emit("welcome:ready");
    },

    open() {
      if (!this.element) return;

      this.element.classList.add("open");
      this.element.removeAttribute("hidden");
      this.element.setAttribute("aria-hidden", "false");

      document.documentElement.classList.add("welcome-open");
      state.welcomeOpen = true;

      EventBus.emit("welcome:open");
    },

    close(markSeen = true) {
      if (!this.element) return;

      this.element.classList.remove("open");
      this.element.setAttribute("aria-hidden", "true");

      window.setTimeout(() => {
        if (!state.welcomeOpen) {
          this.element.setAttribute("hidden", "");
        }
      }, state.reducedMotion ? 0 : APP.transitionDuration);

      document.documentElement.classList.remove("welcome-open");

      state.welcomeOpen = false;

      if (markSeen) {
        Storage.set(STORAGE_KEYS.welcomeSeen, "true");
      }

      EventBus.emit("welcome:close", { markSeen });
    },

    reset() {
      Storage.remove(STORAGE_KEYS.welcomeSeen);
      this.open();
    }
  };

  /* ================================================================
     16 — SEARCH CONTROLLER
     ================================================================ */

  const SearchController = {
    modal: null,
    input: null,
    globalInput: null,
    debounceSearch: null,

    init() {
      this.modal = DOM.one(SELECTORS.searchModal);
      this.input = DOM.one(SELECTORS.searchInput);
      this.globalInput = DOM.one(SELECTORS.globalSearch);

      const trigger = DOM.one(SELECTORS.searchTrigger);

      if (trigger) {
        trigger.addEventListener("click", () => {
          this.open();
        });
      }

      if (this.input) {
        this.debounceSearch = debounce(
          value => this.perform(value),
          APP.debounceDelay
        );

        this.input.addEventListener("input", event => {
          this.debounceSearch(event.target.value);
        });
      }

      if (this.globalInput) {
        const handler = debounce(event => {
          const query = event.target.value.trim();

          if (query.length >= 2) {
            this.open(query);
            this.perform(query);
          }
        });

        this.globalInput.addEventListener("input", handler);
      }

      EventBus.on("search:request", payload => {
        this.open(payload?.query || "");
        this.perform(payload?.query || "");
      });

      EventBus.emit("search:ready");
    },

    open(query = "") {
      if (!this.modal) return;

      ModalController.open(this.modal);

      if (this.input) {
        this.input.value = query;

        window.setTimeout(() => {
          this.input?.focus();
          this.input?.select();
        }, 60);
      }

      state.searchOpen = true;
    },

    close() {
      if (!this.modal) return;

      ModalController.close(this.modal);
      state.searchOpen = false;
    },

    perform(query) {
      const normalized = String(query || "").trim();

      EventBus.emit("search:query", {
        query: normalized
      });

      const searchModule =
        ModuleRegistry.getAPI("global-search");

      if (searchModule) {
        safeCall(
          searchModule.search,
          null,
          normalized
        );

        return;
      }

      this.renderFallback(normalized);
    },

    renderFallback(query) {
      const results = DOM.one("#modalSearchResults");

      if (!results) return;

      if (!query) {
        results.innerHTML = `
          <p style="text-align:center;padding:2rem;">
            تلاش کے لیے عبارت درج کریں۔
          </p>
        `;
        return;
      }

      results.innerHTML = `
        <div class="search-fallback-message">
          <p>مرکزی تلاش ماڈیول ابھی دستیاب نہیں ہے۔</p>
          <small>تلاش: ${escapeHtml(query)}</small>
        </div>
      `;
    }
  };

  /* ================================================================
     17 — ROUTER
     ================================================================ */

  const Router = {
    init() {
      window.addEventListener("hashchange", () => {
        this.handle(location.hash);
      });

      document.addEventListener("click", event => {
        const anchor = event.target.closest?.("a[href^='#']");

        if (!anchor) return;

        const href = anchor.getAttribute("href");

        if (!href || href === "#") return;

        const route = normalizeRoute(href);

        if (isValidRoute(route)) {
          event.preventDefault();
          this.navigate(route);
        }
      });

      this.handle(location.hash || `#${APP.defaultRoute}`);

      EventBus.emit("router:ready");
    },

    current() {
      return state.route;
    },

    navigate(route, options = {}) {
      const normalized = normalizeRoute(route);

      if (normalized === state.route && !options.force) {
        this.scrollToRoute(normalized);
        return;
      }

      state.previousRoute = state.route;
      state.route = normalized;

      state.routeHistory.push({
        from: state.previousRoute,
        to: normalized,
        time: Date.now()
      });

      if (state.routeHistory.length > 50) {
        state.routeHistory.shift();
      }

      if (!options.silent) {
        const nextHash = `#${normalized}`;

        if (location.hash !== nextHash) {
          history.pushState(
            { route: normalized },
            "",
            nextHash
          );
        }
      }

      this.activateNav(normalized);
      this.scrollToRoute(normalized);

      MobileMenu.close();

      EventBus.emit("route:changed", {
        route: normalized,
        previousRoute: state.previousRoute
      });
    },

    handle(hash) {
      const route = normalizeRoute(hash);
      this.navigate(route, {
        silent: true,
        force: true
      });
    },

    activateNav(route) {
      DOM.all(SELECTORS.navLinks).forEach(link => {
        const href = link.getAttribute("href") || "";
        const linkRoute = normalizeRoute(href);

        const active = linkRoute === route;

        link.classList.toggle("active", active);

        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },

    scrollToRoute(route) {
      const target = document.getElementById(route);

      if (!target) {
        if (route === "home") {
          window.scrollTo({
            top: 0,
            behavior: state.reducedMotion
              ? "auto"
              : "smooth"
          });
        }

        return;
      }

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        APP.scrollOffset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: state.reducedMotion
          ? "auto"
          : "smooth"
      });
    }
  };

  /* ================================================================
     18 — ACTIVE SECTION OBSERVER
     ================================================================ */

  const SectionObserver = {
    observer: null,

    init() {
      const sections = DOM.all(SELECTORS.section);

      if (!sections.length || !("IntersectionObserver" in window)) {
        return;
      }

      this.observer = new IntersectionObserver(
        entries => {
          const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            );

          if (!visible.length) return;

          const id = visible[0].target.id;

          if (isValidRoute(id) && id !== state.route) {
            Router.activateNav(id);
          }
        },
        {
          root: null,
          threshold: [0.15, 0.35, 0.6],
          rootMargin: "-15% 0px -60% 0px"
        }
      );

      sections.forEach(section => {
        this.observer.observe(section);
      });

      state.observers.push(this.observer);
    }
  };

  /* ================================================================
     19 — SCROLL CONTROLLER
     ================================================================ */

  const ScrollController = {
    lastY: 0,
    ticking: false,

    init() {
      const handler = throttle(() => {
        this.onScroll();
      }, 80);

      window.addEventListener("scroll", handler, {
        passive: true
      });

      this.onScroll();
    },

    onScroll() {
      const y = window.scrollY || 0;

      document.documentElement.classList.toggle(
        "scrolled",
        y > 20
      );

      const navbar = DOM.one(SELECTORS.navbar);

      if (navbar) {
        navbar.classList.toggle(
          "navbar-scrolled",
          y > 24
        );
      }

      state.lastScrollY = y;
      EventBus.emit("scroll", { y });
    },

    toTop() {
      window.scrollTo({
        top: 0,
        behavior: state.reducedMotion
          ? "auto"
          : "smooth"
      });
    }
  };

  /* ================================================================
     20 — ONLINE / OFFLINE STATUS
     ================================================================ */

  const NetworkStatus = {
    init() {
      window.addEventListener("online", () => {
        state.online = true;
        document.documentElement.classList.remove("offline");
        Toast.success("انٹرنیٹ کنکشن بحال ہو گیا");
        EventBus.emit("network:online");
      });

      window.addEventListener("offline", () => {
        state.online = false;
        document.documentElement.classList.add("offline");
        Toast.info("آپ آف لائن ہیں؛ دستیاب محفوظ مواد استعمال کریں");
        EventBus.emit("network:offline");
      });

      document.documentElement.classList.toggle(
        "offline",
        !navigator.onLine
      );
    }
  };

  /* ================================================================
     21 — EXTERNAL LINK SAFETY
     ================================================================ */

  const LinkSafety = {
    init() {
      DOM.all("a[target='_blank']").forEach(anchor => {
        const rel = anchor.getAttribute("rel") || "";

        const tokens = new Set(
          rel.split(/\s+/).filter(Boolean)
        );

        tokens.add("noopener");
        tokens.add("noreferrer");

        anchor.setAttribute(
          "rel",
          Array.from(tokens).join(" ")
        );
      });
    }
  };

  /* ================================================================
     22 — COPY / SHARE BRIDGE
     ================================================================ */

  const ShareController = {
    init() {
      document.addEventListener("click", event => {
        const button =
          event.target.closest?.("[data-share]");

        if (!button) return;

        const title =
          button.dataset.shareTitle ||
          document.title;

        const text =
          button.dataset.shareText ||
          "";

        this.share({
          title,
          text,
          url:
            button.dataset.shareUrl ||
            location.href
        });
      });
    },

    async share({ title, text, url }) {
      try {
        if (
          navigator.share &&
          typeof navigator.share === "function"
        ) {
          await navigator.share({
            title,
            text,
            url
          });

          EventBus.emit("share:success", {
            method: "native"
          });

          return true;
        }

        await this.copy(`${title}\n${text}\n${url}`);

        Toast.success("مواد کاپی ہو گیا؛ اب شیئر کر سکتے ہیں");

        EventBus.emit("share:success", {
          method: "clipboard"
        });

        return true;
      } catch (error) {
        if (error?.name === "AbortError") {
          return false;
        }

        Logger.warn("Share failed", error);
        Toast.error("شیئر کرنے میں مسئلہ پیش آیا");
        return false;
      }
    },

    async copy(text) {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textarea = DOM.create("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      let success = false;

      try {
        success = document.execCommand("copy");
      } catch (error) {
        success = false;
      }

      textarea.remove();

      return success;
    }
  };

  /* ================================================================
     23 — DATA REGISTRY BRIDGE
     ================================================================ */

  const DataRegistry = {
    register(name, data) {
      if (!name) return false;

      state.dataRegistry.set(name, data);

      EventBus.emit("data:registered", {
        name,
        data
      });

      return true;
    },

    get(name, fallback = null) {
      return state.dataRegistry.has(name)
        ? state.dataRegistry.get(name)
        : fallback;
    },

    remove(name) {
      state.dataRegistry.delete(name);
      EventBus.emit("data:removed", { name });
    },

    has(name) {
      return state.dataRegistry.has(name);
    }
  };

  /* ================================================================
     24 — MODULE BRIDGE
     ================================================================ */

  const ModuleBridge = {
    init() {
      const expectedModules = [
        "storage",
        "global-search",
        "library-engine",
        "fatawa-engine",
        "quran-tafseer",
        "hadith-engine",
        "audio-suite",
        "tasbeeh-pro",
        "card-generator"
      ];

      expectedModules.forEach(name => {
        if (window[name]) {
          ModuleRegistry.register(name, window[name]);
          ModuleRegistry.markReady(name);
        }
      });

      /*
       * بعض modules اپنے APIs کو global namespace میں اس طرح ظاہر کر سکتے ہیں:
       *
       * window.IslamicPortalModules = {
       *   "global-search": {...},
       *   "library-engine": {...}
       * };
       */

      const globalModules =
        window.IslamicPortalModules;

      if (
        globalModules &&
        typeof globalModules === "object"
      ) {
        Object.entries(globalModules).forEach(
          ([name, api]) => {
            ModuleRegistry.register(name, api);
            ModuleRegistry.markReady(name);
          }
        );
      }

      EventBus.emit("modules:scanned", {
        modules: ModuleRegistry.list()
      });
    }
  };

  /* ================================================================
     25 — COUNTDOWN BRIDGE
     ================================================================ */

  const CountdownBridge = {
    init() {
      const countdown =
        ModuleRegistry.getAPI("countdown");

      if (countdown) {
        safeCall(
          countdown.init,
          null
        );
      }

      EventBus.emit("countdown:bridge-ready");
    }
  };

  /* ================================================================
     26 — AUDIO BRIDGE
     ================================================================ */

  const AudioBridge = {
    init() {
      const audio =
        ModuleRegistry.getAPI("audio-suite");

      if (!audio) {
        EventBus.emit("audio:waiting");
        return;
      }

      safeCall(
        audio.init,
        null
      );

      EventBus.emit("audio:ready");
    },

    play(index) {
      const audio =
        ModuleRegistry.getAPI("audio-suite");

      if (!audio) {
        Toast.info("آڈیو ماڈیول ابھی دستیاب نہیں ہے");
        return false;
      }

      return safeCall(
        audio.play,
        false,
        index
      );
    },

    pause() {
      const audio =
        ModuleRegistry.getAPI("audio-suite");

      return safeCall(
        audio.pause,
        false
      );
    }
  };

  /* ================================================================
     27 — LIBRARY BRIDGE
     ================================================================ */

  const LibraryBridge = {
    init() {
      const library =
        ModuleRegistry.getAPI("library-engine");

      if (!library) {
        EventBus.emit("library:waiting");
        return;
      }

      safeCall(
        library.init,
        null
      );

      EventBus.emit("library:ready");
    },

    search(query) {
      const library =
        ModuleRegistry.getAPI("library-engine");

      if (!library) return null;

      return safeCall(
        library.search,
        [],
        query
      );
    }
  };

  /* ================================================================
     28 — FATAWA BRIDGE
     ================================================================ */

  const FatawaBridge = {
    init() {
      const fatawa =
        ModuleRegistry.getAPI("fatawa-engine");

      if (!fatawa) {
        EventBus.emit("fatawa:waiting");
        return;
      }

      safeCall(
        fatawa.init,
        null
      );

      EventBus.emit("fatawa:ready");
    },

    search(query) {
      const fatawa =
        ModuleRegistry.getAPI("fatawa-engine");

      if (!fatawa) return null;

      return safeCall(
        fatawa.search,
        [],
        query
      );
    }
  };

  /* ================================================================
     29 — QURAN / TAFSEER BRIDGE
     ================================================================ */

  const QuranBridge = {
    init() {
      const quran =
        ModuleRegistry.getAPI("quran-tafseer");

      if (!quran) {
        EventBus.emit("quran:waiting");
        return;
      }

      safeCall(
        quran.init,
        null
      );

      EventBus.emit("quran:ready");
    },

    openSurah(surah, ayah = null) {
      const quran =
        ModuleRegistry.getAPI("quran-tafseer");

      if (!quran) return false;

      return safeCall(
        quran.openSurah,
        false,
        surah,
        ayah
      );
    }
  };

  /* ================================================================
     30 — HADITH BRIDGE
     ================================================================ */

  const HadithBridge = {
    init() {
      const hadith =
        ModuleRegistry.getAPI("hadith-engine");

      if (!hadith) {
        EventBus.emit("hadith:waiting");
        return;
      }

      safeCall(
        hadith.init,
        null
      );

      EventBus.emit("hadith:ready");
    },

    search(query) {
      const hadith =
        ModuleRegistry.getAPI("hadith-engine");

      if (!hadith) return null;

      return safeCall(
        hadith.search,
        [],
        query
      );
    }
  };

  /* ================================================================
     31 — TASBEEH BRIDGE
     ================================================================ */

  const TasbeehBridge = {
    init() {
      const tasbeeh =
        ModuleRegistry.getAPI("tasbeeh-pro");

      if (!tasbeeh) {
        EventBus.emit("tasbeeh:waiting");
        return;
      }

      safeCall(
        tasbeeh.init,
        null
      );

      EventBus.emit("tasbeeh:ready");
    },

    increment() {
      const tasbeeh =
        ModuleRegistry.getAPI("tasbeeh-pro");

      if (!tasbeeh) return false;

      return safeCall(
        tasbeeh.increment,
        false
      );
    },

    reset() {
      const tasbeeh =
        ModuleRegistry.getAPI("tasbeeh-pro");

      if (!tasbeeh) return false;

      return safeCall(
        tasbeeh.reset,
        false
      );
    }
  };

  /* ================================================================
     32 — CARD GENERATOR BRIDGE
     ================================================================ */

  const CardBridge = {
    init() {
      const card =
        ModuleRegistry.getAPI("card-generator");

      if (!card) {
        EventBus.emit("cards:waiting");
        return;
      }

      safeCall(
        card.init,
        null
      );

      EventBus.emit("cards:ready");
    },

    generate(options = {}) {
      const card =
        ModuleRegistry.getAPI("card-generator");

      if (!card) {
        Toast.info("کارڈ جنریٹر ابھی دستیاب نہیں ہے");
        return null;
      }

      return safeCall(
        card.generate,
        null,
        options
      );
    }
  };

  /* ================================================================
     33 — BOOKMARK / STORAGE BRIDGE
     ================================================================ */

  const BookmarkBridge = {
    init() {
      const storage =
        ModuleRegistry.getAPI("storage");

      if (storage) {
        safeCall(
          storage.init,
          null
        );
      }

      EventBus.emit("bookmarks:ready");
    },

    add(item) {
      const storage =
        ModuleRegistry.getAPI("storage");

      if (storage?.addBookmark) {
        return safeCall(
          storage.addBookmark,
          false,
          item
        );
      }

      return false;
    },

    remove(item) {
      const storage =
        ModuleRegistry.getAPI("storage");

      if (storage?.removeBookmark) {
        return safeCall(
          storage.removeBookmark,
          false,
          item
        );
      }

      return false;
    },

    list() {
      const storage =
        ModuleRegistry.getAPI("storage");

      if (storage?.getBookmarks) {
        return safeCall(
          storage.getBookmarks,
          [],
        );
      }

      return [];
    }
  };

  /* ================================================================
     34 — GLOBAL EVENT ACTIONS
     ================================================================ */

  const GlobalActions = {
    init() {
      document.addEventListener("click", event => {
        const target = event.target.closest?.("[data-action]");

        if (!target) return;

        const action =
          target.getAttribute("data-action");

        switch (action) {
          case "font-increase":
            Accessibility.increaseFont();
            break;

          case "font-decrease":
            Accessibility.decreaseFont();
            break;

          case "font-reset":
            Accessibility.resetFont();
            break;

          case "scroll-top":
            ScrollController.toTop();
            break;

          case "theme-toggle":
            ThemeController.toggle();
            break;

          case "search-open":
            SearchController.open();
            break;

          case "mobile-menu":
            MobileMenu.toggle();
            break;

          case "welcome-enter":
            WelcomeGateway.close(true);
            break;

          case "share":
            ShareController.share({
              title:
                target.dataset.title ||
                document.title,
              text:
                target.dataset.text ||
                "",
              url:
                target.dataset.url ||
                location.href
            });
            break;

          default:
            EventBus.emit("action:unknown", {
              action,
              target
            });
        }
      });
    }
  };

  /* ================================================================
     35 — LAZY INITIALIZATION
     ================================================================ */

  const LazyLoader = {
    observer: null,

    init() {
      const lazyElements = DOM.all(
        "[data-lazy-module]"
      );

      if (!lazyElements.length) return;

      if (!("IntersectionObserver" in window)) {
        lazyElements.forEach(element => {
          this.activate(element);
        });

        return;
      }

      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            this.activate(entry.target);
            this.observer.unobserve(entry.target);
          });
        },
        {
          rootMargin: "300px"
        }
      );

      lazyElements.forEach(element => {
        this.observer.observe(element);
      });

      state.observers.push(this.observer);
    },

    activate(element) {
      const moduleName =
        element.getAttribute("data-lazy-module");

      if (!moduleName) return;

      EventBus.emit("lazy:activate", {
        moduleName,
        element
      });

      const api =
        ModuleRegistry.getAPI(moduleName);

      if (api?.mount) {
        safeCall(
          api.mount,
          null,
          element
        );
      }
    }
  };

  /* ================================================================
     36 — PAGE VISIBILITY
     ================================================================ */

  const VisibilityController = {
    init() {
      document.addEventListener(
        "visibilitychange",
        () => {
          EventBus.emit(
            document.hidden
              ? "page:hidden"
              : "page:visible"
          );
        }
      );
    }
  };

  /* ================================================================
     37 — ERROR RECOVERY
     ================================================================ */

  const ErrorRecovery = {
    init() {
      window.addEventListener(
        "error",
        event => {
          Logger.error(
            "Global JavaScript error",
            event.error || event.message
          );

          EventBus.emit("app:error", {
            type: "runtime",
            error: event.error,
            message: event.message
          });
        }
      );

      window.addEventListener(
        "unhandledrejection",
        event => {
          Logger.error(
            "Unhandled Promise rejection",
            event.reason
          );

          EventBus.emit("app:error", {
            type: "promise",
            error: event.reason
          });
        }
      );
    }
  };

  /* ================================================================
     38 — PERFORMANCE MONITOR
     ================================================================ */

  const PerformanceMonitor = {
    marks: new Map(),

    start(name) {
      this.marks.set(name, performance.now());
    },

    end(name) {
      if (!this.marks.has(name)) return null;

      const duration =
        performance.now() -
        this.marks.get(name);

      this.marks.delete(name);

      EventBus.emit("performance:measure", {
        name,
        duration
      });

      return duration;
    },

    init() {
      this.start("application-start");

      window.addEventListener(
        "load",
        () => {
          this.end("application-start");
        },
        { once: true }
      );
    }
  };

  /* ================================================================
     39 — PAGE TITLE MANAGER
     ================================================================ */

  const TitleManager = {
    baseTitle: document.title,

    titles: {
      home: "اسلامی ڈیجیٹل پورٹل",
      articles: "مضامین — اسلامی ڈیجیٹل پورٹل",
      quotes: "اقوال و اقتباسات — اسلامی ڈیجیٹل پورٹل",
      naat: "نعت شریف — اسلامی ڈیجیٹل پورٹل",
      books: "اسلامی کتب خانہ — اسلامی ڈیجیٹل پورٹل",
      fatawa: "فتاویٰ — اسلامی ڈیجیٹل پورٹل",
      quran: "قرآن و تفاسیر — اسلامی ڈیجیٹل پورٹل",
      hadith: "احادیث — اسلامی ڈیجیٹل پورٹل",
      tasbeeh: "ڈیجیٹل تسبیح — اسلامی ڈیجیٹل پورٹل",
      shajra: "شجرہ قادریہ رضویہ — اسلامی ڈیجیٹل پورٹل",
      asma: "اسمائے مصطفیٰ ﷺ — اسلامی ڈیجیٹل پورٹل",
      milad: "میلاد النبی ﷺ — اسلامی ڈیجیٹل پورٹل",
      about: "تعارف و مقاصد — اسلامی ڈیجیٹل پورٹل",
      requests: "درخواست — اسلامی ڈیجیٹل پورٹل",
      questions: "سوالات — اسلامی ڈیجیٹل پورٹل",
      contact: "رابطہ — اسلامی ڈیجیٹل پورٹل"
    },

    init() {
      EventBus.on("route:changed", ({ route }) => {
        this.set(route);
      });
    },

    set(route) {
      document.title =
        this.titles[route] ||
        this.baseTitle;
    }
  };

  /* ================================================================
     40 — FIRST VISIT TRACKER
     ================================================================ */

  const FirstVisit = {
    init() {
      const visited =
        Storage.get(
          STORAGE_KEYS.firstVisit,
          null
        );

      if (!visited) {
        Storage.set(
          STORAGE_KEYS.firstVisit,
          new Date().toISOString()
        );

        EventBus.emit("visitor:first");
      } else {
        EventBus.emit("visitor:returning", {
          firstVisit: visited
        });
      }
    }
  };

  /* ================================================================
     41 — MODULE INITIALIZATION ORDER
     ================================================================ */

  async function initializeModules() {
    ModuleBridge.init();

    BookmarkBridge.init();
    CountdownBridge.init();
    LibraryBridge.init();
    FatawaBridge.init();
    QuranBridge.init();
    HadithBridge.init();
    AudioBridge.init();
    TasbeehBridge.init();
    CardBridge.init();

    await sleep(0);

    EventBus.emit("modules:initialized");
  }

  /* ================================================================
     42 — APPLICATION INITIALIZATION
     ================================================================ */

  async function init() {
    if (state.initialized) {
      return window.IslamicPortal;
    }

    PerformanceMonitor.init();

    state.domReady = true;

    ThemeController.init();
    Accessibility.init();
    ModalController.init();
    MobileMenu.init();
    WelcomeGateway.init();
    SearchController.init();
    Router.init();
    SectionObserver.init();
    ScrollController.init();
    NetworkStatus.init();
    LinkSafety.init();
    ShareController.init();
    GlobalActions.init();
    LazyLoader.init();
    VisibilityController.init();
    ErrorRecovery.init();
    TitleManager.init();
    FirstVisit.init();

    await initializeModules();

    state.initialized = true;

    document.documentElement.classList.add(
      "portal-ready"
    );

    document.body.classList.add(
      "portal-initialized"
    );

    EventBus.emit("app:ready", {
      version: APP.version,
      route: state.route,
      online: state.online
    });

    PerformanceMonitor.end("application-start");

    Logger.info(
      `پورٹل کامیابی سے شروع ہو گیا — v${APP.version}`
    );

    return window.IslamicPortal;
  }

  /* ================================================================
     43 — PUBLIC API
     ================================================================ */

  const PublicAPI = {
    APP,
    state,

    init,

    getRoute() {
      return Router.current();
    },

    navigate(route, options) {
      return Router.navigate(route, options);
    },

    search(query) {
      SearchController.open(query);
      SearchController.perform(query);
    },

    toast(message, options) {
      Toast.show(message, options);
    },

    theme: {
      get() {
        return state.theme;
      },

      set(theme) {
        ThemeController.apply(theme);
      },

      toggle() {
        ThemeController.toggle();
      }
    },

    accessibility: {
      increaseFont() {
        Accessibility.increaseFont();
      },

      decreaseFont() {
        Accessibility.decreaseFont();
      },

      resetFont() {
        Accessibility.resetFont();
      }
    },

    audio: AudioBridge,
    library: LibraryBridge,
    fatawa: FatawaBridge,
    quran: QuranBridge,
    hadith: HadithBridge,
    tasbeeh: TasbeehBridge,
    cards: CardBridge,
    bookmarks: BookmarkBridge,

    modules: ModuleRegistry,
    events: EventBus,
    data: DataRegistry,
    features: Features,

    welcome: {
      open() {
        WelcomeGateway.open();
      },

      close() {
        WelcomeGateway.close(true);
      },

      reset() {
        WelcomeGateway.reset();
      }
    },

    diagnostics() {
      return {
        app: {
          name: APP.name,
          version: APP.version,
          initialized: state.initialized,
          online: state.online,
          route: state.route
        },

        modules: ModuleRegistry.list().map(
          module => ({
            name: module.name,
            status: module.status,
            error: module.error
          })
        ),

        errors: [...state.moduleErrors],

        features: Object.fromEntries(
          state.featureFlags.entries()
        ),

        storage: {
          theme: Storage.get(
            STORAGE_KEYS.theme
          ),
          fontScale: Storage.get(
            STORAGE_KEYS.fontScale
          ),
          welcomeSeen: Storage.get(
            STORAGE_KEYS.welcomeSeen
          )
        }
      };
    }
  };

  /* ================================================================
     44 — GLOBAL EXPOSURE
     ================================================================ */

  window.IslamicPortal = PublicAPI;

  /*
   * Compatibility aliases:
   * مستقبل کے modules چاہیں تو ان APIs کو استعمال کر سکتے ہیں۔
   */
  window.IslamicPortalApp = PublicAPI;
  window.PortalEvents = EventBus;
  window.PortalStorage = Storage;
  window.PortalRouter = Router;
  window.PortalToast = Toast;

  /* ================================================================
     45 — DOM READY
     ================================================================ */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        init().catch(error => {
          Logger.error(
            "Application initialization failed",
            error
          );

          document.documentElement.classList.add(
            "portal-error"
          );
        });
      },
      { once: true }
    );
  } else {
    init().catch(error => {
      Logger.error(
        "Application initialization failed",
        error
      );

      document.documentElement.classList.add(
        "portal-error"
      );
    });
  }

  /* ================================================================
     46 — HTML ESCAPING HELPER
     ================================================================ */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();

/**
 * SYSTEM CORE ARCHITECTURE
 * یہ فائل ویب ایپ کی موجودہ حالت (State) کو سنبھالتی ہے۔
 */

const AppState = {
    theme: localStorage.getItem('theme') || 'light',
    currentFilter: 'all',
    searchQuery: '',
    nowPlaying: null,
    isPlaying: false,
    
    // Core Initialization
    init() {
        this.applyTheme(this.theme);
        console.log("System Core Initialized Successfully.");
    },

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        localStorage.setItem('theme', this.theme);
    },

    applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        const toggleBtn = document.getElementById('themeToggle');
        if(toggleBtn) toggleBtn.innerText = themeName === 'light' ? '🌙' : '☀️';
    }
};

// Initialize system immediately
AppState.init();

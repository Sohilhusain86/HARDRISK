/**
 * MAIN SYSTEM CONTROLLER
 * یہ فائل کلکس، ٹائپنگ اور دیگر ایونٹس کو کنٹرول کرتی ہے۔
 */

const SystemController = {
    // DOM Elements
    grid: 'contentGrid',
    searchInput: document.getElementById('searchInput'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    player: document.getElementById('mediaPlayer'),
    pdfModal: document.getElementById('pdfModal'),

    init() {
        this.bindEvents();
        this.updateView();
    },

    bindEvents() {
        // Search Input
        this.searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value;
            this.updateView();
        });

        // Filter Buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                AppState.currentFilter = e.target.dataset.filter;
                this.updateView();
            });
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => AppState.toggleTheme());

        // Player & Modal Close Buttons
        document.getElementById('closePlayerBtn').addEventListener('click', () => this.closePlayer());
        document.getElementById('closePdfBtn').addEventListener('click', () => this.closePdfModal());
    },

    updateView() {
        const filteredData = DataModule.getFilteredData(AppState.currentFilter, AppState.searchQuery);
        UIComponents.renderGrid(this.grid, filteredData);
    },

    // Actions
    playAudio(id) {
        const item = DataModule.items.find(i => i.id === id);
        if(!item) return;
        
        document.getElementById('nowPlayingTitle').innerText = item.title;
        this.player.classList.remove('hidden');
        setTimeout(() => this.player.classList.add('active'), 10);
        
        const playBtn = document.getElementById('playPauseBtn');
        playBtn.innerText = '⏸';
        this.showToast('آڈیو لوڈ ہو رہی ہے: ' + item.title);
        // Note: Actual Audio() object logic goes here when connecting real files.
    },

    closePlayer() {
        this.player.classList.remove('active');
        setTimeout(() => this.player.classList.add('hidden'), 400);
    },

    openPdf(id) {
        const item = DataModule.items.find(i => i.id === id);
        if(!item) return;

        document.getElementById('pdfTitle').innerText = item.title;
        this.pdfModal.classList.remove('hidden');
        setTimeout(() => this.pdfModal.classList.add('active'), 10);
    },

    closePdfModal() {
        this.pdfModal.classList.remove('active');
        setTimeout(() => this.pdfModal.classList.add('hidden'), 300);
    },

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast urdu';
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Start the application when HTML is loaded
document.addEventListener('DOMContentLoaded', () => {
    SystemController.init();
});


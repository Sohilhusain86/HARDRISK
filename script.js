const contentGrid = document.getElementById("contentGrid");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");

const mediaPlayer = document.getElementById("mediaPlayer");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const nowPlayingType = document.getElementById("nowPlayingType");
const playPauseBtn = document.getElementById("playPauseBtn");
const closePlayerBtn = document.getElementById("closePlayerBtn");
const audioProgress = document.getElementById("audioProgress");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");

const pdfModal = document.getElementById("pdfModal");
const pdfTitle = document.getElementById("pdfTitle");
const pdfFrame = document.getElementById("pdfFrame");
const closePdfBtn = document.getElementById("closePdfBtn");

let activeFilter = "all";
let activeAudio = null;
let activeItem = null;

const audio = new Audio();

function renderItems() {
  const query = searchInput.value.toLowerCase().trim();

  const filtered = contentItems.filter(item => {
    const matchFilter = activeFilter === "all" || item.type === activeFilter;
    const text = `${item.title} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
    const matchSearch = text.includes(query);
    return matchFilter && matchSearch;
  });

  contentGrid.innerHTML = filtered.map(item => `
    <article class="card ${item.type}">
      <div class="card-badge">${item.type === "audio" ? "Audio" : "PDF"}</div>
      <h3 class="urdu">${item.title}</h3>
      <p class="urdu">${item.description || ""}</p>
      <div class="tag-row">
        ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <button class="action-btn" data-id="${item.id}">
        ${item.type === "audio" ? "سنیں" : "پڑھیں"}
      </button>
    </article>
  `).join("");

  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = contentItems.find(x => x.id == btn.dataset.id);
      if (item.type === "audio") openAudio(item);
      else openPdf(item);
    });
  });
}

function openAudio(item) {
  activeItem = item;
  nowPlayingTitle.textContent = item.title;
  nowPlayingType.textContent = "Audio";
  mediaPlayer.classList.remove("hidden");

  if (activeAudio !== item.file) {
    audio.src = item.file;
    activeAudio = item.file;
  }
  audio.play();
  playPauseBtn.textContent = "⏸";
}

function openPdf(item) {
  pdfTitle.textContent = item.title;
  pdfFrame.src = item.file;
  pdfModal.classList.remove("hidden");
}

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶";
  }
});

closePlayerBtn.addEventListener("click", () => {
  audio.pause();
  mediaPlayer.classList.add("hidden");
});

closePdfBtn.addEventListener("click", () => {
  pdfModal.classList.add("hidden");
  pdfFrame.src = "";
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  audioProgress.value = (audio.currentTime / audio.duration) * 100;
  currentTime.textContent = formatTime(audio.currentTime);
  totalTime.textContent = formatTime(audio.duration);
});

audioProgress.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (audioProgress.value / 100) * audio.duration;
  }
});

audio.addEventListener("ended", () => {
  playPauseBtn.textContent = "▶";
});

function formatTime(sec) {
  const m = Math.floor(sec / 60) || 0;
  const s = Math.floor(sec % 60) || 0;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

searchInput.addEventListener("input", renderItems);

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderItems();
  });
});

themeToggle.addEventListener("click", () => {
  const theme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", theme === "light" ? "dark" : "light");
  themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
});

renderItems();
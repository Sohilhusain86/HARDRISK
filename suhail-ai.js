// ==========================================================
// 🚀 सोहेल एआई (Suhail AI) - ऑटोमैटिक क्लासरूम इंजन
// यह स्क्रिप्ट खुद चैट बॉक्स, क्विज़ और नोट्स टैब से जुड़ती है
// ==========================================================

(function() {
  console.log("⚡ सोहेल एआई क्लासरूम इंजन सक्रिय हुआ...");

  // 1. चैट बॉक्स: लिखते ही अगला लफ़्ज़ व माद्दा सुझाव (Auto-Hook)
  function attachChatSmartBar() {
    const input = document.getElementById('chat-input') || document.querySelector('textarea') || document.querySelector('input[type="text"]');
    if (!input || document.getElementById('suhail-smart-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'suhail-smart-bar';
    bar.style.cssText = 'display:none; padding:5px 12px; font-size:0.75rem; background:#182229; color:#00a884; border:1px solid rgba(0,168,132,0.3); border-radius:15px; margin-bottom:6px; cursor:pointer; width:fit-content;';
    input.parentNode.insertBefore(bar, input);

    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const val = input.value.trim();
      if (val.length < 3) { bar.style.display = 'none'; return; }

      timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: 'groq_autocomplete', prompt: val })
          });
          const d = await res.json();
          if (d.reply) {
            bar.innerHTML = `✨ <b>सोहेल एआई सुझाव:</b> ${d.reply} <i>(टैप करें)</i>`;
            bar.style.display = 'inline-block';
            bar.onclick = () => { input.value = val + " " + d.reply; bar.style.display = 'none'; input.focus(); };
          }
        } catch(e) { bar.style.display = 'none'; }
      }, 700);
    });
  }

  // 2. क्विज़ स्क्रीन: ग़लत जवाब पर खुद नह्वी वजह समझाना
  function attachQuizAutoExplainer() {
    document.addEventListener('click', (e) => {
      const opt = e.target.closest('.quiz-option') || e.target.closest('[onclick*="checkAnswer"]');
      if (!opt) return;

      setTimeout(() => {
        const modal = document.querySelector('.quiz-card') || document.querySelector('#quiz-modal') || opt.closest('div');
        if (modal && !modal.querySelector('#suhail-quiz-why')) {
          const whyBox = document.createElement('div');
          whyBox.id = 'suhail-quiz-why';
          whyBox.style.cssText = 'background:#182229; border-left:3px solid #eab308; padding:8px; font-size:0.78rem; color:#e9edef; margin-top:10px; border-radius:4px;';
          whyBox.innerHTML = '📖 <i>सोहेल एआई नह्वी नियम लोड कर रहा है...</i>';
          modal.appendChild(whyBox);

          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: 'cerebras_quiz_explain', prompt: "इस नह्वी क्विज़ सवाल के सही नियम की तशरीह करें" })
          }).then(r => r.json()).then(d => {
            whyBox.innerHTML = `<b>📖 सोहेल एआई नह्वी तशरीह:</b> ${d.reply || 'सबक याद रखें।'}`;
          }).catch(() => whyBox.remove());
        }
      }, 300);
    });
  }

  // 3. नोट्स टैब: खुलते ही ऑटोमैटिक क्लास समरी रेंडर करना
  function attachNotesAutoSummary() {
    const notesTab = document.querySelector('[data-tab="notes"]') || document.getElementById('tab-notes') || document.querySelector('a[href="#notes"]');
    if (!notesTab) return;

    notesTab.addEventListener('click', () => {
      const container = document.getElementById('notes') || document.getElementById('notes-content') || document.querySelector('.notes-container');
      if (!container || container.getAttribute('data-summary-loaded')) return;

      const summaryCard = document.createElement('div');
      summaryCard.style.cssText = 'background:#111b21; border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:12px; margin-bottom:12px; font-size:0.82rem; color:#e9edef;';
      summaryCard.innerHTML = `<h4 style="color:#eab308; margin-bottom:4px;">📌 आज का इल्मी खुलासा (सोहेल एआई)</h4><p>लोड हो रहा है...</p>`;
      container.prepend(summaryCard);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'sambanova_class_summary', prompt: "दिनभर के असबाक़ का खुलासा बनाएँ" })
      }).then(r => r.json()).then(d => {
        summaryCard.querySelector('p').innerText = d.reply || "आज का सबक मुकम्मल हुआ।";
        container.setAttribute('data-summary-loaded', 'true');
      }).catch(() => summaryCard.remove());
    });
  }

  // DOM लोड होते ही खुद ब खुद कनेक्ट हो जाए
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachChatSmartBar();
      attachQuizAutoExplainer();
      attachNotesAutoSummary();
    });
  } else {
    attachChatSmartBar();
    attachQuizAutoExplainer();
    attachNotesAutoSummary();
  }
})();

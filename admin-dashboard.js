(function () {
  // जब एडमिन टैब खुले तभी लोड करें
  const adminTab = document.getElementById("tab-admin");
  if (!adminTab) return;

  // 1. एडमिन पैनल में 'Approval' और 'Analytics' के लिए स्विच बटन जोड़ें
  const navContainer = document.createElement("div");
  navContainer.style.cssText = "display:flex; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;";
  navContainer.innerHTML = `
    <button id="btn-sub-reqs" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--primary-green); color:#fff; font-weight:600; cursor:pointer; font-size:0.8rem;">
      <i class="fa-solid fa-clock-rotate-left"></i> पेंडिंग पेमेंट्स
    </button>
    <button id="btn-sub-analytics" style="flex:1; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#182229; color:var(--text-muted); font-weight:600; cursor:pointer; font-size:0.8rem;">
      <i class="fa-solid fa-chart-pie"></i> छात्र समरी व यूसेज
    </button>
  `;
  adminTab.insertBefore(navContainer, adminTab.firstChild);

  // 2. एनालिटिक्स का मुख्य कंटेनर बनाएँ
  const analyticsView = document.createElement("div");
  analyticsView.id = "admin-analytics-view";
  analyticsView.style.display = "none";
  analyticsView.innerHTML = `
    <!-- स्टैट्स कार्ड्स -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
      <div style="background:#182229; border:1px solid var(--card-border); border-radius:10px; padding:10px; text-align:center;">
        <span style="font-size:0.75rem; color:var(--text-muted);">कुल छात्र</span>
        <h3 id="stat-total-students" style="color:var(--primary-green); font-size:1.3rem;">0</h3>
      </div>
      <div style="background:#182229; border:1px solid var(--card-border); border-radius:10px; padding:10px; text-align:center;">
        <span style="font-size:0.75rem; color:var(--text-muted);">कुल पूछे गए सवाल</span>
        <h3 id="stat-total-questions" style="color:var(--accent-yellow); font-size:1.3rem;">0</h3>
      </div>
    </div>

    <!-- सर्च बार -->
    <div style="margin-bottom:10px;">
      <input type="text" id="admin-search-student" placeholder="छात्र का नाम, फ़ोन या रोल नंबर से खोजें..." 
        style="width:100%; background:#182229; border:1px solid var(--card-border); border-radius:8px; padding:8px 12px; color:#fff; font-size:0.85rem; outline:none;">
    </div>

    <!-- छात्रों की लिस्ट -->
    <div id="students-list-cards" style="display:flex; flex-direction:column; gap:8px; max-height:450px; overflow-y:auto;">
      <p style="text-align:center; font-size:0.8rem; color:var(--text-muted);">डेटा लोड हो रहा है...</p>
    </div>
  `;
  adminTab.appendChild(analyticsView);

  let cachedStudents = [];

  // टैब स्विचिंग लॉजिक
  const btnReqs = document.getElementById("btn-sub-reqs");
  const btnAnalytics = document.getElementById("btn-sub-analytics");
  const reqsList = document.getElementById("admin-requests-list");
  const reqsHeader = adminTab.querySelector("div:nth-child(2)"); // original header

  btnReqs.onclick = () => {
    btnReqs.style.background = "var(--primary-green)";
    btnReqs.style.color = "#fff";
    btnAnalytics.style.background = "#182229";
    btnAnalytics.style.color = "var(--text-muted)";
    if (reqsHeader) reqsHeader.style.display = "flex";
    if (reqsList) reqsList.style.display = "flex";
    analyticsView.style.display = "none";
  };

  btnAnalytics.onclick = () => {
    btnAnalytics.style.background = "var(--primary-green)";
    btnAnalytics.style.color = "#fff";
    btnReqs.style.background = "#182229";
    btnReqs.style.color = "var(--text-muted)";
    if (reqsHeader) reqsHeader.style.display = "none";
    if (reqsList) reqsList.style.display = "none";
    analyticsView.style.display = "block";
    loadStudentAnalytics();
  };

  // डेटा फ़ेच करना
  async function loadStudentAnalytics() {
    const listDiv = document.getElementById("students-list-cards");
    listDiv.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted);">छात्रों का रिकॉर्ड लोड हो रहा है...</p>';

    try {
      const res = await fetch("/api/admin?action=students_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass: currentAdminPass || localStorage.getItem("suhail_ai_admin_pass") })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      document.getElementById("stat-total-students").textContent = data.summary.totalStudents || 0;
      document.getElementById("stat-total-questions").textContent = data.summary.totalQuestions || 0;

      cachedStudents = data.students || [];
      renderStudentsList(cachedStudents);
    } catch (e) {
      listDiv.innerHTML = `<p style="color:var(--danger); font-size:0.8rem; text-align:center;">${e.message}</p>`;
    }
  }

  // छात्रों के कार्ड्स बनाना
  function renderStudentsList(list) {
    const listDiv = document.getElementById("students-list-cards");
    if (!list.length) {
      listDiv.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted);">कोई रिकॉर्ड नहीं मिला।</p>';
      return;
    }

    listDiv.innerHTML = "";
    list.forEach(s => {
      const isBlocked = s.status === "blocked";
      const card = document.createElement("div");
      card.style.cssText = "background:#182229; border:1px solid var(--card-border); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:4px;";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="font-size:0.9rem; color:#fff;">${s.name} <span style="font-size:0.75rem; color:var(--text-muted);">(रोल: ${s.roll})</span></b>
          <span style="font-size:0.7rem; padding:2px 8px; border-radius:10px; background:${isBlocked ? '#ef4444' : 'rgba(0,168,132,0.2)'}; color:${isBlocked ? '#fff' : 'var(--primary-green)'}; font-weight:700;">
            ${s.plan} ${isBlocked ? '(निलंबित)' : ''}
          </span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">फ़ोन: <span style="color:#fff;">${s.phone}</span> | वैधता: <span style="color:var(--accent-yellow);">${s.daysLeft}</span></div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; background:#111b21; padding:6px; border-radius:6px; margin:4px 0;">
          <span>पूछे गए कुल सवाल: <b style="color:var(--primary-green);">${s.totalQuestions}</b></span>
          <span>आज के सवाल: <b style="color:#fff;">${s.dailyQuestions}</b></span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:var(--text-muted);">
          <span>आख़िरी बार सक्रिय: ${s.lastActive}</span>
          <button class="btn-toggle-block" data-phone="${s.phone}" data-status="${isBlocked ? 'active' : 'blocked'}" 
            style="padding:3px 8px; border-radius:4px; border:none; background:${isBlocked ? 'var(--success)' : 'var(--danger)'}; color:#fff; font-size:0.68rem; cursor:pointer;">
            ${isBlocked ? 'अनब्लॉक करें' : 'ब्लॉक करें'}
          </button>
        </div>
      `;
      listDiv.appendChild(card);
    });

    // ब्लॉक/अनब्लॉक बटन इवेंट
    listDiv.querySelectorAll(".btn-toggle-block").forEach(btn => {
      btn.onclick = async () => {
        const phone = btn.dataset.phone;
        const newStatus = btn.dataset.status;
        if (!confirm(`क्या आप वाकई इस छात्र को ${newStatus === 'blocked' ? 'ब्लॉक' : 'अनब्लॉक'} करना चाहते हैं?`)) return;

        try {
          const res = await fetch("/api/admin?action=toggle_block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pass: currentAdminPass || localStorage.getItem("suhail_ai_admin_pass"),
              targetPhone: phone,
              newStatus: newStatus
            })
          });
          const d = await res.json();
          alert(d.message);
          loadStudentAnalytics();
        } catch (e) {
          alert("Error: " + e.message);
        }
      };
    });
  }

  // लाइव सर्च फ़िल्टर
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "admin-search-student") {
      const q = e.target.value.toLowerCase().trim();
      const filtered = cachedStudents.filter(s => 
        s.name.toLowerCase().includes(q) || 
        String(s.phone).includes(q) || 
        String(s.roll).includes(q)
      );
      renderStudentsList(filtered);
    }
  });
})();
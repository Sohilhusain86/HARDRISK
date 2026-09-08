// ==========================================================
// 🚀 सोहेल एआई: 100% विज़िबल सनद बोर्ड + शाही नोटिस + 5-बटन डॉक
// ==========================================================

(function () {
  "use strict";

  // 1. तफ़सीली सनद बोर्ड को सीधे अब्दुल गफ़्फ़ार के कार्ड के नीचे लगाना
  function attachAwardsBoard() {
    if (document.getElementById('suhail-awards-board')) return;

    // अब्दुल गफ़्फ़ार (रोल 6989) का कार्ड ढूँढना
    var allCards = document.querySelectorAll('*');
    var targetCard = null;

    for (var i = 0; i < allCards.length; i++) {
      var txt = allCards[i].textContent || allCards[i].innerText || '';
      if (txt.indexOf('6989') !== -1 && (txt.indexOf('abdul gaffar') !== -1 || txt.indexOf('अब्दुल') !== -1)) {
        // सबसे नजदीकी मुख्य कार्ड चुनना
        var p = allCards[i];
        while (p && p.parentElement && p.parentElement.children.length < 3) {
          p = p.parentElement;
        }
        targetCard = p;
        break;
      }
    }

    // अगर कार्ड मिल गया तो उसके ठीक नीचे जोड़ें
    var parentList = targetCard ? targetCard.parentElement : (document.querySelector('.chat-list') || document.querySelector('#chats'));
    if (!parentList) return;

    var board = document.createElement('div');
    board.id = 'suhail-awards-board';
    board.style.cssText = 'width:calc(100% - 20px) !important; margin:15px 10px 100px !important; background:#111b21 !important; border:1px solid rgba(234, 179, 8, 0.45) !important; border-radius:14px !important; padding:15px 12px !important; box-sizing:border-box !important; display:block !important; box-shadow:0 6px 20px rgba(0,0,0,0.6) !important;';
    
    board.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px; margin-bottom:10px;">
        <div style="color:#eab308; font-size:0.88rem; font-weight:800; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-award"></i> तालीमी एज़ाज़ात व सनद बोर्ड
        </div>
        <span style="font-size:0.68rem; color:#8696a0;">उस्ताद की सनद</span>
      </div>
      <div style="font-size:0.72rem; color:#8696a0; margin-bottom:10px; text-align:left;">
        उस्ताद (Suhail Husain) की जानिब से नवाज़े गए मुमताज़ तलबा की मुकम्मल तफ़सील:
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:#182229; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">Kaif raza qadri (रोल: 6975)</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">350 XP</strong></span>
          </div>
          <div style="background:rgba(234,179,8,0.18); border:1px solid #eab308; color:#fef08a; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">⭐ मुमताज़ तालिब-ए-इल्म 🌟</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:#182229; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 12px;">
          <div style="text-align:left;">
            <h4 style="font-size:0.84rem; font-weight:700; color:#e9edef; margin:0 0 3px 0;">Suhail Husain (रोल: 7877)</h4>
            <span style="font-size:0.7rem; color:#8696a0;">कुल इल्मी तरक़्क़ी: ⚡ <strong style="color:#eab308;">480 XP</strong></span>
          </div>
          <div style="background:rgba(59,130,246,0.15); border:1px solid #3b82f6; color:#93c5fd; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; white-space:nowrap;">👑 मोहतमिम व उस्ताद</div>
        </div>
      </div>
    `;

    // सीधे उसी लिस्ट में सबसे नीचे जोड़ना
    parentList.appendChild(board);
  }

  // 2. कैफ़ रज़ा के आगे बैज लगाना
  function updateKaifBadge() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length > 2) continue;
      if (el.closest && (el.closest('#suhail-5btn-dock') || el.closest('#suhail-awards-board') || el.closest('#suhail-notice-modal'))) continue;

      var t = (el.innerText || el.textContent || '').trim();
      if (t.indexOf('6975') !== -1 && t.indexOf('Kaif') !== -1) {
        if (!el.getAttribute('data-badge-applied')) {
          el.setAttribute('data-badge-applied', 'true');
          el.innerHTML = '<span style="color:#eab308; font-size:1rem; margin-right:4px;">⭐</span><span style="background:rgba(234,179,8,0.22); color:#fef08a; border:1px solid #eab308; padding:1px 6px; border-radius:5px; font-size:0.7rem; font-weight:bold; margin-right:5px;">मुमताज़ तालिब-ए-इल्म 🌟</span>' + el.innerHTML.replace(/🥈/g, '').trim();
        }
        break;
      }
    }
  }

  // 3. रन और रिपीट
  function init() {
    attachAwardsBoard();
    updateKaifBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // हर 1 सेकंड में जाँच करेगा ताकि लिस्ट लोड होते ही बोर्ड वहीं सेट हो जाए
  setInterval(function () {
    attachAwardsBoard();
    updateKaifBadge();
  }, 1000);
})();

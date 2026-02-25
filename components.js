/**
 * UI COMPONENTS MODULE
 * یہ فائل ڈیٹا کو لے کر HTML کارڈز بناتی ہے۔
 */

const UIComponents = {
    
    // Generate a single HTML card
    createCard(item) {
        const isAudio = item.type === 'audio';
        const tagClass = isAudio ? 'tag-audio' : 'tag-pdf';
        const tagText = isAudio ? 'Audio' : 'Book';
        const actionBtn = isAudio 
            ? `<button class="btn btn-primary" onclick="SystemController.playAudio('${item.id}')">▶ چلائیں</button>`
            : `<button class="btn btn-primary" onclick="SystemController.openPdf('${item.id}')">📖 پڑھیں</button>`;

        return `
            <article class="card" id="card-${item.id}">
                <span class="tag ${tagClass}">${tagText}</span>
                <h3 class="card-title urdu">${item.title}</h3>
                <p class="urdu" style="font-size: 0.8rem; color: var(--text-secondary);">فارمیٹ: ${item.ext}</p>
                <div class="card-actions">
                    ${actionBtn}
                    <button class="btn" onclick="SystemController.showToast('فائل محفوظ کر لی گئی')">♡</button>
                </div>
            </article>
        `;
    },

    // Render the entire grid
    renderGrid(containerId, dataArray) {
        const container = document.getElementById(containerId);
        if(dataArray.length === 0) {
            container.innerHTML = `<p class="urdu" style="grid-column: 1/-1; text-align:center;">کوئی فائل نہیں ملی۔</p>`;
            return;
        }
        container.innerHTML = dataArray.map(item => this.createCard(item)).join('');
    }
};

/**
 * ResQ Disaster Response - First Aid View Controller
 * Manages medical guides, procedure steps, and precautions
 */

class FirstAidView {
    constructor() {
        this.guidesData = [];
        this.activeCategory = 'all';
        
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.cardsGrid = document.getElementById('firstaid-cards');
        this.searchInput = document.getElementById('firstaid-search');
        this.categoriesContainer = document.getElementById('firstaid-categories');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.filterGuides());
        }

        if (this.categoriesContainer) {
            this.categoriesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('cat-chip')) {
                    this.categoriesContainer.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    this.activeCategory = e.target.dataset.cat || 'all';
                    this.filterGuides();
                }
            });
        }
    }

    async loadGuides() {
        const response = await ApiService.getFirstAidGuides('all');
        this.guidesData = response.guides || [];
        this.renderGuides(this.guidesData);
    }

    filterGuides() {
        const query = (this.searchInput ? this.searchInput.value : '').toLowerCase().trim();

        const filtered = this.guidesData.filter(g => {
            const matchesCat = (this.activeCategory === 'all') || (g.category === this.activeCategory);
            const matchesQuery = !query || 
                g.title.toLowerCase().includes(query) || 
                (g.description && g.description.toLowerCase().includes(query)) ||
                (g.steps && g.steps.toLowerCase().includes(query));
            return matchesCat && matchesQuery;
        });

        this.renderGuides(filtered);
    }

    renderGuides(guides) {
        if (!this.cardsGrid) return;

        this.cardsGrid.innerHTML = '';

        if (guides.length === 0) {
            this.cardsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class="fa-solid fa-notes-medical" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
                    <p>No first aid guides match your search criteria.</p>
                </div>
            `;
            return;
        }

        guides.forEach(guide => {
            const card = document.createElement('div');
            card.className = 'firstaid-card';

            const stepsFormatted = (guide.steps || '')
                .split('\n')
                .filter(step => step.trim().length > 0)
                .map(step => `<div style="margin-bottom:0.4rem;">${this.escapeHTML(step)}</div>`)
                .join('');

            card.innerHTML = `
                <div class="fa-card-header">
                    <h3>${this.escapeHTML(guide.title)}</h3>
                    <span class="fa-cat-badge">${this.escapeHTML(guide.category)}</span>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary);">${this.escapeHTML(guide.description || '')}</p>

                ${guide.precautions ? `
                    <div class="fa-alert-banner">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span><strong>Precaution:</strong> ${this.escapeHTML(guide.precautions)}</span>
                    </div>
                ` : ''}

                <div class="fa-steps-box">
                    <strong style="color:var(--accent-blue); display:block; margin-bottom:0.4rem;"><i class="fa-solid fa-list-check"></i> Procedure Steps:</strong>
                    ${stepsFormatted}
                </div>

                ${guide.materials ? `
                    <div style="font-size:0.78rem; color:var(--text-muted);">
                        <i class="fa-solid fa-toolbox"></i> <strong>Required Supplies:</strong> ${this.escapeHTML(guide.materials)}
                    </div>
                ` : ''}
            `;

            this.cardsGrid.appendChild(card);
        });
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
}

window.FirstAidView = FirstAidView;

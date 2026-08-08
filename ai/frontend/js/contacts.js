/**
 * ResQ Disaster Response - Emergency Contacts Controller
 * Directory manager for emergency response numbers & search
 */

class ContactsView {
    constructor() {
        this.contactsData = [];
        this.activeType = 'all';

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.contactsGrid = document.getElementById('contacts-list');
        this.searchInput = document.getElementById('contacts-search');
        this.categoriesContainer = document.getElementById('contacts-categories');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterContacts());
        }

        if (this.categoriesContainer) {
            this.categoriesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('cat-chip')) {
                    this.categoriesContainer.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    this.activeType = e.target.dataset.type || 'all';
                    this.filterContacts();
                }
            });
        }
    }

    async loadContacts() {
        const response = await ApiService.getEmergencyContacts();
        this.contactsData = response.contacts || [];
        this.renderContacts(this.contactsData);
    }

    filterContacts() {
        const query = (this.searchInput ? this.searchInput.value : '').toLowerCase().trim();

        const filtered = this.contactsData.filter(c => {
            const matchesType = (this.activeType === 'all') || (c.type === this.activeType);
            const matchesQuery = !query ||
                c.name.toLowerCase().includes(query) ||
                (c.description && c.description.toLowerCase().includes(query)) ||
                (c.phone && c.phone.toLowerCase().includes(query));
            return matchesType && matchesQuery;
        });

        this.renderContacts(filtered);
    }

    renderContacts(contacts) {
        if (!this.contactsGrid) return;

        this.contactsGrid.innerHTML = '';

        if (contacts.length === 0) {
            this.contactsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class="fa-solid fa-address-book" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
                    <p>No emergency contacts match your search.</p>
                </div>
            `;
            return;
        }

        contacts.forEach(contact => {
            const card = document.createElement('div');
            card.className = 'contact-card';

            const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');

            card.innerHTML = `
                <div class="contact-info">
                    <h3>${this.escapeHTML(contact.name)}</h3>
                    <p>${this.escapeHTML(contact.description || contact.type)}</p>
                    <div class="contact-phone"><i class="fa-solid fa-phone"></i> ${this.escapeHTML(contact.phone)}</div>
                </div>
                <a href="tel:${cleanPhone}" class="contact-action-btn" title="Call Emergency Line">
                    <i class="fa-solid fa-phone"></i>
                </a>
            `;

            this.contactsGrid.appendChild(card);
        });
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
}

window.ContactsView = ContactsView;

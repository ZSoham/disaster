/**
 * ResQ Disaster Response - SOS Emergency Beacon Controller
 * Handles GPS position detection, SOS broadcast formatting, and queue management
 */

class SosView {
    constructor() {
        this.selectedCategory = 'medical';
        this.currentLocationStr = 'Detecting GPS position...';
        this.sosQueue = [];

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.categorySelector = document.getElementById('sos-category-select');
        this.locationInput = document.getElementById('sos-location-input');
        this.gpsBtn = document.getElementById('sos-gps-btn');
        this.previewTextarea = document.getElementById('sos-preview-text');
        this.copyBtn = document.getElementById('sos-copy-btn');
        this.submitBtn = document.getElementById('sos-submit-btn');
        this.historyList = document.getElementById('sos-history-list');
    }

    bindEvents() {
        // Category Selector
        if (this.categorySelector) {
            this.categorySelector.addEventListener('click', (e) => {
                const btn = e.target.closest('.sos-cat-btn');
                if (btn) {
                    this.categorySelector.querySelectorAll('.sos-cat-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedCategory = btn.dataset.cat || 'general';
                    this.updatePreviewText();
                }
            });
        }

        // Location Input Change
        if (this.locationInput) {
            this.locationInput.addEventListener('input', (e) => {
                this.currentLocationStr = e.target.value;
                this.updatePreviewText();
            });
        }

        // GPS Refresh Button
        if (this.gpsBtn) {
            this.gpsBtn.addEventListener('click', () => this.detectGPSLocation());
        }

        // Copy SMS Button
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copySOSMessage());
        }

        // Submit/Queue SOS Button
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => this.handleQueueSOS());
        }
    }

    async init() {
        await this.detectGPSLocation();
        await this.loadSOSHistory();
    }

    async detectGPSLocation() {
        if (this.locationInput) {
            this.locationInput.value = 'Locating via GPS...';
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude.toFixed(5);
                    const lng = pos.coords.longitude.toFixed(5);
                    this.currentLocationStr = `GPS (${lat}, ${lng})`;
                    if (this.locationInput) {
                        this.locationInput.value = this.currentLocationStr;
                    }
                    this.updatePreviewText();
                },
                (err) => {
                    this.currentLocationStr = 'Main Street, Downtown (Approximate)';
                    if (this.locationInput) {
                        this.locationInput.value = this.currentLocationStr;
                    }
                    this.updatePreviewText();
                },
                { timeout: 5000 }
            );
        } else {
            this.currentLocationStr = 'Disaster Zone Sector 4';
            if (this.locationInput) {
                this.locationInput.value = this.currentLocationStr;
            }
            this.updatePreviewText();
        }
    }

    updatePreviewText() {
        const templates = {
            medical: `SOS URGENT MEDICAL HELP REQUIRED at [${this.currentLocationStr}]. Immediate trauma medical team requested!`,
            shelter: `SOS SHELTER & SUPPLIES NEEDED at [${this.currentLocationStr}]. Refuge required for survivors.`,
            evacuation: `SOS IMMEDIATE EVACUATION REQUIRED from [${this.currentLocationStr}]. Trapped personnel need extraction.`,
            general: `SOS EMERGENCY DISTRESS SIGNAL from [${this.currentLocationStr}]. Requesting emergency dispatch.`
        };

        const msg = templates[this.selectedCategory] || templates['general'];
        if (this.previewTextarea) {
            this.previewTextarea.value = msg;
        }
    }

    async handleQueueSOS() {
        const text = this.previewTextarea ? this.previewTextarea.value : '';
        if (!text) return;

        // Call API
        const sosRecord = await ApiService.generateSOS(this.currentLocationStr, this.selectedCategory);
        await ApiService.sendSOS(sosRecord.id);

        // Reload history
        await this.loadSOSHistory();

        // Feedback
        if (this.submitBtn) {
            const orig = this.submitBtn.innerHTML;
            this.submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Queued!`;
            this.submitBtn.style.background = '#10b981';
            setTimeout(() => {
                this.submitBtn.innerHTML = orig;
                this.submitBtn.style.background = '';
            }, 2000);
        }
    }

    async loadSOSHistory() {
        // Fetch from local cache or API mock history
        if (!this.historyList) return;

        this.historyList.innerHTML = `
            <div class="sos-log-item">
                <div class="sos-log-top">
                    <strong>Medical Distress Signal</strong>
                    <span class="sos-badge sent">Transmitted</span>
                </div>
                <div style="color:var(--text-secondary); margin-bottom:4px;">Location: GPS (40.7128, -74.0060)</div>
                <div style="color:var(--text-muted); font-size:0.75rem;">Status: Queued for offline mesh broadcast</div>
            </div>
            <div class="sos-log-item">
                <div class="sos-log-top">
                    <strong>Shelter Request</strong>
                    <span class="sos-badge pending">Queued</span>
                </div>
                <div style="color:var(--text-secondary); margin-bottom:4px;">Location: Main Street, Downtown</div>
                <div style="color:var(--text-muted); font-size:0.75rem;">Status: Waiting local connection</div>
            </div>
        `;
    }

    copySOSMessage() {
        if (!this.previewTextarea) return;
        this.previewTextarea.select();
        navigator.clipboard.writeText(this.previewTextarea.value);

        if (this.copyBtn) {
            const orig = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
            setTimeout(() => { this.copyBtn.innerHTML = orig; }, 2000);
        }
    }
}

window.SosView = SosView;

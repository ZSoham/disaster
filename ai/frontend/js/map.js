/**
 * ResQ Disaster Response - Map & Shelter View Controller
 * Integrates Leaflet.js interactive maps & shelter management
 */

class MapView {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.shelterMarkers = [];
        this.sheltersData = [];
        this.userLocation = { lat: 28.6139, lng: 77.2090 }; // Default New Delhi coordinates
        
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.mapContainer = document.getElementById('leaflet-map');
        this.shelterListEl = document.getElementById('shelter-list');
        this.shelterCountEl = document.getElementById('shelter-count');
        this.searchInput = document.getElementById('shelter-search');
        this.locateBtn = document.getElementById('locate-btn');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.filterShelters(e.target.value));
        }

        if (this.locateBtn) {
            this.locateBtn.addEventListener('click', () => this.detectUserLocation());
        }
    }

    async initMap() {
        if (this.map || !this.mapContainer || !window.L) return;

        // Initialize Leaflet Map
        this.map = L.map('leaflet-map').setView([this.userLocation.lat, this.userLocation.lng], 13);

        // OpenStreetMap tiles (supports offline tile caching when configured)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // User Location Pin
        this.setUserLocationMarker(this.userLocation.lat, this.userLocation.lng, 'You are here');

        // Fetch Shelters Data from API
        await this.loadShelters();

        // Attempt live GPS detection
        this.detectUserLocation();
    }

    async loadShelters() {
        const response = await ApiService.getShelters();
        this.sheltersData = response.shelters || [];

        this.renderShelterMarkers();
        this.renderShelterList(this.sheltersData);
    }

    renderShelterMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.shelterMarkers.forEach(m => m.remove());
        this.shelterMarkers = [];

        this.sheltersData.forEach(shelter => {
            if (shelter.latitude && shelter.longitude) {
                const marker = L.marker([shelter.latitude, shelter.longitude], {
                    title: shelter.name
                }).addTo(this.map);

                const popupContent = `
                    <div style="font-family:sans-serif; padding:4px;">
                        <h4 style="margin:0 0 4px 0; color:#1e293b; font-size:14px;">${shelter.name}</h4>
                        <p style="margin:0 0 6px 0; font-size:12px; color:#64748b;">${shelter.address || ''}</p>
                        <div style="font-size:12px; font-weight:bold; color:#10b981;">Capacity: ${shelter.capacity || 'N/A'} beds</div>
                        <div style="font-size:11px; margin-top:4px; color:#3b82f6;"><i class="fa-solid fa-phone"></i> ${shelter.phone || 'N/A'}</div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                this.shelterMarkers.push(marker);
            }
        });
    }

    renderShelterList(shelters) {
        if (!this.shelterListEl) return;

        this.shelterListEl.innerHTML = '';
        if (this.shelterCountEl) {
            this.shelterCountEl.innerText = `${shelters.length} Shelters`;
        }

        if (shelters.length === 0) {
            this.shelterListEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:2rem;">No shelters found.</div>`;
            return;
        }

        shelters.forEach(shelter => {
            const card = document.createElement('div');
            card.className = 'shelter-item-card';

            const suppliesList = (shelter.supplies || '').split(',').map(s => `<span class="tag-badge">${s.trim()}</span>`).join('');
            const capacityPercent = Math.min(Math.round(((shelter.capacity || 100) / 500) * 100), 100);
            let capClass = 'low';
            if (capacityPercent > 75) capClass = 'high';
            else if (capacityPercent > 40) capClass = 'medium';

            card.innerHTML = `
                <div class="shelter-title">${shelter.name}</div>
                <div class="shelter-address"><i class="fa-solid fa-location-dot"></i> ${shelter.address || 'Address not listed'}</div>
                <div class="capacity-bar-container">
                    <div class="capacity-label">
                        <span>Capacity: ${shelter.capacity} beds</span>
                        <span><i class="fa-solid fa-phone"></i> ${shelter.phone || 'N/A'}</span>
                    </div>
                    <div class="capacity-track">
                        <div class="capacity-fill ${capClass}" style="width:${capacityPercent}%;"></div>
                    </div>
                </div>
                <div class="shelter-tags">${suppliesList}</div>
            `;

            card.addEventListener('click', () => {
                if (this.map && shelter.latitude && shelter.longitude) {
                    this.map.flyTo([shelter.latitude, shelter.longitude], 15);
                    const match = this.shelterMarkers.find(m => m.getLatLng().lat === shelter.latitude);
                    if (match) match.openPopup();
                }
            });

            this.shelterListEl.appendChild(card);
        });
    }

    filterShelters(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            this.renderShelterList(this.sheltersData);
            return;
        }

        const filtered = this.sheltersData.filter(s => 
            s.name.toLowerCase().includes(q) || 
            (s.address && s.address.toLowerCase().includes(q)) || 
            (s.supplies && s.supplies.toLowerCase().includes(q))
        );

        this.renderShelterList(filtered);
    }

    detectUserLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.userLocation = { lat, lng };

                    this.setUserLocationMarker(lat, lng, 'Your Detected Location');
                    if (this.map) {
                        this.map.flyTo([lat, lng], 14);
                    }
                },
                (err) => {
                    console.warn('Geolocation access denied or timed out:', err.message);
                },
                { timeout: 5000 }
            );
        }
    }

    setUserLocationMarker(lat, lng, title) {
        if (!this.map) return;

        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            const userIcon = L.divIcon({
                className: 'user-location-pin',
                html: `<div style="background:#ef4444; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px #ef4444;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
            this.userMarker.bindPopup(`<b>${title}</b>`);
        }
    }
}

window.MapView = MapView;

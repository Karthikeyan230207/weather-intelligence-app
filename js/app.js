class WeatherApp {
    constructor() {
        this.currentPayload = null;
        this.recentSearches = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES)) || ['London', 'New York', 'Tokyo'];
    }

    async init() {

        // Initialize Three.js 3D Weather Scene
        const threedEngine = new Weather3DEngine('weather3dCanvasContainer');
        uiRenderer.set3DEngine(threedEngine);

        // Bind DOM Event Listeners
        this.bindEvents();

        // Initial Location Detection (Geolocation API -> Fallback to Default City)
        await this.detectLocationAndFetch();
    }

    /**
     * Geolocation API Detection
     */
    async detectLocationAndFetch() {
        this.showLoading(true);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    try {
                        const payload = await apiService.getWeatherPayload({ lat, lon }, true);
                        this.loadWeatherData(payload);
                    } catch (err) {
                        console.warn('Geolocation weather fetch failed, loading default city:', err.message);
                        this.searchCity(CONFIG.DEFAULT_CITY.name);
                    }
                },
                (error) => {
                    console.info('Geolocation permission denied or unavailable:', error.message);
                    this.showToast('Location permission denied. Loaded default city.');
                    this.searchCity(CONFIG.DEFAULT_CITY.name);
                },
                { timeout: 7000 }
            );
        } else {
            this.searchCity(CONFIG.DEFAULT_CITY.name);
        }
    }

    /**
     * Main City Search handler
     */
    async searchCity(query) {
        if (!query || query.trim() === '') return;
        this.showLoading(true);

        try {
            const payload = await apiService.getWeatherPayload(query.trim());
            this.loadWeatherData(payload);
        } catch (err) {
            this.showToast(`Error: ${err.message || 'Could not fetch weather data'}`);
            this.showLoading(false);
        }
    }

    loadWeatherData(payload) {
        this.currentPayload = payload;
        uiRenderer.renderPayload(payload);
        this.showLoading(false);

        if (payload.notice) {
            this.showToast(payload.notice, 4000);
        }
    }

    /**
     * DOM Event Listeners Setup
     */
    bindEvents() {
        // City Search Form
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');

        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    this.searchCity(query);
                }
            })

            document.addEventListener('click', (e) => {
                
            });
        }

        // Use My Location Button
        const myLocationBtn = document.getElementById('myLocationBtn');
        if (myLocationBtn) {
            myLocationBtn.addEventListener('click', () => this.detectLocationAndFetch());
        }

        // Unit Toggle Switch (°C / °F)
        const unitToggleBtn = document.getElementById('unitToggleBtn');
        if (unitToggleBtn) {
            unitToggleBtn.textContent = apiService.unit === 'metric' ? '°C' : '°F';
            unitToggleBtn.addEventListener('click', () => {
                const nextUnit = apiService.unit === 'metric' ? 'imperial' : 'metric';
                apiService.setUnit(nextUnit);
                unitToggleBtn.textContent = nextUnit === 'metric' ? '°C' : '°F';
                if (this.currentPayload) {
                    this.searchCity(this.currentPayload.cityName);
                }
            });
        }

        // Comparison Input Form
        const compareForm = document.getElementById('compareForm');
        const compareInput = document.getElementById('compareInput');
        if (compareForm && compareInput) {
            compareForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = compareInput.value.trim();
                if (q) {
                    uiRenderer.addCityToComparison(q);
                    compareInput.value = '';
                }
            });
        }

        // Settings Modal Listeners
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                apiKeyInput.value = apiService.apiKey || '';
                settingsModal.classList.add('active');
            });

            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });

            saveApiKeyBtn.addEventListener('click', () => {
                const key = apiKeyInput.value.trim();
                apiService.setApiKey(key);
                settingsModal.classList.remove('active');
                this.showToast(key ? 'API Key saved successfully!' : 'Using Dynamic Fallback Provider');
                if (this.currentPayload) {
                    this.searchCity(this.currentPayload.cityName);
                }
            });
        }
    }

    showLoading(isLoading) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'flex' : 'none';
        }
    }

    showToast(message, duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new WeatherApp();
    app.init();
});

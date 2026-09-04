class UIRenderer {
    constructor() {
        this.tempChart = null;
        this.leafletMap = null;
        this.mapMarker = null;
        this.threedEngine = null;
        this.comparisonCities = [];
    }

    set3DEngine(engine) {
        this.threedEngine = engine;
    }

    renderPayload(payload) {
        this.updateAtmosphereTheme(payload.current.conditionType, payload.current.isNight);
        this.renderHeroSection(payload);
        this.renderWeatherIntelligence(payload);
        this.renderHourlyTimeline(payload);
        this.renderAnalyticsChart(payload);
        this.renderEnvironmentCards(payload);
        this.renderDailyForecast(payload);
        this.renderAlerts(payload);
        this.updateLeafletMap(payload.coords, payload.cityName, payload.country, payload.current);
        
        if (this.threedEngine) {
            this.threedEngine.updateCondition(payload.current.conditionType);
        }
    }

    /**
     * Dynamic UI atmosphere theme update (background gradient & particle glow)
     */
    updateAtmosphereTheme(conditionType, isNight) {
        const body = document.body;
        const themeClasses = ['theme-clear-day', 'theme-clear-night', 'theme-clouds', 'theme-rain', 'theme-thunderstorm', 'theme-snow', 'theme-mist'];
        themeClasses.forEach(cls => body.classList.remove(cls));

        let activeTheme = `theme-${conditionType}`;
        if (isNight && (conditionType === 'clear-day' || conditionType === 'clouds')) {
            activeTheme = conditionType === 'clear-day' ? 'theme-clear-night' : 'theme-clouds';
        }

        body.classList.add(activeTheme);
    }

    /**
     * 1. Hero Section
     */
    renderHeroSection(payload) {
        const { cityName, country, current } = payload;

        document.getElementById('heroCityName').textContent = `${cityName}${country ? ', ' + country : ''}`;
        document.getElementById('heroDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        document.getElementById('heroTemp').textContent = `${current.temp}${apiService.getUnitSymbol()}`;
        document.getElementById('heroCondition').textContent = current.description;
        document.getElementById('heroConditionIcon').innerHTML = this.getWeatherVectorIcon(current.conditionType);
        document.getElementById('heroFeelsLike').textContent = `Feels like ${current.feelsLike}${apiService.getUnitSymbol()}`;
    }

    /**
     * 2. Weather Intelligence Section
     */
    renderWeatherIntelligence(payload) {
        // Outfit Recommendation
        const outfit = WeatherIntelligence.getOutfitRecommendation(payload);
        document.getElementById('outfitIcon').innerHTML = outfit.iconHtml;
        document.getElementById('outfitText').textContent = outfit.clothing;
        document.getElementById('umbrellaText').innerHTML = outfit.umbrella;

        // Outdoor Score (Circular Gauge + Activities)
        const outdoor = WeatherIntelligence.calculateOutdoorScore(payload);
        const scoreEl = document.getElementById('outdoorScoreValue');
        scoreEl.textContent = outdoor.score;

        // Animate SVG Gauge stroke-dashoffset
        const circle = document.getElementById('outdoorScoreCircle');
        if (circle) {
            const radius = 52;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (outdoor.score / 100) * circumference;
            circle.style.strokeDasharray = `${circumference}`;
            circle.style.strokeDashoffset = `${offset}`;
        }

        document.getElementById('outdoorSummary').textContent = outdoor.summary;

        // Render Outdoor Activity Badges
        const activitiesEl = document.getElementById('activitiesGrid');
        activitiesEl.innerHTML = Object.values(outdoor.activities).map(act => `
            <div class="activity-badge">
                <div class="activity-header">
                    <span class="activity-icon">${act.iconHtml}</span>
                    <span class="activity-name">${act.name}</span>
                    <span class="activity-score">${act.score}/100</span>
                </div>
                <div class="activity-desc">${act.recommendation}</div>
            </div>
        `).join('');

    }

    /**
     * 3. Hourly Forecast 24h Timeline
     */
    renderHourlyTimeline(payload) {
        const timelineEl = document.getElementById('hourlyTimeline');
        timelineEl.innerHTML = payload.hourly.map(item => `
            <div class="timeline-card">
                <div class="timeline-time">${item.time}</div>
                <div class="timeline-icon">${this.getWeatherVectorIcon(item.condition)}</div>
                <div class="timeline-temp">${item.temp}${apiService.getUnitSymbol()}</div>
                <div class="timeline-pop"><i class="fa-solid fa-droplet text-blue"></i> ${item.pop}%</div>
                <div class="timeline-wind"><i class="fa-solid fa-wind text-muted"></i> ${item.windSpeed} ${apiService.getSpeedSymbol()}</div>
            </div>
        `).join('');
    }

    /**
     * 4. Chart.js Temperature & Rain Analytics Graph
     */
    renderAnalyticsChart(payload) {
        const ctx = document.getElementById('analyticsChart')?.getContext('2d');
        if (!ctx) return;

        if (this.tempChart) {
            this.tempChart.destroy();
        }

        const labels = payload.hourly.map(h => h.time);
        const temps = payload.hourly.map(h => h.temp);
        const pops = payload.hourly.map(h => h.pop);

        const tempGradient = ctx.createLinearGradient(0, 0, 0, 300);
        tempGradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        tempGradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

        const popGradient = ctx.createLinearGradient(0, 0, 0, 300);
        popGradient.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        popGradient.addColorStop(1, 'rgba(251, 191, 36, 0.0)');

        this.tempChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `Temperature (${apiService.getUnitSymbol()})`,
                        data: temps,
                        borderColor: '#38bdf8',
                        backgroundColor: tempGradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'yTemp',
                        pointBackgroundColor: '#38bdf8',
                        pointRadius: 4,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Rain Probability (%)',
                        data: pops,
                        borderColor: '#fbbf24',
                        backgroundColor: popGradient,
                        borderWidth: 2,
                        borderDash: [4, 4],
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'yPop',
                        pointBackgroundColor: '#fbbf24',
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: { color: 'rgba(255, 255, 255, 0.9)', font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
                        bodyFont: { family: 'Inter', size: 13 },
                        padding: 12,
                        cornerRadius: 10,
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Inter' } }
                    },
                    yTemp: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        ticks: { color: '#38bdf8', font: { family: 'Inter' } }
                    },
                    yPop: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 100,
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#fbbf24', font: { family: 'Inter' }, callback: val => `${val}%` }
                    }
                }
            }
        });
    }

    /**
     * 5. Environment Metrics (UV, Humidity, Comfort, Wind, Visibility)
     */
    renderEnvironmentCards(payload) {
        const { current } = payload;
        // Humidity & Wind & Visibility
        document.getElementById('humidityValue').textContent = `${current.humidity}%`;
        document.getElementById('windValue').textContent = `${current.windSpeed} ${apiService.getSpeedSymbol()}`;
    }

    /**
     * 6. 7-Day Forecast Section
     */
    renderDailyForecast(payload) {
        const dailyContainer = document.getElementById('dailyForecastContainer');
        dailyContainer.innerHTML = payload.daily.map((day, idx) => `
            <div class="daily-card" onclick="uiRenderer.toggleDailyDetail(${idx})">
                <div class="daily-header">
                    <span class="daily-name">${day.day} <small>${day.date}</small></span>
                    <span class="daily-icon">${this.getWeatherVectorIcon(day.condition)}</span>
                    <span class="daily-temp-range">
                        <strong>${day.maxTemp}°</strong> / <small>${day.minTemp}°</small>
                    </span>
                </div>
                <div class="daily-detail" id="dailyDetail-${idx}">
                    <div class="daily-stat"><span>Rain Prob:</span> <strong>${day.pop}%</strong></div>
                    <div class="daily-stat"><span>Wind Speed:</span> <strong>${day.windSpeed} ${apiService.getSpeedSymbol()}</strong></div>
                    <div class="daily-stat"><span>Condition:</span> <strong>${day.condition}</strong></div>
                </div>
            </div>
        `).join('');
    }

    toggleDailyDetail(idx) {
        const detailEl = document.getElementById(`dailyDetail-${idx}`);
        if (detailEl) {
            detailEl.classList.toggle('expanded');
        }
    }

    /**
     * 7. Alert Banners
     */
    renderAlerts(payload) {
        const alertsContainer = document.getElementById('alertsContainer');
        const alerts = WeatherIntelligence.detectWeatherAlerts(payload);

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }

        alertsContainer.innerHTML = alerts.map(alt => `
            <div class="alert-banner alert-${alt.type}">
                <div class="alert-title">${alt.title}</div>
                <div class="alert-msg">${alt.message}</div>
            </div>
        `).join('');
    }

    /**
     * 8. High-Accuracy Leaflet Interactive Weather Map
     */
    updateLeafletMap(coords, cityName, country, current) {
        const mapContainer = document.getElementById('weatherMap');
        if (!mapContainer) return;

        const targetLat = coords.lat;
        const targetLon = coords.lon;

        const mapCoordsBadge = document.getElementById('mapCoordsBadge');
        if (mapCoordsBadge) {
            mapCoordsBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> Lat: ${targetLat.toFixed(4)}°, Lon: ${targetLon.toFixed(4)}°`;
        }

        const customPinIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
                <div class="pin-pulse-ring"></div>
                <div class="pin-core-badge">
                    <span>${current.temp}${apiService.getUnitSymbol()}</span>
                </div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
        });

        if (!this.leafletMap) {
            this.leafletMap = L.map('weatherMap', {
                zoomControl: true,
                attributionControl: false
            }).setView([targetLat, targetLon], 11);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }).addTo(this.leafletMap);

            this.leafletMap.on('click', async (e) => {
                const { lat, lng } = e.latlng;
                const newPayload = await apiService.getWeatherPayload({ lat, lon: lng }, true);
                app.loadWeatherData(newPayload);
            });
        } else {
            this.leafletMap.flyTo([targetLat, targetLon], 11, {
                duration: 1.2,
                easeLinearity: 0.25
            });
        }

        if (this.mapMarker) {
            this.leafletMap.removeLayer(this.mapMarker);
        }

        const popupContent = `
            <div class="map-popup-card">
                <div class="map-popup-title">${cityName}${country ? ', ' + country : ''}</div>
                <div class="map-popup-temp">${current.temp}${apiService.getUnitSymbol()} — ${current.description}</div>
                <div class="map-popup-meta">
                    <span>💧 Humidity: ${current.humidity}%</span> • 
                    <span>🌬️ Wind: ${current.windSpeed} ${apiService.getSpeedSymbol()}</span>
                </div>
                <div class="map-popup-coords">📍 Precise Coordinates: ${targetLat.toFixed(4)}°, ${targetLon.toFixed(4)}°</div>
            </div>
        `;

        this.mapMarker = L.marker([targetLat, targetLon], { icon: customPinIcon })
            .addTo(this.leafletMap)
            .bindPopup(popupContent, { offset: [0, -10] })
            .openPopup();
    }

    /**
     * 9. City Comparison Tool Logic
     */
    async addCityToComparison(cityName) {
        if (this.comparisonCities.length >= 3) {
            alert('You can compare a maximum of 3 cities simultaneously.');
            return;
        }

        const payload = await apiService.getWeatherPayload(cityName);
        const outdoor = WeatherIntelligence.calculateOutdoorScore(payload);

        this.comparisonCities.push({
            payload,
            outdoorScore: outdoor.score
        });

        this.renderCityComparisonUI();
    }

    removeComparisonCity(index) {
        this.comparisonCities.splice(index, 1);
        this.renderCityComparisonUI();
    }

    renderCityComparisonUI() {
        const container = document.getElementById('comparisonGrid');
        if (!container) return;

        if (this.comparisonCities.length === 0) {
            container.innerHTML = '<div class="comparison-empty">Add 2 or 3 cities using the comparison search to compare weather side-by-side.</div>';
            return;
        }

        const maxTemp = Math.max(...this.comparisonCities.map(c => c.payload.current.temp));
        const maxHumidity = Math.max(...this.comparisonCities.map(c => c.payload.current.humidity));
        const maxOutdoor = Math.max(...this.comparisonCities.map(c => c.outdoorScore));

        container.innerHTML = this.comparisonCities.map((item, idx) => {
            const c = item.payload.current;
            return `
                <div class="comparison-card">
                    <button class="remove-compare-btn" onclick="uiRenderer.removeComparisonCity(${idx})">✕</button>
                    <div class="compare-city-title">${item.payload.cityName}</div>
                    <div class="compare-temp ${c.temp === maxTemp ? 'highlight-stat' : ''}">
                        ${c.temp}${apiService.getUnitSymbol()}
                        ${c.temp === maxTemp ? '<span class="badge-tag"><i class="fa-solid fa-fire"></i> Highest Temp</span>' : ''}
                    </div>
                    <div class="compare-metric ${c.humidity === maxHumidity ? 'highlight-stat' : ''}">
                        <i class="fa-solid fa-droplet text-blue"></i> Humidity: <strong>${c.humidity}%</strong>
                        ${c.humidity === maxHumidity ? '<span class="badge-tag"><i class="fa-solid fa-droplet"></i> Most Humid</span>' : ''}
                    </div>
                    <div class="compare-metric">
                        <i class="fa-solid fa-wind text-emerald"></i> Wind: <strong>${c.windSpeed} ${apiService.getSpeedSymbol()}</strong>
                    </div>
                    <div class="compare-metric ${item.outdoorScore === maxOutdoor ? 'highlight-stat' : ''}">
                        <i class="fa-solid fa-tree text-emerald"></i> Outdoor Score: <strong>${item.outdoorScore}/100</strong>
                        ${item.outdoorScore === maxOutdoor ? '<span class="badge-tag"><i class="fa-solid fa-tree"></i> Best Outdoor</span>' : ''}
                    </div>
                    <div class="compare-desc">${c.description}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Vector icon mapping helper for realistic weather condition icons
     */
    getWeatherVectorIcon(condition) {
        switch (condition) {
            case 'clear-day':
                return '<i class="fa-solid fa-sun text-gold icon-v-anim"></i>';
            case 'clear-night':
                return '<i class="fa-solid fa-moon text-purple icon-v-anim"></i>';
            case 'clouds':
                return '<i class="fa-solid fa-cloud text-blue icon-v-anim"></i>';
            case 'clouds-night':
                return '<i class="fa-solid fa-cloud-moon text-purple icon-v-anim"></i>';
            case 'rain':
                return '<i class="fa-solid fa-cloud-showers-heavy text-blue icon-v-anim"></i>';
            case 'thunderstorm':
                return '<i class="fa-solid fa-cloud-bolt text-purple icon-v-anim"></i>';
            case 'snow':
                return '<i class="fa-solid fa-snowflake text-blue icon-v-anim"></i>';
            case 'mist':
                return '<i class="fa-solid fa-smog text-muted icon-v-anim"></i>';
            default:
                return '<i class="fa-solid fa-cloud-sun text-gold icon-v-anim"></i>';
        }
    }
}

const uiRenderer = new UIRenderer();

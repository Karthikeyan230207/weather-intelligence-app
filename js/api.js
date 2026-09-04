
class WeatherAPIService {
    constructor() {
        this.apiKey =  CONFIG.OPENWEATHER_API_KEY;
        this.unit = localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || CONFIG.DEFAULT_UNIT;
        this.cache = new Map(); // Simple in-memory cache to reduce network calls
    }

    setUnit(unit) {
        this.unit = unit;
        localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);
        this.cache.clear();
    }

    getUnitSymbol() {
        return this.unit === 'metric' ? '°C' : '°F';
    }

    getSpeedSymbol() {
        return this.unit === 'metric' ? 'km/h' : 'mph';
    }

    /**
     * Main entry point to fetch complete weather payload for a city query or lat/lon
     */
async getWeatherPayload(query, isCoords = false) {
    const cacheKey =
        typeof query === 'string'
            ? query.toLowerCase()
            : `${query.lat.toFixed(2)},${query.lon.toFixed(2)}`;

    if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);

        if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
            return cached.data;
        }
    }

    let payload = null;

    if (this.apiKey) {
        try {
            payload = await this.fetchFromOpenWeather(query, isCoords);

        } catch (err) {
            console.error('OpenWeather error:', err);
            alert(`City not found ! Please Enter a valid city name. 🔴`);
            throw err;
        }
    } else {
        // No API key → use mock provider
        payload = this.generateDynamicMockPayload(query, isCoords);
        payload.isMock = true;
        payload.notice =
            'Using Dynamic Weather Provider (API Key unconfigured)';
    }

    this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: payload
    });

    return payload;
}

    /**
     * Fetch live data using OpenWeather API 2.5/3.0
     */
    async fetchFromOpenWeather(query, isCoords) {
        const units = this.unit;
        let weatherUrl = '';
        let forecastUrl = '';

        if (isCoords) {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&units=${units}&appid=${this.apiKey}`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${query.lat}&lon=${query.lon}&units=${units}&appid=${this.apiKey}`;
        } else {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=${units}&appid=${this.apiKey}`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&units=${units}&appid=${this.apiKey}`;
        }

        const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);

        if (!wRes.ok) {
            const errJson = await wRes.json().catch(() => ({}));
            throw new Error(errJson.message || `City not found (${wRes.status})`);
        }

        const current = await wRes.json();
        const forecast = await fRes.json();

        return this.formatOpenWeatherData(current, forecast);
    }

    /**
     * Transform raw OpenWeather response into our standardized schema
     */
    formatOpenWeatherData(current, forecast) {
        const temp = Math.round(current.main.temp);
        const feelsLike = Math.round(current.main.feels_like);
        const tempMin = Math.round(current.main.temp_min);
        const tempMax = Math.round(current.main.temp_max);
        const humidity = current.main.humidity;
        const windSpeed = Math.round(this.unit === 'metric' ? current.wind.speed * 3.6 : current.wind.speed);
        const visibility = Math.round((current.visibility || 10000) / 1000); // in km
        const pressure = current.main.pressure;

        const mainCondition = current.weather[0].main; // Rain, Clear, Clouds, Snow, Thunderstorm, Mist, Fog, Drizzle
        const description = current.weather[0].description;
        const iconCode = current.weather[0].icon;

        const nowSec = Math.floor(Date.now() / 1000);
        const isNight = current.sys.sunset ? (nowSec > current.sys.sunset || nowSec < current.sys.sunrise) : (new Date().getHours() > 19 || new Date().getHours() < 6);

        // Normalize weather condition type for our 3D and dynamic atmosphere engine
        const conditionType = this.normalizeCondition(mainCondition, isNight);

        // Generate hourly forecast (next 24 hours)
        const hourly = (forecast.list || []).slice(0, 8).map((item, idx) => {
            const itemDate = new Date(item.dt * 1000);
            const hours = itemDate.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHour = `${hours % 12 || 12} ${ampm}`;

            return {
                time: formattedHour,
                hour24: hours,
                temp: Math.round(item.main.temp),
                pop: Math.round((item.pop || 0) * 100),
                humidity: item.main.humidity,
                windSpeed: Math.round(this.unit === 'metric' ? item.wind.speed * 3.6 : item.wind.speed),
                condition: this.normalizeCondition(item.weather[0].main, hours > 19 || hours < 6),
                description: item.weather[0].description,
                icon: item.weather[0].icon
            };
        });

        // Generate 7-day forecast grouped by day
        const dailyMap = new Map();
        (forecast.list || []).forEach(item => {
            const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, {
                    dayName: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                    fullDate: dateStr,
                    temps: [],
                    pops: [],
                    winds: [],
                    conditions: [],
                    icon: item.weather[0].icon
                });
            }
            const entry = dailyMap.get(dateStr);
            entry.temps.push(item.main.temp);
            entry.pops.push((item.pop || 0) * 100);
            entry.winds.push(this.unit === 'metric' ? item.wind.speed * 3.6 : item.wind.speed);
            entry.conditions.push(item.weather[0].main);
        });

        const daily = Array.from(dailyMap.values()).slice(0, 7).map(d => ({
            day: d.dayName,
            date: d.fullDate,
            minTemp: Math.round(Math.min(...d.temps)),
            maxTemp: Math.round(Math.max(...d.temps)),
            pop: Math.round(Math.max(...d.pops)),
            windSpeed: Math.round(d.winds.reduce((a, b) => a + b, 0) / d.winds.length),
            condition: this.normalizeCondition(d.conditions[0], false),
            icon: d.icon
        }));

        // UV Index fallback estimation if unavailable
        const uvIndex = Math.min(11, Math.max(1, Math.round((tempMax > 28 ? 8 : tempMax > 20 ? 5 : 2) + Math.random() * 2)));

        return {
            isMock: false,
            cityName: current.name,
            country: current.sys.country || '',
            coords: { lat: current.coord.lat, lon: current.coord.lon },
            timezoneOffset: current.timezone,
            current: {
                temp,
                feelsLike,
                tempMin,
                tempMax,
                humidity,
                windSpeed,
                visibility,
                pressure,
                uvIndex,
                conditionType,
                mainCondition,
                description: description.charAt(0).toUpperCase() + description.slice(1),
                icon: iconCode,
                isNight,
                sunrise: current.sys.sunrise ? new Date(current.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:15 AM',
                sunset: current.sys.sunset ? new Date(current.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:45 PM',
                sunriseTimestamp: current.sys.sunrise || (Date.now() / 1000 - 3600 * 6),
                sunsetTimestamp: current.sys.sunset || (Date.now() / 1000 + 3600 * 6)
            },
            hourly,
            daily
        };
    }

    /**
     * Map OpenWeather strings to our standard condition keys
     */
    normalizeCondition(mainStr, isNight) {
        const str = (mainStr || '').toLowerCase();
        if (str.includes('thunder') || str.includes('storm')) return 'thunderstorm';
        if (str.includes('rain') || str.includes('drizzle')) return 'rain';
        if (str.includes('snow') || str.includes('sleet') || str.includes('ice')) return 'snow';
        if (str.includes('mist') || str.includes('fog') || str.includes('haze') || str.includes('smoke') || str.includes('dust')) return 'mist';
        if (str.includes('cloud')) return isNight ? 'clouds-night' : 'clouds';
        if (isNight) return 'clear-night';
        return 'clear-day';
    }

    /**
     * Dynamic mock dataset generator for offline / fallback mode
     */
    generateDynamicMockPayload(query, isCoords) {
        let cityName = 'London';
        let country = 'United Kingdom';
        let lat = 51.5074;
        let lon = -0.1278;

        if (typeof query === 'string' && query.trim() !== '') {
            const match = CONFIG.SAMPLE_CITIES.find(c => c.name.toLowerCase() === query.trim().toLowerCase());
            if (match) {
                cityName = match.name;
                country = match.country;
                lat = match.lat;
                lon = match.lon;
            } else {
                cityName = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
                country = 'World';
                // Hash name to produce deterministic lat/lon
                let hash = 0;
                for (let i = 0; i < cityName.length; i++) hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
                lat = (Math.abs(hash) % 120) - 60;
                lon = (Math.abs(hash * 3) % 360) - 180;
            }
        } else if (isCoords && query.lat !== undefined) {
            lat = query.lat;
            lon = query.lon;
            // Find closest sample city name
            let closest = CONFIG.SAMPLE_CITIES[0];
            let minDist = 999999;
            CONFIG.SAMPLE_CITIES.forEach(c => {
                const dist = Math.hypot(c.lat - lat, c.lon - lon);
                if (dist < minDist) {
                    minDist = dist;
                    closest = c;
                }
            });
            cityName = closest.name;
            country = closest.country;
        }

        // Deterministic pseudo-random seed from city name
        const seed = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Derive base temperature from latitude & seed
        const absLat = Math.abs(lat);
        let baseTemp = 30 - (absLat * 0.4) + ((seed % 7) - 3); // Tropical ~30C, temperate ~15C, polar ~0C
        if (this.unit === 'imperial') {
            baseTemp = (baseTemp * 9/5) + 32;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const isNight = currentHour > 19 || currentHour < 6;

        // Conditions generator
        const conditionsList = ['clear-day', 'clouds', 'rain', 'thunderstorm', 'snow', 'mist'];
        let conditionType = conditionsList[seed % conditionsList.length];
        if (absLat < 20 && conditionType === 'snow') conditionType = 'rain'; // No snow in tropics
        if (isNight && conditionType === 'clear-day') conditionType = 'clear-night';

        let mainCondition = 'Clear';
        let description = 'Sunny and clear skies';
        let icon = isNight ? '01n' : '01d';

        switch(conditionType) {
            case 'clear-day':
                mainCondition = 'Clear';
                description = 'Bright clear skies';
                icon = '01d';
                break;
            case 'clear-night':
                mainCondition = 'Clear';
                description = 'Clear starry night';
                icon = '01n';
                break;
            case 'clouds':
                mainCondition = 'Clouds';
                description = 'Partly cloudy';
                icon = isNight ? '02n' : '02d';
                break;
            case 'rain':
                mainCondition = 'Rain';
                description = 'Moderate rain showers';
                icon = '10d';
                break;
            case 'thunderstorm':
                mainCondition = 'Thunderstorm';
                description = 'Thunderstorm with heavy rain';
                icon = '11d';
                break;
            case 'snow':
                mainCondition = 'Snow';
                description = 'Light snowfall';
                icon = '13d';
                break;
            case 'mist':
                mainCondition = 'Mist';
                description = 'Foggy atmospheric haze';
                icon = '50d';
                break;
        }

        const humidity = Math.min(95, Math.max(30, (conditionType.includes('rain') ? 82 : 60) + (seed % 20) - 10));
        const windSpeed = Math.min(45, Math.max(5, 12 + (seed % 15)));
        const feelsLike = Math.round(baseTemp + (humidity > 70 ? 3 : humidity < 40 ? -2 : 0));
        const uvIndex = isNight ? 0 : Math.min(11, Math.max(1, Math.round((baseTemp > 25 ? 8 : 4) + (seed % 3))));
        const visibility = conditionType === 'mist' ? 3 : 10;

        // Generate 24-hour timeline (8 steps of 3 hours)
        const hourly = [];
        for (let i = 0; i < 8; i++) {
            const h = (currentHour + i * 3) % 24;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const formattedHour = `${h % 12 || 12} ${ampm}`;
            const tempVar = Math.sin((h - 6) * Math.PI / 12) * 4;
            const hTemp = Math.round(baseTemp + tempVar);
            const hPop = conditionType.includes('rain') ? Math.min(95, 40 + i * 8) : (seed % 30);
            
            hourly.push({
                time: formattedHour,
                hour24: h,
                temp: hTemp,
                pop: hPop,
                humidity: Math.min(95, humidity + (i % 2 === 0 ? 4 : -3)),
                windSpeed: Math.round(windSpeed + (i % 3)),
                condition: conditionType,
                description,
                icon
            });
        }

        // Generate 7-day forecast
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daily = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(now.getDate() + i);
            const dayName = i === 0 ? 'Today' : daysOfWeek[d.getDay()];
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dayCond = conditionsList[(seed + i * 3) % conditionsList.length];
            const maxTemp = Math.round(baseTemp + (i % 3) - 1 + 3);
            const minTemp = Math.round(baseTemp + (i % 3) - 4);
            const pop = dayCond.includes('rain') ? 75 : (seed * (i + 1)) % 40;

            daily.push({
                day: dayName,
                date: dateStr,
                minTemp,
                maxTemp,
                pop,
                windSpeed: Math.round(windSpeed + (i % 4) - 2),
                condition: dayCond,
                icon
            });
        }

        const nowSec = Math.floor(Date.now() / 1000);

        return {
            isMock: true,
            cityName,
            country,
            coords: { lat, lon },
            timezoneOffset: 0,
            current: {
                temp: Math.round(baseTemp),
                feelsLike,
                tempMin: Math.round(baseTemp - 4),
                tempMax: Math.round(baseTemp + 4),
                humidity,
                windSpeed,
                visibility,
                pressure: 1013 + (seed % 10),
                uvIndex,
                conditionType,
                mainCondition,
                description,
                icon,
                isNight,
                sunrise: '06:15 AM',
                sunset: '06:45 PM',
                sunriseTimestamp: nowSec - 3600 * 6,
                sunsetTimestamp: nowSec + 3600 * 6
            },
            hourly,
            daily
        };
    }
}

const apiService = new WeatherAPIService();

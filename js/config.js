
const CONFIG = {
    // OpenWeather API Key - Users can input their own key in the UI or hardcode here
    OPENWEATHER_API_KEY: 'API_KEY',
    // Units: 'metric' (°C, km/h) or 'imperial' (°F, mph)
    DEFAULT_UNIT: 'metric',
    
    // Storage keys
    STORAGE_KEYS: {
        UNIT: 'weather_intel_unit',
        THEME: 'weather_intel_theme',
    },
    
    // Default fallback city if geolocation is denied or fails
    DEFAULT_CITY: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278
    },

};

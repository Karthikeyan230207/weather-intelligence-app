# 🌤️ Weather Intelligence - Modern Personal Weather Assistant

**Weather Intelligence** is a portfolio-quality, highly interactive weather application and personal weather assistant built using Vanilla Web Technologies (HTML5, CSS3, ES6 JavaScript) alongside Three.js, Chart.js, Leaflet.js, and the OpenWeather API.

Unlike standard weather dashboards that simply report temperatures, Weather Intelligence acts as a personal assistant—interpreting what the weather *feels like*, recommending optimal *clothing and umbrella gear*, computing a zero-to-hundred *Outdoor Score*, predicting *rain arrival times*, and displaying dynamic 3D weather visual scenes.

---

## 🌟 Key Features

1. **📍 Smart Current Location & Geolocation**
   - Automatically detects current location via browser Geolocation API.
   - Includes "📍 Use My Location" quick action button.
   - Smooth fallback to manual city search if permission is denied.

2. **🌈 Dynamic Reactive Atmosphere UI**
   - Theme backgrounds and glow overlays react dynamically to current condition: Clear Day/Night, Rain, Thunderstorm, Snow, Mist, and Clouds.
   - Smooth light/dark theme switch with system preference auto-detection.

3. **🧊 Interactive Three.js 3D Weather Scene**
   - Embedded 3D Canvas visual in the hero section.
   - Procedural 3D Sun with rotating rays, 3D Moon with twinkling stars, particle Rain & Snow, Thunderstorm lightning flashes, and Cloud clusters with mouse parallax interaction.

4. **🧠 Weather Intelligence Assistant Insights**
   - Dynamic humanized interpretations: humidity effects, ideal outdoor activity windows, and temperature differences.
   - **👕 Outfit Recommendation**: Tailored clothing advice based on temp, humidity, and wind.
   - **☔ Umbrella Alert**: Rain risk banner and umbrella reminders.

5. **🌳 Outdoor Score (0 - 100)**
   - Circular SVG gauge calculating suitability for outdoors.
   - Individual activity scores and advice for **Exercise 🏃**, **Outdoor Dining ☕**, **Walking 🚶**, and **Cycling 🚴**.

6. **⏱️ 24-Hour Hourly Timeline**
   - Scrollable horizontal timeline displaying temperature, condition icons, rain probabilities (POP), and wind speeds.

7. **📊 Chart.js Temperature & Rain Analytics**
   - Interactive line graph displaying temperature curves alongside rain probability bars with rich hover tooltips.

8. **🌧️ Rain Watch Prediction**
   - Estimates minutes until rain onset or confirms clear skies based on hourly forecast trends.

9. **🌅 Sun & Moon Intelligence**
   - Sunrise and sunset times with a daylight percentage progress bar.
   - Moon phase name (Full Moon, Waxing Crescent, etc.) and illumination icon.

10. **☀️ UV & Health Protection + 🛋️ Comfort Index**
    - Risk levels and protective advice for UV exposure.
    - Comfort Index rating (Humid & Muggy, Cold & Crisp, Hot & Oppressive, Optimal).

11. **📅 Expandable 7-Day Weather Forecast**
    - Clickable daily forecast cards expanding rain, wind, and min/max details.

12. **🌎 Multi-City Weather Comparison**
    - Side-by-side comparison matrix for 2–3 cities highlighting highest temp, most humid, and best outdoor scores.

13. **🗺️ Interactive Regional Weather Map**
    - Leaflet.js map with OpenStreetMap tiles, interactive map clicks, and weather marker popups.

14. **❤️ Favorite Cities & 🔥 Weather Journey Stats**
    - Save favorite cities in `LocalStorage`.
    - Tracks searched cities count, top searched location, and hottest/coldest temperatures viewed.

15. **🛡️ Resilient Dual API / Mock Provider**
    - Works out of the box with an intelligent built-in dynamic weather generator for instant testing.
    - Seamlessly accepts live OpenWeather API keys via the settings menu.

---

## 📁 Project Structure

```
weather-intelligence-app/
├── index.html              # Main HTML5 document with semantic sections
├── styles.css              # Glassmorphism design system & atmosphere themes
├── js/
│   ├── config.js           # API keys, storage constants, sample city dataset
│   ├── api.js              # OpenWeather API integration + Dynamic Mock Provider
│   ├── weather3d.js        # Three.js 3D weather visual engine
│   ├── intelligence.js     # Outdoor score, outfit, UV, Sun/Moon, & insights logic
│   ├── ui.js               # UI renderer, Chart.js, Leaflet map, comparison & stats
│   └── app.js              # Application entry point & DOM event handlers
└── README.md               # Project documentation
```

---

## 🚀 How to Run Locally

1. Clone or download the repository files.
2. Serve the directory using any static local web server, for example using Python:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   `http://localhost:8080`

---

## 🔑 OpenWeather API Key Configuration (Optional)

1. Get a free API Key from [OpenWeather](https://openweathermap.org/api).
2. Click the **⚙️ Settings** icon in the top right header of the app.
3. Paste your API key and click **Save Key**. The app will immediately start fetching live global weather data!

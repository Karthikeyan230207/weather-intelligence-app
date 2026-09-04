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

5. **🌳 Outdoor Score (0 - 100)**
   - Circular SVG gauge calculating suitability for outdoors.
   - Individual activity scores and advice for **Exercise 🏃**, **Outdoor Dining ☕**, **Walking 🚶**, and **Cycling 🚴**.

6. **⏱️ 24-Hour Hourly Timeline**
   - Scrollable horizontal timeline displaying temperature, condition icons, rain probabilities (POP), and wind speeds.

7. **📅 Expandable 7-Day Weather Forecast**
    - Clickable daily forecast cards expanding rain, wind, and min/max details.

8. **🌎 Multi-City Weather Comparison**
    - Side-by-side comparison matrix for 2–3 cities highlighting highest temp, most humid, and best outdoor scores.

9. **🗺️ Interactive Regional Weather Map**
    - Leaflet.js map with OpenStreetMap tiles, interactive map clicks, and weather marker popups.

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
2. No need any packages 
Just open the index.html directly

---

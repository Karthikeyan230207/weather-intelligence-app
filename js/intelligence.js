

class WeatherIntelligence {
    /**
     * Outfit Recommendation logic using realistic vector icon classes
     */
    static getOutfitRecommendation(payload) {
        const { current, hourly } = payload;
        let tempC = current.temp;
        if (apiService.unit === 'imperial') {
            tempC = (current.temp - 32) * 5 / 9;
        }

        let clothes = '';
        let iconHtml = '<i class="fa-solid fa-shirt"></i>';

        if (tempC < 10) {
            clothes = 'Heavy winter coat, thermal layers, scarf, and insulated socks.';
            iconHtml = '<i class="fa-solid fa-vest-patches"></i>';
        } else if (tempC >= 10 && tempC < 18) {
            clothes = 'Light jacket, cardigan, or warm hoodie over a casual shirt.';
            iconHtml = '<i class="fa-solid fa-user-ninja"></i>';
        } else if (tempC >= 18 && tempC <= 26) {
            clothes = 'Comfortable cotton T-shirt, light chinos, or jeans.';
            iconHtml = '<i class="fa-solid fa-shirt"></i>';
        } else if (tempC > 26 && tempC <= 32) {
            clothes = 'Light breathable cotton top, shorts, sunglasses, and UV cap.';
            iconHtml = '<i class="fa-solid fa-glasses"></i>';
        } else {
            clothes = 'Ultra-lightweight moisture-wicking clothing. Stay in shade and hydrated!';
            iconHtml = '<i class="fa-solid fa-sun-plant-wilt"></i>';
        }

        const willRain = current.conditionType === 'rain' || current.conditionType === 'thunderstorm' || hourly.some(h => h.pop >= 50);
        const umbrellaAdvice = willRain ? '<i class="fa-solid fa-umbrella text-blue"></i> Rain expected: Carry an umbrella or waterproof jacket.' : '<i class="fa-solid fa-sun text-gold"></i> Clear skies: No umbrella needed today.';

        return {
            iconHtml,
            clothing: clothes,
            umbrella: umbrellaAdvice,
            needUmbrella: willRain
        };
    }

    /**
     * Outdoor Score (0 - 100) + Activity recommendations
     */
    static calculateOutdoorScore(payload) {
        const { current } = payload;
        let tempC = current.temp;
        if (apiService.unit === 'imperial') {
            tempC = (current.temp - 32) * 5 / 9;
        }

        let score = 100;

        if (tempC < 15) score -= (15 - tempC) * 3;
        else if (tempC > 25) score -= (tempC - 25) * 3.5;

        if (current.conditionType === 'rain') score -= 35;
        if (current.conditionType === 'thunderstorm') score -= 55;

        if (current.humidity > 70) score -= (current.humidity - 70) * 0.5;
        if (current.windSpeed > 20) score -= (current.windSpeed - 20) * 0.8;
        if (current.uvIndex > 7) score -= (current.uvIndex - 7) * 4;

        score = Math.round(Math.min(100, Math.max(10, score)));

        let summary = 'Ideal weather for outdoor activities!';
        if (score >= 80) summary = 'Excellent conditions for outdoor sports and walks.';
        else if (score >= 60) summary = 'Good time to go outside, but stay comfortable.';
        else if (score >= 40) summary = 'Moderate conditions. Check weather precautions before heading out.';
        else summary = 'Unfavorable outdoor weather. Indoor activities recommended.';

        const activities = {
            walking: {
                name: 'Walking',
                iconHtml: '<i class="fa-solid fa-person-walking text-blue"></i>',
                score: score,
                recommendation: score > 70 ? 'Perfect for a refreshing park stroll.' : 'Bring appropriate outerwear.'
            },
            cycling: {
                name: 'Cycling',
                iconHtml: '<i class="fa-solid fa-bicycle text-purple"></i>',
                score: Math.min(100, Math.max(10, score + (current.windSpeed > 20 ? -25 : 5))),
                recommendation: current.windSpeed > 20 ? 'Strong winds may cause resistance while riding.' : 'Smooth road conditions for biking.'
            }
        };

        return { score, summary, activities };
    }

    /**
     * Weather Alert Trigger Engine
     */
    static detectWeatherAlerts(payload) {
        const { current } = payload;
        const alerts = [];

        if (current.conditionType === 'thunderstorm') {
            alerts.push({
                type: 'severe',
                title: '⚡ Severe Thunderstorm Warning',
                message: 'Lightning strikes and flash flooding risk in your area. Stay indoors.'
            });
        }

        if (current.conditionType === 'rain' && current.humidity > 85) {
            alerts.push({
                type: 'warning',
                title: '🌧️ Heavy Rainfall Advisory',
                message: 'Heavy downpours expected. Exercise caution on slippery roads.'
            });
        }

        let tempC = current.temp;
        if (apiService.unit === 'imperial') tempC = (current.temp - 32) * 5 / 9;

        if (tempC >= 35) {
            alerts.push({
                type: 'warning',
                title: '🔥 Extreme Heat Advisory',
                message: 'Unusually high heat today. Stay hydrated and avoid direct sunlight.'
            });
        } else if (tempC <= 0) {
            alerts.push({
                type: 'info',
                title: '❄️ Freeze Alert',
                message: 'Sub-zero temperatures may cause icy patches on sidewalks and roads.'
            });
        }

        if (current.windSpeed >= 35) {
            alerts.push({
                type: 'warning',
                title: '🌪️ High Wind Advisory',
                message: `Strong gusty winds up to ${current.windSpeed} ${apiService.getSpeedSymbol()}. Secure loose outdoor items.`
            });
        }

        return alerts;
    }
}

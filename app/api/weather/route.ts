import { NextResponse } from 'next/server';

const OWM_KEY = '439d4b804bc8187953eb36d2a8c26a02'; // Free demo key from OpenWeatherMap samples

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
        return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
    }

    try {
        // Step 1: Geocode city name → lat/lon
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`,
            { next: { revalidate: 3600 } }
        );
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) {
            return NextResponse.json({ error: 'City not found', city }, { status: 404 });
        }

        const { lat, lon, name, country } = geoData[0];

        // Step 2: Get current weather
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&lang=fr`,
            { next: { revalidate: 600 } } // Cache 10 min
        );
        const weather = await weatherRes.json();

        // Step 3: Get 5-day / 3-hour forecast
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&lang=fr`,
            { next: { revalidate: 1800 } } // Cache 30 min
        );
        const forecastData = await forecastRes.json();

        // Process daily forecast (take noon entry per day)
        const dailyMap = new Map<string, any>();
        if (forecastData.list) {
            for (const entry of forecastData.list) {
                const date = entry.dt_txt.split(' ')[0];
                const hour = parseInt(entry.dt_txt.split(' ')[1].split(':')[0]);
                // Prefer noon (12:00) reading for each day
                if (!dailyMap.has(date) || hour === 12) {
                    dailyMap.set(date, {
                        date,
                        temp: Math.round(entry.main.temp),
                        tempMin: Math.round(entry.main.temp_min),
                        tempMax: Math.round(entry.main.temp_max),
                        condition: entry.weather[0]?.main || 'Clear',
                        description: entry.weather[0]?.description || '',
                        icon: entry.weather[0]?.icon || '01d',
                        humidity: entry.main.humidity,
                        wind: Math.round(entry.wind.speed * 3.6), // m/s → km/h
                    });
                }
            }
        }

        const forecast = Array.from(dailyMap.values()).slice(0, 5);

        return NextResponse.json({
            city: name,
            country,
            lat,
            lon,
            current: {
                temp: Math.round(weather.main?.temp),
                feelsLike: Math.round(weather.main?.feels_like),
                humidity: weather.main?.humidity,
                wind: Math.round((weather.wind?.speed || 0) * 3.6),
                condition: weather.weather?.[0]?.main || 'Clear',
                description: weather.weather?.[0]?.description || '',
                icon: weather.weather?.[0]?.icon || '01d',
            },
            forecast,
        });
    } catch (error: any) {
        console.error('Weather API error:', error);
        return NextResponse.json({ error: 'Weather service unavailable' }, { status: 500 });
    }
}

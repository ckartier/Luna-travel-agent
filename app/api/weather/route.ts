import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
        return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
    }

    try {
        // Step 1: Geocode city using Open-Meteo Geocoding API
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`,
            { next: { revalidate: 3600 } }
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return NextResponse.json({ error: 'City not found', city }, { status: 404 });
        }

        const { latitude: lat, longitude: lon, name, country } = geoData.results[0];

        // Step 2: Get weather data using Open-Meteo Weather API
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
            { next: { revalidate: 600 } }
        );
        const data = await weatherRes.json();

        // Helper to map WMO weather codes to our simple conditions
        const getCondition = (code: number) => {
            if (code <= 3) return { main: 'Clear', desc: 'Dégagé / Nuageux' };
            if (code <= 49) return { main: 'Clouds', desc: 'Brouillard' };
            if (code <= 69) return { main: 'Drizzle', desc: 'Bruine' };
            if (code <= 79) return { main: 'Snow', desc: 'Neige' };
            if (code <= 99) return { main: 'Rain', desc: 'Averses / Orages' };
            return { main: 'Clear', desc: 'Dégagé' };
        };

        const currentCond = getCondition(data.current.weather_code);

        const forecast = data.daily.time.slice(0, 5).map((date: string, i: number) => {
            const dayCond = getCondition(data.daily.weather_code[i]);
            return {
                date,
                temp: Math.round(data.daily.temperature_2m_max[i]), // using max temp for day preview
                condition: dayCond.main,
                humidity: data.current.relative_humidity_2m, // fallback
                wind: Math.round(data.current.wind_speed_10m), // fallback
            };
        });

        return NextResponse.json({
            city: name,
            country,
            current: {
                temp: Math.round(data.current.temperature_2m),
                feelsLike: Math.round(data.current.apparent_temperature),
                humidity: data.current.relative_humidity_2m,
                wind: Math.round(data.current.wind_speed_10m),
                condition: currentCond.main,
                description: currentCond.desc,
            },
            forecast,
        });
    } catch (error: any) {
        console.error('Weather API error:', error);
        return NextResponse.json({ error: 'Weather service unavailable' }, { status: 500 });
    }
}

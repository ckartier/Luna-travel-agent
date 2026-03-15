import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
        return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
    }

    try {
        // Step 1: Try Open-Meteo Geocoding first
        let lat: number | null = null;
        let lon: number | null = null;
        let resolvedName = city;
        let resolvedCountry = '';

        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=3&language=fr&format=json`,
            { next: { revalidate: 3600 } }
        );
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            resolvedName = geoData.results[0].name;
            resolvedCountry = geoData.results[0].country;
        }

        // Step 2: Fallback to Mapbox Geocoding if Open-Meteo fails
        if (lat === null || lon === null) {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (mapboxToken) {
                const mbRes = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?types=place&limit=1&language=fr&access_token=${mapboxToken}`,
                    { next: { revalidate: 3600 } }
                );
                const mbData = await mbRes.json();
                if (mbData.features && mbData.features.length > 0) {
                    const [mbLon, mbLat] = mbData.features[0].center;
                    lat = mbLat;
                    lon = mbLon;
                    resolvedName = mbData.features[0].text || city;
                    resolvedCountry = mbData.features[0].context?.find((c: any) => c.id.startsWith('country'))?.text || '';
                }
            }
        }

        // If still no coordinates, city not found
        if (lat === null || lon === null) {
            return NextResponse.json({ error: 'City not found', city }, { status: 404 });
        }

        // Step 3: Get weather data from Open-Meteo
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max&timezone=auto&forecast_days=7`,
            { next: { revalidate: 600 } }
        );
        const data = await weatherRes.json();

        // WMO weather codes → human-readable conditions
        const getCondition = (code: number) => {
            if (code === 0) return { main: 'Clear', desc: 'Ciel dégagé' };
            if (code <= 3) return { main: 'Clouds', desc: 'Partiellement nuageux' };
            if (code <= 49) return { main: 'Clouds', desc: 'Brouillard' };
            if (code <= 59) return { main: 'Drizzle', desc: 'Bruine' };
            if (code <= 69) return { main: 'Rain', desc: 'Pluie' };
            if (code <= 79) return { main: 'Snow', desc: 'Neige' };
            if (code <= 84) return { main: 'Rain', desc: 'Averses' };
            if (code <= 89) return { main: 'Snow', desc: 'Averses de neige' };
            if (code <= 99) return { main: 'Thunderstorm', desc: 'Orages' };
            return { main: 'Clear', desc: 'Dégagé' };
        };

        const currentCond = getCondition(data.current.weather_code);

        const forecast = data.daily.time.slice(0, 7).map((date: string, i: number) => {
            const dayCond = getCondition(data.daily.weather_code[i]);
            return {
                date,
                temp: Math.round(data.daily.temperature_2m_max[i]),
                tempMin: Math.round(data.daily.temperature_2m_min[i]),
                condition: dayCond.main,
                description: dayCond.desc,
                humidity: Math.round(data.daily.relative_humidity_2m_mean?.[i] ?? data.current.relative_humidity_2m),
                wind: Math.round(data.daily.wind_speed_10m_max?.[i] ?? data.current.wind_speed_10m),
            };
        });

        return NextResponse.json({
            city: resolvedName,
            country: resolvedCountry,
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

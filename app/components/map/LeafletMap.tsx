'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
    mapboxToken: string;
}

export interface LeafletMapHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    setMapStyle: (styleId: string) => void;
}

const MAP_STYLES = [
    { id: 'light-v11', label: 'Clair', color: '#e8e4dc' },
    { id: 'streets-v12', label: 'Rues', color: '#a8c8e8' },
    { id: 'outdoors-v12', label: 'Terrain', color: '#8bc48a' },
    { id: 'satellite-streets-v12', label: 'Satellite', color: '#1a3a2a' },
];

export { MAP_STYLES };

const ROUTES = [
    { from: [2.35, 48.86] as [number, number], to: [139.69, 35.68] as [number, number], color: '#60a5fa' },
    { from: [2.35, 48.86] as [number, number], to: [-73.94, 40.71] as [number, number], color: '#c084fc' },
    { from: [2.35, 48.86] as [number, number], to: [55.27, 25.20] as [number, number], color: '#fbbf24' },
    { from: [2.35, 48.86] as [number, number], to: [-43.17, -22.91] as [number, number], color: '#34d399' },
    { from: [2.35, 48.86] as [number, number], to: [100.50, 13.76] as [number, number], color: '#f472b6' },
    { from: [2.35, 48.86] as [number, number], to: [28.98, 41.01] as [number, number], color: '#fb923c' },
];

function greatCircle(a: [number, number], b: [number, number], n = 64): [number, number][] {
    const R = Math.PI / 180;
    const lat1 = a[1] * R, lng1 = a[0] * R, lat2 = b[1] * R, lng2 = b[0] * R;
    const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2));
    if (d < 1e-10) return [a, b];
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
        const f = i / n;
        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);
        const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
        const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);
        pts.push([Math.atan2(y, x) / R, Math.atan2(z, Math.sqrt(x * x + y * y)) / R]);
    }
    return pts;
}

function calcBearing(a: [number, number], b: [number, number]): number {
    const R = Math.PI / 180;
    const dLng = (b[0] - a[0]) * R;
    const y = Math.sin(dLng) * Math.cos(b[1] * R);
    const x = Math.cos(a[1] * R) * Math.sin(b[1] * R) - Math.sin(a[1] * R) * Math.cos(b[1] * R) * Math.cos(dLng);
    return ((Math.atan2(y, x) / R) + 360) % 360;
}

const ARCS = ROUTES.map(r => greatCircle(r.from, r.to));

const LeafletMap = forwardRef<LeafletMapHandle, Props>(function LeafletMap({ mapboxToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const frameRef = useRef<number>(0);
    const planesRef = useRef<{ marker: mapboxgl.Marker; arc: [number, number][]; speed: number; offset: number }[]>([]);

    const addLayers = useCallback((map: mapboxgl.Map) => {
        ROUTES.forEach((route, i) => {
            if (map.getSource(`r${i}`)) return;
            const coords = ARCS[i];
            map.addSource(`r${i}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} } });
            map.addLayer({ id: `r${i}-glow`, type: 'line', source: `r${i}`, paint: { 'line-color': route.color, 'line-width': 10, 'line-opacity': 0.08, 'line-blur': 8 } });
            map.addLayer({ id: `r${i}-dash`, type: 'line', source: `r${i}`, paint: { 'line-color': route.color, 'line-width': 1.2, 'line-opacity': 0.25, 'line-dasharray': [1.5, 2.5] } });
            map.addSource(`t${i}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords.slice(0, 2) }, properties: {} } });
            map.addLayer({ id: `t${i}-g`, type: 'line', source: `t${i}`, paint: { 'line-color': route.color, 'line-width': 6, 'line-opacity': 0.25, 'line-blur': 4 } });
            map.addLayer({ id: `t${i}-c`, type: 'line', source: `t${i}`, paint: { 'line-color': '#fff', 'line-width': 2, 'line-opacity': 0.8 } });
        });
    }, []);

    // Expose map controls to parent via ref
    useImperativeHandle(ref, () => ({
        zoomIn: () => mapRef.current?.zoomIn(),
        zoomOut: () => mapRef.current?.zoomOut(),
        setMapStyle: (styleId: string) => {
            if (mapRef.current) {
                mapRef.current.setStyle(`mapbox://styles/mapbox/${styleId}`);
            }
        },
    }), []);

    useEffect(() => {
        if (!containerRef.current || mapRef.current || !mapboxToken) return;
        mapboxgl.accessToken = mapboxToken;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [20, 40], zoom: 4, projection: 'globe',
            attributionControl: false, antialias: true, dragRotate: true,
        });

        map.on('style.load', () => {
            const name = (map.getStyle().name || '').toLowerCase();
            const isDark = name.includes('dark') || name.includes('satellite');
            map.setFog({
                color: isDark ? 'rgb(50,50,55)' : 'rgb(235,232,226)',
                'high-color': isDark ? 'rgb(70,75,90)' : 'rgb(210,215,225)',
                'horizon-blend': 0.04,
                'space-color': 'rgb(220,218,212)' as any,
                'star-intensity': 0,
            });
            try {
                const labels = map.getStyle().layers?.filter((l: any) => l.type === 'symbol' && l.id.includes('label')) || [];
                labels.forEach((l: any) => {
                    map.setPaintProperty(l.id, 'text-halo-color', isDark ? 'rgba(100,160,255,0.2)' : 'rgba(120,160,220,0.25)');
                    map.setPaintProperty(l.id, 'text-halo-width', 3);
                    map.setPaintProperty(l.id, 'text-halo-blur', 4);
                });
            } catch { }
            addLayers(map);
        });

        map.on('load', () => {
            ROUTES.forEach((route, i) => {
                (i === 0 ? [route.from, route.to] : [route.to]).forEach(p => {
                    const el = document.createElement('div');
                    el.style.cssText = `width:7px;height:7px;border-radius:50%;background:${route.color};box-shadow:0 0 8px ${route.color}90;border:1.5px solid #fff;`;
                    new mapboxgl.Marker({ element: el }).setLngLat(p).addTo(map);
                });
            });

            planesRef.current = ROUTES.map((route, i) => {
                const el = document.createElement('div');
                el.style.cssText = 'width:38px;height:38px;pointer-events:none;';
                el.innerHTML = `<svg viewBox="0 0 20 20" width="38" height="38" style="display:block;filter:drop-shadow(0 0 6px ${route.color}) drop-shadow(0 0 12px ${route.color}80);"><path d="M10 2 L12.5 8 L18 9.5 L12.5 11 L12.5 16 L10 14.5 L7.5 16 L7.5 11 L2 9.5 L7.5 8 Z" fill="${route.color}" stroke="rgba(255,255,255,0.9)" stroke-width="0.6"/></svg>`;
                const marker = new mapboxgl.Marker({ element: el, anchor: 'center', rotationAlignment: 'map' }).setLngLat(ARCS[i][0]).addTo(map);
                return { marker, arc: ARCS[i], speed: 0.0008 + Math.random() * 0.0005, offset: i * 0.15 };
            });

            let tick = 0;
            const loop = () => {
                tick++;
                planesRef.current.forEach((p, i) => {
                    const t = ((tick * p.speed) + p.offset) % 1;
                    const len = p.arc.length - 1;
                    const idx = t * len, i0 = Math.floor(idx), i1 = Math.min(i0 + 1, len), f = idx - i0;
                    p.marker.setLngLat([p.arc[i0][0] + (p.arc[i1][0] - p.arc[i0][0]) * f, p.arc[i0][1] + (p.arc[i1][1] - p.arc[i0][1]) * f]);
                    p.marker.setRotation(calcBearing(p.arc[i0], p.arc[Math.min(i0 + 2, len)]));
                    const n = Math.floor(len * 0.18), s = Math.max(0, i0 - n), trail = p.arc.slice(s, i0 + 1);
                    if (trail.length >= 2) { const src = map.getSource(`t${i}`) as mapboxgl.GeoJSONSource; src?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trail }, properties: {} }); }
                });
                frameRef.current = requestAnimationFrame(loop);
            };
            frameRef.current = requestAnimationFrame(loop);
        });

        let d = 0;
        const drift = () => { d += 0.002; if (!map.isMoving()) map.setCenter([20 + Math.sin(d) * 1.5, 40 + Math.cos(d * 0.7) * 0.8]); requestAnimationFrame(drift); };
        requestAnimationFrame(drift);

        mapRef.current = map;
        return () => { cancelAnimationFrame(frameRef.current); map.remove(); mapRef.current = null; };
    }, [mapboxToken, addLayers]);

    return (
        <>
            <style jsx global>{`
                .mapboxgl-canvas{outline:none!important}
                .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib,.mapboxgl-ctrl-group{display:none!important}
            `}</style>
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        </>
    );
});

export default LeafletMap;

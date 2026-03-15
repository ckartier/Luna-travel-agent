import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

const START_TIME = Date.now();

/**
 * GET /api/health
 * 
 * Public health check endpoint for monitoring.
 * Returns: status, version, uptime, database connectivity.
 */
export async function GET() {
    const start = Date.now();
    let dbStatus = 'unknown';

    try {
        // Quick Firestore connectivity check
        await adminDb.collection('settings').doc('health').get();
        dbStatus = 'connected';
    } catch {
        dbStatus = 'disconnected';
    }

    const uptimeMs = Date.now() - START_TIME;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMinutes = Math.floor((uptimeMs % 3600000) / 60000);

    return NextResponse.json({
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        uptimeMs,
        database: dbStatus,
        responseTime: `${Date.now() - start}ms`,
        timestamp: new Date().toISOString(),
        services: {
            firestore: dbStatus,
            auth: 'active',
            api: 'active',
        },
    });
}

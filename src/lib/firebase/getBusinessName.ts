import { adminDb } from './admin';

/**
 * Fetch the business name from site-config in Firestore.
 * Falls back to 'Votre Conciergerie' if not configured.
 * Can optionally accept a tenantId to look up tenant-specific config.
 */
export async function getBusinessName(tenantId?: string): Promise<string> {
  try {
    if (tenantId) {
      const configDoc = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('site-config').doc('global')
        .get();
      if (configDoc.exists) {
        const data = configDoc.data();
        const name = data?.business?.name;
        if (name) return name;
      }
    }
    return 'Votre Conciergerie';
  } catch {
    return 'Votre Conciergerie';
  }
}

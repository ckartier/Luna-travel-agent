import { adminDb } from './admin';

type EnsureProSupplierParams = {
  uid: string;
  email: string;
  tenantId: string;
};

type EnsureProSupplierResult = {
  created: boolean;
  supplierId?: string;
};

/**
 * Server-side safety net:
 * ensure a pro-travel account always has a supplier record in its tenant.
 */
export async function ensureProTravelSupplier(
  params: EnsureProSupplierParams,
): Promise<EnsureProSupplierResult> {
  const { uid, email, tenantId } = params;
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!tenantId || !normalizedEmail) return { created: false };

  const suppliersRef = adminDb.collection('tenants').doc(tenantId).collection('suppliers');
  const existingSnap = await suppliersRef.where('email', '==', normalizedEmail).limit(10).get();
  const existingTravelDoc = existingSnap.docs.find((docSnap) => {
    const data = docSnap.data() as { vertical?: string };
    return !data.vertical || data.vertical === 'travel';
  });

  if (existingTravelDoc) {
    return { created: false, supplierId: existingTravelDoc.id };
  }

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : null;
  const displayName =
    (userData?.displayName as string | undefined)?.trim()
    || normalizedEmail.split('@')[0]
    || 'Prestataire';
  const phone = ((userData?.phone as string | undefined) || '').trim();

  const createdRef = suppliersRef.doc();
  const now = new Date();
  await createdRef.set({
    name: displayName,
    contactName: displayName,
    category: 'AUTRE',
    country: 'France',
    city: 'Paris',
    email: normalizedEmail,
    phone,
    notes: 'Compte pro synchronise automatiquement.',
    commission: 0,
    tags: ['pro-account'],
    isFavorite: false,
    isLunaFriend: false,
    vertical: 'travel',
    createdAt: now,
    updatedAt: now,
  });

  return { created: true, supplierId: createdRef.id };
}


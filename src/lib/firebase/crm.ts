import { db } from './client';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';

export interface CRMLead {
    id?: string;
    clientId?: string;
    clientName?: string;
    destination: string;
    dates: string;
    budget: string;
    pax: string;
    days?: number;
    links?: { title: string, url: string }[];
    vibe?: string;
    flexibility?: string;
    mustHaves?: string;
    status: 'NEW' | 'ANALYSING' | 'PROPOSAL_READY' | 'WON' | 'LOST';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMContact {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    vipLevel: 'Standard' | 'Premium' | 'VIP' | 'Elite';
    preferences: string[];
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMActivity {
    id?: string;
    type: 'urgent' | 'call' | 'email' | 'meeting' | 'message' | 'done' | 'normal';
    title: string;
    time: string;
    status: 'PENDING' | 'DONE';
    color: 'red' | 'blue' | 'purple' | 'emerald' | 'amber' | 'gray';
    iconName: string;
    contactId?: string;
    contactName?: string;
    leadId?: string;
    tripId?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

// ═══ TRIPS / PLANNING ═══

export interface CRMTrip {
    id?: string;
    title: string;
    destination: string;
    clientName: string;
    clientId?: string;
    startDate: string; // ISO date string YYYY-MM-DD
    endDate: string;   // ISO date string YYYY-MM-DD
    status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'UNPAID' | 'DEPOSIT' | 'PAID';
    amount: number;
    notes: string;
    color: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

// Collections
const leadsCollection = collection(db, 'leads');
const contactsCollection = collection(db, 'contacts');
const activitiesCollection = collection(db, 'activities');
const tripsCollection = collection(db, 'trips');

// Leads CRUD
export const createLead = async (leadData: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(leadsCollection, {
        ...leadData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return docRef.id;
};

export const getLeads = async () => {
    const q = query(leadsCollection, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CRMLead));
};

export const updateLeadStatus = async (id: string, status: CRMLead['status']) => {
    const leadRef = doc(db, 'leads', id);
    await updateDoc(leadRef, {
        status,
        updatedAt: new Date()
    });
};

// Contacts CRUD
export const createContact = async (contactData: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(contactsCollection, {
        ...contactData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return docRef.id;
};

export const getContacts = async () => {
    const q = query(contactsCollection, orderBy('lastName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CRMContact));
};

// Activities CRUD
export const createActivity = async (activityData: Omit<CRMActivity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(activitiesCollection, {
        ...activityData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return docRef.id;
};

export const getActivities = async () => {
    const q = query(activitiesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CRMActivity));
};

export const updateActivityStatus = async (id: string, status: CRMActivity['status']) => {
    const activityRef = doc(db, 'activities', id);
    await updateDoc(activityRef, {
        status,
        updatedAt: new Date()
    });
};

// ═══ USER PROFILE ═══

export interface CRMUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    role: 'Agent' | 'Admin' | 'Manager';
    agency: string;
    phone: string;
    bio: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/**
 * Get or create a user profile in Firestore.
 * Called on every auth state change to ensure the doc exists.
 */
export const getOrCreateUser = async (firebaseUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): Promise<CRMUser> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
        // Update photo & name from Google in case they changed
        const data = snapshot.data() as CRMUser;
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (firebaseUser.photoURL && firebaseUser.photoURL !== data.photoURL) {
            updates.photoURL = firebaseUser.photoURL;
        }
        if (firebaseUser.displayName && firebaseUser.displayName !== data.displayName) {
            updates.displayName = firebaseUser.displayName;
        }
        if (Object.keys(updates).length > 1) {
            await updateDoc(userRef, updates);
        }
        return { ...data, ...updates } as CRMUser;
    }

    // Create new user document
    const newUser: CRMUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Utilisateur',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || null,
        role: 'Agent',
        agency: '',
        phone: '',
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Use setDoc (not addDoc) so the doc ID = uid
    const { setDoc: firestoreSetDoc } = await import('firebase/firestore');
    await firestoreSetDoc(userRef, newUser);
    return newUser;
};

/** Update editable user profile fields */
export const updateUserProfile = async (uid: string, data: Partial<Pick<CRMUser, 'phone' | 'agency' | 'bio' | 'role'>>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
    });
};

/** Get a user profile */
export const getUser = async (uid: string): Promise<CRMUser | null> => {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as CRMUser) : null;
};

// ═══ TRIPS CRUD ═══

export const createTrip = async (tripData: Omit<CRMTrip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(tripsCollection, {
        ...tripData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return docRef.id;
};

export const getTrips = async () => {
    const q = query(tripsCollection, orderBy('startDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMTrip));
};

export const updateTrip = async (id: string, data: Partial<Omit<CRMTrip, 'id' | 'createdAt'>>) => {
    const tripRef = doc(db, 'trips', id);
    await updateDoc(tripRef, { ...data, updatedAt: new Date() });
};

export const deleteTrip = async (id: string) => {
    const tripRef = doc(db, 'trips', id);
    await deleteDoc(tripRef);
};

// ═══ LINKED QUERIES ═══

export const getLeadsForContact = async (contactId: string) => {
    const q = query(leadsCollection, where('clientId', '==', contactId), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMLead));
};

export const getTripsForContact = async (contactId: string) => {
    const q = query(tripsCollection, where('clientId', '==', contactId), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMTrip));
};

export const getActivitiesForContact = async (contactId: string) => {
    const q = query(activitiesCollection, where('contactId', '==', contactId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const getActivitiesForLead = async (leadId: string) => {
    const q = query(activitiesCollection, where('leadId', '==', leadId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const getActivitiesForTrip = async (tripId: string) => {
    const q = query(activitiesCollection, where('tripId', '==', tripId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const findContactByEmail = async (email: string): Promise<CRMContact | null> => {
    const q = query(contactsCollection, where('email', '==', email.toLowerCase().trim()));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CRMContact;
};

export const updateLead = async (id: string, data: Partial<Omit<CRMLead, 'id' | 'createdAt'>>) => {
    const leadRef = doc(db, 'leads', id);
    await updateDoc(leadRef, { ...data, updatedAt: new Date() });
};

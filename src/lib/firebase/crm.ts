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

// Collections
const leadsCollection = collection(db, 'leads');
const contactsCollection = collection(db, 'contacts');

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

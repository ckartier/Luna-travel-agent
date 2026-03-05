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
import { createTenant } from './tenant';

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
    company?: string;
    vipLevel: 'Standard' | 'Premium' | 'VIP' | 'Elite';
    preferences: string[];
    dateOfBirth?: string;
    passportNumber?: string;
    passportExpiry?: string;
    nationality?: string;
    lifetimeValue?: number;
    dietary?: string;
    seatPreference?: string;
    roomPreference?: string;
    loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
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
    startDate: string;
    endDate: string;
    status: 'DRAFT' | 'PROPOSAL' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'UNPAID' | 'DEPOSIT' | 'PAID';
    amount: number;
    cost?: number;
    margin?: number;
    travelers?: number;
    notes: string;
    color: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMTripSegment {
    id: string;
    type: 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER' | 'TRAIN';
    title: string;
    timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    bookingUrl?: string;
    cost?: number;
    price?: number;
    bookingId?: string;
}

export interface CRMTripDay {
    id: string;
    date: string;
    dayIndex: number;
    title?: string;
    location?: string;
    segments: CRMTripSegment[];
}

// ═══ BOOKINGS / RESERVATIONS ═══

export interface CRMBooking {
    id?: string;
    tripId: string;
    clientId: string;
    clientName: string;
    type: 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER';
    supplier: string;
    destination: string;
    confirmationNumber: string;
    pnr?: string;
    checkIn: string;
    checkOut?: string;
    status: 'PENDING' | 'CONFIRMED' | 'TICKETED' | 'CANCELLED' | 'REFUNDED';
    supplierCost: number;
    clientPrice: number;
    currency: string;
    notes?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

// ═══ CATALOG & FINANCIALS ═══

export interface CRMCatalogItem {
    id?: string;
    type: 'HOTEL' | 'FLIGHT' | 'ACTIVITY' | 'TRANSFER' | 'OTHER';
    name: string;
    supplier: string;
    location: string;
    description: string;
    netCost: number;
    recommendedMarkup: number;
    currency: string;
    images?: string[];
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate: number;
}

export interface CRMInvoice {
    id?: string;
    invoiceNumber: string;
    tripId: string;
    clientId: string;
    clientName: string;
    issueDate: string;
    dueDate: string;
    items: CRMInvoiceItem[];
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
    amountPaid: number;
    currency: string;
    status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    notes?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMPayment {
    id?: string;
    invoiceId: string;
    clientId: string;
    amount: number;
    currency: string;
    method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'STRIPE';
    paymentDate: string;
    referenceId?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

// ═══ COMMUNICATION & DOCUMENTS ═══

export interface CRMMessage {
    id?: string;
    clientId: string;
    clientName: string;
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'CHAT';
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    senderId?: string;
    attachments?: string[];
    isRead: boolean;
    createdAt: Timestamp | Date;
}

export interface CRMDocument {
    id?: string;
    clientId: string;
    tripId?: string;
    type: 'PASSPORT' | 'VISA' | 'CONTRACT' | 'TICKET' | 'OTHER';
    name: string;
    fileUrl: string;
    size: number;
    uploadedBy: string;
    expiryDate?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMCampaign {
    id?: string;
    name: string;
    channel: 'EMAIL' | 'SMS';
    targetAudience: string[];
    subject?: string;
    content: string;
    status: 'DRAFT' | 'SCHEDULED' | 'SENT';
    scheduledDate?: string;
    sentCount: number;
    openCount: number;
    clickCount: number;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CRMTask {
    id?: string;
    title: string;
    description?: string;
    assigneeId: string;
    assigneeName: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string;
    tags: string[];
    linkedContactId?: string;
    linkedTripId?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface CalendarEvent {
    id?: string;
    title: string;
    type: 'TRIP_START' | 'TRIP_END' | 'BOOKING_CHECKIN' | 'BOOKING_CHECKOUT' |
    'INVOICE_DUE' | 'TASK_DEADLINE' | 'MEETING' | 'FOLLOW_UP';
    date: string;
    time?: string;
    endDate?: string;
    color: string;
    sourceType: 'trip' | 'booking' | 'invoice' | 'task';
    sourceId: string;
    clientId?: string;
    clientName?: string;
    assignedTo?: string;
    isAllDay: boolean;
    reminder?: number;
    createdAt: Timestamp | Date;
}

// ═══ TENANT-SCOPED COLLECTIONS ═══
// All business data lives under tenants/{tenantId}/ for multi-tenant isolation.

const tenantCol = (tenantId: string, name: string) => collection(db, 'tenants', tenantId, name);
const tenantDoc = (tenantId: string, colName: string, docId: string) => doc(db, 'tenants', tenantId, colName, docId);

// ═══ LEADS CRUD ═══

export const createLead = async (tid: string, data: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'leads'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getLeads = async (tid: string) => {
    const q = query(tenantCol(tid, 'leads'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMLead));
};

export const updateLeadStatus = async (tid: string, id: string, status: CRMLead['status']) => {
    await updateDoc(tenantDoc(tid, 'leads', id), { status, updatedAt: new Date() });
};

export const updateLead = async (tid: string, id: string, data: Partial<Omit<CRMLead, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'leads', id), { ...data, updatedAt: new Date() });
};

// ═══ CONTACTS CRUD ═══

export const createContact = async (tid: string, data: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'contacts'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getContacts = async (tid: string) => {
    const q = query(tenantCol(tid, 'contacts'), orderBy('lastName', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMContact));
};

export const findContactByEmail = async (tid: string, email: string): Promise<CRMContact | null> => {
    const q = query(tenantCol(tid, 'contacts'), where('email', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as CRMContact;
};

// ═══ ACTIVITIES CRUD ═══

export const createActivity = async (tid: string, data: Omit<CRMActivity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'activities'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getActivities = async (tid: string) => {
    const q = query(tenantCol(tid, 'activities'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const updateActivityStatus = async (tid: string, id: string, status: CRMActivity['status']) => {
    await updateDoc(tenantDoc(tid, 'activities', id), { status, updatedAt: new Date() });
};

// ═══ USER PROFILE (global — NOT tenant-scoped) ═══

export interface CRMUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    role: 'Agent' | 'Admin' | 'Manager';
    agency: string;
    phone: string;
    bio: string;
    tenantId: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export const getOrCreateUser = async (firebaseUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): Promise<CRMUser> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
        const data = snapshot.data() as CRMUser;
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        const hasCustomPhoto = data.photoURL && data.photoURL.includes('firebasestorage');
        if (firebaseUser.photoURL && firebaseUser.photoURL !== data.photoURL && !hasCustomPhoto) {
            updates.photoURL = firebaseUser.photoURL;
        }
        if (firebaseUser.displayName && firebaseUser.displayName !== data.displayName) {
            updates.displayName = firebaseUser.displayName;
        }
        if (Object.keys(updates).length > 1) {
            await updateDoc(userRef, updates);
        }

        let result = { ...data, ...updates } as CRMUser;
        if (!result.tenantId) {
            const tenantId = await createTenant(
                firebaseUser.uid,
                firebaseUser.email || data.email || '',
                firebaseUser.displayName || data.displayName || 'Utilisateur',
            );
            await updateDoc(userRef, { tenantId });
            result = { ...result, tenantId };
        }
        return result;
    }

    const tenantId = await createTenant(firebaseUser.uid, firebaseUser.email || '', firebaseUser.displayName || 'Utilisateur');

    const newUser: CRMUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Utilisateur',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || null,
        role: 'Agent',
        agency: '',
        phone: '',
        bio: '',
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const { setDoc: firestoreSetDoc } = await import('firebase/firestore');
    await firestoreSetDoc(userRef, newUser);
    return newUser;
};

export const updateUserProfile = async (uid: string, data: Partial<Pick<CRMUser, 'phone' | 'agency' | 'bio' | 'role'>>) => {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: new Date() });
};

export const getUser = async (uid: string): Promise<CRMUser | null> => {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? (snapshot.data() as CRMUser) : null;
};

// ═══ TRIPS CRUD ═══

export const createTrip = async (tid: string, data: Omit<CRMTrip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'trips'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    await generateCalendarEventsForTrip(tid, ref.id, data);
    return ref.id;
};

export const getTrips = async (tid: string) => {
    const q = query(tenantCol(tid, 'trips'), orderBy('startDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMTrip));
};

export const updateTrip = async (tid: string, id: string, data: Partial<Omit<CRMTrip, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'trips', id), { ...data, updatedAt: new Date() });
    if (data.startDate || data.endDate) {
        const updated = await getDoc(tenantDoc(tid, 'trips', id));
        if (updated.exists()) await generateCalendarEventsForTrip(tid, id, updated.data() as CRMTrip);
    }
};

export const deleteTrip = async (tid: string, id: string) => {
    await deleteDoc(tenantDoc(tid, 'trips', id));
    await deleteCalendarEventsForSource(tid, id);
};

// ═══ LINKED QUERIES ═══

export const getLeadsForContact = async (tid: string, contactId: string) => {
    const q = query(tenantCol(tid, 'leads'), where('clientId', '==', contactId), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMLead));
};

export const getTripsForContact = async (tid: string, contactId: string) => {
    const q = query(tenantCol(tid, 'trips'), where('clientId', '==', contactId), orderBy('startDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMTrip));
};

export const getActivitiesForContact = async (tid: string, contactId: string) => {
    const q = query(tenantCol(tid, 'activities'), where('contactId', '==', contactId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const getActivitiesForLead = async (tid: string, leadId: string) => {
    const q = query(tenantCol(tid, 'activities'), where('leadId', '==', leadId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

export const getActivitiesForTrip = async (tid: string, tripId: string) => {
    const q = query(tenantCol(tid, 'activities'), where('tripId', '==', tripId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMActivity));
};

// ═══ TRIP DAYS CRUD ═══

export const createTripDay = async (tid: string, tripId: string, dayData: Omit<CRMTripDay, 'id'>) => {
    const daysColl = collection(db, 'tenants', tid, 'trips', tripId, 'days');
    const ref = await addDoc(daysColl, dayData);
    return ref.id;
};

export const getTripDays = async (tid: string, tripId: string) => {
    const daysColl = collection(db, 'tenants', tid, 'trips', tripId, 'days');
    const q = query(daysColl, orderBy('dayIndex', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMTripDay));
};

export const updateTripDay = async (tid: string, tripId: string, dayId: string, data: Partial<CRMTripDay>) => {
    const dayRef = doc(db, 'tenants', tid, 'trips', tripId, 'days', dayId);
    await updateDoc(dayRef, data as any);
};

export const deleteTripDay = async (tid: string, tripId: string, dayId: string) => {
    await deleteDoc(doc(db, 'tenants', tid, 'trips', tripId, 'days', dayId));
};

// ═══ BOOKINGS CRUD ═══

export const createBooking = async (tid: string, data: Omit<CRMBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'bookings'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    await generateCalendarEventsForBooking(tid, ref.id, data);
    return ref.id;
};

export const getBookings = async (tid: string) => {
    const q = query(tenantCol(tid, 'bookings'), orderBy('checkIn', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMBooking));
};

export const getBookingsForTrip = async (tid: string, tripId: string) => {
    const q = query(tenantCol(tid, 'bookings'), where('tripId', '==', tripId), orderBy('checkIn', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMBooking));
};

export const updateBooking = async (tid: string, id: string, data: Partial<Omit<CRMBooking, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'bookings', id), { ...data, updatedAt: new Date() });
};

export const deleteBooking = async (tid: string, id: string) => {
    await deleteDoc(tenantDoc(tid, 'bookings', id));
    await deleteCalendarEventsForSource(tid, id);
};

// ═══ CATALOG CRUD ═══

export const createCatalogItem = async (tid: string, data: Omit<CRMCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'catalog'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getCatalogItems = async (tid: string) => {
    const q = query(tenantCol(tid, 'catalog'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMCatalogItem));
};

export const updateCatalogItem = async (tid: string, id: string, data: Partial<Omit<CRMCatalogItem, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'catalog', id), { ...data, updatedAt: new Date() });
};

export const deleteCatalogItem = async (tid: string, id: string) => {
    await deleteDoc(tenantDoc(tid, 'catalog', id));
};

// ═══ INVOICES CRUD ═══

export const createInvoice = async (tid: string, data: Omit<CRMInvoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'invoices'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    await generateCalendarEventsForInvoice(tid, ref.id, data);
    return ref.id;
};

export const getInvoices = async (tid: string) => {
    const q = query(tenantCol(tid, 'invoices'), orderBy('issueDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMInvoice));
};

export const updateInvoice = async (tid: string, id: string, data: Partial<Omit<CRMInvoice, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'invoices', id), { ...data, updatedAt: new Date() });
};

// ═══ PAYMENTS CRUD ═══

export const createPayment = async (tid: string, data: Omit<CRMPayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'payments'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getPayments = async (tid: string) => {
    const q = query(tenantCol(tid, 'payments'), orderBy('paymentDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMPayment));
};

// ═══ MESSAGES CRUD ═══

export const createMessage = async (tid: string, data: Omit<CRMMessage, 'id' | 'createdAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'messages'), { ...data, createdAt: new Date() });
    return ref.id;
};

export const getMessagesForClient = async (tid: string, clientId: string) => {
    const q = query(tenantCol(tid, 'messages'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMMessage));
};

export const getAllMessages = async (tid: string) => {
    const q = query(tenantCol(tid, 'messages'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMMessage));
};

export const markMessageRead = async (tid: string, id: string) => {
    await updateDoc(tenantDoc(tid, 'messages', id), { isRead: true });
};

// ═══ DOCUMENTS CRUD ═══

export const createDocument = async (tid: string, data: Omit<CRMDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'documents'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getDocumentsForClient = async (tid: string, clientId: string) => {
    const q = query(tenantCol(tid, 'documents'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMDocument));
};

export const getAllDocuments = async (tid: string) => {
    const q = query(tenantCol(tid, 'documents'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMDocument));
};

export const deleteDocument = async (tid: string, id: string) => {
    await deleteDoc(tenantDoc(tid, 'documents', id));
};

// ═══ CAMPAIGNS CRUD ═══

export const createCampaign = async (tid: string, data: Omit<CRMCampaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'campaigns'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getCampaigns = async (tid: string) => {
    const q = query(tenantCol(tid, 'campaigns'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMCampaign));
};

// ═══ TASKS CRUD ═══

export const createTask = async (tid: string, data: Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'tasks'), { ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
};

export const getTasks = async (tid: string) => {
    const q = query(tenantCol(tid, 'tasks'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CRMTask));
};

export const updateTask = async (tid: string, id: string, data: Partial<Omit<CRMTask, 'id' | 'createdAt'>>) => {
    await updateDoc(tenantDoc(tid, 'tasks', id), { ...data, updatedAt: new Date() });
};

export const deleteTask = async (tid: string, id: string) => {
    await deleteDoc(tenantDoc(tid, 'tasks', id));
};

// ═══ CALENDAR EVENTS CRUD ═══

export const createCalendarEvent = async (tid: string, data: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const ref = await addDoc(tenantCol(tid, 'calendar_events'), { ...data, createdAt: new Date() });
    return ref.id;
};

export const getCalendarEvents = async (tid: string, startDate?: string, endDate?: string) => {
    let q;
    if (startDate && endDate) {
        q = query(tenantCol(tid, 'calendar_events'), where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'asc'));
    } else {
        q = query(tenantCol(tid, 'calendar_events'), orderBy('date', 'asc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
};

export const deleteCalendarEventsForSource = async (tid: string, sourceId: string) => {
    const q = query(tenantCol(tid, 'calendar_events'), where('sourceId', '==', sourceId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
};

// ═══ CALENDAR AUTO-GENERATION ═══

async function generateCalendarEventsForTrip(tid: string, tripId: string, trip: Partial<CRMTrip>) {
    await deleteCalendarEventsForSource(tid, tripId);
    if (!trip.startDate || !trip.endDate) return;

    await Promise.all([
        createCalendarEvent(tid, {
            title: `🛫 ${trip.title || trip.destination} — Départ`,
            type: 'TRIP_START', date: trip.startDate, color: trip.color || '#4F46E5',
            sourceType: 'trip', sourceId: tripId, clientId: trip.clientId, clientName: trip.clientName, isAllDay: true,
        }),
        createCalendarEvent(tid, {
            title: `🛬 ${trip.title || trip.destination} — Retour`,
            type: 'TRIP_END', date: trip.endDate, color: trip.color || '#4F46E5',
            sourceType: 'trip', sourceId: tripId, clientId: trip.clientId, clientName: trip.clientName, isAllDay: true,
        }),
    ]);
}

async function generateCalendarEventsForBooking(tid: string, bookingId: string, booking: Partial<CRMBooking>) {
    await deleteCalendarEventsForSource(tid, bookingId);
    const events: Promise<string>[] = [];

    if (booking.checkIn) {
        events.push(createCalendarEvent(tid, {
            title: `📋 ${booking.supplier} — ${booking.type} Check-in`,
            type: 'BOOKING_CHECKIN', date: booking.checkIn, color: '#10B981',
            sourceType: 'booking', sourceId: bookingId, clientId: booking.clientId, clientName: booking.clientName, isAllDay: true,
        }));
    }
    if (booking.checkOut) {
        events.push(createCalendarEvent(tid, {
            title: `📋 ${booking.supplier} — ${booking.type} Check-out`,
            type: 'BOOKING_CHECKOUT', date: booking.checkOut, color: '#F59E0B',
            sourceType: 'booking', sourceId: bookingId, clientId: booking.clientId, clientName: booking.clientName, isAllDay: true,
        }));
    }

    await Promise.all(events);
}

async function generateCalendarEventsForInvoice(tid: string, invoiceId: string, invoice: Partial<CRMInvoice>) {
    await deleteCalendarEventsForSource(tid, invoiceId);
    if (!invoice.dueDate) return;

    await createCalendarEvent(tid, {
        title: `💰 Facture ${invoice.invoiceNumber || ''} — Échéance`,
        type: 'INVOICE_DUE', date: invoice.dueDate, color: '#EF4444',
        sourceType: 'invoice', sourceId: invoiceId, clientId: invoice.clientId, clientName: invoice.clientName, isAllDay: true,
    });
}

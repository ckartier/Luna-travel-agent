import { db } from "./client";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { createTenant } from "./tenant";

export interface CRMLead {
  id?: string;
  clientId?: string;
  clientName?: string;
  destination: string;
  dates: string;
  budget: string;
  pax: string;
  days?: number;
  links?: { title: string; url: string }[];
  vibe?: string;
  flexibility?: string;
  mustHaves?: string;
  agentResults?: {
    transport?: any;
    accommodation?: any;
    dining?: any;
    itinerary?: any;
    client?: any;
  };
  status: "NEW" | "ANALYSING" | "PROPOSAL_READY" | "WON" | "LOST";
  tripId?: string;
  source?: string;
  cartItems?: any[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CRMContact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  communicationPreference?: "EMAIL" | "WHATSAPP";
  company?: string;
  vipLevel: "Standard" | "Premium" | "VIP" | "Elite";
  preferences: string[];
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  lifetimeValue?: number;
  dietary?: string;
  seatPreference?: string;
  roomPreference?: string;
  loyaltyTier?: "Bronze" | "Silver" | "Gold" | "Platinum";
  profileAnalysis?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CRMActivity {
  id?: string;
  type: "urgent" | "call" | "email" | "meeting" | "message" | "done" | "normal";
  title: string;
  time: string;
  status: "PENDING" | "DONE";
  color: "red" | "blue" | "purple" | "emerald" | "amber" | "gray";
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
  status:
  | "DRAFT"
  | "PROPOSAL"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
  paymentStatus: "UNPAID" | "DEPOSIT" | "PAID";
  amount: number;
  cost?: number;
  margin?: number;
  travelers?: number;
  notes: string;
  color: string;
  shareId?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ScheduledTripMessage {
  id?: string;
  scheduledDate: string; // ISO date string
  daysBeforeDeparture: number; // e.g. 30, 7, 1, 0
  title: string; // e.g. "J-30", "J-7", "La veille"
  message: string; // The actual message text
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  sent: boolean;
  sentAt?: string; // ISO date when actually sent
}

export interface CRMTripSegment {
  id: string;
  type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "TRAIN";
  title: string;
  timeSlot: "Morning" | "Afternoon" | "Evening" | "Night" | string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  bookingUrl?: string;
  cost?: number;   // Legacy — use netCost instead
  price?: number;  // Legacy — use clientPrice instead
  bookingId?: string; // Legacy — use supplierBookingId instead

  // ═══ FUSION: Liens Prestation / Prestataire ═══
  catalogItemId?: string;       // → CRMCatalogItem.id
  supplierId?: string;          // → CRMSupplier.id
  supplierBookingId?: string;   // → CRMSupplierBooking.id

  // ═══ FUSION: Financier ═══
  netCost?: number;             // Coût fournisseur (depuis CatalogItem ou manuel)
  clientPrice?: number;         // Prix client (netCost + marge)
  markupPercent?: number;       // Marge appliquée en %

  // ═══ FUSION: Statut Booking ═══
  bookingStatus?: "NONE" | "PROPOSED" | "CONFIRMED" | "CANCELLED";
  confirmationNumber?: string;

  // ═══ TRANSPORT: Aller / Retour ═══
  outboundLocation?: string;
  outboundDestination?: string;
  outboundTime?: string;
  returnLocation?: string;
  returnDestination?: string;
  returnTime?: string;
  returnEnabled?: boolean;
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
  type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER";
  supplier: string;
  destination: string;
  confirmationNumber: string;
  pnr?: string;
  checkIn: string;
  checkOut?: string;
  status: "PENDING" | "CONFIRMED" | "TICKETED" | "CANCELLED" | "REFUNDED";
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
  type: "HOTEL" | "FLIGHT" | "ACTIVITY" | "TRANSFER" | "OTHER";
  name: string;
  supplier: string;
  location: string;
  description: string;
  netCost: number;
  recommendedMarkup: number;
  currency: string;
  images?: string[];
  imageUrl?: string; // Single hero image URL
  video?: string; // Video URL
  concierge?: string; // Nom du concierge / contact principal
  phone?: string; // Téléphone
  email?: string; // Email
  website?: string; // Site web
  address?: string; // Adresse
  supplierId?: string; // Lien vers l'ID du prestataire (Hôtel, Guide, etc.)

  // ═══ TRANSPORT: Tarification Avancée ═══
  pricingMode?: "ONE_WAY" | "ROUND_TRIP" | "HOURLY";
  oneWayPrice?: number;
  roundTripPrice?: number;
  hourlyPrice?: number;

  // ═══ AI: Multimodal Embedding Vector ═══
  embedding?: number[];
}

export interface CRMSupplierBooking {
  id?: string;
  supplierId: string;
  prestationId: string;
  prestationName: string;
  clientId?: string;
  clientName?: string;
  date: string; // ISO YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  status:
  | "PROPOSED"
  | "CONFIRMED"
  | "TERMINATED"
  | "CANCELLED"
  | "CANCELLED_LATE";
  prestationType?:
  | "HOTEL"
  | "FLIGHT"
  | "ACTIVITY"
  | "TRANSFER"
  | "RESTAURANT"
  | "EXPERIENCE"
  | "OTHER";
  rate: number;
  extraFees?: number;
  pickupLocation?: string; // Client pickup point
  numberOfGuests?: number; // Number of guests
  notes?: string;
  // Reminder tracking
  reminderJ1Sent?: boolean; // 24h reminder sent
  reminderH3Sent?: boolean; // 3h reminder sent
  // Cancellation metadata
  cancelledAt?: Date | Timestamp;
  cancelledLate?: boolean; // true if cancelled < 1h before
  reassignedTo?: string; // new supplier ID if reassigned
  reassignedFrom?: string; // old booking ID if this is a reassignment
  supplierResponse?: {
    confirmed: boolean;
    respondedAt: Date;
    respondedBy: string;
    respondedPhone: string;
  };
  // ═══ TRANSPORT: Aller / Retour ═══
  outboundLocation?: string;
  outboundDestination?: string;
  outboundTime?: string;
  returnLocation?: string;
  returnDestination?: string;
  returnTime?: string;
  returnEnabled?: boolean;
  pricingMode?: "ONE_WAY" | "ROUND_TRIP" | "HOURLY";
  createdAt: Timestamp | Date;
}

export interface CRMInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export interface CRMQuoteItem {
  description: string;
  quantity: number;
  netCost: number; // Coût HT payé au prestataire
  unitPrice: number; // Prix HT vendu au client
  total: number;
  taxRate: number;
}

export interface CRMQuote {
  id?: string;
  quoteNumber: string;
  tripId: string;
  clientId: string;
  clientName: string;
  leadId?: string; // Link to pipeline lead
  issueDate: string;
  validUntil: string;
  items: CRMQuoteItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  currency: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  notes?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CRMInvoice {
  id?: string;
  invoiceNumber: string;
  type?: "CLIENT" | "SUPPLIER"; // Distinguish client invoices from supplier invoices
  tripId: string;
  clientId: string;
  clientName: string;
  supplierId?: string; // For supplier invoices
  supplierName?: string; // For supplier invoices
  issueDate: string;
  dueDate: string;
  items: CRMInvoiceItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
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
  method: "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "STRIPE";
  paymentDate: string;
  referenceId?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ═══ COMMUNICATION & DOCUMENTS ═══

export interface CRMMessage {
  id?: string;
  clientId: string;
  clientName: string;
  channel: "EMAIL" | "WHATSAPP" | "SMS" | "CHAT";
  direction: "INBOUND" | "OUTBOUND";
  recipientType?: "CLIENT" | "SUPPLIER";
  content: string;
  senderId?: string;
  attachments?: string[];
  isRead: boolean;
  bookingId?: string;
  prestationName?: string;
  buttonReply?: { id: string; title: string; confirmed: boolean };
  createdAt: Timestamp | Date;
}

export interface CRMDocument {
  id?: string;
  clientId: string;
  tripId?: string;
  type: "PASSPORT" | "VISA" | "CONTRACT" | "TICKET" | "OTHER";
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
  channel: "EMAIL" | "SMS";
  targetAudience: string[];
  subject?: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "SENT";
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
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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
  type:
  | "TRIP_START"
  | "TRIP_END"
  | "BOOKING_CHECKIN"
  | "BOOKING_CHECKOUT"
  | "INVOICE_DUE"
  | "TASK_DEADLINE"
  | "MEETING"
  | "FOLLOW_UP";
  date: string;
  time?: string;
  endDate?: string;
  color: string;
  sourceType: "trip" | "booking" | "invoice" | "task";
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

const tenantCol = (tenantId: string, name: string) =>
  collection(db, "tenants", tenantId, name);
const tenantDoc = (tenantId: string, colName: string, docId: string) =>
  doc(db, "tenants", tenantId, colName, docId);

// ═══ LEADS CRUD ═══

export const createLead = async (
  tid: string,
  data: Omit<CRMLead, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "leads"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getLeads = async (tid: string) => {
  const q = query(tenantCol(tid, "leads"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  const leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMLead);

  // Data Audit: Dynamically link leads to their latest contact info if clientId exists
  const contactSnap = await getDocs(tenantCol(tid, "contacts"));
  const contactMap = new Map(
    contactSnap.docs.map((d) => [d.id, d.data() as CRMContact]),
  );

  return leads.map((l) => {
    if (l.clientId && contactMap.has(l.clientId)) {
      const c = contactMap.get(l.clientId)!;
      return { ...l, clientName: `${c.firstName} ${c.lastName}` };
    }
    return l;
  });
};

export const updateLeadStatus = async (
  tid: string,
  id: string,
  status: CRMLead["status"],
) => {
  await updateDoc(tenantDoc(tid, "leads", id), {
    status,
    updatedAt: new Date(),
  });
};

export const updateLead = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMLead, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "leads", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteLead = async (tid: string, id: string) => {
  const deletePromises: Promise<void>[] = [];

  try {
    // 1. Cascade: delete all activities linked to this lead
    const actSnap = await getDocs(
      query(tenantCol(tid, "activities"), where("leadId", "==", id)),
    );
    deletePromises.push(...actSnap.docs.map((d) => deleteDoc(d.ref)));

    // 2. Cascade: delete calendar events linked to this lead
    const calSnap = await getDocs(
      query(tenantCol(tid, "calendar"), where("sourceId", "==", id)),
    );
    deletePromises.push(...calSnap.docs.map((d) => deleteDoc(d.ref)));

    // 3. Get the lead to check for linked tripId
    const leadRef = tenantDoc(tid, "leads", id);
    const leadSnap = await getDoc(leadRef);
    const leadData = leadSnap.exists() ? (leadSnap.data() as CRMLead) : null;

    if (leadData?.tripId) {
      const tripId = leadData.tripId;

      // 3a. Delete trip days (sub-collection)
      const daysColl = collection(db, "tenants", tid, "trips", tripId, "days");
      const daysSnap = await getDocs(daysColl);
      deletePromises.push(...daysSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3b. Delete bookings linked to this trip
      const bookSnap = await getDocs(
        query(tenantCol(tid, "bookings"), where("tripId", "==", tripId)),
      );
      deletePromises.push(...bookSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3c. Delete quotes linked to this trip
      const quoteSnap = await getDocs(
        query(tenantCol(tid, "quotes"), where("tripId", "==", tripId)),
      );
      deletePromises.push(...quoteSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3d. Delete invoices linked to this trip
      const invSnap = await getDocs(
        query(tenantCol(tid, "invoices"), where("tripId", "==", tripId)),
      );
      deletePromises.push(...invSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3e. Delete calendar events for the trip
      const tripCalSnap = await getDocs(
        query(tenantCol(tid, "calendar"), where("sourceId", "==", tripId)),
      );
      deletePromises.push(...tripCalSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3f. Delete activities linked to the trip
      const tripActSnap = await getDocs(
        query(tenantCol(tid, "activities"), where("tripId", "==", tripId)),
      );
      deletePromises.push(...tripActSnap.docs.map((d) => deleteDoc(d.ref)));

      // 3g. Delete the trip itself
      deletePromises.push(deleteDoc(tenantDoc(tid, "trips", tripId)));
    }

    // 4. Delete the lead itself
    deletePromises.push(deleteDoc(leadRef));

    await Promise.all(deletePromises);
  } catch (e) {
    console.error("Error in deleteLead:", e);
    // Fallback: at least try to delete the lead itself if cascade fails
    try {
      await deleteDoc(tenantDoc(tid, "leads", id));
    } catch (innerError) {
      console.error("Even single delete failed:", innerError);
    }
  }
};

// ═══ CONTACTS CRUD ═══

export const createContact = async (
  tid: string,
  data: Omit<CRMContact, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "contacts"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getContacts = async (tid: string) => {
  const q = query(tenantCol(tid, "contacts"), orderBy("lastName", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMContact);
};

export const findContactByEmail = async (
  tid: string,
  email: string,
): Promise<CRMContact | null> => {
  const q = query(
    tenantCol(tid, "contacts"),
    where("email", "==", email.toLowerCase().trim()),
  );
  const snap = await getDocs(q);
  return snap.empty
    ? null
    : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as CRMContact);
};

export const updateContact = async (
  tid: string,
  contactId: string,
  data: Partial<CRMContact>,
) => {
  const ref = doc(db, "tenants", tid, "contacts", contactId);
  await updateDoc(ref, { ...data, updatedAt: new Date() });
};

export const deleteContact = async (tid: string, contactId: string) => {
  const deletePromises: Promise<void>[] = [];

  try {
    // 1. Cascade: delete leads linked to this contact
    const leadsSnap = await getDocs(
      query(tenantCol(tid, "leads"), where("clientId", "==", contactId)),
    );
    deletePromises.push(...leadsSnap.docs.map((d) => deleteDoc(d.ref)));

    // 2. Cascade: delete messages linked to this contact
    const msgSnap = await getDocs(
      query(tenantCol(tid, "messages"), where("clientId", "==", contactId)),
    );
    deletePromises.push(...msgSnap.docs.map((d) => deleteDoc(d.ref)));

    // 3. Cascade: delete documents linked to this contact
    const docSnap = await getDocs(
      query(tenantCol(tid, "documents"), where("clientId", "==", contactId)),
    );
    deletePromises.push(...docSnap.docs.map((d) => deleteDoc(d.ref)));

    // 4. Cascade: delete invoices linked to this contact
    const invSnap = await getDocs(
      query(tenantCol(tid, "invoices"), where("clientId", "==", contactId)),
    );
    deletePromises.push(...invSnap.docs.map((d) => deleteDoc(d.ref)));

    // 5. Cascade: delete quotes linked to this contact
    const quoteSnap = await getDocs(
      query(tenantCol(tid, "quotes"), where("clientId", "==", contactId)),
    );
    deletePromises.push(...quoteSnap.docs.map((d) => deleteDoc(d.ref)));

    // 6. Delete the contact itself
    deletePromises.push(deleteDoc(tenantDoc(tid, "contacts", contactId)));

    await Promise.all(deletePromises);
  } catch (e) {
    console.error("Error in deleteContact:", e);
    try {
      await deleteDoc(tenantDoc(tid, "contacts", contactId));
    } catch (innerError) {
      console.error("Even single delete failed:", innerError);
    }
  }
};

// ═══ ACTIVITIES CRUD ═══

export const createActivity = async (
  tid: string,
  data: Omit<CRMActivity, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "activities"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getActivities = async (tid: string) => {
  const q = query(tenantCol(tid, "activities"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMActivity);
};

export const updateActivityStatus = async (
  tid: string,
  id: string,
  status: CRMActivity["status"],
) => {
  await updateDoc(tenantDoc(tid, "activities", id), {
    status,
    updatedAt: new Date(),
  });
};

// ═══ USER PROFILE (global — NOT tenant-scoped) ═══

export interface CRMUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: "Agent" | "Admin" | "Manager" | "SuperAdmin";
  agency: string;
  phone: string;
  bio: string;
  tenantId: string;
  language?: "fr" | "en" | "da" | "nl" | "es";
  emailTemplate?: "pro" | "minimalist" | "classic";
  emailSignature?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export const getOrCreateUser = async (firebaseUser: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<CRMUser> => {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as CRMUser;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const hasCustomPhoto =
      data.photoURL && data.photoURL.includes("firebasestorage");
    if (
      firebaseUser.photoURL &&
      firebaseUser.photoURL !== data.photoURL &&
      !hasCustomPhoto
    ) {
      updates.photoURL = firebaseUser.photoURL;
    }
    if (
      firebaseUser.displayName &&
      firebaseUser.displayName !== data.displayName
    ) {
      updates.displayName = firebaseUser.displayName;
    }
    if (Object.keys(updates).length > 1) {
      await updateDoc(userRef, updates);
    }

    // SuperAdmin auto-promotion for existing users
    const SUPER_ADMIN_EMAILS = ["ckartier@gmail.com"];
    if (
      SUPER_ADMIN_EMAILS.includes((firebaseUser.email || "").toLowerCase()) &&
      data.role !== "SuperAdmin"
    ) {
      await updateDoc(userRef, { role: "SuperAdmin" });
      data.role = "SuperAdmin";
    }

    let result = { ...data, ...updates } as CRMUser;
    if (!result.tenantId) {
      const tenantId = await createTenant(
        firebaseUser.uid,
        firebaseUser.email || data.email || "",
        firebaseUser.displayName || data.displayName || "Utilisateur",
      );
      await updateDoc(userRef, { tenantId });
      result = { ...result, tenantId };
    }
    return result;
  }

  const tenantId = await createTenant(
    firebaseUser.uid,
    firebaseUser.email || "",
    firebaseUser.displayName || "Utilisateur",
  );

  // SuperAdmin auto-assignment
  const SUPER_ADMIN_EMAILS = ["ckartier@gmail.com"];
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(
    (firebaseUser.email || "").toLowerCase(),
  );

  const newUser: CRMUser = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || "Utilisateur",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || null,
    role: isSuperAdmin ? "SuperAdmin" : "Agent",
    agency: "",
    phone: "",
    bio: "",
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { setDoc: firestoreSetDoc } = await import("firebase/firestore");
  await firestoreSetDoc(userRef, newUser);
  return newUser;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<
    Pick<CRMUser, "phone" | "agency" | "bio" | "role" | "language" | "tenantId" | "emailTemplate" | "emailSignature">
  >,
) => {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: new Date() });
};

export const joinTenant = async (
  uid: string,
  tenantId: string,
  role: string,
  email: string,
  displayName: string,
) => {
  // 1. Ensure user document exists and has the correct tenant and role
  // We do this FIRST so that firestore rules (isTenantMember) allow the next step
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      uid,
      email,
      displayName,
      tenantId,
      role: role === "admin" ? "Admin" : "Agent",
      updatedAt: new Date(),
    },
    { merge: true },
  );

  // 2. Add as a member to the tenant document
  const { addTenantMember, getTenant, removeTenantMember } =
    await import("./tenant");

  // Clean up any "fake" invitation entry with same email
  try {
    const tenant = await getTenant(tenantId);
    if (tenant?.members) {
      const fakeUid = Object.keys(tenant.members).find(
        (key) =>
          key.startsWith("invited_") &&
          tenant.members[key].email.toLowerCase() === email.toLowerCase(),
      );
      if (fakeUid) {
        await removeTenantMember(tenantId, fakeUid);
      }
    }
  } catch (e) {
    console.error("Failed to cleanup fake invitation:", e);
  }

  await addTenantMember(tenantId, uid, email, displayName, role as any);
};

export const getUser = async (uid: string): Promise<CRMUser | null> => {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as CRMUser) : null;
};

// ═══ TRIPS CRUD ═══

export const createTrip = async (
  tid: string,
  data: Omit<CRMTrip, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "trips"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await generateCalendarEventsForTrip(tid, ref.id, data);
  return ref.id;
};

export const getTrips = async (tid: string) => {
  const q = query(tenantCol(tid, "trips"), orderBy("startDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMTrip);
};

export const getTrip = async (tid: string, tripId: string): Promise<CRMTrip | null> => {
  const snap = await getDoc(tenantDoc(tid, "trips", tripId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CRMTrip;
};

export const updateTrip = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMTrip, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "trips", id), {
    ...data,
    updatedAt: new Date(),
  });
  if (data.startDate || data.endDate) {
    const updated = await getDoc(tenantDoc(tid, "trips", id));
    if (updated.exists())
      await generateCalendarEventsForTrip(tid, id, updated.data() as CRMTrip);
  }
};

// ═══ SHARE TRIP PUBLICLY ═══

/**
 * Generate a short share ID and create a public snapshot in top-level 'sharedTrips'
 * collection so it can be accessed without auth via /trip/[shareId]
 */
export const shareTripPublic = async (
  tid: string,
  tripId: string,
): Promise<string> => {
  // Check if already shared
  const tripRef = tenantDoc(tid, "trips", tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists()) throw new Error("Trip not found");
  const trip = tripSnap.data() as CRMTrip;

  // If already has a shareId, return it
  if (trip.shareId) return trip.shareId;

  // Generate a unique short ID
  const shareId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // Get trip days
  const daysColl = collection(db, "tenants", tid, "trips", tripId, "days");
  const daysSnap = await getDocs(query(daysColl, orderBy("dayIndex", "asc")));
  const days = daysSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Get bookings for this trip
  const bookingsSnap = await getDocs(
    query(tenantCol(tid, "bookings"), where("tripId", "==", tripId))
  );
  const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Store public snapshot in top-level collection (no auth needed to read)
  const sharedRef = doc(db, "sharedTrips", shareId);
  const tripSnapshot: Record<string, any> = {
    title: trip.title,
    destination: trip.destination,
    clientName: trip.clientName,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
  };
  if (trip.travelers != null) tripSnapshot.travelers = trip.travelers;

  await setDoc(sharedRef, {
    shareId,
    tenantId: tid,
    tripId,
    trip: tripSnapshot,
    days,
    bookings: bookings.map(b => ({
      type: (b as any).type,
      supplier: (b as any).supplier,
      destination: (b as any).destination,
      checkIn: (b as any).checkIn,
      checkOut: (b as any).checkOut,
      status: (b as any).status,
    })),
    createdAt: new Date(),
  });

  // Save shareId back to the trip
  await updateDoc(tripRef, { shareId, updatedAt: new Date() });

  return shareId;
};

/**
 * Refresh the public snapshot with latest trip data
 */
export const refreshSharedTrip = async (tid: string, tripId: string): Promise<void> => {
  const tripRef = tenantDoc(tid, "trips", tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists()) return;
  const trip = tripSnap.data() as CRMTrip;
  if (!trip.shareId) return;

  const daysColl = collection(db, "tenants", tid, "trips", tripId, "days");
  const daysSnap = await getDocs(query(daysColl, orderBy("dayIndex", "asc")));
  const days = daysSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const bookingsSnap = await getDocs(
    query(tenantCol(tid, "bookings"), where("tripId", "==", tripId))
  );
  const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const sharedRef = doc(db, "sharedTrips", trip.shareId);
  const tripSnapshot: Record<string, any> = {
    title: trip.title,
    destination: trip.destination,
    clientName: trip.clientName,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
  };
  if (trip.travelers != null) tripSnapshot.travelers = trip.travelers;

  await setDoc(sharedRef, {
    shareId: trip.shareId,
    tenantId: tid,
    tripId,
    trip: tripSnapshot,
    days,
    bookings: bookings.map(b => ({
      type: (b as any).type,
      supplier: (b as any).supplier,
      destination: (b as any).destination,
      checkIn: (b as any).checkIn,
      checkOut: (b as any).checkOut,
      status: (b as any).status,
    })),
    updatedAt: new Date(),
  }, { merge: true });
};

/**
 * Get shared trip data by shareId (public, no auth)
 */
export const getSharedTrip = async (shareId: string) => {
  const sharedRef = doc(db, "sharedTrips", shareId);
  const snap = await getDoc(sharedRef);
  if (!snap.exists()) return null;
  return snap.data();
};

// ═══ SCHEDULED TRIP MESSAGES ═══

/**
 * Add a scheduled message to a shared trip
 */
export const addScheduledMessage = async (
  shareId: string,
  msg: Omit<ScheduledTripMessage, 'id' | 'sent'>
): Promise<void> => {
  const sharedRef = doc(db, "sharedTrips", shareId);
  const snap = await getDoc(sharedRef);
  if (!snap.exists()) throw new Error("Shared trip not found");

  const data = snap.data();
  const messages: ScheduledTripMessage[] = data.scheduledMessages || [];
  const newMsg: ScheduledTripMessage = {
    ...msg,
    id: `msg-${Date.now().toString(36)}`,
    sent: false,
  };
  messages.push(newMsg);
  // Sort by date ascending
  messages.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  await updateDoc(sharedRef, { scheduledMessages: messages });
};

/**
 * Update a scheduled message
 */
export const updateScheduledMessage = async (
  shareId: string,
  msgId: string,
  updates: Partial<ScheduledTripMessage>
): Promise<void> => {
  const sharedRef = doc(db, "sharedTrips", shareId);
  const snap = await getDoc(sharedRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const messages: ScheduledTripMessage[] = (data.scheduledMessages || []).map(
    (m: ScheduledTripMessage) => m.id === msgId ? { ...m, ...updates } : m
  );
  await updateDoc(sharedRef, { scheduledMessages: messages });
};

/**
 * Delete a scheduled message
 */
export const deleteScheduledMessage = async (
  shareId: string,
  msgId: string
): Promise<void> => {
  const sharedRef = doc(db, "sharedTrips", shareId);
  const snap = await getDoc(sharedRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const messages: ScheduledTripMessage[] = (data.scheduledMessages || []).filter(
    (m: ScheduledTripMessage) => m.id !== msgId
  );
  await updateDoc(sharedRef, { scheduledMessages: messages });
};

/**
 * Get all scheduled messages for a shared trip
 */
export const getScheduledMessages = async (shareId: string): Promise<ScheduledTripMessage[]> => {
  const sharedRef = doc(db, "sharedTrips", shareId);
  const snap = await getDoc(sharedRef);
  if (!snap.exists()) return [];
  return snap.data().scheduledMessages || [];
};

export const deleteTrip = async (tid: string, id: string) => {
  const deletePromises: Promise<void>[] = [];

  // Cascade: delete trip days (sub-collection)
  const daysColl = collection(db, "tenants", tid, "trips", id, "days");
  const daysSnap = await getDocs(daysColl);
  deletePromises.push(...daysSnap.docs.map((d) => deleteDoc(d.ref)));

  // Cascade: delete bookings linked to this trip
  const bookSnap = await getDocs(
    query(tenantCol(tid, "bookings"), where("tripId", "==", id)),
  );
  deletePromises.push(...bookSnap.docs.map((d) => deleteDoc(d.ref)));

  // Cascade: delete activities linked to this trip
  const actSnap = await getDocs(
    query(tenantCol(tid, "activities"), where("tripId", "==", id)),
  );
  deletePromises.push(...actSnap.docs.map((d) => deleteDoc(d.ref)));

  // Cascade: delete calendar events
  await deleteCalendarEventsForSource(tid, id);

  // Cascade: delete quotes linked to this trip
  const quoteSnap = await getDocs(
    query(tenantCol(tid, "quotes"), where("tripId", "==", id)),
  );
  deletePromises.push(...quoteSnap.docs.map((d) => deleteDoc(d.ref)));

  // Cascade: delete invoices linked to this trip
  const invSnap = await getDocs(
    query(tenantCol(tid, "invoices"), where("tripId", "==", id)),
  );
  deletePromises.push(...invSnap.docs.map((d) => deleteDoc(d.ref)));

  // Delete the trip itself
  deletePromises.push(deleteDoc(tenantDoc(tid, "trips", id)));

  await Promise.all(deletePromises);
};

// ═══ LINKED QUERIES ═══

export const getLeadsForContact = async (
  tid: string,
  contactId: string,
  contactName?: string,
) => {
  // First try by clientId (no orderBy to avoid composite index)
  const q = query(tenantCol(tid, "leads"), where("clientId", "==", contactId));
  const snap = await getDocs(q);
  let leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMLead);

  // Fallback: also search by clientName if no results and name provided
  if (leads.length === 0 && contactName) {
    const q2 = query(
      tenantCol(tid, "leads"),
      where("clientName", "==", contactName),
    );
    const snap2 = await getDocs(q2);
    leads = snap2.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMLead);
  }

  // Sort client-side to avoid composite index requirement
  return leads.sort((a, b) => {
    const aTime =
      a.updatedAt instanceof Date
        ? a.updatedAt.getTime()
        : (a.updatedAt as any)?.toMillis?.() || 0;
    const bTime =
      b.updatedAt instanceof Date
        ? b.updatedAt.getTime()
        : (b.updatedAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
};

export const getTripsForContact = async (tid: string, contactId: string) => {
  const q = query(tenantCol(tid, "trips"), where("clientId", "==", contactId));
  const snap = await getDocs(q);
  const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMTrip);
  return trips.sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  );
};

export const getActivitiesForContact = async (
  tid: string,
  contactId: string,
) => {
  const q = query(
    tenantCol(tid, "activities"),
    where("contactId", "==", contactId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMActivity);
};

export const getActivitiesForLead = async (tid: string, leadId: string) => {
  const q = query(
    tenantCol(tid, "activities"),
    where("leadId", "==", leadId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMActivity);
};

export const getActivitiesForTrip = async (tid: string, tripId: string) => {
  const q = query(
    tenantCol(tid, "activities"),
    where("tripId", "==", tripId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMActivity);
};

// ═══ TRIP DAYS CRUD ═══

export const createTripDay = async (
  tid: string,
  tripId: string,
  dayData: Omit<CRMTripDay, "id">,
) => {
  const daysColl = collection(db, "tenants", tid, "trips", tripId, "days");
  const ref = await addDoc(daysColl, dayData);
  return ref.id;
};

export const getTripDays = async (tid: string, tripId: string) => {
  const daysColl = collection(db, "tenants", tid, "trips", tripId, "days");
  const q = query(daysColl, orderBy("dayIndex", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMTripDay);
};

export const updateTripDay = async (
  tid: string,
  tripId: string,
  dayId: string,
  data: Partial<CRMTripDay>,
) => {
  const dayRef = doc(db, "tenants", tid, "trips", tripId, "days", dayId);
  await updateDoc(dayRef, data as any);
};

export const deleteTripDay = async (
  tid: string,
  tripId: string,
  dayId: string,
) => {
  await deleteDoc(doc(db, "tenants", tid, "trips", tripId, "days", dayId));
};

// ═══ BOOKINGS CRUD ═══

export const createBooking = async (
  tid: string,
  data: Omit<CRMBooking, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "bookings"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await generateCalendarEventsForBooking(tid, ref.id, data);
  return ref.id;
};

export const getBookings = async (tid: string) => {
  const q = query(tenantCol(tid, "bookings"), orderBy("checkIn", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMBooking);
};

export const getBookingsForTrip = async (tid: string, tripId: string) => {
  const q = query(
    tenantCol(tid, "bookings"),
    where("tripId", "==", tripId),
    orderBy("checkIn", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMBooking);
};

export const updateBooking = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMBooking, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "bookings", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteBooking = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "bookings", id));
  await deleteCalendarEventsForSource(tid, id);
};

// ═══ CATALOG CRUD ═══

export const createCatalogItem = async (
  tid: string,
  data: Omit<CRMCatalogItem, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "catalog"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getCatalogItems = async (tid: string) => {
  const q = query(tenantCol(tid, "catalog"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMCatalogItem);
};

export const updateCatalogItem = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMCatalogItem, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "catalog", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteCatalogItem = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "catalog", id));
};

// ═══ COLLECTIONS (Voyages Exclusifs) CRUD ═══

export interface CRMCollection {
  id?: string;
  name: string;
  date: string;
  location: string;
  description: string;
  images: string[];
  video?: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export const createCollection = async (
  tid: string,
  data: Omit<CRMCollection, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "collections"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getCollections = async (tid: string) => {
  const q = query(tenantCol(tid, "collections"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMCollection);
};

export const updateCollection = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMCollection, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "collections", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteCollection = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "collections", id));
};

// ═══ INVOICES CRUD ═══

export const createInvoice = async (
  tid: string,
  data: Omit<CRMInvoice, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "invoices"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await generateCalendarEventsForInvoice(tid, ref.id, data);
  return ref.id;
};

export const getInvoices = async (
  tid: string,
  type?: "CLIENT" | "SUPPLIER",
) => {
  let q;
  if (type) {
    // Filter by type. Also include invoices without type field for backward compat (treated as CLIENT)
    if (type === "CLIENT") {
      // Get all invoices and filter client-side for backward compat
      q = query(tenantCol(tid, "invoices"), orderBy("issueDate", "desc"));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as CRMInvoice)
        .filter((inv) => !inv.type || inv.type === "CLIENT");
    } else {
      q = query(
        tenantCol(tid, "invoices"),
        where("type", "==", "SUPPLIER"),
        orderBy("issueDate", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMInvoice);
    }
  }
  q = query(tenantCol(tid, "invoices"), orderBy("issueDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMInvoice);
};

export const updateInvoice = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMInvoice, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "invoices", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteInvoice = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "invoices", id));
};

// ═══ QUOTES CRUD ═══

export const createQuote = async (
  tid: string,
  data: Omit<CRMQuote, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "quotes"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Data Audit: Cross-log this quote creation to the client's activity timeline
  await createActivity(tid, {
    title: `Devis émis: ${data.quoteNumber}`,
    time: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: "email",
    color: "emerald",
    status: "DONE",
    iconName: "Mail",
    contactId: data.clientId,
    contactName: data.clientName,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  return ref.id;
};

export const getQuotes = async (tid: string) => {
  const q = query(tenantCol(tid, "quotes"), orderBy("issueDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMQuote);
};

export const updateQuote = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMQuote, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "quotes", id), {
    ...data,
    updatedAt: new Date(),
  });

  // Transition Logic: If quote is accepted, automatically generate an invoice
  if (data.status === "ACCEPTED") {
    const quoteSnap = await getDoc(tenantDoc(tid, "quotes", id));
    if (quoteSnap.exists()) {
      const quote = { id: quoteSnap.id, ...quoteSnap.data() } as CRMQuote;
      await createInvoiceFromQuote(tid, quote);

      // Also update trip status if exists
      if (quote.tripId) {
        await updateTrip(tid, quote.tripId, { status: "CONFIRMED" });
      }
    }
  }
};

export const deleteQuote = async (tid: string, id: string) => {
  const deletePromises: Promise<void>[] = [];

  // Read the quote to get its quoteNumber for matching invoices
  const quoteRef = tenantDoc(tid, "quotes", id);
  const quoteSnap = await getDoc(quoteRef);
  if (quoteSnap.exists()) {
    const quoteData = quoteSnap.data();
    // Cascade: delete invoices created from this quote (matched by clientId + similar amount)
    if (quoteData.clientId) {
      const invSnap = await getDocs(
        query(tenantCol(tid, "invoices"), where("clientId", "==", quoteData.clientId)),
      );
      // Only delete invoices with matching tripId (if set) to avoid deleting unrelated invoices
      invSnap.docs.forEach((d) => {
        const inv = d.data();
        if (quoteData.tripId && inv.tripId === quoteData.tripId) {
          deletePromises.push(deleteDoc(d.ref));
        }
      });
    }
  }

  deletePromises.push(deleteDoc(quoteRef));
  await Promise.all(deletePromises);
};

/**
 * Creates an invoice based on an accepted quote.
 */
export const createInvoiceFromQuote = async (tid: string, quote: CRMQuote) => {
  const invoiceData: Omit<CRMInvoice, "id" | "createdAt" | "updatedAt"> = {
    invoiceNumber: `INV-${quote.quoteNumber.split("-")[1] || Date.now().toString().slice(-6)}`,
    tripId: quote.tripId,
    clientId: quote.clientId,
    clientName: quote.clientName,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10), // +7 days
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      taxRate: item.taxRate,
    })),
    subtotal: quote.subtotal,
    taxTotal: quote.taxTotal,
    totalAmount: quote.totalAmount,
    currency: quote.currency,
    amountPaid: 0,
    status: "SENT",
    notes: `Facture générée depuis le devis ${quote.quoteNumber}. ${quote.notes || ""}`,
  };

  return await createInvoice(tid, invoiceData);
};

/**
 * Creates an invoice from a confirmed supplier booking.
 * Auto-called when a booking status transitions to CONFIRMED.
 */
export const createInvoiceFromBooking = async (
  tid: string,
  booking: CRMSupplierBooking,
  supplierName: string,
) => {
  const bookingDate = new Date(booking.date);
  const invoiceData: Omit<CRMInvoice, "id" | "createdAt" | "updatedAt"> = {
    invoiceNumber: `INV-P${Date.now().toString().slice(-6)}`,
    type: "SUPPLIER",
    tripId: "", // Will be linked if trip exists
    clientId: booking.supplierId,
    clientName: supplierName,
    supplierId: booking.supplierId,
    supplierName: supplierName,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(bookingDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10), // +30 days
    items: [
      {
        description: `${booking.prestationName}${booking.startTime ? ` à ${booking.startTime}` : ""} — ${supplierName} (${booking.date})`,
        quantity: (booking as any).numberOfGuests || 1,
        unitPrice: booking.rate,
        total: booking.rate * ((booking as any).numberOfGuests || 1),
        taxRate: 0,
      },
    ],
    subtotal: booking.rate * ((booking as any).numberOfGuests || 1),
    taxTotal: 0,
    totalAmount:
      booking.rate * ((booking as any).numberOfGuests || 1) +
      (booking.extraFees || 0),
    currency: "EUR",
    amountPaid: 0,
    status: "DRAFT",
    notes: `Facture fournisseur auto-générée — Prestation confirmée par ${supplierName}.\nDate: ${booking.date} ${booking.startTime || ""} - ${booking.endTime || ""}\n${(booking as any).pickupLocation ? `Lieu: ${(booking as any).pickupLocation}` : ""}\nBooking ID: ${booking.id || "N/A"}`,
  };

  const invoiceId = await createInvoice(tid, invoiceData);

  // Link invoice to booking
  if (booking.id) {
    await updateSupplierBooking(tid, booking.id, {
      notes:
        `${booking.notes || ""}\n📄 Facture: ${invoiceData.invoiceNumber}`.trim(),
    } as any);
  }

  return invoiceId;
};

/**
 * Creates a quote from a pipeline lead's agent results.
 * Called when agent results are generated.
 */
export const createQuoteFromLead = async (tid: string, lead: CRMLead) => {
  if (!lead.id) return null;

  // Check if a quote already exists for this lead
  const existingQ = query(
    tenantCol(tid, "quotes"),
    where("leadId", "==", lead.id),
  );
  const existingSnap = await getDocs(existingQ);
  if (existingSnap.docs.length > 0) {
    // Update existing quote
    const existingId = existingSnap.docs[0].id;
    const budget =
      parseInt(String(lead.budget || "0").replace(/[^\d]/g, "")) || 0;
    await updateQuote(tid, existingId, {
      clientName: lead.clientName || "Client",
      totalAmount: budget,
      subtotal: budget,
      status: "DRAFT",
    });
    return existingId;
  }

  const budget =
    parseInt(String(lead.budget || "0").replace(/[^\d]/g, "")) || 0;
  const items: CRMQuoteItem[] = [];

  // Build items from agent results
  const ar = lead.agentResults;
  if (ar?.transport?.flights?.length) {
    const flightCost = Math.round(budget * 0.3);
    items.push({
      description: `✈️ Vols (${ar.transport.flights.length} vol(s))`,
      quantity: 1,
      netCost: Math.round(flightCost * 0.7),
      unitPrice: flightCost,
      total: flightCost,
      taxRate: 0,
    });
  }
  if (ar?.accommodation?.hotels?.length) {
    const hotelCost = Math.round(budget * 0.45);
    items.push({
      description: `🏨 Hébergement (${ar.accommodation.hotels.length} hôtel(s))`,
      quantity: 1,
      netCost: Math.round(hotelCost * 0.7),
      unitPrice: hotelCost,
      total: hotelCost,
      taxRate: 0,
    });
  }
  if (ar?.itinerary?.days?.length) {
    const activityCost = Math.round(budget * 0.2);
    items.push({
      description: `🗓 Activités & Itinéraire (${ar.itinerary.days.length} jours)`,
      quantity: 1,
      netCost: Math.round(activityCost * 0.6),
      unitPrice: activityCost,
      total: activityCost,
      taxRate: 0,
    });
  }

  // Fee Luna
  const lunaFee = Math.round(budget * 0.05);
  items.push({
    description: "✨ Frais de conciergerie Luna",
    quantity: 1,
    netCost: 0,
    unitPrice: lunaFee,
    total: lunaFee,
    taxRate: 20,
  });

  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const taxTotal = items.reduce(
    (s, it) => s + (it.total * it.taxRate) / 100,
    0,
  );

  const quoteData: Omit<CRMQuote, "id" | "createdAt" | "updatedAt"> = {
    quoteNumber: `QUO-${Date.now().toString().slice(-6)}`,
    tripId: lead.tripId || "",
    clientId: lead.clientId || "",
    clientName: lead.clientName || "Client",
    leadId: lead.id,
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 24 * 3600000)
      .toISOString()
      .slice(0, 10),
    items,
    subtotal,
    taxTotal,
    totalAmount: subtotal + taxTotal,
    currency: "EUR",
    status: "DRAFT",
    notes: `Devis auto-généré depuis le pipeline — ${lead.destination || "Destination non définie"}`,
  };

  return await createQuote(tid, quoteData);
};

// ═══ PAYMENTS CRUD ═══

export const createPayment = async (
  tid: string,
  data: Omit<CRMPayment, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "payments"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Auto-sync invoice: update amountPaid and status
  if (data.invoiceId && data.status === "COMPLETED") {
    try {
      const invoiceRef = tenantDoc(tid, "invoices", data.invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      if (invoiceSnap.exists()) {
        const invoice = invoiceSnap.data() as CRMInvoice;
        const newAmountPaid = (invoice.amountPaid || 0) + data.amount;
        const isPaid = newAmountPaid >= invoice.totalAmount;
        await updateDoc(invoiceRef, {
          amountPaid: newAmountPaid,
          status: isPaid ? "PAID" : "PARTIAL",
          updatedAt: new Date(),
        });
      }
    } catch (e) {
      console.error("[Payment→Invoice Sync] Error:", e);
    }
  }

  return ref.id;
};

export const getPayments = async (tid: string) => {
  const q = query(tenantCol(tid, "payments"), orderBy("paymentDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMPayment);
};

// ═══ MESSAGES CRUD ═══

export const createMessage = async (
  tid: string,
  data: Omit<CRMMessage, "id" | "createdAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "messages"), {
    ...data,
    createdAt: new Date(),
  });
  return ref.id;
};

export const getMessagesForClient = async (tid: string, clientId: string) => {
  const q = query(
    tenantCol(tid, "messages"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMMessage);
};

export const getAllMessages = async (tid: string) => {
  const q = query(tenantCol(tid, "messages"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMMessage);
};

export const markMessageRead = async (tid: string, id: string) => {
  await updateDoc(tenantDoc(tid, "messages", id), { isRead: true });
};

// ═══ DOCUMENTS CRUD ═══

export const createDocument = async (
  tid: string,
  data: Omit<CRMDocument, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "documents"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getDocumentsForClient = async (tid: string, clientId: string) => {
  const q = query(
    tenantCol(tid, "documents"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMDocument);
};

export const getAllDocuments = async (tid: string) => {
  const q = query(tenantCol(tid, "documents"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMDocument);
};

export const deleteDocument = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "documents", id));
};

// ═══ CAMPAIGNS CRUD ═══

export const createCampaign = async (
  tid: string,
  data: Omit<CRMCampaign, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "campaigns"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getCampaigns = async (tid: string) => {
  const q = query(tenantCol(tid, "campaigns"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMCampaign);
};

// ═══ TASKS CRUD ═══

export const createTask = async (
  tid: string,
  data: Omit<CRMTask, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "tasks"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getTasks = async (tid: string) => {
  const q = query(tenantCol(tid, "tasks"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMTask);
};

export const updateTask = async (
  tid: string,
  id: string,
  data: Partial<Omit<CRMTask, "id" | "createdAt">>,
) => {
  await updateDoc(tenantDoc(tid, "tasks", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteTask = async (tid: string, id: string) => {
  await deleteDoc(tenantDoc(tid, "tasks", id));
};

// ═══ CALENDAR EVENTS CRUD ═══

export const createCalendarEvent = async (
  tid: string,
  data: Omit<CalendarEvent, "id" | "createdAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "calendar_events"), {
    ...data,
    createdAt: new Date(),
  });
  return ref.id;
};

export const getCalendarEvents = async (
  tid: string,
  startDate?: string,
  endDate?: string,
) => {
  let q;
  if (startDate && endDate) {
    q = query(
      tenantCol(tid, "calendar_events"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc"),
    );
  } else {
    q = query(tenantCol(tid, "calendar_events"), orderBy("date", "asc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CalendarEvent);
};

export const deleteCalendarEventsForSource = async (
  tid: string,
  sourceId: string,
) => {
  const q = query(
    tenantCol(tid, "calendar_events"),
    where("sourceId", "==", sourceId),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

// ═══ CALENDAR AUTO-GENERATION ═══

async function generateCalendarEventsForTrip(
  tid: string,
  tripId: string,
  trip: Partial<CRMTrip>,
) {
  await deleteCalendarEventsForSource(tid, tripId);
  if (!trip.startDate || !trip.endDate) return;

  await Promise.all([
    createCalendarEvent(tid, {
      title: `🛫 ${trip.title || trip.destination} — Départ`,
      type: "TRIP_START",
      date: trip.startDate,
      color: trip.color || "#4F46E5",
      sourceType: "trip",
      sourceId: tripId,
      clientId: trip.clientId,
      clientName: trip.clientName,
      isAllDay: true,
    }),
    createCalendarEvent(tid, {
      title: `🛬 ${trip.title || trip.destination} — Retour`,
      type: "TRIP_END",
      date: trip.endDate,
      color: trip.color || "#4F46E5",
      sourceType: "trip",
      sourceId: tripId,
      clientId: trip.clientId,
      clientName: trip.clientName,
      isAllDay: true,
    }),
  ]);
}

async function generateCalendarEventsForBooking(
  tid: string,
  bookingId: string,
  booking: Partial<CRMBooking>,
) {
  await deleteCalendarEventsForSource(tid, bookingId);
  const events: Promise<string>[] = [];

  if (booking.checkIn) {
    events.push(
      createCalendarEvent(tid, {
        title: `📋 ${booking.supplier} — ${booking.type} Check-in`,
        type: "BOOKING_CHECKIN",
        date: booking.checkIn,
        color: "#10B981",
        sourceType: "booking",
        sourceId: bookingId,
        clientId: booking.clientId,
        clientName: booking.clientName,
        isAllDay: true,
      }),
    );
  }
  if (booking.checkOut) {
    events.push(
      createCalendarEvent(tid, {
        title: `📋 ${booking.supplier} — ${booking.type} Check-out`,
        type: "BOOKING_CHECKOUT",
        date: booking.checkOut,
        color: "#F59E0B",
        sourceType: "booking",
        sourceId: bookingId,
        clientId: booking.clientId,
        clientName: booking.clientName,
        isAllDay: true,
      }),
    );
  }

  await Promise.all(events);
}

async function generateCalendarEventsForInvoice(
  tid: string,
  invoiceId: string,
  invoice: Partial<CRMInvoice>,
) {
  await deleteCalendarEventsForSource(tid, invoiceId);
  if (!invoice.dueDate) return;

  await createCalendarEvent(tid, {
    title: `💰 Facture ${invoice.invoiceNumber || ""} — Échéance`,
    type: "INVOICE_DUE",
    date: invoice.dueDate,
    color: "#EF4444",
    sourceType: "invoice",
    sourceId: invoiceId,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    isAllDay: true,
  });
}

// ═══ SUPPLIERS / PRESTATAIRES ═══

export type SupplierCategory =
  | "HÉBERGEMENT"
  | "RESTAURANT"
  | "ACTIVITÉ"
  | "CULTURE"
  | "TRANSPORT"
  | "GUIDE"
  | "AUTRE";

export interface CRMSupplier {
  id?: string;
  name: string;
  category: SupplierCategory;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactName?: string;
  notes?: string;
  rating?: number; // 1-5
  commission?: number; // % de commission
  currency?: string;
  professionalLicense?: string;
  bankDetails?: string;
  tags?: string[];
  isFavorite?: boolean;
  languages?: string[]; // New: FR, EN, ES, ID...
  hasLicense?: boolean; // New: Professional Driver/Guide license
  isGuide?: boolean; // New: Functions
  isChauffeur?: boolean; // New: Functions
  isLunaFriend?: boolean; // Created manually by user = "Luna Friends"
  photoURL?: string; // Image scraped from website or uploaded
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CRMPrestation {
  id?: string;
  supplierId: string;
  supplierName: string;
  tripId?: string;
  tripTitle?: string;
  clientId?: string;
  clientName?: string;
  name?: string; // Compatibility
  description: string;
  date: string;
  cost: number;
  clientPrice: number;
  status: "RÉSERVÉ" | "CONFIRMÉ" | "TERMINÉ" | "ANNULÉ";
  notes?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ── Supplier CRUD ──

export const createSupplier = async (
  tid: string,
  data: Omit<CRMSupplier, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "suppliers"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getSuppliers = async (tid: string) => {
  const q = query(tenantCol(tid, "suppliers"), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMSupplier);
};

export const getSupplierById = async (
  tid: string,
  supplierId: string,
): Promise<CRMSupplier | null> => {
  const ref = doc(db, "tenants", tid, "suppliers", supplierId);
  const snap = await getDoc(ref);
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as CRMSupplier)
    : null;
};

export const updateSupplier = async (
  tid: string,
  supplierId: string,
  data: Partial<CRMSupplier>,
) => {
  const ref = doc(db, "tenants", tid, "suppliers", supplierId);
  await updateDoc(ref, { ...data, updatedAt: new Date() });
};

export const deleteSupplier = async (tid: string, supplierId: string) => {
  const ref = doc(db, "tenants", tid, "suppliers", supplierId);
  await deleteDoc(ref);
};

// ── Prestation CRUD ──

export const createPrestation = async (
  tid: string,
  data: Omit<CRMPrestation, "id" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(tenantCol(tid, "prestations"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
};

export const getPrestations = async (tid: string) => {
  const q = query(tenantCol(tid, "catalog"), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMCatalogItem);
};

// ── Supplier Bookings ──

export const createSupplierBooking = async (
  tid: string,
  data: Omit<CRMSupplierBooking, "id" | "createdAt">,
) => {
  // Sanitize: Firebase rejects undefined values — strip them
  const clean: Record<string, any> = { createdAt: new Date() };
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) clean[key] = val;
  }
  const ref = await addDoc(tenantCol(tid, "supplier_bookings"), clean);
  return ref.id;
};

export const getSupplierBookings = async (tid: string, supplierId: string) => {
  // Avoid composite index requirement by sorting client-side
  const q = query(
    tenantCol(tid, "supplier_bookings"),
    where("supplierId", "==", supplierId),
  );
  const snap = await getDocs(q);
  const data = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CRMSupplierBooking,
  );
  return data.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
};

export const updateSupplierBooking = async (
  tid: string,
  bookingId: string,
  data: Partial<CRMSupplierBooking>,
) => {
  const ref = doc(db, "tenants", tid, "supplier_bookings", bookingId);
  await updateDoc(ref, data);
};

export const getAllSupplierBookings = async (tid: string) => {
  const q = query(tenantCol(tid, "supplier_bookings"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CRMSupplierBooking,
  );
};

export const getPrestationsForSupplier = async (
  tid: string,
  supplierId: string,
) => {
  // Avoid composite index requirement by sorting client-side
  const q = query(
    tenantCol(tid, "prestations"),
    where("supplierId", "==", supplierId),
  );
  const snap = await getDocs(q);
  const data = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CRMPrestation,
  );

  return data.sort((a, b) => {
    const aTime =
      a.updatedAt instanceof Date
        ? a.updatedAt.getTime()
        : (a.updatedAt as any)?.toMillis?.() || 0;
    const bTime =
      b.updatedAt instanceof Date
        ? b.updatedAt.getTime()
        : (b.updatedAt as any)?.toMillis?.() || 0;
    return bTime - aTime;
  });
};

export const updatePrestation = async (
  tid: string,
  prestationId: string,
  data: Partial<CRMPrestation>,
) => {
  const ref = doc(db, "tenants", tid, "prestations", prestationId);
  await updateDoc(ref, { ...data, updatedAt: new Date() });
};

export const deletePrestation = async (tid: string, prestationId: string) => {
  const ref = doc(db, "tenants", tid, "prestations", prestationId);
  await deleteDoc(ref);
};

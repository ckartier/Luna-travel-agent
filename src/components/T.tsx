'use client';

import { useTranslation } from '@/src/hooks/useTranslation';
import { LunaLocale } from '@/src/lib/i18n/translations';
import { useVertical } from '@/src/contexts/VerticalContext';

/**
 * Auto-translation dictionary — maps French UI strings to all languages.
 * This is the comprehensive list of ALL strings used across ALL CRM pages.
 * When a page renders <T>French text</T>, it looks up the French text here
 * and returns the translation for the current locale.
 */
const AUTO_DICT: Record<string, Record<LunaLocale, string>> = {
    // ═══ DASHBOARD ═══
    'Dashboard': { fr: 'Dashboard', en: 'Dashboard', da: 'Dashboard', nl: 'Dashboard', es: 'Panel' },
    "Vue d'ensemble de vos performances et leads.": { fr: "Vue d'ensemble de vos performances et leads.", en: 'Overview of your performance and leads.', da: 'Oversigt over dine resultater og leads.', nl: 'Overzicht van uw prestaties en leads.', es: 'Resumen de tu rendimiento y leads.' },
    'Sync Active': { fr: 'Sync Active', en: 'Sync Active', da: 'Sync Aktiv', nl: 'Sync Actief', es: 'Sync Activa' },
    'Revenus Totaux': { fr: 'Revenus Totaux', en: 'Total Revenue', da: 'Samlet Omsætning', nl: 'Totale Inkomsten', es: 'Ingresos Totales' },
    'Total Leads': { fr: 'Total Leads', en: 'Total Leads', da: 'Samlet Leads', nl: 'Totale Leads', es: 'Total Leads' },
    'Clients Actifs': { fr: 'Clients Actifs', en: 'Active Clients', da: 'Aktive Kunder', nl: 'Actieve Klanten', es: 'Clientes Activos' },
    'Voyages Actifs': { fr: 'Voyages Actifs', en: 'Active Trips', da: 'Aktive Rejser', nl: 'Actieve Reizen', es: 'Viajes Activos' },
    'Revenus par Mois': { fr: 'Revenus par Mois', en: 'Revenue by Month', da: 'Omsætning pr. Måned', nl: 'Inkomsten per Maand', es: 'Ingresos por Mes' },
    'Ajoutez des voyages pour voir les revenus': { fr: 'Ajoutez des voyages pour voir les revenus', en: 'Add trips to see revenue', da: 'Tilføj rejser for at se omsætning', nl: 'Voeg reizen toe om inkomsten te zien', es: 'Añade viajes para ver ingresos' },
    'À faire': { fr: 'À faire', en: 'To Do', da: 'At gøre', nl: 'Te doen', es: 'Por hacer' },
    'Aucune tâche en attente 🎉': { fr: 'Aucune tâche en attente 🎉', en: 'No pending tasks 🎉', da: 'Ingen ventende opgaver 🎉', nl: 'Geen openstaande taken 🎉', es: 'Sin tareas pendientes 🎉' },

    // ═══ PIPELINE ═══
    'Pipeline': { fr: 'Pipeline', en: 'Pipeline', da: 'Pipeline', nl: 'Pipeline', es: 'Pipeline' },
    'Gérez vos leads du premier contact au closing.': { fr: 'Gérez vos leads du premier contact au closing.', en: 'Manage your leads from first contact to closing.', da: 'Administrer dine leads fra første kontakt til closing.', nl: 'Beheer uw leads van eerste contact tot afsluiting.', es: 'Gestiona tus leads desde el primer contacto hasta el cierre.' },
    'NOUVEAU': { fr: 'NOUVEAU', en: 'NEW', da: 'NY', nl: 'NIEUW', es: 'NUEVO' },
    'IA EN COURS': { fr: 'IA EN COURS', en: 'AI IN PROGRESS', da: 'AI I GANG', nl: 'AI BEZIG', es: 'IA EN CURSO' },
    'DEVIS ENVOYÉ': { fr: 'DEVIS ENVOYÉ', en: 'QUOTE SENT', da: 'TILBUD SENDT', nl: 'OFFERTE VERZONDEN', es: 'PRESUPUESTO ENVIADO' },
    'GAGNÉ': { fr: 'GAGNÉ', en: 'WON', da: 'VUNDET', nl: 'GEWONNEN', es: 'GANADO' },
    'Nouveau lead': { fr: 'Nouveau lead', en: 'New lead', da: 'Nyt lead', nl: 'Nieuwe lead', es: 'Nuevo lead' },
    'Ajouter': { fr: 'Ajouter', en: 'Add', da: 'Tilføj', nl: 'Toevoegen', es: 'Añadir' },
    'Nom du lead...': { fr: 'Nom du lead...', en: 'Lead name...', da: 'Lead-navn...', nl: 'Lead naam...', es: 'Nombre del lead...' },
    'Aucun deal dans cette étape': { fr: 'Aucun deal dans cette étape', en: 'No deals in this stage', da: 'Ingen aftaler i denne fase', nl: 'Geen deals in deze fase', es: 'Sin acuerdos en esta etapa' },
    'Envoyer au Super Agent': { fr: 'Envoyer au Super Agent', en: 'Send to Super Agent', da: 'Send til Super Agent', nl: 'Stuur naar Super Agent', es: 'Enviar al Super Agente' },
    'Créer le voyage': { fr: 'Créer le voyage', en: 'Create trip', da: 'Opret rejse', nl: 'Reis aanmaken', es: 'Crear viaje' },
    'Supprimer': { fr: 'Supprimer', en: 'Delete', da: 'Slet', nl: 'Verwijderen', es: 'Eliminar' },

    // ═══ CONTACTS ═══
    'Contacts': { fr: 'Contacts', en: 'Contacts', da: 'Kontakter', nl: 'Contacten', es: 'Contactos' },
    'Gérez votre base de clients et prestataires.': { fr: 'Gérez votre base de clients et prestataires.', en: 'Manage your clients and suppliers.', da: 'Administrer dine kunder og leverandører.', nl: 'Beheer uw klanten en leveranciers.', es: 'Gestiona tus clientes y proveedores.' },
    'Exporter CSV': { fr: 'Exporter CSV', en: 'Export CSV', da: 'Eksporter CSV', nl: 'CSV Exporteren', es: 'Exportar CSV' },
    'Exporter tout': { fr: 'Exporter tout', en: 'Export all', da: 'Eksporter alt', nl: 'Alles exporteren', es: 'Exportar todo' },
    'Rechercher un contact...': { fr: 'Rechercher un contact...', en: 'Search contacts...', da: 'Søg kontakter...', nl: 'Contacten zoeken...', es: 'Buscar contactos...' },
    'Nom': { fr: 'Nom', en: 'Name', da: 'Navn', nl: 'Naam', es: 'Nombre' },
    'Email': { fr: 'Email', en: 'Email', da: 'E-mail', nl: 'E-mail', es: 'Email' },
    'Téléphone': { fr: 'Téléphone', en: 'Phone', da: 'Telefon', nl: 'Telefoon', es: 'Teléfono' },
    'Segment': { fr: 'Segment', en: 'Segment', da: 'Segment', nl: 'Segment', es: 'Segmento' },
    'Aucun contact trouvé': { fr: 'Aucun contact trouvé', en: 'No contacts found', da: 'Ingen kontakter fundet', nl: 'Geen contacten gevonden', es: 'Sin contactos' },
    'Ajouter un contact': { fr: 'Ajouter un contact', en: 'Add contact', da: 'Tilføj kontakt', nl: 'Contact toevoegen', es: 'Añadir contacto' },
    'Nouveau Contact': { fr: 'Nouveau Contact', en: 'New Contact', da: 'Ny Kontakt', nl: 'Nieuw Contact', es: 'Nuevo Contacto' },
    'Prénom': { fr: 'Prénom', en: 'First Name', da: 'Fornavn', nl: 'Voornaam', es: 'Nombre' },
    'Nom de famille': { fr: 'Nom de famille', en: 'Last Name', da: 'Efternavn', nl: 'Achternaam', es: 'Apellido' },
    'Annuler': { fr: 'Annuler', en: 'Cancel', da: 'Annuller', nl: 'Annuleren', es: 'Cancelar' },
    'Créer': { fr: 'Créer', en: 'Create', da: 'Opret', nl: 'Aanmaken', es: 'Crear' },
    'Fermer': { fr: 'Fermer', en: 'Close', da: 'Luk', nl: 'Sluiten', es: 'Cerrar' },
    'Enregistrer': { fr: 'Enregistrer', en: 'Save', da: 'Gem', nl: 'Opslaan', es: 'Guardar' },

    // ═══ MAILS / INBOX ═══
    'Boîte de Réception': { fr: 'Boîte de Réception', en: 'Inbox', da: 'Indbakke', nl: 'Postvak IN', es: 'Bandeja de entrada' },
    'Votre flux d\'emails entrants, analysés par Luna.': { fr: 'Votre flux d\'emails entrants, analysés par Luna.', en: 'Your incoming email flow, analyzed by Luna.', da: 'Din indgående e-mailstrøm, analyseret af Luna.', nl: 'Uw inkomende e-mailstroom, geanalyseerd door Luna.', es: 'Tu flujo de emails entrantes, analizado por Luna.' },
    'Actualiser': { fr: 'Actualiser', en: 'Refresh', da: 'Opdater', nl: 'Vernieuwen', es: 'Actualizar' },
    'Pas encore connecté à Gmail': { fr: 'Pas encore connecté à Gmail', en: 'Not yet connected to Gmail', da: 'Endnu ikke forbundet til Gmail', nl: 'Nog niet verbonden met Gmail', es: 'Aún no conectado a Gmail' },
    'Connecter Gmail': { fr: 'Connecter Gmail', en: 'Connect Gmail', da: 'Tilslut Gmail', nl: 'Gmail Verbinden', es: 'Conectar Gmail' },
    'Analyser avec Luna IA': { fr: 'Analyser avec Luna IA', en: 'Analyze with Luna AI', da: 'Analyser med Luna AI', nl: 'Analyseren met Luna AI', es: 'Analizar con Luna IA' },
    'Dispatcher aux Agents': { fr: 'Dispatcher aux Agents', en: 'Dispatch to Agents', da: 'Send til Agenter', nl: 'Naar Agenten Sturen', es: 'Enviar a los Agentes' },
    'Ajouter au Pipeline': { fr: 'Ajouter au Pipeline', en: 'Add to Pipeline', da: 'Tilføj til Pipeline', nl: 'Aan Pipeline Toevoegen', es: 'Añadir al Pipeline' },
    'Sélectionnez un email': { fr: 'Sélectionnez un email', en: 'Select an email', da: 'Vælg en e-mail', nl: 'Selecteer een e-mail', es: 'Seleccione un email' },
    'Aucun email trouvé': { fr: 'Aucun email trouvé', en: 'No emails found', da: 'Ingen e-mails fundet', nl: 'Geen e-mails gevonden', es: 'Sin emails encontrados' },

    // ═══ PLANNING ═══
    'Planning': { fr: 'Planning', en: 'Planning', da: 'Planlægning', nl: 'Planning', es: 'Planificación' },
    'Calendrier de vos voyages et prestations.': { fr: 'Calendrier de vos voyages et prestations.', en: 'Calendar of your trips and services.', da: 'Kalender over dine rejser og ydelser.', nl: 'Kalender van uw reizen en diensten.', es: 'Calendario de tus viajes y servicios.' },
    'Aujourd\'hui': { fr: 'Aujourd\'hui', en: 'Today', da: 'I dag', nl: 'Vandaag', es: 'Hoy' },

    // ═══ BOOKINGS ═══
    'Réservations': { fr: 'Réservations', en: 'Bookings', da: 'Reservationer', nl: 'Boekingen', es: 'Reservas' },
    'Gérez vos réservations de voyages.': { fr: 'Gérez vos réservations de voyages.', en: 'Manage your travel bookings.', da: 'Administrer dine rejsereservationer.', nl: 'Beheer uw reisboekingen.', es: 'Gestiona tus reservas de viaje.' },

    // ═══ CATALOG ═══
    'Catalogue': { fr: 'Catalogue', en: 'Catalog', da: 'Katalog', nl: 'Catalogus', es: 'Catálogo' },
    'Vos prestations et services disponibles.': { fr: 'Vos prestations et services disponibles.', en: 'Your available services.', da: 'Dine tilgængelige ydelser.', nl: 'Uw beschikbare diensten.', es: 'Tus servicios disponibles.' },
    'Rechercher...': { fr: 'Rechercher...', en: 'Search...', da: 'Søg...', nl: 'Zoeken...', es: 'Buscar...' },
    'Toutes': { fr: 'Toutes', en: 'All', da: 'Alle', nl: 'Alle', es: 'Todas' },
    'Ajouter une prestation': { fr: 'Ajouter une prestation', en: 'Add a service', da: 'Tilføj en ydelse', nl: 'Een dienst toevoegen', es: 'Añadir un servicio' },

    // ═══ SUPPLIERS ═══
    'Prestataires': { fr: 'Prestataires', en: 'Suppliers', da: 'Leverandører', nl: 'Leveranciers', es: 'Proveedores' },
    'Gérez vos prestataires et partenaires.': { fr: 'Gérez vos prestataires et partenaires.', en: 'Manage your suppliers and partners.', da: 'Administrer dine leverandører og partnere.', nl: 'Beheer uw leveranciers en partners.', es: 'Gestiona tus proveedores y socios.' },
    'Ajouter un prestataire': { fr: 'Ajouter un prestataire', en: 'Add a supplier', da: 'Tilføj en leverandør', nl: 'Een leverancier toevoegen', es: 'Añadir un proveedor' },

    // ═══ QUOTES ═══
    'Devis': { fr: 'Devis', en: 'Quotes', da: 'Tilbud', nl: 'Offertes', es: 'Presupuestos' },
    'Créez et gérez vos devis clients.': { fr: 'Créez et gérez vos devis clients.', en: 'Create and manage client quotes.', da: 'Opret og administrer kundetilbud.', nl: 'Maak en beheer klantoffertes.', es: 'Crea y gestiona presupuestos de clientes.' },
    'Créer un devis': { fr: 'Créer un devis', en: 'Create a quote', da: 'Opret et tilbud', nl: 'Een offerte aanmaken', es: 'Crear un presupuesto' },

    // ═══ INVOICES ═══
    'Factures': { fr: 'Factures', en: 'Invoices', da: 'Fakturaer', nl: 'Facturen', es: 'Facturas' },
    'Gérez vos factures et paiements.': { fr: 'Gérez vos factures et paiements.', en: 'Manage your invoices and payments.', da: 'Administrer dine fakturaer og betalinger.', nl: 'Beheer uw facturen en betalingen.', es: 'Gestiona tus facturas y pagos.' },

    // ═══ PAYMENTS ═══
    'Paiements': { fr: 'Paiements', en: 'Payments', da: 'Betalinger', nl: 'Betalingen', es: 'Pagos' },

    // ═══ TEAM ═══
    'Équipe': { fr: 'Équipe', en: 'Team', da: 'Hold', nl: 'Team', es: 'Equipo' },
    'Gérez les membres de votre équipe.': { fr: 'Gérez les membres de votre équipe.', en: 'Manage your team members.', da: 'Administrer dine teammedlemmer.', nl: 'Beheer uw teamleden.', es: 'Gestiona los miembros de tu equipo.' },

    // ═══ ANALYTICS ═══
    'Analytics': { fr: 'Analytics', en: 'Analytics', da: 'Analyse', nl: 'Analyse', es: 'Analítica' },
    'Vos statistiques de performance.': { fr: 'Vos statistiques de performance.', en: 'Your performance statistics.', da: 'Dine præstationsstatistikker.', nl: 'Uw prestatiestatistieken.', es: 'Tus estadísticas de rendimiento.' },

    // ═══ INTEGRATIONS ═══
    'Intégrations': { fr: 'Intégrations', en: 'Integrations', da: 'Integrationer', nl: 'Integraties', es: 'Integraciones' },

    // ═══ COMMON UI ═══
    'Chargement...': { fr: 'Chargement...', en: 'Loading...', da: 'Indlæser...', nl: 'Laden...', es: 'Cargando...' },
    'Erreur': { fr: 'Erreur', en: 'Error', da: 'Fejl', nl: 'Fout', es: 'Error' },
    'Succès': { fr: 'Succès', en: 'Success', da: 'Succes', nl: 'Succes', es: 'Éxito' },
    'Confirmer': { fr: 'Confirmer', en: 'Confirm', da: 'Bekræft', nl: 'Bevestigen', es: 'Confirmar' },
    'Modifier': { fr: 'Modifier', en: 'Edit', da: 'Rediger', nl: 'Bewerken', es: 'Editar' },
    'Détails': { fr: 'Détails', en: 'Details', da: 'Detaljer', nl: 'Details', es: 'Detalles' },
    'Actions': { fr: 'Actions', en: 'Actions', da: 'Handlinger', nl: 'Acties', es: 'Acciones' },
    'Statut': { fr: 'Statut', en: 'Status', da: 'Status', nl: 'Status', es: 'Estado' },
    'Date': { fr: 'Date', en: 'Date', da: 'Dato', nl: 'Datum', es: 'Fecha' },
    'Montant': { fr: 'Montant', en: 'Amount', da: 'Beløb', nl: 'Bedrag', es: 'Monto' },
    'Type': { fr: 'Type', en: 'Type', da: 'Type', nl: 'Type', es: 'Tipo' },
    'Description': { fr: 'Description', en: 'Description', da: 'Beskrivelse', nl: 'Beschrijving', es: 'Descripción' },
    'Destination': { fr: 'Destination', en: 'Destination', da: 'Destination', nl: 'Bestemming', es: 'Destino' },
    'Budget': { fr: 'Budget', en: 'Budget', da: 'Budget', nl: 'Budget', es: 'Presupuesto' },
    'Client': { fr: 'Client', en: 'Client', da: 'Kunde', nl: 'Klant', es: 'Cliente' },
    'Fournisseur': { fr: 'Fournisseur', en: 'Supplier', da: 'Leverandør', nl: 'Leverancier', es: 'Proveedor' },
    'Catégorie': { fr: 'Catégorie', en: 'Category', da: 'Kategori', nl: 'Categorie', es: 'Categoría' },
    'Prix': { fr: 'Prix', en: 'Price', da: 'Pris', nl: 'Prijs', es: 'Precio' },
    'Total': { fr: 'Total', en: 'Total', da: 'Total', nl: 'Totaal', es: 'Total' },
    'Valider': { fr: 'Valider', en: 'Validate', da: 'Valider', nl: 'Valideren', es: 'Validar' },
    'Rejeter': { fr: 'Rejeter', en: 'Reject', da: 'Afvis', nl: 'Afwijzen', es: 'Rechazar' },
    'Envoyer': { fr: 'Envoyer', en: 'Send', da: 'Send', nl: 'Verzenden', es: 'Enviar' },
    'Répondre': { fr: 'Répondre', en: 'Reply', da: 'Svar', nl: 'Antwoorden', es: 'Responder' },
    'Voir': { fr: 'Voir', en: 'View', da: 'Se', nl: 'Bekijken', es: 'Ver' },
    'Retour': { fr: 'Retour', en: 'Back', da: 'Tilbage', nl: 'Terug', es: 'Volver' },
    'Suivant': { fr: 'Suivant', en: 'Next', da: 'Næste', nl: 'Volgende', es: 'Siguiente' },
    'Précédent': { fr: 'Précédent', en: 'Previous', da: 'Forrige', nl: 'Vorige', es: 'Vorig' },
    'Oui': { fr: 'Oui', en: 'Yes', da: 'Ja', nl: 'Ja', es: 'Sí' },
    'Non': { fr: 'Non', en: 'No', da: 'Nej', nl: 'Nee', es: 'No' },
    'Aucun résultat': { fr: 'Aucun résultat', en: 'No results', da: 'Ingen resultater', nl: 'Geen resultaten', es: 'Sin resultados' },
    'Nouveau': { fr: 'Nouveau', en: 'New', da: 'Ny', nl: 'Nieuw', es: 'Nuevo' },
    'Confirmé': { fr: 'Confirmé', en: 'Confirmed', da: 'Bekræftet', nl: 'Bevestigd', es: 'Confirmado' },
    'En attente': { fr: 'En attente', en: 'Pending', da: 'Afventer', nl: 'In afwachting', es: 'Pendiente' },
    'Terminé': { fr: 'Terminé', en: 'Completed', da: 'Afsluttet', nl: 'Voltooid', es: 'Completado' },
    'Annulé': { fr: 'Annulé', en: 'Cancelled', da: 'Annulleret', nl: 'Geannuleerd', es: 'Cancelado' },

    // ═══ AGENTS ═══
    'Besoin du client': { fr: 'Besoin du client', en: 'Client need', da: 'Kundens behov', nl: 'Klantbehoefte', es: 'Necesidad del cliente' },
    'Lieu': { fr: 'Lieu', en: 'Location', da: 'Sted', nl: 'Locatie', es: 'Lugar' },
    "LANCER L'EXPERT": { fr: "LANCER L'EXPERT", en: "LAUNCH EXPERT", da: "START EKSPERTEN", nl: "START EXPERT", es: "LANZAR EXPERTO" },
    'CRÉER LE VOYAGE': { fr: 'CRÉER LE VOYAGE', en: 'CREATE TRIP', da: 'OPRET REJSE', nl: 'REIS MAKEN', es: 'CREAR VIAJE' },
    'Départ de': { fr: 'Départ de', en: 'Departing from', da: 'Afrejse fra', nl: 'Vertrek vanuit', es: 'Salida desde' },
    'Destinations': { fr: 'Destinations', en: 'Destinations', da: 'Destinationer', nl: 'Bestemmingen', es: 'Destinos' },
    'Départ': { fr: 'Départ', en: 'Departure', da: 'Afrejse', nl: 'Vertrek', es: 'Salida' },
    'Flexibilité': { fr: 'Flexibilité', en: 'Flexibility', da: 'Fleksibilitet', nl: 'Flexibiliteit', es: 'Flexibilidad' },
    'Voyageurs': { fr: 'Voyageurs', en: 'Travelers', da: 'Rejsende', nl: 'Reizigers', es: 'Viajeros' },
    'Expérience souhaitée': { fr: 'Expérience souhaitée', en: 'Desired experience', da: 'Ønsket oplevelse', nl: 'Gewenste ervaring', es: 'Experiencia deseada' },
    'Notes particulières': { fr: 'Notes particulières', en: 'Special notes', da: 'Særlige noter', nl: 'Bijzondere notities', es: 'Notas especiales' },
    'Dates Exactes': { fr: 'Dates Exactes', en: 'Exact Dates', da: 'Nøjagtige Datoer', nl: 'Exacte Data', es: 'Fechas Exactas' },
    '+/- 3 Jours': { fr: '+/- 3 Jours', en: '+/- 3 Days', da: '+/- 3 Dage', nl: '+/- 3 Dagen', es: '+/- 3 Días' },
    'Mois Flexible': { fr: 'Mois Flexible', en: 'Flexible Month', da: 'Fleksibel Måned', nl: 'Flexibele Maand', es: 'Mes Flexible' },
    '+ Ajouter': { fr: '+ Ajouter', en: '+ Add', da: '+ Tilføj', nl: '+ Toevoegen', es: '+ Añadir' },

    // ═══ LOGIN / AUTH ═══
    'Connexion': { fr: 'Connexion', en: 'Login', da: 'Log ind', nl: 'Inloggen', es: 'Iniciar sesión' },
    'Se connecter avec Google': { fr: 'Se connecter avec Google', en: 'Sign in with Google', da: 'Log ind med Google', nl: 'Inloggen met Google', es: 'Iniciar sesión con Google' },
    'Déconnexion': { fr: 'Déconnexion', en: 'Log out', da: 'Log ud', nl: 'Uitloggen', es: 'Cerrar sesión' },

    // ═══ LANDING / PRICING ═══
    'Concierge Voyage': { fr: 'Concierge Voyage', en: 'Travel Concierge', da: 'Rejseconcierge', nl: 'Reisconcierge', es: 'Conserje de Viajes' },
    'Commencer': { fr: 'Commencer', en: 'Get Started', da: 'Kom i gang', nl: 'Aan de slag', es: 'Comenzar' },
    'En savoir plus': { fr: 'En savoir plus', en: 'Learn More', da: 'Læs mere', nl: 'Meer informatie', es: 'Saber más' },
    'Tarifs': { fr: 'Tarifs', en: 'Pricing', da: 'Priser', nl: 'Prijzen', es: 'Precios' },
    'par mois': { fr: 'par mois', en: 'per month', da: 'pr. måned', nl: 'per maand', es: 'al mes' },
    'Essai gratuit': { fr: 'Essai gratuit', en: 'Free trial', da: 'Gratis prøveperiode', nl: 'Gratis proefperiode', es: 'Prueba gratuita' },

    // ═══ BOOKINGS ═══
    'Nouvelle Réservation': { fr: 'Nouvelle Réservation', en: 'New Booking', da: 'Ny Reservation', nl: 'Nieuwe Boeking', es: 'Nueva Reserva' },
    'Aucune réservation trouvée.': { fr: 'Aucune réservation trouvée.', en: 'No bookings found.', da: 'Ingen reservationer fundet.', nl: 'Geen boekingen gevonden.', es: 'No se encontraron reservas.' },
    'Tout': { fr: 'Tout', en: 'All', da: 'Alle', nl: 'Alles', es: 'Todo' },
    'Chercher...': { fr: 'Chercher...', en: 'Search...', da: 'Søg...', nl: 'Zoeken...', es: 'Buscar...' },
    'Marge': { fr: 'Marge', en: 'Margin', da: 'Margen', nl: 'Marge', es: 'Margen' },

    // ═══ CATALOG ═══
    'Catalogue Prestations': { fr: 'Catalogue Prestations', en: 'Services Catalog', da: 'Ydelseskatalog', nl: 'Dienstencatalogus', es: 'Catálogo de Servicios' },
    'Nouvelle Offre': { fr: 'Nouvelle Offre', en: 'New Offer', da: 'Nyt Tilbud', nl: 'Nieuwe Aanbieding', es: 'Nueva Oferta' },
    'Nouvelle Prestation': { fr: 'Nouvelle Prestation', en: 'New Service', da: 'Ny Ydelse', nl: 'Nieuwe Dienst', es: 'Nuevo Servicio' },
    'Publier au Catalogue': { fr: 'Publier au Catalogue', en: 'Publish to Catalog', da: 'Udgiv til Katalog', nl: 'Publiceren naar Catalogus', es: 'Publicar en Catálogo' },
    'Achat': { fr: 'Achat', en: 'Cost', da: 'Købspris', nl: 'Kostprijs', es: 'Coste' },
    'Prix Vente': { fr: 'Prix Vente', en: 'Sell Price', da: 'Salgspris', nl: 'Verkoopprijs', es: 'Precio Venta' },
    'FAVORIS': { fr: 'FAVORIS', en: 'FAVORITES', da: 'FAVORITTER', nl: 'FAVORIETEN', es: 'FAVORITOS' },
    'TOUT': { fr: 'TOUT', en: 'ALL', da: 'ALLE', nl: 'ALLES', es: 'TODO' },

    // ═══ PLANNING ═══
    'Brouillon': { fr: 'Brouillon', en: 'Draft', da: 'Kladde', nl: 'Concept', es: 'Borrador' },
    'En cours': { fr: 'En cours', en: 'In Progress', da: 'I gang', nl: 'Lopend', es: 'En curso' },
    'Nouveau Voyage': { fr: 'Nouveau Voyage', en: 'New Trip', da: 'Ny Rejse', nl: 'Nieuwe Reis', es: 'Nuevo Viaje' },

    // ═══ SUPPLIERS ═══
    'Nouveau Prestataire': { fr: 'Nouveau Prestataire', en: 'New Supplier', da: 'Ny Leverandør', nl: 'Nieuwe Leverancier', es: 'Nuevo Proveedor' },

    // ═══ QUOTES ═══
    'Nouveau Devis': { fr: 'Nouveau Devis', en: 'New Quote', da: 'Nyt Tilbud', nl: 'Nieuwe Offerte', es: 'Nuevo Presupuesto' },

    // ═══ TEAM ═══
    'Inviter un membre': { fr: 'Inviter un membre', en: 'Invite a member', da: 'Inviter et medlem', nl: 'Een lid uitnodigen', es: 'Invitar a un miembro' },

    // ═══ CATALOG DETAIL ═══
    'Description de l\'offre': { fr: 'Description de l\'offre', en: 'Offer Description', da: 'Tilbudsbeskrivelse', nl: 'Aanbieding Beschrijving', es: 'Descripción de la oferta' },
    'Galerie Photos': { fr: 'Galerie Photos', en: 'Photo Gallery', da: 'Fotogalleri', nl: 'Fotogalerij', es: 'Galería de Fotos' },
    'Planning Booking': { fr: 'Planning Booking', en: 'Booking Schedule', da: 'Reservationsplan', nl: 'Boekingsplanning', es: 'Planificación de Reservas' },
    'Prestataire lié': { fr: 'Prestataire lié', en: 'Linked Supplier', da: 'Tilknyttet Leverandør', nl: 'Gekoppelde Leverancier', es: 'Proveedor vinculado' },
    'Frais & Marges': { fr: 'Frais & Marges', en: 'Fees & Margins', da: 'Gebyrer & Marginer', nl: 'Kosten & Marges', es: 'Gastos y Márgenes' },
    'Coût Net (Achat)': { fr: 'Coût Net (Achat)', en: 'Net Cost (Purchase)', da: 'Nettopris (Køb)', nl: 'Nettokost (Aankoop)', es: 'Coste Neto (Compra)' },
    'Prix Client (Vente)': { fr: 'Prix Client (Vente)', en: 'Client Price (Sale)', da: 'Kundepris (Salg)', nl: 'Klantprijs (Verkoop)', es: 'Precio Cliente (Venta)' },
    'Bénéfice Net': { fr: 'Bénéfice Net', en: 'Net Profit', da: 'Nettooverskud', nl: 'Nettowinst', es: 'Beneficio Neto' },
    'Envoi au Client': { fr: 'Envoi au Client', en: 'Send to Client', da: 'Send til Kunde', nl: 'Naar Klant Sturen', es: 'Enviar al Cliente' },
    'Sync Prestataire': { fr: 'Sync Prestataire', en: 'Sync Supplier', da: 'Synk Leverandør', nl: 'Sync Leverancier', es: 'Sincronizar Proveedor' },
    'Lier maintenant': { fr: 'Lier maintenant', en: 'Link now', da: 'Tilknyt nu', nl: 'Nu koppelen', es: 'Vincular ahora' },

    // ═══ TRIPS ═══
    'Voyages': { fr: 'Voyages', en: 'Trips', da: 'Rejser', nl: 'Reizen', es: 'Viajes' },
    'Itinéraire': { fr: 'Itinéraire', en: 'Itinerary', da: 'Rejseplan', nl: 'Reisroute', es: 'Itinerario' },
    'Jour': { fr: 'Jour', en: 'Day', da: 'Dag', nl: 'Dag', es: 'Día' },
    'Nuits': { fr: 'Nuits', en: 'Nights', da: 'Nætter', nl: 'Nachten', es: 'Noches' },
    'Ajouter un jour': { fr: 'Ajouter un jour', en: 'Add a day', da: 'Tilføj en dag', nl: 'Een dag toevoegen', es: 'Añadir un día' },
    'Hébergement': { fr: 'Hébergement', en: 'Accommodation', da: 'Indkvartering', nl: 'Accommodatie', es: 'Alojamiento' },
    'Transport': { fr: 'Transport', en: 'Transport', da: 'Transport', nl: 'Vervoer', es: 'Transporte' },
    'Activités': { fr: 'Activités', en: 'Activities', da: 'Aktiviteter', nl: 'Activiteiten', es: 'Actividades' },
    'Restauration': { fr: 'Restauration', en: 'Dining', da: 'Spisning', nl: 'Dineren', es: 'Restauración' },

    // ═══ LEADS / PIPELINE ═══
    'Leads': { fr: 'Leads', en: 'Leads', da: 'Leads', nl: 'Leads', es: 'Leads' },
    'Nouveau Lead': { fr: 'Nouveau Lead', en: 'New Lead', da: 'Nyt Lead', nl: 'Nieuwe Lead', es: 'Nuevo Lead' },
    'Résultats IA': { fr: 'Résultats IA', en: 'AI Results', da: 'AI-Resultater', nl: 'AI-Resultaten', es: 'Resultados IA' },
    'Proposition': { fr: 'Proposition', en: 'Proposal', da: 'Forslag', nl: 'Voorstel', es: 'Propuesta' },
    'Premier contact': { fr: 'Premier contact', en: 'First contact', da: 'Første kontakt', nl: 'Eerste contact', es: 'Primer contacto' },
    'En négociation': { fr: 'En négociation', en: 'Negotiating', da: 'Forhandling', nl: 'In onderhandeling', es: 'En negociación' },
    'Converti': { fr: 'Converti', en: 'Converted', da: 'Konverteret', nl: 'Geconverteerd', es: 'Convertido' },
    'Perdu': { fr: 'Perdu', en: 'Lost', da: 'Tabt', nl: 'Verloren', es: 'Perdido' },

    // ═══ AGENTS ═══
    'Agent IA': { fr: 'Agent IA', en: 'AI Agent', da: 'AI-Agent', nl: 'AI-Agent', es: 'Agente IA' },
    'Voyage & Prestations': { fr: 'Voyage & Prestations', en: 'Travel & Services', da: 'Rejse & Ydelser', nl: 'Reis & Diensten', es: 'Viaje y Servicios' },
    'Recherche en cours...': { fr: 'Recherche en cours...', en: 'Searching...', da: 'Søger...', nl: 'Zoeken...', es: 'Buscando...' },
    'Génération en cours...': { fr: 'Génération en cours...', en: 'Generating...', da: 'Genererer...', nl: 'Genereren...', es: 'Generando...' },
    'Expert Voyage': { fr: 'Expert Voyage', en: 'Travel Expert', da: 'Rejseekspert', nl: 'Reisexpert', es: 'Experto en Viajes' },
    'Expert Prestations': { fr: 'Expert Prestations', en: 'Services Expert', da: 'Ydelsesekspert', nl: 'Dienstexpert', es: 'Experto en Servicios' },

    // ═══ MESSAGES ═══
    'Messages': { fr: 'Messages', en: 'Messages', da: 'Beskeder', nl: 'Berichten', es: 'Mensajes' },
    'Conversations': { fr: 'Conversations', en: 'Conversations', da: 'Samtaler', nl: 'Gesprekken', es: 'Conversaciones' },
    'Écrire un message...': { fr: 'Écrire un message...', en: 'Write a message...', da: 'Skriv en besked...', nl: 'Schrijf een bericht...', es: 'Escribe un mensaje...' },
    'Aucun message': { fr: 'Aucun message', en: 'No messages', da: 'Ingen beskeder', nl: 'Geen berichten', es: 'Sin mensajes' },

    // ═══ DOCUMENTS ═══
    'Documents': { fr: 'Documents', en: 'Documents', da: 'Dokumenter', nl: 'Documenten', es: 'Documentos' },
    'Gérez vos documents et fichiers.': { fr: 'Gérez vos documents et fichiers.', en: 'Manage your documents and files.', da: 'Administrer dine dokumenter og filer.', nl: 'Beheer uw documenten en bestanden.', es: 'Gestiona tus documentos y archivos.' },
    'Télécharger': { fr: 'Télécharger', en: 'Download', da: 'Download', nl: 'Downloaden', es: 'Descargar' },
    'Importer': { fr: 'Importer', en: 'Import', da: 'Importer', nl: 'Importeren', es: 'Importar' },

    // ═══ MARKETING ═══
    'Marketing': { fr: 'Marketing', en: 'Marketing', da: 'Marketing', nl: 'Marketing', es: 'Marketing' },
    'Campagnes': { fr: 'Campagnes', en: 'Campaigns', da: 'Kampagner', nl: 'Campagnes', es: 'Campañas' },
    'Nouvelle campagne': { fr: 'Nouvelle campagne', en: 'New campaign', da: 'Ny kampagne', nl: 'Nieuwe campagne', es: 'Nueva campaña' },

    // ═══ TEMPLATES ═══
    'Templates': { fr: 'Templates', en: 'Templates', da: 'Skabeloner', nl: 'Sjablonen', es: 'Plantillas' },
    'Choisissez un template': { fr: 'Choisissez un template', en: 'Choose a template', da: 'Vælg en skabelon', nl: 'Kies een sjabloon', es: 'Elige una plantilla' },
    'Personnaliser': { fr: 'Personnaliser', en: 'Customize', da: 'Tilpas', nl: 'Aanpassen', es: 'Personalizar' },
    'Aperçu': { fr: 'Aperçu', en: 'Preview', da: 'Forhåndsvisning', nl: 'Voorbeeld', es: 'Vista previa' },
    'Publier': { fr: 'Publier', en: 'Publish', da: 'Udgiv', nl: 'Publiceren', es: 'Publicar' },

    // ═══ COLLECTIONS ═══
    'Collections': { fr: 'Collections', en: 'Collections', da: 'Samlinger', nl: 'Collecties', es: 'Colecciones' },

    // ═══ TÂCHES ═══
    'Tâches': { fr: 'Tâches', en: 'Tasks', da: 'Opgaver', nl: 'Taken', es: 'Tareas' },
    'Nouvelle tâche': { fr: 'Nouvelle tâche', en: 'New task', da: 'Ny opgave', nl: 'Nieuwe taak', es: 'Nueva tarea' },
    'Assigné à': { fr: 'Assigné à', en: 'Assigned to', da: 'Tildelt til', nl: 'Toegewezen aan', es: 'Asignado a' },
    'Priorité': { fr: 'Priorité', en: 'Priority', da: 'Prioritet', nl: 'Prioriteit', es: 'Prioridad' },
    'Échéance': { fr: 'Échéance', en: 'Due date', da: 'Frist', nl: 'Vervaldatum', es: 'Vencimiento' },
    'Alertes CRM': { fr: 'Alertes CRM', en: 'CRM Alerts', da: 'CRM-advarsler', nl: 'CRM-waarschuwingen', es: 'Alertas CRM' },
    'Aucune alerte pour le moment': { fr: 'Aucune alerte pour le moment', en: 'No alerts for now', da: 'Ingen advarsler i øjeblikket', nl: 'Geen meldingen op dit moment', es: 'No hay alertas por ahora' },
    'Les réponses WhatsApp et les rappels pro apparaîtront ici': { fr: 'Les réponses WhatsApp et les rappels pro apparaîtront ici', en: 'WhatsApp replies and pro reminders will appear here', da: 'WhatsApp-svar og pro-påmindelser vises her', nl: 'WhatsApp-antwoorden en pro-herinneringen verschijnen hier', es: 'Las respuestas de WhatsApp y recordatorios pro aparecerán aquí' },
    'Alerte Workflow Pro': { fr: 'Alerte Workflow Pro', en: 'Pro Workflow Alert', da: 'Pro-workflow-advarsel', nl: 'Pro-workflowmelding', es: 'Alerta de flujo Pro' },
    'Demande Pro Workflow': { fr: 'Demande Pro Workflow', en: 'Pro Workflow Request', da: 'Pro-workflow-forespørgsel', nl: 'Pro-workflowaanvraag', es: 'Solicitud de flujo Pro' },
    'Ouvrir Demande Pro': { fr: 'Ouvrir Demande Pro', en: 'Open Pro Request', da: 'Åbn pro-forespørgsel', nl: 'Open pro-aanvraag', es: 'Abrir solicitud Pro' },
    'Rappel': { fr: 'Rappel', en: 'Reminder', da: 'Påmindelse', nl: 'Herinnering', es: 'Recordatorio' },
    'Tout marquer lu': { fr: 'Tout marquer lu', en: 'Mark all as read', da: 'Markér alle som læst', nl: 'Alles als gelezen markeren', es: 'Marcar todo como leído' },
    'Prestataire a confirmé via WhatsApp !': { fr: 'Prestataire a confirmé via WhatsApp !', en: 'Supplier confirmed via WhatsApp!', da: 'Leverandøren bekræftede via WhatsApp!', nl: 'Leverancier heeft via WhatsApp bevestigd!', es: '¡El proveedor confirmó por WhatsApp!' },
    'ANNULATION TARDIVE !': { fr: 'ANNULATION TARDIVE !', en: 'LATE CANCELLATION!', da: 'SEN AFLYSNING!', nl: 'LATE ANNULERING!', es: '¡CANCELACIÓN TARDÍA!' },
    'Prestataire a refusé': { fr: 'Prestataire a refusé', en: 'Supplier refused', da: 'Leverandøren afviste', nl: 'Leverancier heeft geweigerd', es: 'El proveedor rechazó' },
    'A confirmé': { fr: 'A confirmé', en: 'Confirmed', da: 'Bekræftet', nl: 'Bevestigd', es: 'Confirmó' },
    'Annul. tardive': { fr: 'Annul. tardive', en: 'Late cancel', da: 'Sen aflysning', nl: 'Late annulering', es: 'Cancelación tardía' },
    'A refusé': { fr: 'A refusé', en: 'Refused', da: 'Afviste', nl: 'Geweigerd', es: 'Rechazó' },
    'Actualisation auto toutes les 15 secondes': { fr: 'Actualisation auto toutes les 15 secondes', en: 'Auto refresh every 15 seconds', da: 'Automatisk opdatering hvert 15. sekund', nl: 'Automatisch verversen elke 15 seconden', es: 'Actualización automática cada 15 segundos' },
    'Haute': { fr: 'Haute', en: 'High', da: 'Høj', nl: 'Hoog', es: 'Alta' },
    'Moyenne': { fr: 'Moyenne', en: 'Medium', da: 'Middel', nl: 'Gemiddeld', es: 'Media' },
    'Basse': { fr: 'Basse', en: 'Low', da: 'Lav', nl: 'Laag', es: 'Baja' },

    // ═══ CONCIERGERIE (PUBLIC SITE) ═══
    'Réserver maintenant': { fr: 'Réserver maintenant', en: 'Book Now', da: 'Bestil nu', nl: 'Nu boeken', es: 'Reservar ahora' },
    'Nos destinations': { fr: 'Nos destinations', en: 'Our Destinations', da: 'Vores Destinationer', nl: 'Onze Bestemmingen', es: 'Nuestros Destinos' },
    'Nos services': { fr: 'Nos services', en: 'Our Services', da: 'Vores Ydelser', nl: 'Onze Diensten', es: 'Nuestros Servicios' },
    'À propos': { fr: 'À propos', en: 'About Us', da: 'Om Os', nl: 'Over Ons', es: 'Sobre Nosotros' },
    'Nous contacter': { fr: 'Nous contacter', en: 'Contact Us', da: 'Kontakt Os', nl: 'Contact', es: 'Contáctenos' },
    'Témoignages': { fr: 'Témoignages', en: 'Testimonials', da: 'Anmeldelser', nl: 'Getuigenissen', es: 'Testimonios' },
    'Votre voyage sur-mesure': { fr: 'Votre voyage sur-mesure', en: 'Your bespoke journey', da: 'Din skræddersyede rejse', nl: 'Uw reis op maat', es: 'Tu viaje a medida' },
    'Découvrir': { fr: 'Découvrir', en: 'Discover', da: 'Opdag', nl: 'Ontdek', es: 'Descubrir' },
    'Expériences uniques': { fr: 'Expériences uniques', en: 'Unique Experiences', da: 'Unikke Oplevelser', nl: 'Unieke Ervaringen', es: 'Experiencias Únicas' },
    'Voyage sur-mesure': { fr: 'Voyage sur-mesure', en: 'Bespoke Travel', da: 'Skræddersyet Rejse', nl: 'Reis op Maat', es: 'Viaje a Medida' },
    'Conciergerie Premium': { fr: 'Conciergerie Premium', en: 'Premium Concierge', da: 'Premium Concierge', nl: 'Premium Conciërge', es: 'Conserjería Premium' },
    'FAQ': { fr: 'FAQ', en: 'FAQ', da: 'FAQ', nl: 'FAQ', es: 'FAQ' },
    'Conditions générales': { fr: 'Conditions générales', en: 'Terms & Conditions', da: 'Vilkår og betingelser', nl: 'Algemene voorwaarden', es: 'Términos y condiciones' },
    'Politique de confidentialité': { fr: 'Politique de confidentialité', en: 'Privacy Policy', da: 'Fortrolighedspolitik', nl: 'Privacybeleid', es: 'Política de privacidad' },
    'Mentions légales': { fr: 'Mentions légales', en: 'Legal Notice', da: 'Juridisk meddelelse', nl: 'Juridische informatie', es: 'Aviso legal' },
    'Tous droits réservés': { fr: 'Tous droits réservés', en: 'All rights reserved', da: 'Alle rettigheder forbeholdes', nl: 'Alle rechten voorbehouden', es: 'Todos los derechos reservados' },

    // ═══ COMMON ACTIONS (MORE) ═══
    'Copier': { fr: 'Copier', en: 'Copy', da: 'Kopier', nl: 'Kopiëren', es: 'Copiar' },
    'Coller': { fr: 'Coller', en: 'Paste', da: 'Sæt ind', nl: 'Plakken', es: 'Pegar' },
    'Dupliquer': { fr: 'Dupliquer', en: 'Duplicate', da: 'Dupliker', nl: 'Dupliceren', es: 'Duplicar' },
    'Archiver': { fr: 'Archiver', en: 'Archive', da: 'Arkiver', nl: 'Archiveren', es: 'Archivar' },
    'Restaurer': { fr: 'Restaurer', en: 'Restore', da: 'Gendan', nl: 'Herstellen', es: 'Restaurar' },
    'Partager': { fr: 'Partager', en: 'Share', da: 'Del', nl: 'Delen', es: 'Compartir' },
    'Imprimer': { fr: 'Imprimer', en: 'Print', da: 'Udskriv', nl: 'Afdrukken', es: 'Imprimir' },
    'Filtrer': { fr: 'Filtrer', en: 'Filter', da: 'Filtrer', nl: 'Filteren', es: 'Filtrar' },
    'Trier': { fr: 'Trier', en: 'Sort', da: 'Sorter', nl: 'Sorteren', es: 'Ordenar' },
    'Exporter': { fr: 'Exporter', en: 'Export', da: 'Eksporter', nl: 'Exporteren', es: 'Exportar' },
    'Sélectionner': { fr: 'Sélectionner', en: 'Select', da: 'Vælg', nl: 'Selecteren', es: 'Seleccionar' },
    'Tout sélectionner': { fr: 'Tout sélectionner', en: 'Select all', da: 'Vælg alle', nl: 'Alles selecteren', es: 'Seleccionar todo' },
    'Aucun résultat trouvé': { fr: 'Aucun résultat trouvé', en: 'No results found', da: 'Ingen resultater fundet', nl: 'Geen resultaten gevonden', es: 'Sin resultados encontrados' },

    // ═══ DATES & TIME ═══
    'Hier': { fr: 'Hier', en: 'Yesterday', da: 'I går', nl: 'Gisteren', es: 'Ayer' },
    'Demain': { fr: 'Demain', en: 'Tomorrow', da: 'I morgen', nl: 'Morgen', es: 'Mañana' },
    'Cette semaine': { fr: 'Cette semaine', en: 'This week', da: 'Denne uge', nl: 'Deze week', es: 'Esta semana' },
    'Ce mois': { fr: 'Ce mois', en: 'This month', da: 'Denne måned', nl: 'Deze maand', es: 'Esta maand' },

    // ═══ FINANCIAL ═══
    'Revenus': { fr: 'Revenus', en: 'Revenue', da: 'Omsætning', nl: 'Inkomsten', es: 'Ingresos' },
    'Dépenses': { fr: 'Dépenses', en: 'Expenses', da: 'Udgifter', nl: 'Uitgaven', es: 'Gastos' },
    'Bénéfice': { fr: 'Bénéfice', en: 'Profit', da: 'Overskud', nl: 'Winst', es: 'Beneficio' },
    'TVA': { fr: 'TVA', en: 'VAT', da: 'Moms', nl: 'BTW', es: 'IVA' },
    'Sous-total': { fr: 'Sous-total', en: 'Subtotal', da: 'Subtotal', nl: 'Subtotaal', es: 'Subtotal' },
    'Remise': { fr: 'Remise', en: 'Discount', da: 'Rabat', nl: 'Korting', es: 'Descuento' },
    'Payé': { fr: 'Payé', en: 'Paid', da: 'Betalt', nl: 'Betaald', es: 'Pagado' },
    'En attente de paiement': { fr: 'En attente de paiement', en: 'Awaiting payment', da: 'Afventer betaling', nl: 'In afwachting van betaling', es: 'Pendiente de pago' },
    'En retard': { fr: 'En retard', en: 'Overdue', da: 'Forsinket', nl: 'Achterstallig', es: 'Atrasado' },

    // ═══ NOTIFICATIONS ═══
    'Notification envoyée': { fr: 'Notification envoyée', en: 'Notification sent', da: 'Notifikation sendt', nl: 'Melding verzonden', es: 'Notificación enviada' },
    'Erreur lors de l\'envoi': { fr: 'Erreur lors de l\'envoi', en: 'Error sending', da: 'Fejl ved afsendelse', nl: 'Fout bij verzending', es: 'Error al enviar' },
    'Opération réussie': { fr: 'Opération réussie', en: 'Operation successful', da: 'Handling lykkedes', nl: 'Bewerking geslaagd', es: 'Operación exitosa' },
    'Êtes-vous sûr ?': { fr: 'Êtes-vous sûr ?', en: 'Are you sure?', da: 'Er du sikker?', nl: 'Weet u het zeker?', es: '¿Estás seguro?' },

    // ═══ ANALYTICS ═══
    'Performances': { fr: 'Performances', en: 'Performance', da: 'Præstation', nl: 'Prestaties', es: 'Rendimiento' },
    'Taux de conversion': { fr: 'Taux de conversion', en: 'Conversion rate', da: 'Konverteringsrate', nl: 'Conversieratio', es: 'Tasa de conversión' },
    'Panier moyen': { fr: 'Panier moyen', en: 'Average basket', da: 'Gennemsnitskurv', nl: 'Gemiddeld mandje', es: 'Cesta media' },
    'Objectif mensuel': { fr: 'Objectif mensuel', en: 'Monthly goal', da: 'Månedligt mål', nl: 'Maanddoel', es: 'Objetivo mensual' },

    // ═══ SUPPLIERS ═══
    'Coordonnées': { fr: 'Coordonnées', en: 'Contact Details', da: 'Kontaktoplysninger', nl: 'Contactgegevens', es: 'Datos de Contacto' },
    'Site web': { fr: 'Site web', en: 'Website', da: 'Hjemmeside', nl: 'Website', es: 'Sitio web' },
    'Langues': { fr: 'Langues', en: 'Languages', da: 'Sprog', nl: 'Talen', es: 'Idiomas' },
    'Guide': { fr: 'Guide', en: 'Guide', da: 'Guide', nl: 'Gids', es: 'Guía' },
    'Chauffeur': { fr: 'Chauffeur', en: 'Driver', da: 'Chauffør', nl: 'Chauffeur', es: 'Conductor' },
    'Luna Friends': { fr: 'Luna Friends', en: 'Luna Friends', da: 'Luna Friends', nl: 'Luna Friends', es: 'Luna Friends' },

    // ═══ DASHBOARD KPIs ═══
    'Executive Dashboard': { fr: 'Executive Dashboard', en: 'Executive Dashboard', da: 'Executive Dashboard', nl: 'Executive Dashboard', es: 'Panel Ejecutivo' },
    'Revenus Portefeuille': { fr: 'Revenus Portefeuille', en: 'Portfolio Revenue', da: 'Porteføljeomsætning', nl: 'Portfolio Inkomsten', es: 'Ingresos del Portafolio' },
    'Opportunités': { fr: 'Opportunités', en: 'Opportunities', da: 'Muligheder', nl: 'Kansen', es: 'Oportunidades' },
    'Voyageurs VIP': { fr: 'Voyageurs VIP', en: 'VIP Travelers', da: 'VIP-Rejsende', nl: 'VIP-Reizigers', es: 'Viajeros VIP' },
    'Missions Actives': { fr: 'Missions Actives', en: 'Active Missions', da: 'Aktive Missioner', nl: 'Actieve Missies', es: 'Misiones Activas' },
    'Performance Revenus': { fr: 'Performance Revenus', en: 'Revenue Performance', da: 'Omsætningspræstation', nl: 'Inkomstenprestatie', es: 'Rendimiento de Ingresos' },
    'Conciergerie': { fr: 'Conciergerie', en: 'Concierge', da: 'Concierge', nl: 'Conciërge', es: 'Conserjería' },
    'Aucune donnée historique disponible': { fr: 'Aucune donnée historique disponible', en: 'No historical data available', da: 'Ingen historiske data tilgængelige', nl: 'Geen historische gegevens beschikbaar', es: 'Sin datos históricos disponibles' },
    'Conciergerie à jour': { fr: 'Conciergerie à jour', en: 'Concierge up to date', da: 'Concierge opdateret', nl: 'Conciërge bijgewerkt', es: 'Conserjería al día' },
    'Synchronisation Temps Réel': { fr: 'Synchronisation Temps Réel', en: 'Real-Time Sync', da: 'Realtidssynkronisering', nl: 'Realtime Synchronisatie', es: 'Sincronización en Tiempo Real' },

    // ═══ EMPTY STATES ═══
    'Aucune conversation': { fr: 'Aucune conversation', en: 'No conversations', da: 'Ingen samtaler', nl: 'Geen gesprekken', es: 'Sin conversaciones' },
    'Sélectionnez une conversation': { fr: 'Sélectionnez une conversation', en: 'Select a conversation', da: 'Vælg en samtale', nl: 'Selecteer een gesprek', es: 'Seleccione una conversación' },
    'Aucun prestataire lié': { fr: 'Aucun prestataire lié', en: 'No linked supplier', da: 'Ingen tilknyttet leverandør', nl: 'Geen gekoppelde leverancier', es: 'Sin proveedor vinculado' },
    'Aucune réservation planning pour le moment': { fr: 'Aucune réservation planning pour le moment', en: 'No scheduled bookings yet', da: 'Ingen planlagte reservationer endnu', nl: 'Nog geen geplande boekingen', es: 'Sin reservas planificadas por el momento' },
    'Aucun prestataire trouvé': { fr: 'Aucun prestataire trouvé', en: 'No supplier found', da: 'Ingen leverandør fundet', nl: 'Geen leverancier gevonden', es: 'Sin proveedor encontrado' },
    'Aucune réservation attachée': { fr: 'Aucune réservation attachée', en: 'No bookings attached', da: 'Ingen reservationer tilknyttet', nl: 'Geen boekingen gekoppeld', es: 'Sin reservas adjuntas' },
    'Aucune étape planifiée pour ce jour.': { fr: 'Aucune étape planifiée pour ce jour.', en: 'No steps planned for this day.', da: 'Ingen trin planlagt for denne dag.', nl: 'Geen stappen gepland voor deze dag.', es: 'Sin etapas planificadas para este día.' },
    'Aucun message programmé': { fr: 'Aucun message programmé', en: 'No scheduled messages', da: 'Ingen planlagte beskeder', nl: 'Geen geplande berichten', es: 'Sin mensajes programados' },
    'Aucun dossier actif': { fr: 'Aucun dossier actif', en: 'No active files', da: 'Ingen aktive sager', nl: 'Geen actieve dossiers', es: 'Sin expedientes activos' },
    'Aucun rappel': { fr: 'Aucun rappel', en: 'No reminders', da: 'Ingen påmindelser', nl: 'Geen herinneringen', es: 'Sin recordatorios' },
    'Aucun tag': { fr: 'Aucun tag', en: 'No tags', da: 'Ingen tags', nl: 'Geen tags', es: 'Sin etiquetas' },
    'Aucune opportunité active.': { fr: 'Aucune opportunité active.', en: 'No active opportunities.', da: 'Ingen aktive muligheder.', nl: 'Geen actieve kansen.', es: 'Sin oportunidades activas.' },
    'Aucune demande.': { fr: 'Aucune demande.', en: 'No requests.', da: 'Ingen forespørgsler.', nl: 'Geen aanvragen.', es: 'Sin solicitudes.' },
    'Aucune langue enregistrée.': { fr: 'Aucune langue enregistrée.', en: 'No languages registered.', da: 'Ingen sprog registreret.', nl: 'Geen talen geregistreerd.', es: 'Sin idiomas registrados.' },
    'Aucun Tag associé': { fr: 'Aucun Tag associé', en: 'No associated tags', da: 'Ingen tilknyttede tags', nl: 'Geen gekoppelde tags', es: 'Sin etiquetas asociadas' },
    'Aucun document. Uploadez votre premier fichier.': { fr: 'Aucun document. Uploadez votre premier fichier.', en: 'No documents. Upload your first file.', da: 'Ingen dokumenter. Upload din første fil.', nl: 'Geen documenten. Upload uw eerste bestand.', es: 'Sin documentos. Suba su primer archivo.' },
    'Aucune campagne. Créez votre première.': { fr: 'Aucune campagne. Créez votre première.', en: 'No campaigns. Create your first one.', da: 'Ingen kampagner. Opret din første.', nl: 'Geen campagnes. Maak uw eerste.', es: 'Sin campañas. Cree su primera.' },

    // ═══ CATALOG / SUPPLIER DETAIL ═══
    'Modifier la prestation': { fr: 'Modifier la prestation', en: 'Edit service', da: 'Rediger ydelse', nl: 'Dienst bewerken', es: 'Editar servicio' },
    'Modifier les coordonnées': { fr: 'Modifier les coordonnées', en: 'Edit contact details', da: 'Rediger kontaktoplysninger', nl: 'Contactgegevens bewerken', es: 'Editar datos de contacto' },
    'Gérez les disponibilités de vos prestataires': { fr: 'Gérez les disponibilités de vos prestataires', en: 'Manage your suppliers\' availability', da: 'Administrer dine leverandørers tilgængelighed', nl: 'Beheer de beschikbaarheid van uw leveranciers', es: 'Gestione la disponibilidad de sus proveedores' },
    'Prix payé au prestataire': { fr: 'Prix payé au prestataire', en: 'Price paid to supplier', da: 'Pris betalt til leverandør', nl: 'Prijs betaald aan leverancier', es: 'Precio pagado al proveedor' },
    'Marge appliquée': { fr: 'Marge appliquée', en: 'Applied margin', da: 'Anvendt margin', nl: 'Toegepaste marge', es: 'Margen aplicado' },

    // ═══ PLANNING / ITINERARY ═══
    'Sélectionner un nouveau prestataire': { fr: 'Sélectionner un nouveau prestataire', en: 'Select a new supplier', da: 'Vælg en ny leverandør', nl: 'Selecteer een nieuwe leverancier', es: 'Seleccionar un nuevo proveedor' },
    'Envoyer Planning': { fr: 'Envoyer Planning', en: 'Send Planning', da: 'Send Planlægning', nl: 'Planning Verzenden', es: 'Enviar Planificación' },
    'Nouveau message personnalisé': { fr: 'Nouveau message personnalisé', en: 'New custom message', da: 'Ny tilpasset besked', nl: 'Nieuw aangepast bericht', es: 'Nuevo mensaje personalizado' },
    'Réservation créée !': { fr: 'Réservation créée !', en: 'Booking created!', da: 'Reservation oprettet!', nl: 'Boeking aangemaakt!', es: '¡Reserva creada!' },
    'Créer le voyage & pousser au pipeline': { fr: 'Créer le voyage & pousser au pipeline', en: 'Create trip & push to pipeline', da: 'Opret rejse & push til pipeline', nl: 'Reis maken & naar pipeline sturen', es: 'Crear viaje y enviar al pipeline' },
    'Recadrer votre photo': { fr: 'Recadrer votre photo', en: 'Crop your photo', da: 'Beskær dit foto', nl: 'Snijd uw foto bij', es: 'Recortar tu foto' },
    'Ajustez le cadrage avec la souris': { fr: 'Ajustez le cadrage avec la souris', en: 'Adjust framing with the mouse', da: 'Juster rammerne med musen', nl: 'Pas de kadrering aan met de muis', es: 'Ajuste el encuadre con el ratón' },

    // ═══ PAGE DESCRIPTIONS ═══
    'Gérez vos offres, tarifs et marges agents en un clin d\'œil.': { fr: 'Gérez vos offres, tarifs et marges agents en un clin d\'œil.', en: 'Manage your offers, rates and agent margins at a glance.', da: 'Administrer dine tilbud, priser og agentmarginer med et øjekast.', nl: 'Beheer uw aanbiedingen, tarieven en agentmarges in één oogopslag.', es: 'Gestione sus ofertas, tarifas y márgenes de agente de un vistazo.' },
    'Gérez vos guides, véhicules et services avec Luna Sync.': { fr: 'Gérez vos guides, véhicules et services avec Luna Sync.', en: 'Manage your guides, vehicles and services with Luna Sync.', da: 'Administrer dine guider, køretøjer og ydelser med Luna Sync.', nl: 'Beheer uw gidsen, voertuigen en diensten met Luna Sync.', es: 'Gestione sus guías, vehículos y servicios con Luna Sync.' },
    'Gérez vos propositions tarifaires et maximisez vos marges agents.': { fr: 'Gérez vos propositions tarifaires et maximisez vos marges agents.', en: 'Manage your pricing proposals and maximize your agent margins.', da: 'Administrer dine pristilbud og maksimer dine agentmarginer.', nl: 'Beheer uw prijsvoorstellen en maximaliseer uw agentmarges.', es: 'Gestione sus propuestas tarifarias y maximice sus márgenes de agente.' },
    'Sélectionnez un devis pour analyser le détail des marges et frais d\'agence.': { fr: 'Sélectionnez un devis pour analyser le détail des marges et frais d\'agence.', en: 'Select a quote to analyze margin and agency fee details.', da: 'Vælg et tilbud for at analysere margin- og bureaugebyrdetaljer.', nl: 'Selecteer een offerte om marge- en agentuurkostendetails te bekijken.', es: 'Seleccione un presupuesto para analizar los detalles de márgenes y comisiones.' },
    'Gérez le planning et les frais additionnels en temps réel.': { fr: 'Gérez le planning et les frais additionnels en temps réel.', en: 'Manage scheduling and additional fees in real time.', da: 'Administrer planlægning og ekstra gebyrer i realtid.', nl: 'Beheer planning en extra kosten in realtime.', es: 'Gestione la planificación y los cargos adicionales en tiempo real.' },
    'Sélectionnez une demande pour l\'analyser avec Luna AI.': { fr: 'Sélectionnez une demande pour l\'analyser avec Luna AI.', en: 'Select a request to analyze with Luna AI.', da: 'Vælg en forespørgsel for at analysere med Luna AI.', nl: 'Selecteer een aanvraag om te analyseren met Luna AI.', es: 'Seleccione una solicitud para analizarla con Luna IA.' },

    // ═══ QUOTES MODAL ═══
    'Nouveau Devis Executive': { fr: 'Nouveau Devis Executive', en: 'New Executive Quote', da: 'Nyt Executive-Tilbud', nl: 'Nieuwe Executive Offerte', es: 'Nuevo Presupuesto Executive' },
    'Voir la Proposition PDF': { fr: 'Voir la Proposition PDF', en: 'View PDF Proposal', da: 'Se PDF-Forslag', nl: 'PDF-Voorstel Bekijken', es: 'Ver Propuesta PDF' },
    'Export Excel': { fr: 'Export Excel', en: 'Export Excel', da: 'Eksporter Excel', nl: 'Exporteer Excel', es: 'Exportar Excel' },
    'Sélection globale :': { fr: 'Sélection globale :', en: 'Global selection:', da: 'Global udvælgelse:', nl: 'Globale selectie:', es: 'Selección global:' },

    // ═══ ACTIONS / BUTTONS ═══
    'FERMER': { fr: 'FERMER', en: 'CLOSE', da: 'LUK', nl: 'SLUITEN', es: 'CERRAR' },
    'Désactiver l\'abonnement': { fr: 'Désactiver l\'abonnement', en: 'Deactivate subscription', da: 'Deaktiver abonnement', nl: 'Abonnement deactiveren', es: 'Desactivar suscripción' },
    'Gérer via Stripe': { fr: 'Gérer via Stripe', en: 'Manage via Stripe', da: 'Administrer via Stripe', nl: 'Beheer via Stripe', es: 'Gestionar vía Stripe' },
    'Changer de plan': { fr: 'Changer de plan', en: 'Change plan', da: 'Skift plan', nl: 'Plan wijzigen', es: 'Cambiar plan' },
    'Aucun abonnement actif': { fr: 'Aucun abonnement actif', en: 'No active subscription', da: 'Intet aktivt abonnement', nl: 'Geen actief abonnement', es: 'Sin suscripción activa' },
    'Signaler un bug': { fr: 'Signaler un bug', en: 'Report a bug', da: 'Rapporter en fejl', nl: 'Een bug melden', es: 'Reportar un error' },

    // ═══ ENRICHIR (FIRECRAWL) ═══
    'Enrichir depuis le web': { fr: 'Enrichir depuis le web', en: 'Enrich from web', da: 'Berig fra nettet', nl: 'Verrijken vanaf web', es: 'Enriquecer desde la web' },
    'Enrichir': { fr: 'Enrichir', en: 'Enrich', da: 'Berig', nl: 'Verrijken', es: 'Enriquecer' },
    'Scraping...': { fr: 'Scraping...', en: 'Scraping...', da: 'Scraper...', nl: 'Scrapen...', es: 'Extrayendo...' },

    // ═══ DOCUMENTS ═══
    'Coffre-fort Documents': { fr: 'Coffre-fort Documents', en: 'Document Vault', da: 'Dokumentboks', nl: 'Documentkluis', es: 'Caja fuerte de documentos' },
    'Stockez et gérez les documents de vos clients en toute sécurité.': { fr: 'Stockez et gérez les documents de vos clients en toute sécurité.', en: 'Store and manage your clients\' documents securely.', da: 'Opbevar og administrer dine kunders dokumenter sikkert.', nl: 'Sla de documenten van uw klanten veilig op.', es: 'Almacene y gestione los documentos de sus clientes de forma segura.' },
    'Uploader': { fr: 'Uploader', en: 'Upload', da: 'Upload', nl: 'Uploaden', es: 'Subir' },
    'Uploader un document': { fr: 'Uploader un document', en: 'Upload a document', da: 'Upload et dokument', nl: 'Upload een document', es: 'Subir un documento' },
    'Tous les types': { fr: 'Tous les types', en: 'All types', da: 'Alle typer', nl: 'Alle typen', es: 'Todos los tipos' },
    'Sélectionner un client': { fr: 'Sélectionner un client', en: 'Select a client', da: 'Vælg en klient', nl: 'Selecteer een klant', es: 'Seleccionar un cliente' },

    // ═══ MARKETING ═══
    'Marketing & Campagnes': { fr: 'Marketing & Campagnes', en: 'Marketing & Campaigns', da: 'Marketing & Kampagner', nl: 'Marketing & Campagnes', es: 'Marketing & Campañas' },
    'Envoyés': { fr: 'Envoyés', en: 'Sent', da: 'Sendt', nl: 'Verzonden', es: 'Enviados' },

    // ═══ TASKS ═══
    'Tâches & Rappels': { fr: 'Tâches & Rappels', en: 'Tasks & Reminders', da: 'Opgaver & Påmindelser', nl: 'Taken & Herinneringen', es: 'Tareas & Recordatorios' },
    'Organisez le travail de votre équipe en colonnes Kanban.': { fr: 'Organisez le travail de votre équipe en colonnes Kanban.', en: 'Organize your team\'s work in Kanban columns.', da: 'Organisér dit teams arbejde i Kanban-kolonner.', nl: 'Organiseer het werk van uw team in Kanban-kolommen.', es: 'Organice el trabajo de su equipo en columnas Kanban.' },
    'À Faire': { fr: 'À Faire', en: 'To Do', da: 'At gøre', nl: 'Te doen', es: 'Por hacer' },
    'En Cours': { fr: 'En Cours', en: 'In Progress', da: 'I gang', nl: 'Bezig', es: 'En progreso' },
    'En Revue': { fr: 'En Revue', en: 'In Review', da: 'Under gennemgang', nl: 'In review', es: 'En revisión' },
    'Marquer Fait': { fr: 'Marquer Fait', en: 'Mark Done', da: 'Markér færdig', nl: 'Markeer als klaar', es: 'Marcar como hecho' },

    // ═══ ACTIVITIES ═══
    'Votre ligne du temps pour ne rater aucune opportunité.': { fr: 'Votre ligne du temps pour ne rater aucune opportunité.', en: 'Your timeline to never miss an opportunity.', da: 'Din tidslinje for aldrig at gå glip af en mulighed.', nl: 'Uw tijdlijn om geen kans te missen.', es: 'Su línea de tiempo para no perder ninguna oportunidad.' },
    'Reporter': { fr: 'Reporter', en: 'Postpone', da: 'Udskyd', nl: 'Uitstellen', es: 'Posponer' },

    // ═══ MESSAGES ═══
    'Nouvelle Conversation': { fr: 'Nouvelle Conversation', en: 'New Conversation', da: 'Ny samtale', nl: 'Nieuw gesprek', es: 'Nueva conversación' },

    // ═══ CHANGELOG ═══
    'Quoi de neuf': { fr: 'Quoi de neuf', en: 'What\'s new', da: 'Hvad er nyt', nl: 'Wat is nieuw', es: 'Novedades' },
    'Dernières mises à jour et améliorations': { fr: 'Dernières mises à jour et améliorations', en: 'Latest updates and improvements', da: 'Seneste opdateringer og forbedringer', nl: 'Laatste updates en verbeteringen', es: 'Últimas actualizaciones y mejoras' },

    // ═══ CLIENT PROFILE ═══
    'Client introuvable': { fr: 'Client introuvable', en: 'Client not found', da: 'Klient ikke fundet', nl: 'Klant niet gevonden', es: 'Cliente no encontrado' },
    'Préférences Strictes': { fr: 'Préférences Strictes', en: 'Strict Preferences', da: 'Strenge præferencer', nl: 'Strikte voorkeuren', es: 'Preferencias estrictas' },

    // ═══ TRIP DETAIL ═══
    'Voyage introuvable': { fr: 'Voyage introuvable', en: 'Trip not found', da: 'Rejse ikke fundet', nl: 'Reis niet gevonden', es: 'Viaje no encontrado' },

    // ═══ DOSSIERS (LEGAL) ═══
    'Dossiers': { fr: 'Dossiers', en: 'Cases', da: 'Sager', nl: 'Dossiers', es: 'Expedientes' },
    'Aucun dossier trouvé': { fr: 'Aucun dossier trouvé', en: 'No cases found', da: 'Ingen sager fundet', nl: 'Geen dossiers gevonden', es: 'Sin expedientes encontrados' },
    'Créez votre premier dossier pour commencer.': { fr: 'Créez votre premier dossier pour commencer.', en: 'Create your first case to get started.', da: 'Opret din første sag for at komme i gang.', nl: 'Maak uw eerste dossier om te beginnen.', es: 'Cree su primer expediente para comenzar.' },
    'Honoraires': { fr: 'Honoraires', en: 'Fees', da: 'Honorarer', nl: 'Honoraria', es: 'Honorarios' },
    'Juridiction': { fr: 'Juridiction', en: 'Jurisdiction', da: 'Jurisdiktion', nl: 'Jurisdictie', es: 'Jurisdicción' },
    'Partie adverse': { fr: 'Partie adverse', en: 'Opposing party', da: 'Modpart', nl: 'Tegenpartij', es: 'Parte contraria' },
    'Magistrat': { fr: 'Magistrat', en: 'Judge', da: 'Dommer', nl: 'Rechter', es: 'Magistrado' },
    'Forces': { fr: 'Forces', en: 'Strengths', da: 'Styrker', nl: 'Sterktes', es: 'Fortalezas' },
    'Faiblesses': { fr: 'Faiblesses', en: 'Weaknesses', da: 'Svagheder', nl: 'Zwaktes', es: 'Debilidades' },

    // ═══ AVOCAT (LEGAL CRM) ═══
    'CRM Legal': { fr: 'CRM Legal', en: 'Legal CRM', da: 'Juridisk CRM', nl: 'Juridisch CRM', es: 'CRM Legal' },
    'Aucune audience planifiée': { fr: 'Aucune audience planifiée', en: 'No hearings scheduled', da: 'Ingen retsmøder planlagt', nl: 'Geen hoorzittingen gepland', es: 'Sin audiencias programadas' },
    'Par type': { fr: 'Par type', en: 'By type', da: 'Efter type', nl: 'Per type', es: 'Por tipo' },
    'Aucune échéance': { fr: 'Aucune échéance', en: 'No deadlines', da: 'Ingen deadlines', nl: 'Geen deadlines', es: 'Sin vencimientos' },

    // ═══ SETUP ═══
    'Installation & Configuration': { fr: 'Installation & Configuration', en: 'Setup & Configuration', da: 'Installation & Konfiguration', nl: 'Installatie & Configuratie', es: 'Instalación & Configuración' },
    'Configurez vos clés API pour activer chaque module': { fr: 'Configurez vos clés API pour activer chaque module', en: 'Configure your API keys to activate each module', da: 'Konfigurér dine API-nøgler for at aktivere hvert modul', nl: 'Configureer uw API-sleutels om elke module te activeren', es: 'Configure sus claves API para activar cada módulo' },
    'Configuration': { fr: 'Configuration', en: 'Configuration', da: 'Konfiguration', nl: 'Configuratie', es: 'Configuración' },
    'Votre Métier': { fr: 'Votre Métier', en: 'Your Industry', da: 'Din branche', nl: 'Uw sector', es: 'Su sector' },
    "Choisissez votre secteur pour adapter l'interface Luna": { fr: "Choisissez votre secteur pour adapter l'interface Luna", en: 'Choose your industry to customize the Luna interface', da: 'Vælg din branche for at tilpasse Luna-grænsefladen', nl: 'Kies uw sector om de Luna-interface aan te passen', es: 'Elija su sector para adaptar la interfaz Luna' },
    "Besoin d'aide ?": { fr: "Besoin d'aide ?", en: 'Need help?', da: 'Brug for hjælp?', nl: 'Hulp nodig?', es: '¿Necesita ayuda?' },
    "Notre équipe peut configurer vos APIs pour vous.": { fr: "Notre équipe peut configurer vos APIs pour vous.", en: 'Our team can configure your APIs for you.', da: 'Vores team kan konfigurere dine API\'er for dig.', nl: 'Ons team kan uw API\'s voor u configureren.', es: 'Nuestro equipo puede configurar sus APIs por usted.' },

    // ═══ SITE BUILDER ═══
    'Templates Web': { fr: 'Templates Web', en: 'Web Templates', da: 'Webskabeloner', nl: 'Webjablonen', es: 'Plantillas Web' },

    // ═══ SUPPLIERS ═══
    'Prestataire introuvable': { fr: 'Prestataire introuvable', en: 'Supplier not found', da: 'Leverandør ikke fundet', nl: 'Leverancier niet gevonden', es: 'Proveedor no encontrado' },
    'Affectation Mission': { fr: 'Affectation Mission', en: 'Mission Assignment', da: 'Missionsopgave', nl: 'Missietoewijzing', es: 'Asignación de misión' },
    'Prestation introuvable': { fr: 'Prestation introuvable', en: 'Service not found', da: 'Ydelse ikke fundet', nl: 'Dienst niet gevonden', es: 'Servicio no encontrado' },
    'Lier un Prestataire': { fr: 'Lier un Prestataire', en: 'Link a Supplier', da: 'Tilknyt en leverandør', nl: 'Koppel een leverancier', es: 'Vincular un proveedor' },

    // ═══ PLANNING ═══
    'Executive Planning': { fr: 'Executive Planning', en: 'Executive Planning', da: 'Executive Planning', nl: 'Executive Planning', es: 'Planificación Ejecutiva' },
    'Logistique & Synchronisation Prestataires': { fr: 'Logistique & Synchronisation Prestataires', en: 'Logistics & Supplier Sync', da: 'Logistik & Leverandørsync', nl: 'Logistiek & Leverancierssync', es: 'Logística & Sincronización de Proveedores' },
    'Début': { fr: 'Début', en: 'Start', da: 'Start', nl: 'Start', es: 'Inicio' },
    'Fin': { fr: 'Fin', en: 'End', da: 'Slut', nl: 'Einde', es: 'Fin' },

    // ═══ AGENT IA ═══
    'Agent Juridique': { fr: 'Agent Juridique', en: 'Legal Agent', da: 'Juridisk Agent', nl: 'Juridische Agent', es: 'Agente Jurídico' },
    'Recherche intelligente de voyages et prestations': { fr: 'Recherche intelligente de voyages et prestations', en: 'Smart search for trips and services', da: 'Intelligent søgning efter rejser og ydelser', nl: 'Slim zoeken naar reizen en diensten', es: 'Búsqueda inteligente de viajes y servicios' },
    'Actif': { fr: 'Actif', en: 'Active', da: 'Aktiv', nl: 'Actief', es: 'Activo' },
    'Annuler la recherche': { fr: 'Annuler la recherche', en: 'Cancel search', da: 'Annullér søgning', nl: 'Zoekopdracht annuleren', es: 'Cancelar búsqueda' },
    'Récents': { fr: 'Récents', en: 'Recent', da: 'Seneste', nl: 'Recent', es: 'Recientes' },

    // ═══ JURISPRUDENCE ═══
    'Jurisprudence': { fr: 'Jurisprudence', en: 'Case Law', da: 'Retspraksis', nl: 'Jurisprudentie', es: 'Jurisprudencia' },
    'Recherche Légifrance': { fr: 'Recherche Légifrance', en: 'Légifrance Search', da: 'Légifrance-søgning', nl: 'Légifrance zoeken', es: 'Búsqueda Légifrance' },
    'Ajouter un arrêt': { fr: 'Ajouter un arrêt', en: 'Add a ruling', da: 'Tilføj en afgørelse', nl: 'Voeg een uitspraak toe', es: 'Añadir una sentencia' },
    'Articles de loi et jurisprudence officielle — API DILA/PISTE': { fr: 'Articles de loi et jurisprudence officielle — API DILA/PISTE', en: 'Legal articles and official case law — DILA/PISTE API', da: 'Lovartikler og officiel retspraksis — DILA/PISTE API', nl: 'Wetsartikelen en officiële jurisprudentie — DILA/PISTE API', es: 'Artículos de ley y jurisprudencia oficial — API DILA/PISTE' },
    'Texte intégral': { fr: 'Texte intégral', en: 'Full text', da: 'Fuldtekst', nl: 'Volledige tekst', es: 'Texto íntegro' },
    'Solution': { fr: 'Solution', en: 'Solution', da: 'Løsning', nl: 'Oplossing', es: 'Solución' },
    'Toute la base': { fr: 'Toute la base', en: 'Full database', da: 'Hele databasen', nl: 'Volledige database', es: 'Toda la base' },
    'Aucun arrêt trouvé': { fr: 'Aucun arrêt trouvé', en: 'No rulings found', da: 'Ingen afgørelser fundet', nl: 'Geen uitspraken gevonden', es: 'Sin sentencias encontradas' },
    'Utilisez la recherche Légifrance ou ajoutez vos propres décisions.': { fr: 'Utilisez la recherche Légifrance ou ajoutez vos propres décisions.', en: 'Use Légifrance search or add your own rulings.', da: 'Brug Légifrance-søgning eller tilføj dine egne afgørelser.', nl: 'Gebruik Légifrance zoeken of voeg uw eigen uitspraken toe.', es: 'Use la búsqueda Légifrance o añada sus propias sentencias.' },
    'Enrichissez votre base jurisprudentielle': { fr: 'Enrichissez votre base jurisprudentielle', en: 'Enrich your case law database', da: 'Berig din retspraksis-database', nl: 'Verrijk uw jurisprudentiedatabase', es: 'Enriquezca su base jurisprudencial' },

    // ═══ SETTINGS ═══
    'Abonnement': { fr: 'Abonnement', en: 'Subscription', da: 'Abonnement', nl: 'Abonnement', es: 'Suscripción' },
    'Membre': { fr: 'Membre', en: 'Member', da: 'Medlem', nl: 'Lid', es: 'Miembro' },
    'Services Google installés et configurés sur ce CRM': { fr: 'Services Google installés et configurés sur ce CRM', en: 'Google services installed and configured on this CRM', da: 'Google-tjenester installeret og konfigureret på dette CRM', nl: 'Google-services geïnstalleerd en geconfigureerd op dit CRM', es: 'Servicios de Google instalados y configurados en este CRM' },
};

/**
 * <T> component — auto-translates any French string to the user's preferred language.
 * Supports vertical-specific overrides: if the active vertical defines a translation
 * override for a string, it takes priority over AUTO_DICT.
 */
export function T({ children }: { children: string }) {
    const { locale } = useTranslation();
    const { vertical } = useVertical();

    // Check vertical overrides first
    const verticalOverride = vertical.translationOverrides[children];
    if (verticalOverride) {
        const overrideText = verticalOverride[locale] || verticalOverride.fr;
        if (overrideText) return <>{overrideText}</>;
    }

    if (locale === 'fr') return <>{children}</>;

    const translated = AUTO_DICT[children]?.[locale];
    return <>{translated || children}</>;
}

/**
 * useAutoTranslate hook — provides a function to translate strings inline.
 * Supports vertical-specific overrides.
 */
export function useAutoTranslate() {
    const { locale } = useTranslation();
    const { vertical } = useVertical();

    return (text: string): string => {
        // Check vertical overrides first
        const verticalOverride = vertical.translationOverrides[text];
        if (verticalOverride) {
            const overrideText = verticalOverride[locale] || verticalOverride.fr;
            if (overrideText) return overrideText;
        }

        if (locale === 'fr') return text;
        return AUTO_DICT[text]?.[locale] || text;
    };
}

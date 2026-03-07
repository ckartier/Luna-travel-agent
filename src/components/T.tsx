'use client';

import { useTranslation } from '@/src/hooks/useTranslation';
import { LunaLocale } from '@/src/lib/i18n/translations';

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
};

/**
 * <T> component — auto-translates any French string to the user's preferred language.
 * Usage: <T>Texte en français</T>  →  outputs translated text
 *
 * This is the fastest way to add i18n to existing pages without rewriting them.
 * If no translation is found, it returns the original French text.
 */
export function T({ children }: { children: string }) {
    const { locale } = useTranslation();

    if (locale === 'fr') return <>{children}</>;

    const translated = AUTO_DICT[children]?.[locale];
    return <>{translated || children}</>;
}

/**
 * useAutoTranslate hook — provides a function to translate strings inline.
 * Usage: const at = useAutoTranslate(); ... at('Texte en français')
 */
export function useAutoTranslate() {
    const { locale } = useTranslation();

    return (text: string): string => {
        if (locale === 'fr') return text;
        return AUTO_DICT[text]?.[locale] || text;
    };
}

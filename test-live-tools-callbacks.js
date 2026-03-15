require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const TRAVEL_TOOLS = [
    {
        name: 'get_upcoming_trips',
        description: 'Obtenir la liste des prochains voyages prévus.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_client_info',
        description: 'Rechercher un client par nom et retourner sa fiche détaillée.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Nom ou email du client' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_today_pipeline',
        description: 'Obtenir le résumé commercial du jour (leads récents et opportunités).',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_recent_emails',
        description: 'Obtenir les 5 derniers emails urgents ou non lus.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_quote_details',
        description: 'Rechercher un devis spécifique par nom de client ou destination.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Client, destination ou numéro de devis' },
            },
            required: ['query'],
        },
    },
    {
        name: 'navigate_to',
        description: 'Naviguer vers une section spécifique de l\'application CRM.',
        parameters: {
            type: 'object',
            properties: {
                section: {
                    type: 'string',
                    enum: [
                        'dashboard', 'clients', 'pipeline', 'conciergerie', 'travel',
                        'quotes', 'invoices', 'marketing', 'mails', 'analytics',
                        'agent-ia', 'settings', 'team', 'site-builder'
                    ],
                },
            },
            required: ['section'],
        },
    },
    {
        name: 'create_quote',
        description: 'Créer un nouveau devis pour un client.',
        parameters: {
            type: 'object',
            properties: {
                clientName: { type: 'string', description: 'Nom ou prénom du client' },
                destination: { type: 'string', description: 'Destination (ex: Maldives, Japon)' },
                budget: { type: 'number', description: 'Budget en euros (optionnel)' },
                startDate: { type: 'string', description: 'Date de départ YYYY-MM-DD (optionnel)' },
                endDate: { type: 'string', description: 'Date de retour YYYY-MM-DD (optionnel)' },
            },
            required: ['clientName', 'destination'],
        },
    },
    {
        name: 'create_email_draft',
        description: 'Préparer un brouillon d\'email. Le statut sera "draft", prêt à être envoyé par l\'utilisateur.',
        parameters: {
            type: 'object',
            properties: {
                toName: { type: 'string', description: 'Nom du destinataire' },
                toEmail: { type: 'string', description: 'Email du destinataire (optionnel si le nom suffit)' },
                subject: { type: 'string', description: 'Objet de l\'email' },
                body: { type: 'string', description: 'Corps de l\'email, rédigé de manière professionnelle en français' },
                relatedTo: { type: 'string', description: 'Voyage, devis ou dossier concerné (optionnel)' },
            },
            required: ['toName', 'subject', 'body'],
        },
    },
    {
        name: 'create_client',
        description: 'Créer une nouvelle fiche client dans le CRM.',
        parameters: {
            type: 'object',
            properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string', description: 'Numéro de téléphone (optionnel)' },
                notes: { type: 'string', description: 'Notes initiales (optionnel)' },
            },
            required: ['firstName', 'lastName'],
        },
    },
    {
        name: 'create_invoice',
        description: 'Créer une facture pour un client ou un voyage.',
        parameters: {
            type: 'object',
            properties: {
                clientName: { type: 'string', description: 'Nom du client' },
                amount: { type: 'number', description: 'Montant TTC en euros' },
                description: { type: 'string', description: 'Description de la prestation (ex: "Voyage Bali juin 2025")' },
                dueDate: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD, optionnel)' },
            },
            required: ['clientName', 'amount', 'description'],
        },
    },
    {
        name: 'add_note_to_client',
        description: 'Ajouter une note interne sur la fiche d\'un client.',
        parameters: {
            type: 'object',
            properties: {
                clientName: { type: 'string', description: 'Nom du client' },
                note: { type: 'string', description: 'Contenu de la note' },
            },
            required: ['clientName', 'note'],
        },
    },
    {
        name: 'update_lead_stage',
        description: 'Mettre à jour le stade d\'un lead dans le pipeline commercial.',
        parameters: {
            type: 'object',
            properties: {
                clientName: { type: 'string', description: 'Nom du client ou prospect' },
                stage: {
                    type: 'string',
                    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
                    description: 'Nouveau stade du pipeline',
                },
            },
            required: ['clientName', 'stage'],
        },
    },
    {
        name: 'search_crm',
        description: 'Rechercher n\'importe quelle entité dans le CRM (client, voyage, email, lead).',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
            },
            required: ['query'],
        },
    },
];

async function testSingleTool(tool) {
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: 'gemini-2.0-flash',
        config: {
          responseModalities: ['AUDIO', 'TEXT'],
          tools: [{ functionDeclarations: [tool] }]
        },
        callbacks: {
           onopen: () => {
              clearTimeout(timeout);
              console.log(`✅ SUCCESS: ${tool.name}`);
              setTimeout(() => { session.close(); resolve(); }, 300);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              if (e.code === 1008) {
                 console.error(`❌ REJECTED 1008: ${tool.name}`);
              }
              resolve();
           }
        }
      });
      timeout = setTimeout(() => {
          console.log(`Timeout: ${tool.name}`);
          resolve();
      }, 3000);
    } catch (err) {
      clearTimeout(timeout);
      console.error(`❌ EXCEPTION ${tool.name}:`, err.message || err);
      resolve();
    }
  });
}

async function run() {
  console.log(`Testing each of the ${TRAVEL_TOOLS.length} tools over Live API...`);
  for (const t of TRAVEL_TOOLS) {
    await testSingleTool(t);
  }
}
run();

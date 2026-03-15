# Guide d'Installation Complet — Luna Conciergerie

## Table des matières

1. [Prérequis](#prérequis)
2. [Firebase — Base de données & Authentification](#firebase)
3. [WhatsApp Business — Notifications clients](#whatsapp)
4. [OpenAI — Agent IA & Génération de contenu](#openai)
5. [Gmail API — Boîte de réception](#gmail)
6. [Mapbox — Autocomplétion destinations](#mapbox)
7. [Déploiement](#déploiement)
8. [FAQ & Dépannage](#faq)

---

## 1. Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Node.js** v18 ou supérieur
- **npm** ou **yarn** installé
- Un compte **Google** (pour Firebase et Gmail)
- Un compte **Meta Business** (pour WhatsApp)
- Un compte **OpenAI** (pour l'Agent IA)

---

## 2. Firebase — Base de données & Authentification

Firebase est le cœur de Luna. Il gère la base de données, l'authentification et le stockage de fichiers.

### Étape 1 : Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com/)
2. Cliquez **Ajouter un projet**
3. Donnez un nom (ex: `luna-conciergerie`)
4. Activez Google Analytics (optionnel)
5. Validez la création

### Étape 2 : Ajouter une application Web

1. Dans votre projet Firebase, cliquez **⚙️ Paramètres du projet**
2. Section **Vos applications** → **Ajouter une application** → **Web** (icône `</>`)
3. Donnez un nom (ex: `Luna Web`)
4. Copiez les valeurs de configuration :

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Étape 3 : Activer Firestore

1. Firebase Console → **Firestore Database** → **Créer une base de données**
2. Choisissez le mode **Production** (les règles seront configurées automatiquement)
3. Sélectionnez la région la plus proche (ex: `europe-west1`)

### Étape 4 : Activer l'authentification

1. Firebase Console → **Authentication** → **Commencer**
2. Onglet **Fournisseurs de connexion**
3. Activez **Email/Mot de passe** et **Google**
4. Pour Google : renseignez votre email de support

### Étape 5 : Activer le Storage

1. Firebase Console → **Storage** → **Commencer**
2. Acceptez les règles par défaut
3. Ce bucket sera utilisé pour les images uploadées

---

## 3. WhatsApp Business — Notifications clients

WhatsApp permet d'envoyer des notifications automatiques aux clients et prestataires.

### Étape 1 : Créer une application Meta

1. Allez sur [developers.facebook.com](https://developers.facebook.com/)
2. **Mes applications** → **Créer une appli** → Type **Business**
3. Donnez un nom (ex: `Luna Notifications`)

### Étape 2 : Ajouter le produit WhatsApp

1. Dans votre application, cliquez **Ajouter un produit**
2. Sélectionnez **WhatsApp** → **Configurer**
3. Associez votre compte Meta Business

### Étape 3 : Récupérer les clés

1. **WhatsApp** → **API Setup** dans le menu latéral
2. Copiez le **Access Token temporaire** (ou créez un token permanent)
3. Copiez le **Phone Number ID** (sous votre numéro de test)

```
WHATSAPP_TOKEN=EAABsb...
WHATSAPP_PHONE_ID=1234567890
WHATSAPP_VERIFY_TOKEN=mon-token-secret-personnalisé
```

### Étape 4 : Configurer le Webhook (optionnel)

1. **Webhook** → **Configuration**
2. URL de callback : `https://votre-domaine.com/api/whatsapp/webhook`
3. Verify Token : celui que vous avez choisi ci-dessus
4. Abonnez-vous aux événements : `messages`

### Notifications envoyées automatiquement

| Événement | Message |
|-----------|---------|
| Confirmation de réservation | Rappel avec détails du voyage |
| Changement de date | Nouvelle date + détails mis à jour |
| Récap pré-départ (J-3) | Itinéraire complet envoyé |
| Réassignation prestataire | Notification au nouveau prestataire |

---

## 4. OpenAI — Agent IA & Génération de contenu

L'Agent IA utilise GPT-4 pour analyser les emails, générer des itinéraires et suggérer des prestations.

### Étape 1 : Créer un compte OpenAI

1. Allez sur [platform.openai.com](https://platform.openai.com/)
2. Créez un compte ou connectez-vous

### Étape 2 : Générer une clé API

1. Menu → **API Keys** → **Create new secret key**
2. Donnez un nom (ex: `Luna Production`)
3. **⚠️ IMPORTANT** : Copiez la clé immédiatement, elle ne sera plus visible !

```
OPENAI_API_KEY=sk-proj-...
```

### Étape 3 : Ajouter des crédits

1. **Billing** → **Add payment method**
2. Ajoutez des crédits (minimum 10$)
3. L'Agent IA utilise GPT-4o, ~0.01$ par requête

### Fonctionnalités IA

- **Analyse email** → Extraction destination, dates, budget, voyageurs
- **Génération itinéraire** → Programme jour par jour avec activités
- **Recherche vols** → Suggestions de vols avec tarifs
- **Recherche hôtels** → Hôtels recommandés par destination
- **Profil client** → Analyse des préférences

---

## 5. Gmail API — Boîte de réception

Gmail permet de recevoir et envoyer des emails directement depuis le CRM.

### Étape 1 : Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez votre projet Firebase existant
3. Activez l'**API Gmail** dans **APIs & Services** → **Bibliothèque**

### Étape 2 : Créer des identifiants OAuth 2.0

1. **APIs & Services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth**
2. Type d'application : **Application Web**
3. Nom : `Luna CRM`
4. URI de redirection autorisés : `https://votre-domaine.com/api/gmail/callback`

```
GOOGLE_CLIENT_ID=123456-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/gmail/callback
```

### Étape 3 : Authentifier votre compte

1. Allez sur `https://votre-domaine.com/api/gmail/auth`
2. Connectez-vous avec votre compte Google
3. Autorisez les scopes : lecture, envoi, modification d'emails
4. Le refresh token sera sauvegardé automatiquement

### Scopes requis

- `gmail.readonly` — Lecture des emails
- `gmail.send` — Envoi d'emails
- `gmail.modify` — Archiver, supprimer, marquer comme lu

---

## 6. Mapbox — Autocomplétion destinations

Mapbox fournit l'autocomplétion des noms de villes dans l'Agent IA.

### Configuration

1. Créez un compte sur [mapbox.com](https://www.mapbox.com/)
2. Copiez votre **Access Token** par défaut

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

---

## 7. Déploiement

### Option 1 : Vercel (recommandé)

1. Poussez votre code sur GitHub
2. Connectez votre repo sur [vercel.com](https://vercel.com/)
3. Ajoutez vos variables d'environnement dans **Settings** → **Environment Variables**
4. Déployez !

### Option 2 : Auto-hébergé

```bash
# Build de production
npm run build

# Démarrer le serveur
npm start
```

### Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec toutes les clés configurées ci-dessus.

---

## 8. FAQ & Dépannage

### L'Agent IA ne répond pas
- Vérifiez que `OPENAI_API_KEY` est configurée
- Vérifiez que vous avez des crédits sur votre compte OpenAI
- Consultez les logs serveur (`npm run dev`)

### Les emails ne se chargent pas
- Vérifiez les 3 clés Gmail (Client ID, Client Secret, Redirect URI)
- Ré-authentifiez-vous via `/api/gmail/auth`
- Assurez-vous que l'API Gmail est activée dans Google Cloud

### WhatsApp n'envoie pas de notifications
- Vérifiez que le token n'a pas expiré
- Utilisez un token permanent (pas le test token)
- Vérifiez le Phone Number ID (ce n'est PAS le numéro de téléphone)

### Firebase "Permission denied"
- Vérifiez vos règles Firestore
- Assurez-vous que l'utilisateur est authentifié
- Vérifiez que le `tenantId` est correct

### Le site conciergerie ne s'affiche pas
- Allez dans **Éditeur Site** et sauvegardez une configuration
- Vérifiez que le template est sélectionné dans **Templates**
- Ajoutez au moins une collection dans **Collections**

---

## Support

📧 **support@luna-travel.com**
📖 **Documentation en ligne** : luna-travel.com/docs
💬 **Chatbot d'aide** : disponible dans le CRM (icône L en bas à droite)

---

*Luna Conciergerie — Guide d'installation v1.0*
*Dernière mise à jour : Mars 2026*

# Agent IA Chat/Voice Redesign (Planned Features)

Ce document décrit les fonctionnalités attendues pour la future version de la page "Agent IA", qui intégrera une interface unifiée Chat/Voix de type ChatGPT.

## Objectifs Principaux
1. **Interface Unifiée (Chat & Voix)** : Permettre à l'utilisateur de passer du texte à la voix (et inversement) de manière fluide, avec une transcription commune.
2. **Design Minimaliste** : UI/UX épurée, animations fluides (framer-motion), effet de vague (waveform) pour la voix, très professionnel ("Siri-like").
3. **Accueil Proactif (Avocats)** : Si le vertical est `legal`, l'Agent Vocal doit démarrer la session en disant : "Bonjour Maître [Nom de l'utilisateur], que puis-je faire pour vous ?"
4. **Flux Conversationnel Naturel** : 
   - L'IA écoute (réponse micro)
   - L'IA confirme/annonce la réflexion (formule de politesse courte)
   - L'IA analyse les données
   - L'IA répond calmement et passe en attente de la prochaine requête
5. **Guidance Proactive** : L'IA ne doit pas juste répondre, elle doit être proactive et relancer la conversation : "Que fait-on ensuite ?", "Est-ce clair pour vous ?", "Souhaitez-vous que je cherche comment adapter cela ?"

## Plan d'Implémentation Technique

### 1. Composant `UnifiedAgent` (Remplacement de `/crm/agent-ia/page.tsx`)
- Supprimer les formulaires d'analyse existants (Dossier / Jurisprudence).
- Créer un layout principal centré avec l'historique de la conversation.
- Ajouter une "Input Bar" en bas de l'écran avec un Toggle : 
  - Mode Clavier (TextInput + Bouton Envoyer)
  - Mode Voix (Gros bouton Micro interactif)

### 2. Adaptation du Hook `useVoiceAgent`
- **Initialisation** : Modifier le hook pour accepter un `initialGreeting` optionnel ou l'injecter via le système prompt / un `CustomEvent`.
- **System Prompt** : Renforcer les consignes de l'IA pour qu'elle utilise des formules de politesse, soit concise, et pose des questions de relance à la fin de ses réponses.
- **Synchronisation** : Prendre l'historique des requêtes textes (via `/api/crm/chat`) et les intégrer dans le même tableau `transcript` que les requêtes vocales.

### 3. Animations & UI
- **Bulles de messages** : Design clair (fond blanc ou gris très léger), typo soignée, ombres subtiles.
- **Visualiseur Audio** : Animations réactives au niveau sonore (`audioLevel`) placées de manière esthétique (ex: autour du bouton micro ou en plein centre bas de l'écran).
- **Statuts Visuels** : Indicateurs clairs : "Écoute...", "Réflexion...", "Conception de la réponse...".

## Notes Complémentaires
- Ne pas oublier de récupérer le nom de l'utilisateur via le hook `useAuth()` (`userProfile?.displayName` ou `user?.displayName`).
- La vérification des statuts Micro/Audio a déjà été implémentée dans la version FAB (Floating Action Button), on pourra réutiliser cette logique (toasts en haut à droite).

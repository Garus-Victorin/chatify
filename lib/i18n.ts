export type Language = "fr" | "en";

export const t = {
  fr: {
    // Auth
    welcomeBack: "Bon retour",
    createAccount: "Créer un compte",
    signInSubtitle: "Connectez-vous à votre compte Chatify",
    registerSubtitle: "Commencez à discuter avec l'IA dès aujourd'hui",
    name: "Nom",
    namePlaceholder: "Votre nom",
    email: "E-mail",
    password: "Mot de passe",
    passwordPlaceholder: "Votre mot de passe",
    passwordMinPlaceholder: "Min. 8 caractères",
    signingIn: "Connexion…",
    creatingAccount: "Création du compte…",
    signIn: "Se connecter",
    noAccount: "Pas encore de compte ?",
    alreadyAccount: "Déjà un compte ?",
    signUp: "S'inscrire",
    networkError: "Erreur réseau — veuillez réessayer",

    // Chat
    howCanIHelp: "Comment puis-je vous aider ?",
    agentModeActive: "Mode agent actif — je peux utiliser des outils de façon autonome",
    askAnything: "Posez n'importe quelle question — tapez / pour les commandes",
    askAgent: "Demandez à l'agent de faire quelque chose de complexe…",
    askAnythingShort: "Posez une question… ou tapez / pour les commandes",
    inputHint: "Entrée pour envoyer · Maj+Entrée pour nouvelle ligne · / pour commandes · ↑↓ historique",
    stopGeneration: "Arrêter la génération",
    regenerate: "Régénérer",
    attachFile: "Joindre un fichier",
    memoryRecall: "rappel mémoire",
    memoryRecalls: "rappels mémoire",

    // Suggestions
    suggestions: [
      { text: "Rédiger un e-mail professionnel", desc: "Rédiger, modifier, améliorer" },
      { text: "Dernières actualités IA aujourd'hui", desc: "Recherche web en temps réel" },
      { text: "Déboguer mon code", desc: "Tous les langages" },
      { text: "Prix du Bitcoin maintenant", desc: "Données de marché en direct" },
      { text: "Brainstormer des idées de startup", desc: "Pensée créative" },
      { text: "Traduire en anglais", desc: "50+ langues" },
    ],

    // Sidebar
    newChat: "Nouvelle conversation",
    searchChats: "Rechercher des conversations…",
    favorites: "Favoris",
    noChatsFound: "Aucune conversation trouvée",
    today: "Aujourd'hui",
    thisWeek: "Cette semaine",
    older: "Plus ancien",
    memory: "Mémoire",
    clearChat: "Vider la conversation",
    export: "Exporter",
    settings: "Paramètres",
    signOut: "Se déconnecter",
    addTag: "Ajouter un tag… (Entrée)",
    clickToRemove: "Cliquer pour supprimer",

    // Header
    profile: "Profil",

    // Plugins
    plugins: "Plugins",
    active: "actif",
    agentMode: "Mode Agent",
    agentModeDesc: "L'IA enchaîne les outils de façon autonome pour résoudre des tâches complexes",
    pluginHint: "Utilisez",
    pluginHintEnd: "pour déclencher les plugins directement",

    // Personality
    aiPersonality: "Personnalité IA",
    personalities: [
      { id: "default",   label: "Défaut",     desc: "Équilibré et utile" },
      { id: "pro",       label: "Pro",         desc: "Formel, structuré, exécutif" },
      { id: "fun",       label: "Fun",         desc: "Enthousiaste et engageant" },
      { id: "technical", label: "Technique",   desc: "Expert, analyses approfondies" },
      { id: "mentor",    label: "Mentor",      desc: "Guidage patient, étape par étape" },
    ],

    // Searching
    searchingWeb: "Recherche sur le web…",

    // Messages
    you: "Vous",
    copy: "Copier",
    edit: "Modifier",
    like: "J'aime",
    dislike: "Je n'aime pas",
    webSearch: "Recherche web",
    cancel: "Annuler",
    send: "Envoyer",
    sources: "source",
    sourcesPlural: "sources",

    // Profile
    profileTitle: "Profil",
    account: "Compte",
    editProfile: "Modifier le profil",
    displayName: "Nom d'affichage",
    emailAddress: "Adresse e-mail",
    emailCannotChange: "(ne peut pas être modifié)",
    memberSince: "Membre depuis",
    freePlan: "Plan gratuit",
    userId: "ID utilisateur",
    activity: "Activité",
    conversations: "Conversations",
    messagesSent: "Messages envoyés",
    webSearches: "Recherches web",
    totalMessages: "Total messages",
    recentConversations: "Conversations récentes",
    noConversations: "Aucune conversation pour l'instant",
    data: "Données",
    exportData: "Exporter toutes les données (JSON)",
    saveChanges: "Enregistrer",
    saved: "Enregistré !",
    message: "message",
    messages: "messages",

    // Errors
    failedToUpdate: "Échec de la mise à jour",
    networkErrorShort: "Erreur réseau",
    failedToCreate: "Impossible de créer la session. Veuillez réessayer.",
    failedToDelete: "Impossible de supprimer la session.",
    messageSaveFailed: "Le message n'a pas pu être sauvegardé.",
    syncFailed: "Réponse sauvegardée localement mais non synchronisée.",
    failedToClear: "Impossible de vider la conversation.",
    failedToEdit: "Impossible de sauvegarder la modification.",
  },
  en: {
    welcomeBack: "Welcome back",
    createAccount: "Create account",
    signInSubtitle: "Sign in to your Chatify account",
    registerSubtitle: "Start chatting with AI today",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "Your password",
    passwordMinPlaceholder: "Min. 8 characters",
    signingIn: "Signing in…",
    creatingAccount: "Creating account…",
    signIn: "Sign in",
    noAccount: "Don't have an account?",
    alreadyAccount: "Already have an account?",
    signUp: "Sign up",
    networkError: "Network error — please try again",

    howCanIHelp: "How can I help you today?",
    agentModeActive: "Agent mode active — I can use tools autonomously to solve complex tasks",
    askAnything: "Ask anything — type / for commands, or enable plugins below",
    askAgent: "Ask the agent to do something complex…",
    askAnythingShort: "Ask anything… or type / for commands",
    inputHint: "Enter to send · Shift+Enter for new line · / for commands · ↑↓ for history",
    stopGeneration: "Stop generation",
    regenerate: "Regenerate",
    attachFile: "Attach file",
    memoryRecall: "memory recall",
    memoryRecalls: "memory recalls",

    suggestions: [
      { text: "Write a professional email", desc: "Draft, edit, improve" },
      { text: "Latest AI news today", desc: "Real-time web search" },
      { text: "Debug my code", desc: "Any language" },
      { text: "Bitcoin price right now", desc: "Live market data" },
      { text: "Brainstorm startup ideas", desc: "Creative thinking" },
      { text: "Translate to French", desc: "50+ languages" },
    ],

    newChat: "New chat",
    searchChats: "Search chats…",
    favorites: "Favorites",
    noChatsFound: "No chats found",
    today: "Today",
    thisWeek: "This week",
    older: "Older",
    memory: "Memory",
    clearChat: "Clear chat",
    export: "Export",
    settings: "Settings",
    signOut: "Sign out",
    addTag: "Add tag… (Enter)",
    clickToRemove: "Click to remove",

    profile: "Profile",

    plugins: "Plugins",
    active: "active",
    agentMode: "Agent Mode",
    agentModeDesc: "AI autonomously chains tools to solve complex tasks",
    pluginHint: "Use",
    pluginHintEnd: "to trigger plugins directly",

    aiPersonality: "AI Personality",
    personalities: [
      { id: "default",   label: "Default",   desc: "Balanced and helpful" },
      { id: "pro",       label: "Pro",        desc: "Formal, structured, executive" },
      { id: "fun",       label: "Fun",        desc: "Enthusiastic and engaging" },
      { id: "technical", label: "Technical",  desc: "Expert-level, deep dives" },
      { id: "mentor",    label: "Mentor",     desc: "Patient, step-by-step guidance" },
    ],

    searchingWeb: "Searching the web…",

    you: "You",
    copy: "Copy",
    edit: "Edit",
    like: "Like",
    dislike: "Dislike",
    webSearch: "Web search",
    cancel: "Cancel",
    send: "Send",
    sources: "source",
    sourcesPlural: "sources",

    profileTitle: "Profile",
    account: "Account",
    editProfile: "Edit profile",
    displayName: "Display name",
    emailAddress: "Email address",
    emailCannotChange: "(cannot be changed)",
    memberSince: "Member since",
    freePlan: "Free plan",
    userId: "User ID",
    activity: "Activity",
    conversations: "Conversations",
    messagesSent: "Messages sent",
    webSearches: "Web searches",
    totalMessages: "Total messages",
    recentConversations: "Recent Conversations",
    noConversations: "No conversations yet",
    data: "Data",
    exportData: "Export all data (JSON)",
    saveChanges: "Save changes",
    saved: "Saved!",
    message: "message",
    messages: "messages",

    failedToUpdate: "Failed to update",
    networkErrorShort: "Network error",
    failedToCreate: "Failed to create session. Please try again.",
    failedToDelete: "Failed to delete session.",
    messageSaveFailed: "Message could not be saved.",
    syncFailed: "Response saved locally but could not sync to server.",
    failedToClear: "Failed to clear chat.",
    failedToEdit: "Failed to save edit.",
  },
} as const;

export type Translations = typeof t.fr;

export function useT(lang: Language): Translations {
  return t[lang] as Translations;
}

// ─── getTranslations — alias for settings page ─────────────────────────────────

export function getTranslations(lang: Language): Translations & {
  settings: string;
  security: string;
  labelName: string;
  labelEmail: string;
  labelPassword: string;
  dangerZone: string;
  resetData: string;
  deleteAccount: string;
  language: string;
  languageDesc: string;
  plugins: string;
  pluginHint: string;
  aiPreferences: string;
  conversationMemory: string;
  memoryDesc: string;
  agentMode: string;
  agentDesc: string;
  editName: string;
  editEmail: string;
  editPassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  minChars: string;
  changePassword: string;
  save: string;
  cancel: string;
  networkError: string;
  passwordsDontMatch: string;
  passwordTooShort: string;
  successName: string;
  successEmail: string;
  successPassword: string;
  resetTitle: string;
  resetDesc: string;
  deleteTitle: string;
  deleteDesc: string;
  personalities: Record<string, { label: string; desc: string }> | readonly { id: string; label: string; desc: string }[];
} {
  const base = t[lang] as Translations;

  const extra = {
    fr: {
      settings: "Paramètres",
      security: "Sécurité",
      labelName: "Nom d'affichage",
      labelEmail: "Adresse e-mail",
      labelPassword: "Mot de passe",
      dangerZone: "Zone de danger",
      resetData: "Réinitialiser les données",
      deleteAccount: "Supprimer le compte",
      language: "Langue",
      languageDesc: "Choisissez la langue de l'interface",
      plugins: "Plugins",
      pluginHint: "Tapez /search, /calc ou /run pour déclencher un plugin directement",
      aiPreferences: "Préférences IA",
      conversationMemory: "Mémoire de conversation",
      memoryDesc: "L'IA se souvient du contexte des échanges précédents",
      agentMode: "Mode Agent",
      agentDesc: "L'IA enchaîne les outils de façon autonome",
      editName: "Modifier le nom",
      editEmail: "Modifier l'e-mail",
      editPassword: "Modifier le mot de passe",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      minChars: "Min. 8 caractères",
      changePassword: "Changer le mot de passe",
      save: "Enregistrer",
      cancel: "Annuler",
      networkError: "Erreur réseau",
      passwordsDontMatch: "Les mots de passe ne correspondent pas",
      passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères",
      successName: "Nom mis à jour avec succès",
      successEmail: "E-mail mis à jour avec succès",
      successPassword: "Mot de passe modifié avec succès",
      resetTitle: "Réinitialiser toutes les données ?",
      resetDesc: "Toutes vos conversations et messages seront supprimés définitivement. Cette action est irréversible.",
      deleteTitle: "Supprimer le compte définitivement ?",
      deleteDesc: "Votre compte et toutes les données associées seront supprimés. Vous serez déconnecté immédiatement. Cette action est irréversible.",
      personalities: {
        default:   { label: "Défaut",    desc: "Équilibré et utile" },
        pro:       { label: "Pro",        desc: "Formel, structuré, exécutif" },
        fun:       { label: "Fun",        desc: "Enthousiaste et engageant" },
        technical: { label: "Technique",  desc: "Expert, analyses approfondies" },
        mentor:    { label: "Mentor",     desc: "Guidage patient, étape par étape" },
      },
    },
    en: {
      settings: "Settings",
      security: "Security",
      labelName: "Display name",
      labelEmail: "Email address",
      labelPassword: "Password",
      dangerZone: "Danger Zone",
      resetData: "Reset all data",
      deleteAccount: "Delete account permanently",
      language: "Language",
      languageDesc: "Choose the interface language",
      plugins: "Plugins",
      pluginHint: "Type /search, /calc or /run to trigger a plugin directly",
      aiPreferences: "AI Preferences",
      conversationMemory: "Conversation Memory",
      memoryDesc: "AI remembers context from previous exchanges",
      agentMode: "Agent Mode",
      agentDesc: "AI autonomously chains tools to solve complex tasks",
      editName: "Edit name",
      editEmail: "Edit email",
      editPassword: "Edit password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      minChars: "Min. 8 characters",
      changePassword: "Change password",
      save: "Save",
      cancel: "Cancel",
      networkError: "Network error",
      passwordsDontMatch: "Passwords don't match",
      passwordTooShort: "Password must be at least 8 characters",
      successName: "Name updated successfully",
      successEmail: "Email updated successfully",
      successPassword: "Password changed successfully",
      resetTitle: "Reset all chat data?",
      resetDesc: "This will permanently delete all your conversations and messages. This action cannot be undone.",
      deleteTitle: "Delete account permanently?",
      deleteDesc: "This will delete your account and all associated data. You will be logged out immediately. This action cannot be undone.",
      personalities: {
        default:   { label: "Default",   desc: "Balanced and helpful" },
        pro:       { label: "Pro",        desc: "Formal, structured, executive" },
        fun:       { label: "Fun",        desc: "Enthusiastic and engaging" },
        technical: { label: "Technical",  desc: "Expert-level, deep dives" },
        mentor:    { label: "Mentor",     desc: "Patient, step-by-step guidance" },
      },
    },
  };

  return { ...base, ...extra[lang] } as unknown as ReturnType<typeof getTranslations>;
}

// ─── LANGUAGES list ────────────────────────────────────────────────────────────

export const LANGUAGES: { id: Language; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { id: "fr", label: "Français",  flag: "🇫🇷", dir: "ltr" },
  { id: "en", label: "English",   flag: "🇬🇧", dir: "ltr" },
];

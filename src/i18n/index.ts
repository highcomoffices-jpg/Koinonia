import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Ressources de traduction
const resources = {
  fr: {
    translation: {
      // Navigation
      home: 'Accueil',
      parishes: 'Paroisses',
      create: 'Créer',
      subscriptions: 'Abonnements',
      profile: 'Profil',
      notifications: 'Notifications',
      settings: 'Paramètres',
      
      // Authentification
      login: 'Connexion',
      register: 'Inscription',
      logout: 'Déconnexion',
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      firstName: 'Prénom',
      lastName: 'Nom',
      
      // Inscription Phase 1
      'register.phase1.title': 'Rejoignez Koinonia',
      'register.phase1.subtitle': 'Créez votre compte pour rejoindre notre communauté chrétienne mondiale',
      'register.phase1.country': 'Pays',
      'register.phase1.selectCountry': 'Sélectionnez votre pays',
      'register.phase1.continue': 'Continuer',
      'register.phase1.haveAccount': 'Déjà un compte ?',
      
      // Inscription Phase 2
      'register.phase2.title': 'Complétez votre profil',
      'register.phase2.subtitle': 'Ces informations nous aideront à personnaliser votre expérience',
      'register.phase2.city': 'Ville',
      'register.phase2.selectCity': 'Sélectionnez votre ville',
      'register.phase2.confession': 'Confession religieuse',
      'register.phase2.selectConfession': 'Sélectionnez votre confession',
      'register.phase2.parish': 'Paroisse/Église',
      'register.phase2.selectParish': 'Sélectionnez votre paroisse (optionnel)',
      'register.phase2.bio': 'Biographie',
      'register.phase2.bioPlaceholder': 'Parlez-nous un peu de vous...',
      'register.phase2.complete': 'Terminer l\'inscription',
      
      // Profil incomplet
      'profile.incomplete.title': 'Profil incomplet',
      'profile.incomplete.message': 'Votre accès est limité. Complétez votre profil pour débloquer toutes les fonctionnalités.',
      'profile.incomplete.complete': 'Compléter mon profil',
      
      // Market
      "market": {
        "title": "Market Chrétien",
        "subtitle": "Achetez, vendez et partagez des articles chrétiens",
        "sell": "Vendre un article"
      },
      
      // Shepherd grades
      "shepherd": {
        "leader": "Leader",
        "superior": "Supérieur",
        "elder": "Ancien"
      },
      
      // Spiritual levels
      "spiritual": {
        "sower": "Semeur",
        "harvester": "Moissonneur",
        "friend": "Ami",
        "points": "points spirituels"
      },
      
      // Validation status
      "validation": {
        "pending": "En attente",
        "approved": "Approuvé",
        "rejected": "Rejeté"
      },
      
      // Vigneron status
      "vigneron": {
        "verified": "Vigneron certifié",
        "not_verified": "Vigneron non certifié"
      },
      
      // Messages généraux
      welcome: 'Bienvenue',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Enregistrer',
      
      // Posts
      'post.like': 'J\'aime',
      'post.comment': 'Commenter',
      'post.share': 'Partager',
      'post.visibility.global': 'Public',
      'post.visibility.restricted': 'Restreint',
      'post.visibility.extended': 'Étendu',
      
      // Rôles et niveaux
      'role.brebis': 'Brebis',
      'role.vigneron': 'Vigneron',
      'role.admin': 'Admin',
      'level.semeur': 'Semeur',
      'level.moissonneur': 'Moissonneur',
      'level.berger': 'Berger',
    }
  },
  en: {
    translation: {
      // Navigation
      home: 'Home',
      parishes: 'Parishes',
      create: 'Create',
      subscriptions: 'Subscriptions',
      profile: 'Profile',
      notifications: 'Notifications',
      settings: 'Settings',
      
      // Authentication
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      
      // Registration Phase 1
      'register.phase1.title': 'Join Koinonia',
      'register.phase1.subtitle': 'Create your account to join our global Christian community',
      'register.phase1.country': 'Country',
      'register.phase1.selectCountry': 'Select your country',
      'register.phase1.continue': 'Continue',
      'register.phase1.haveAccount': 'Already have an account?',
      
      // Registration Phase 2
      'register.phase2.title': 'Complete your profile',
      'register.phase2.subtitle': 'This information will help us personalize your experience',
      'register.phase2.city': 'City',
      'register.phase2.selectCity': 'Select your city',
      'register.phase2.confession': 'Religious confession',
      'register.phase2.selectConfession': 'Select your confession',
      'register.phase2.parish': 'Parish/Church',
      'register.phase2.selectParish': 'Select your parish (optional)',
      'register.phase2.bio': 'Biography',
      'register.phase2.bioPlaceholder': 'Tell us a bit about yourself...',
      'register.phase2.complete': 'Complete registration',
      
      // Incomplete profile
      'profile.incomplete.title': 'Incomplete profile',
      'profile.incomplete.message': 'Your access is limited. Complete your profile to unlock all features.',
      'profile.incomplete.complete': 'Complete my profile',
      
      // Market
      "market": {
        "title": "Christian Market",
        "subtitle": "Buy, sell and share Christian items",
        "sell": "Sell an item"
      },
      
      // Shepherd grades
      "shepherd": {
        "leader": "Leader",
        "superior": "Superior",
        "elder": "Elder"
      },
      
      // Spiritual levels
      "spiritual": {
        "sower": "Sower",
        "harvester": "Harvester",
        "friend": "Friend",
        "points": "spiritual points"
      },
      
      // Validation status
      "validation": {
        "pending": "Pending",
        "approved": "Approved",
        "rejected": "Rejected"
      },
      
      // Vigneron status
      "vigneron": {
        "verified": "Certified Vinedresser",
        "not_verified": "Uncertified Vinedresser"
      },
      
      // General messages
      welcome: 'Welcome',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      
      // Posts
      'post.like': 'Like',
      'post.comment': 'Comment',
      'post.share': 'Share',
      'post.visibility.global': 'Public',
      'post.visibility.restricted': 'Restricted',
      'post.visibility.extended': 'Extended',
      
      // Roles and levels
      'role.brebis': 'Sheep',
      'role.vigneron': 'Vinedresser',
      'role.admin': 'Admin',
      'level.semeur': 'Sower',
      'level.moissonneur': 'Harvester',
      'level.berger': 'Shepherd',
    }
  },
  sw: {
    translation: {
      // Navigation
      home: 'Nyumbani',
      parishes: 'Parokia',
      create: 'Unda',
      subscriptions: 'Michango',
      profile: 'Wasifu',
      notifications: 'Arifa',
      settings: 'Mipangilio',
      
      // Authentication
      login: 'Ingia',
      register: 'Jisajili',
      logout: 'Toka',
      email: 'Barua pepe',
      password: 'Nywila',
      confirmPassword: 'Thibitisha Nywila',
      firstName: 'Jina la Kwanza',
      lastName: 'Jina la Ukoo',
      
      // Registration Phase 1
      'register.phase1.title': 'Jiunge na Koinonia',
      'register.phase1.subtitle': 'Unda akaunti yako ili kujiunge na jumuiya yetu ya Kikristo duniani',
      'register.phase1.country': 'Nchi',
      'register.phase1.selectCountry': 'Chagua nchi yako',
      'register.phase1.continue': 'Endelea',
      'register.phase1.haveAccount': 'Una akaunti tayari?',
      
      // Registration Phase 2
      'register.phase2.title': 'Kamilisha wasifu wako',
      'register.phase2.subtitle': 'Maelezo haya yatatusaidia kukupatia huduma bora zaidi',
      'register.phase2.city': 'Jiji',
      'register.phase2.selectCity': 'Chagua jiji lako',
      'register.phase2.confession': 'Dhehebu ya kidini',
      'register.phase2.selectConfession': 'Chagua dhehebu yako',
      'register.phase2.parish': 'Parokia/Kanisa',
      'register.phase2.selectParish': 'Chagua parokia yako (si lazima)',
      'register.phase2.bio': 'Wasifu',
      'register.phase2.bioPlaceholder': 'Tuambie kidogo kuhusu wewe...',
      'register.phase2.complete': 'Maliza usajili',
      
      // Incomplete profile
      'profile.incomplete.title': 'Wasifu haujakamilika',
      'profile.incomplete.message': 'Ufikiaji wako ni mdogo. Kamilisha wasifu wako ili kufungua huduma zote.',
      'profile.incomplete.complete': 'Kamilisha wasifu wangu',
      
      // Market
      "market": {
        "title": "Soko la Kikristo",
        "subtitle": "Nunua, uza na shiriki vitu vya Kikristo",
        "sell": "Uza bidhaa"
      },
      
      // Shepherd grades
      "shepherd": {
        "leader": "Kiongozi",
        "superior": "Mkuu",
        "elder": "Mzee"
      },
      
      // Spiritual levels
      "spiritual": {
        "sower": "Mpanzi",
        "harvester": "Mvunaji",
        "friend": "Rafiki",
        "points": "pointi za kiroho"
      },
      
      // Validation status
      "validation": {
        "pending": "Inasubiri",
        "approved": "Imekubaliwa",
        "rejected": "Imekataliwa"
      },
      
      // Vigneron status
      "vigneron": {
        "verified": "Mlimaji aliyeidhinishwa",
        "not_verified": "Mlimaji ambaye hajaidhinishwa"
      },
      
      // General messages
      welcome: 'Karibu',
      loading: 'Inapakia...',
      error: 'Hitilafu',
      success: 'Mafanikio',
      cancel: 'Ghairi',
      save: 'Hifadhi',
      
      // Posts
      'post.like': 'Penda',
      'post.comment': 'Jibu',
      'post.share': 'Shiriki',
      'post.visibility.global': 'Umma',
      'post.visibility.restricted': 'Kikomo',
      'post.visibility.extended': 'Kuongezwa',
      
      // Roles and levels
      'role.brebis': 'Kondoo',
      'role.vigneron': 'Mlimaji',
      'role.admin': 'Msimamizi',
      'level.semeur': 'Mpandaji',
      'level.moissonneur': 'Mvunaji',
      'level.berger': 'Mchungaji',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
# Gold_Crew OSINT — Source Code

> Plateforme OSINT professionnelle avec Gold_Crew AI intégré.

## Structure du projet

```
gold_crew_osint/
├── index.html              # Point d'entrée HTML
├── main.js                 # Bootstrap de l'application
├── styles.css              # Styles CSS (thème terminal)
├── locales/
│   ├── fr.json             # Traductions françaises
│   ├── en.json             # English translations
│   └── ht.json             # Tradiksyon Kreyòl Ayisyen
├── js/
│   ├── state.js            # Gestionnaire d'état global
│   ├── storage.js          # Abstraction stockage (localStorage)
│   ├── i18n.js             # Module d'internationalisation
│   ├── toast.js            # Notifications toast
│   ├── totp.js             # TOTP 2FA (Web Crypto)
│   ├── fingerprint.js      # Empreinte navigateur (anti multi-comptes)
│   ├── bruteforce.js       # Protection anti-brute force
│   ├── auth.js             # Authentification & utilisateurs
│   ├── admin.js            # Module admin (users, promos, settings)
│   ├── router.js           # Routeur SPA
│   ├── mistral-ai.js       # Gold_Crew AI (Mistral integration)
│   ├── osint-engine.js     # Moteur OSINT multi-sources
│   └── views/
│       ├── landing.js          # Page d'accueil
│       ├── auth.js             # Connexion / Inscription
│       ├── dashboard.js        # Dashboard utilisateur
│       ├── home-sub.js         # Sous-vue accueil
│       ├── search-sub.js       # Moteur de recherche OSINT
│       ├── history-sub.js      # Historique
│       ├── favorites-sub.js    # Favoris
│       ├── promo-sub.js        # Codes promo
│       ├── stats-sub.js        # Statistiques
│       ├── profile-sub.js      # Profil utilisateur
│       ├── settings-sub.js     # Paramètres
│       ├── admin-login.js      # Connexion admin
│       ├── admin-panel.js      # Panel admin principal
│       ├── admin-home-sub.js   # Dashboard admin
│       ├── admin-users-sub.js  # Gestion utilisateurs
│       ├── admin-osint-sources-sub.js  # Sources OSINT
│       ├── admin-promos-sub.js         # Codes promo
│       ├── admin-api-keys-sub.js       # Clés API
│       ├── admin-announcements-sub.js  # Annonces
│       ├── admin-site-settings-sub.js  # Paramètres site
│       ├── admin-ai-sub.js            # Configuration Gold_Crew AI
│       ├── admin-account-sub.js        # Compte admin
│       └── admin-sourcecode-sub.js     # Téléchargement source
│       └── admin-apk-sub.js            # Générateur APK Android
```

## Sources OSINT intégrées

| Source | Type | Gratuit |
|--------|------|---------|
| GitHub Users | Pseudo search | ✅ |
| Google CSE | Full-text | ❌ (clé API) |
| Facebook Graph | Name search | ❌ (clé API) |
| TikTok API | Username | ❌ (clé API) |
| Custom Source | Configurable | Variable |
| Shodan | IP/Infrastructure | ❌ (clé API) |
| HIBP | Email breaches | ❌ (clé API) |
| VirusTotal | Domain/URL/Hash/IP | ❌ (clé API) |
| Hunter.io | Email finder | ❌ (clé API) |
| IPInfo | IP Geolocation | ✅ |
| DNS Lookup | DNS records | ✅ |
| Wayback Machine | Web archives | ✅ |

## Identifiants Admin

- **Username:** balla
- **Password:** 620891542

## Gold_Crew AI

Intégration Mistral API pour l'analyse OSINT automatique.
La clé API peut être modifiée dans le panel admin.

## GitHub Token

Un token GitHub peut être configuré dans **Admin > Paramètres site > Token GitHub**.

Il est stocké uniquement dans le navigateur de l'admin et permet d'augmenter les limites d'API GitHub (5000 req/h au lieu de 60 sans authentification).

---
© 2026 Gold_Crew — Créé par Mcamara

# Checklist Déploiement Render

## ✅ Structure Monolithique Conforme

```
✓ /root
  ✓ server.js                          (Node + Express + Socket.io)
  ✓ package.json                       (Scripts build globaux)
  ✓ .gitignore                         (node_modules, .env excluded)
  ✓ .env.example                       (Documentation variables)
  ✓ DEPLOY.md                          (Guide complet)
  ✓ /server
    ✓ index.js                         (À archiver - logique migré dans server.js)
    ✓ /data (quiz.json, duels.json)
  ✓ /client
    ✓ package.json                     (React vite config)
    ✓ vite.config.js                   (Build → ../build)
    ✓ src/
      ✓ main.jsx                       (AppLoader wrapper)
      ✓ App.jsx                        (Game Logic - inchangé)
      ✓ /components
        ✓ ColdStartLoader.jsx          (New - Cold start handler)
      ✓ /contexts
        ✓ SocketContext.jsx            (Updated - CORS prod + relative URL)
```

## 🔧 Fichiers Modifiés / Créés

### Racine
| Fichier | Action | Détail |
|---|---|---|
| `package.json` | 🆕 CRÉER | Scripts : `install-all`, `build`, `start` |
| `.gitignore` | 🆕 CRÉER | Exclude node_modules, .env, build/ |
| `.env.example` | 🆕 CRÉER | Variables d'environnement templates |
| `server.js` | 🆕 CRÉER | **Principal** - Express + Socket.io + Static serve |
| `DEPLOY.md` | 🆕 CRÉER | Guide complet déploiement |

### Client
| Fichier | Action | Détail |
|---|---|---|
| `client/vite.config.js` | ✏️ MODIFIER | `outDir: '../build'` |
| `client/src/main.jsx` | ✏️ MODIFIER | `AppLoader` wrapper + ColdStartLoader check |
| `client/src/components/ColdStartLoader.jsx` | 🆕 CRÉER | Écran chargement, ping `/api/status` |
| `client/src/contexts/SocketContext.jsx` | ✏️ MODIFIER | URL relative prod, reconnection policy |

## 📋 Avant Push sur GitHub

### ✅ À vérifier localement

```bash
# 1. Test build
npm run build
# → Doit créer /client/build/ (TEST: ls client/build/)

# 2. Test serveur local
NODE_ENV=development npm start
# → Accède à http://localhost:3000
# → Checks /api/status → { "status": "ok" }

# 3. Test WebSocket
# → Console devtools Should see "⚡ socket connected: [socket-id]"
```

### ✅ Git Setup

```bash
# Initialiser repo si nécessaire
git init
git add .
git commit -m "Setup monolithic app for Render deployment"
git branch -M main  # Si pas de main branch

# Push vers remote
git remote add origin https://github.com/YOUR_USERNAME/lcg-app.git
git push -u origin main
```

## 🚀 Étapes Finales Render

### 1. Connecter depuis Render Dashboard
- [https://render.com](https://render.com) → **New** → **Web Service**
- Select **GitHub**, connecte repo `lcg-app`

### 2. Configuration Render
```
Build Command:   npm run build
Start Command:   npm start
Node Version:    18 (default ok)
```

### 3. Environment Variables (Render Dashboard)
```
NODE_ENV=production
PORT=3000
```

### 4. Deploy
- Clique **Create Web Service**
- Attends build (~3-5 min)
- Ctrl+Click sur URL pour test

## 🧪 Tests Post-Déploiement

### Health Check
```bash
curl https://lcg-app-xxxx.onrender.com/api/status
# Response: { "status": "ok", "uptime": X.XX, "timestamp": "..." }
```

### Cold Start (Si server sleep)
1. Refresh page
2. Doit voir "Le Cube se réveille..."
3. Attends ~30 sec (15+ tentative)
4. App charge normalement

### WebSocket Connection
1. DevTools Console
2. Check: "⚡ socket connected: [socket-id]"
3. Test room creation - doit broadcaster aux autres joueurs

## 🎯 Points Clés

✅ **Monolithic** : Pas de déploiement séparé (pas de Netlify client)  
✅ **WebSocket** : Socket.io gestion CORS dynamique (prod/dev)  
✅ **Cold Start** : ColdStartLoader retry intelligent  
✅ **SPA Routing** : Fallback `*` → `index.html`  
✅ **Health Check** : `/api/status` pour monitoring  

## ⚠️ Pièges Courants

1. ❌ "Cannot GET /" → Build pas créé. Run `npm run build` localement
2. ❌ Socket CORS error → Vérif CLIENT_URL dans env vars
3. ❌ Serveur freeze au start → Instance Free timeout? Upgrade
4. ❌ .env committed → Vérifie .gitignore!

---

**Status** : Prêt pour déploiement  
**Date** : Mars 2026

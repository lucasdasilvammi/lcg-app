# Déploiement de Le Cube Graphique sur Render.com

## 📋 Architecture Monolithique

```
/root (Dépôt GitHub)
├── server.js                 # Serveur Node.js (Express + Socket.io)
├── package.json              # Fichier MAÎTRE (Scripts de build globaux)
├── .gitignore                # Exclure node_modules, .env, client/build
├── /server                   # Logique métier (données, tests)
│   ├── data/
│   │   ├── quiz.json
│   │   └── duels.json
│   └── tests/
└── /client                   # Frontend React
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
```

## 🚀 Workflow de Déploiement

### 1. **Push sur GitHub**
```bash
git add .
git commit -m "Deploy monolithic app to Render"
git push origin main
```

### 2. **Connecter Render à GitHub**
- Accède à [Render.com](https://render.com)
- Clique sur **New +** → **Web Service**
- Utilise **GitHub** comme source
- Sectionne ton repository `lcg-app`

### 3. **Configuration Render**

| Configuration | Valeur |
|---|---|
| **Name** | `lcg-app` (ou ton choix) |
| **Environment** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (ou Starter pour plus de RAM) |

### 4. **Variables d'Environnement (Render Dashboard)**
```
NODE_ENV=production
PORT=3000
```

*(Optionnel) Si tu veux personnaliser CORS:*
```
CLIENT_URL=https://lcg-app-yourrandomname.onrender.com
```

## 🔧 Configuration Technique

### Package.json Racine
```json
{
  "scripts": {
    "install-all": "npm install && cd client && npm install",
    "build": "npm run install-all && cd client && npm run build",
    "start": "node server.js"
  }
}
```

### Serveur (server.js)
- ✅ Service statique : `app.use(express.static(path.join(__dirname, 'client/build')))`
- ✅ Health Check : `GET /api/status` pour Render monitoring
- ✅ Fallback : Redirige `*` vers `index.html` (React SPA routing)
- ✅ Socket.io CORS : Dynamique pour prod

### Client (vite.config.js)
```javascript
build: {
  outDir: '../build',  // Build pas dans dist/
  emptyOutDir: true,
}
```

## ⏰ Gestion du "Cold Start" (Serveur Endormi)

Render Free → Serveur s'endort après **15 min** d'inactivité.

### Solution Implémentée
1. **ColdStartLoader.jsx** : Écran de chargement
   - Ping `/api/status` toutes les 3 sec
   - Max 30 tentatives (~90 sec)
   - Message : "Le Cube se réveille..."

2. **main.jsx** : Wrapper `AppLoader`
   - Vérifie serveur avant de charger App
   - Affiche ColdStartLoader si serveur pas prêt

3. **Première Visite**
   - Utilisateur attend ~30 sec (premier wake-up)
   - Subsequent sessions : Serveur reste actif si utilisation continue

## 🔗 URLs Importantes

| Ressource | URL |
|---|---|
| **App** | `https://lcg-app-yourrandomname.onrender.com` |
| **Health Check** | `https://lcg-app-yourrandomname.onrender.com/api/status` |
| **WebSocket** | `wss://lcg-app-yourrandomname.onrender.com` (auto) |

## 🐛 Troubleshooting

### Problème : "Cannot GET /"
**Cause** : `client/build` n'existe pas  
**Solution** :
```bash
cd client && npm run build
cd ..
```

### Problème : Erreur CORS / WebSocket
**Cause** : Serveur ne reconnaît pas l'origine  
**Solution** :
1. Définis `CLIENT_URL` dans Render env vars
2. Vérifie la valeur autorisée dans `server.js`

### Problème : Freeze/Timeout au démarrage
**Cause** : Server.js ne démarre pas on time  
**Solution** :
1. Augmente l'instance (Free → Starter)
2. Vérifie que `PORT=3000` est défini

### Problème : Socket.io se déconnecte
**Cause** : Cold start ou réseau instable  
**Solution** : ColdStartLoader retry automatiquement. Fais patient 30 sec.

## 📈 Optimisations Futures

- [ ] Ajouter un conteneur Redis pour persister les rooms
- [ ] Impl rate-limiting pour éviter les abus
- [ ] Monitoring & logs centralisés (Sentry)
- [ ] Cache HTTP pour assets statiques

## 📚 Ressources

- [Render Documentation](https://render.com/docs)
- [Express.js Static Files](https://expressjs.com/en/starter/static-files.html)
- [Socket.io CORS](https://socket.io/docs/v4/socket-io-cors/)
- [Vite Build Config](https://vitejs.dev/config/build.html)

---

**Auteur** : Gantier  
**Last Updated** : Mars 2026

# 🚀 Déploiement en 5 Minutes

## Confirmation de ta stratégie
✅ **WebSockets (Socket.io)** pour la synchronisation temps réel des rôles  
✅ **Monolithic** : Tout dans `npm start` sur Render  
✅ **Pas de Netlify** : Avoid CORS / WebSocket issues  

## Structure Final
```
/root (ton repo GitHub)
├── server.js                    # 🆕 Express + Socket.io
├── package.json                 # 🆕 Scripts build master
├── .gitignore                   # 🆕 Exclut node_modules, .env
├── DEPLOY.md, CHECKLIST.md      # Documentation
├── /server (inchangé)
│   ├── index.js                 # Archiver après (logique en server.js)
│   └── /data (quiz, duels JSON)
└── /client 
    ├── package.json             # inchangé
    ├── vite.config.js           # ✏️ outDir: '../build'
    └── /src
        ├── main.jsx             # ✏️ AppLoader wrapper + ColdStartLoader
        ├── App.jsx              # inchangé
        ├── /components
        │   └── ColdStartLoader.jsx  # 🆕 Cold start handler
        └── /contexts
            └── SocketContext.jsx    # ✏️ CORS prod + URL relative
```

## Test Local AVANT Render

```bash
# 1. Build
npm run build

# 2. Vérifier /client/build/ créé
ls -la client/build/

# 3. Start
NODE_ENV=development npm start

# 4. Tester
#    → http://localhost:3000
#    → GET http://localhost:3000/api/status (doit retourner { "status": "ok" })
#    → Console devTools: "⚡ socket connected: [ID]"
```

## Push GitHub

```bash
git add .
git commit -m "Setup monolithic deployment for Render"
git push origin main
```

## Setup Render (5 min)

1. **Render.com Dashboard**
   - Click **New +** → **Web Service**
   - Select GitHub, choose `lcg-app` repo

2. **Configuration**
   ```
   Name:            lcg-app
   Environment:     Node
   Build Command:   npm run build
   Start Command:   npm start
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy** → Click "Create Web Service" → Wait 3-5 min

## ✅ Post-Deploy Checks

```bash
# 1. Health Check
curl https://lcg-app-xxx.onrender.com/api/status
# Response: { "status": "ok", "uptime": X, "timestamp": "..." }

# 2. Visite l'app
https://lcg-app-xxx.onrender.com

# 3. Cold Start Test (si serveur endormi)
#    → Rafrais page
#    → voir "Le Cube se réveille..."
#    → Attends ~30 sec
#    → App charge
```

## 🎯 Clés du Succès

1. ✅ **server.js** serveur Node central
2. ✅ **package.json racine** avec `npm run build` → `install-all` + client build
3. ✅ **Vite** build vers `../build/` (pas dist)
4. ✅ **ColdStartLoader** gère le wake-up Render
5. ✅ **SocketContext** URL relative en prod
6. ✅ **Express fallback** `*` → `index.html`

## 🆘 Erreurs Courants

| Erreur | Cause | Fix |
|---|---|---|
| "Cannot GET /" | Build inexistant | Run `npm run build` local |
| CORS error | Serveur pas reconnaître client | Set CLIENT_URL env |
| Socket timeout | Cold start | ColdStartLoader auto-retry |
| 500 error | Port not 3000 | Verify PORT env var |

---

**Tu es maintenant prêt pour Render! 🚀**

```
Next: git push → Render auto-deploy → App live
```

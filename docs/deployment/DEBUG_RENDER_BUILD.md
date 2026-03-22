# 🔧 DIAGNOSTIC BUILD RENDER - GUIDE DE DEBUG

## ❌ Build Failed - Comment Déboguer

### 1. Récupère les Logs d'Erreur

Dans **Render Dashboard** :
1. Va sur ton service `lcg-app`
2. Clique sur l'onglet **Logs**
3. Cherche la section **Build** (rouge = erreur)
4. Copie-colle l'erreur complète ici

**Exemple d'erreur typique:**
```
npm ERR! code ENOENT
npm ERR! syscall spawn git
npm ERR! path git
npm ERR! errno -4058
```

---

## 2. Erreurs Courantes & Solutions

### ❌ Erreur: "git command not found"
**Cause:** Git pas installé dans le container  
**Solution:** Rien à faire - c'est un bug Render. Attends 24h ou contacte support.

### ❌ Erreur: "npm run build failed"
**Cause:** Build React échoue  
**Solution:** Vérifie si `/build` existe localement

### ❌ Erreur: "Cannot find module"
**Cause:** Dépendances manquantes  
**Solution:** Vérifie `package.json` scripts

### ❌ Erreur: "Port already in use"
**Cause:** Port 3000 occupé  
**Solution:** Change PORT env var

---

## 3. Tests Locaux Avant Redeploy

### Test Build Local
```bash
npm run build
# Doit créer /build/ sans erreur
```

### Test Start Local
```bash
NODE_ENV=production PORT=3000 npm start
# Doit démarrer sans erreur
```

### Test Health Check
```bash
curl http://localhost:3000/api/status
# Doit retourner { "status": "ok" }
```

---

## 4. Redeploy sur Render

Après correction:
1. **Render Dashboard** → Service → **Deploys**
2. Click **Trigger Deploy**
3. Attends nouveau build (3-5 min)

---

## 5. Si Rien Marche Pas

### Option A: Logs Complets
Copie-colle **TOUTE** l'erreur Render ici, je diagnostique.

### Option B: Support Render
- [render.com/support](https://render.com/support)
- Décris: "Build fails on Node app, logs show [erreur]"

### Option C: Alternative Hébergement
Si Render pose problème:
- **Railway.app** (plus simple pour Node)
- **Vercel** (mais pas pour Socket.io)
- **Heroku** (mais payant)

---

## 📋 Checklist Debug

- [ ] Logs Render copiés?
- [ ] Erreur exacte identifiée?
- [ ] Test local réussi?
- [ ] Redeploy tenté?

**Copie l'erreur Render et je corrige immédiatement!** 🚀

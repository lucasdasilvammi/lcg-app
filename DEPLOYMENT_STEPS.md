# 🎯 DÉPLOIEMENT EN 3 ÉTAPES

## Étape 1️⃣ : Créer le Repo sur GitHub

1. Va sur **[github.com](https://github.com)**
2. Clique **+** (haut-droit) → **New repository**
3. **Repository name** : `lcg-app`
4. **Description** : "Le Cube Graphique - Web App Fullstack"
5. Select **Public** (pour que Render puisse accéder)
6. ❌ NE cochez PAS "Initialize with README" (on a déjà un projet)
7. Click **Create repository**

---

## Étape 2️⃣ : Push le Code

Après création du repo, GitHub affiche les instructions. Utilise celle-ci dans le terminal :

```bash
git remote add origin https://github.com/lucasdasilvammi/lcg-app.git
git push -u origin main
```

**Ou si tu es déjà dans le projet:**

```bash
cd "f:\Téléchargements\Université\Année 5\Gantier\Le cube graphique code\lcg-app Deploy"
git push -u origin main
```

**Sortie attendue:**
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To github.com:lucasdasilvammi/lcg-app.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Étape 3️⃣ : Setup Render

### A. Accède à Render
1. Va sur **[render.com](https://render.com)**
2. Click **Sign Up** (recommandé: GitHub login)
3. Authorize Render à accéder tes repos

### B. Crée le Web Service
1. Click **New +** → **Web Service**
2. Choose **GitHub** source
3. Select repo `lucasdasilvammi/lcg-app`
4. Autorise l'accès

### C. Configure le Service

| Option | Valeur |
|---|---|
| **Name** | `lcg-app` |
| **Environment** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (ou Starter pour mieux) |

### D. Ajoute les Variables d'Environnement

Clique **Advanced** et ajoute:

```
NODE_ENV=production
PORT=3000
```

### E. Deploy!
Click **Create Web Service** et attends 3-5 min ⏳

Render affichera une URL comme:
```
https://lcg-app-xxxx.onrender.com
```

---

## Step 4️⃣ : Teste l'App

### ✅ Health Check
```bash
curl https://lcg-app-xxxx.onrender.com/api/status
```

### ✅ Visite l'App
```
https://lcg-app-xxxx.onrender.com
```

### ✅ Test Cold Start
Si le serveur s'était endormi:
- Vois "Le Cube se réveille..."
- Attends ~30 sec
- App charge auto

### ✅ Test WebSocket
- Console (F12)
- Cherche "⚡ socket connected"
- Crée une salle
- ✅ Ça marche!

---

## 🎯 Adresse Finale

Une fois live sur Render:
```
https://lcg-app-xxxx.onrender.com
```

L'utilisateur verra:
1. "Le Cube se réveille..." on first visit (30 sec)
2. React app loads
3. Peut créer/rejoindre salles en temps réel (WebSocket)

---

## ⚠️ Important

- **GitHub repo doit être PUBLIC** (so Render can clone it)
- **Garde .env.example mais crée .env sur Render** (via dashboard)
- **Ne commit jamais .env** (déjà dans .gitignore)

---

## 🆘 Si ça marche pas

1. Check **Render logs**: Dashboard → Logs
2. Common issues:
   - Build failed → Check npm output
   - Socket error → Check CLIENT_URL env var
   - "Cannot GET /" → Check /build/ exists

---

## ✨ C'est Parti!

**1. Create GitHub repo**  
**2. `git push -u origin main`**  
**3. Setup Render**  
**4. Refresh app URL**  

**Ton app est en live! 🚀**

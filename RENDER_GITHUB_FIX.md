# Fix Render GitHub Link Issue

## ✅ Solution Simple : Utiliser le Lien Public HTTPS

### Étape 1 : Sur Render
1. Click **New +** → **Web Service**
2. **Choose source** : Sélectionne **Public Git Repository** (pas GitHub, mais "Public Git Repository")
3. Colle l'URL HTTPS:
   ```
   https://github.com/lucasdasilvammi/lcg-app.git
   ```

### Étape 2 : Configuration Reste la Même
- **Build Command** : `npm run build`
- **Start Command** : `npm start`
- **Environment Variables** :
  ```
  NODE_ENV=production
  PORT=3000
  ```

### Étape 3 : Create Web Service
- Click **Create** et laisse deploy (3-5 min)
- Render pulls le repo public et déploie!

---

## ⚠️ Limitation
- **Updates manuels** : Pas d'auto-deploy quand tu push sur GitHub
- **Solution** : A chaque push, tu dois aller dans Render → Service → **Deploys** → **Trigger Deploy**

---

## 🔄 Alternative : Auto-Deploy (Si tu veux)

Si tu veux l'auto-deploy, voici comment:

### Option A: GitHub Token (Plus Simple)
1. **GitHub** → Settings → Personal Access Tokens → Tokens (classic)
2. **Generate new token (classic)**
   - Nomme-le "render-deploy"
   - Scopes: ✅ `repo` (full control)
   - Copy le token
3. **Render** : Colle le token quand demandé
4. ✅ Auto-deploy enabled!

### Option B: Réessayer l'OAuth (Attend Email)
- Check spam/promotions
- Si rien après 5 min, utilise Option A (Token)

---

## 🎯 Recommandation
**→ Utilise la méthode HTTPS publique** pour commencer (plus rapide)
**→ Si tu veux auto-deploy, utilise le Token GitHub** (5 min setup)

---

## URLs à Utiliser

| Élément | Valeur |
|---|---|
| **Repo HTTPS** | `https://github.com/lucasdasilvammi/lcg-app.git` |
| **Repo GitHub** | `https://github.com/lucasdasilvammi/lcg-app` |
| **Render Dashboard** | [render.com/dashboard](https://render.com/dashboard) |

---

**Essaie la méthode HTTPS publique en premier - ça devrait marcher tout de suite! 👍**

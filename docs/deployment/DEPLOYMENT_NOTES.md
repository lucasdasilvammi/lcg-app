# 🚀 Render Deployment Fixes - Lessons Learned

## Erreurs Rencontrées et Solutions

### 1. **Erreur Initiale: crypto.hash is not a function**
**Contexte**: Build échoue sur Render avec Vite 7.x  
**Cause**: Vite 7.x nécessite Node.js 18+, mais Render utilisait une version plus ancienne  
**Solution**:
- Downgrade Vite de `7.2.4` → `5.4.21`
- Downgrade @vitejs/plugin-react de `5.1.1` → `4.3.3`
- Downgrade React de `19.x` → `18.3.1`
- Downgrade @types/react de `19.x` → `18.x`
- Update engines: `"node": ">=16.0.0"`

### 2. **Erreur Suivante: crypto$2.getRandomValues is not a function**
**Contexte**: Même problème persiste malgré downgrade  
**Cause**: Vite 5.x nécessite toujours Node.js 18+ pour certaines APIs crypto  
**Solution**:
- Créer fichier `.nvmrc` avec `18` (force Render à utiliser Node 18)
- Update engines: `"node": "18.x"`

## ✅ Configuration Finale Validée

### Fichiers Modifiés
- `client/package.json`: Versions downgradées
- `package.json`: engines `"node": "18.x"`
- `.nvmrc`: `18`

### Variables d'Environnement Render
- `NODE_ENV=production`
- `PORT=3000`

### Commands
- Build: `npm run build`
- Start: `npm start`

## 🔄 Workflow pour Prochains Déploiements

1. **Développement**: Modifier les fichiers dans le dossier de dev
2. **Test Local**: `npm run dev` pour vérifier
3. **Copie Prod**: Copier changements vers dossier deploy
4. **Build Test**: `npm run build` pour valider
5. **Push**: `git add . && git commit -m "..." && git push`
6. **Deploy**: Render "Deploy latest commit"

## ⚠️ Points d'Attention Futurs

- Toujours vérifier compatibilité Node.js des nouvelles versions de dépendances
- Tester build localement avant push
- Utiliser `.nvmrc` pour forcer version Node sur Render
- Garder engines à jour dans package.json

## 📝 Notes Additionnelles

- Architecture: Monolithic (Express + React build)
- Cold Start: Géré par ColdStartLoader (30 tentatives, 3s interval)
- WebSocket: Socket.io pour jeu temps réel
- CORS: Dynamique (dev/prod)
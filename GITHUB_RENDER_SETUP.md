# 🚀 GITHUB + RENDER DEPLOYMENT GUIDE

## Step 1: Push to GitHub

```bash
# Add your GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/lcg-app.git

# Push to GitHub
git push -u origin main
```

**URL Structure:**
```
https://github.com/YOUR_USERNAME/lcg-app.git
```

---

## Step 2: Setup Render Deployment

### 2.1 Create Render Account
1. Visit [render.com](https://render.com)
2. Click **Sign Up** → Create account (GitHub login recommended)

### 2.2 Deploy Web Service
1. Click **New +** button (top-right)
2. Select **Web Service**
3. Choose **GitHub** as source
4. Authorize Render to access your GitHub repo
5. Select repo `lcg-app`

### 2.3 Configure Service

| Setting | Value |
|---|---|
| **Name** | `lcg-app` |
| **Environment** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter if you want better performance) |

### 2.4 Environment Variables

Click **Advanced** → Add these env vars:

```
NODE_ENV=production
PORT=3000
```

*(Optional) If you own a custom domain:*
```
CLIENT_URL=https://your-custom-domain.com
```

### 2.5 Create & Deploy

1. Click **Create Web Service**
2. Render automated deploy starts (~3-5 min)
3. Watch logs in dashboard
4. When complete: Your app gets a public URL like:
   ```
   https://lcg-app-xxxx.onrender.com
   ```

---

## Step 3: Post-Deployment Tests

### 3.1 Health Check
```bash
curl https://lcg-app-xxxx.onrender.com/api/status
```

**Expected Response:**
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-03-22T10:00:00.000Z"
}
```

### 3.2 App Access
```
https://lcg-app-xxxx.onrender.com
```

Expected: React app loads (look for game interface)

### 3.3 Cold Start Test (Wait 15+ min)
1. Visit app URL
2. If server was dormant:
   - See "🤔 Le Cube se réveille..."
   - Wait ~30 sec
   - App loads automatically
3. ✅ Success!

### 3.4 Test Game Creation
1. Open browser console (F12)
2. Check for: `"⚡ socket connected: [ID]"`
3. Click "Créer Salle"
4. Should see room ID & code
5. ✅ Socket.io working!

---

## Troubleshooting

### ❌ "Cannot GET /"
**Problem:** Build not uploaded  
**Solution:** Check Render logs, rerun build

### ❌ CORS / Socket Error
**Problem:** Server not recognizing client origin  
**Solution:** Set `CLIENT_URL` env var in Render dashboard

### ❌ Build Timeout
**Problem:** Free tier has limited build time  
**Solution:** Upgrade to Starter plan (if build > 15 min)

### ❌ App Freezes After Deploy
**Problem:** Cold start delay extended  
**Solution:** ColdStartLoader should handle it (~30 sec max)

---

## Post-Deployment Management

### View Logs
```
Render Dashboard → Your Service → Logs
```

### Redeploy Latest
```bash
git push origin main
# Render auto-redeploys!
```

### Restart Service
```
Render Dashboard → Service Name → More → Restart
```

### Custom Domain
```
Render Dashboard → Settings → Custom Domain
# Follow instructions to set DNS
```

---

## Performance Tips (Optional)

1. **Upgrade Instance** (if slow)
   - Free → Starter: Better CPU & RAM
   - Costs ~$7/mo but much faster

2. **Add Redis** (for persistent rooms)
   - Render → Add-ons → Redis
   - Modify server.js to use Redis

3. **Enable CDN** (for static assets)
   - Render → Settings → CDN

---

## Support & Resources

| Resource | Link |
|---|---|
| Render Docs | [render.com/docs](https://render.com/docs) |
| Node.js Deployment | [render.com/docs/deploy-node](https://render.com/docs/deploy-node) |
| GitHub Integration | [render.com/docs/github](https://render.com/docs/github) |
| Status Page | [status.render.com](https://status.render.com) |

---

## Next Steps

1. ✅ **Commit & Push**
   ```bash
   git push -u origin main
   ```

2. ✅ **Render Setup** (follow section 2.2-2.5)

3. ✅ **Test** (follow section 3)

4. ✅ **Monitor logs** during first deploy

---

**🎉 Your app is production-ready!**

Questions? Check logs or docs above.

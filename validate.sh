#!/bin/bash
# Validation Script - Ensure all deployment files are in place

echo "🔍 Validating Render Deployment Structure..."
echo ""

# Check root files
echo "✓ Checking Root Files:"
[ -f "package.json" ] && echo "  ✅ package.json" || echo "  ❌ package.json MISSING"
[ -f "server.js" ] && echo "  ✅ server.js" || echo "  ❌ server.js MISSING"
[ -f ".gitignore" ] && echo "  ✅ .gitignore" || echo "  ❌ .gitignore MISSING"
[ -f ".env.example" ] && echo "  ✅ .env.example" || echo "  ❌ .env.example MISSING"
[ -f "DEPLOY.md" ] && echo "  ✅ DEPLOY.md" || echo "  ❌ DEPLOY.md MISSING"
[ -f "CHECKLIST.md" ] && echo "  ✅ CHECKLIST.md" || echo "  ❌ CHECKLIST.md MISSING"
[ -f "SETUP_COMPLETE.md" ] && echo "  ✅ SETUP_COMPLETE.md" || echo "  ❌ SETUP_COMPLETE.md MISSING"

echo ""
echo "✓ Checking Data Files:"
[ -f "server/data/quiz.json" ] && echo "  ✅ server/data/quiz.json" || echo "  ❌ server/data/quiz.json MISSING"
[ -f "server/data/duels.json" ] && echo "  ✅ server/data/duels.json" || echo "  ❌ server/data/duels.json MISSING"

echo ""
echo "✓ Checking Client Configuration:"
[ -f "client/package.json" ] && echo "  ✅ client/package.json" || echo "  ❌ client/package.json MISSING"
[ -f "client/vite.config.js" ] && echo "  ✅ client/vite.config.js" || echo "  ❌ client/vite.config.js MISSING"
[ -f "client/src/main.jsx" ] && echo "  ✅ client/src/main.jsx" || echo "  ❌ client/src/main.jsx MISSING"
[ -f "client/src/App.jsx" ] && echo "  ✅ client/src/App.jsx" || echo "  ❌ client/src/App.jsx MISSING"

echo ""
echo "✓ Checking New Components:"
[ -f "client/src/components/ColdStartLoader.jsx" ] && echo "  ✅ client/src/components/ColdStartLoader.jsx" || echo "  ❌ client/src/components/ColdStartLoader.jsx MISSING"
[ -f "client/src/contexts/SocketContext.jsx" ] && echo "  ✅ client/src/contexts/SocketContext.jsx" || echo "  ❌ client/src/contexts/SocketContext.jsx MISSING"

echo ""
echo "✓ Checking Git Setup:"
git rev-parse --git-dir > /dev/null 2>&1 && echo "  ✅ Git repository initialized" || echo "  ⚠️  Git not initialized"

echo ""
echo "---"
echo "🎯 Summary:"
echo "  If all ✅, you're ready to: git push origin main"
echo "  Then setup Render.com Web Service with:"
echo "    Build Command: npm run build"
echo "    Start Command: npm start"
echo ""

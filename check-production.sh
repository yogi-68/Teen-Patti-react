#!/bin/bash

# Production Readiness Check Script
# Run this before deploying to production

echo "🔍 Checking Production Readiness..."
echo ""

ISSUES=0
WARNINGS=0

# Check 1: Environment files
echo "🌍 Checking environment files..."
if [ ! -f "client/.env.production" ]; then
    echo "❌ Missing client/.env.production file"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "server/.env" ]; then
    echo "⚠️  Missing server/.env file"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 2: Vercel config
echo "🚀 Checking Vercel configuration..."
if [ ! -f "client/vercel.json" ]; then
    echo "⚠️  Missing client/vercel.json"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Render config
echo "🎨 Checking Render configuration..."
if [ ! -f "config/render.yaml" ]; then
    echo "⚠️  Missing config/render.yaml"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: Package.json files
echo "📦 Checking package.json files..."
if [ ! -f "client/package.json" ]; then
    echo "❌ Missing client/package.json"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "server/package.json" ]; then
    echo "❌ Missing server/package.json"
    ISSUES=$((ISSUES + 1))
fi

# Check 5: Build directories exist after build
echo "🏗️  Checking if builds succeed..."
if [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Run 'npm install' in client and server directories"
    WARNINGS=$((WARNINGS + 1))
fi

# Results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Ready for production deployment."
    echo ""
    echo "Next steps:"
    echo "1. Update environment variables with production URLs"
    echo "2. Run 'cd client && vercel --prod'"
    echo "3. Push to GitHub and deploy via Render dashboard"
    echo "4. Test the production deployment"
elif [ $ISSUES -eq 0 ]; then
    echo "✅ No critical issues, but review warnings before deploying."
else
    echo "❌ Fix $ISSUES critical issue(s) before deploying to production."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $ISSUES

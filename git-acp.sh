#!/bin/bash

echo "🚀 Quick Git Add, Commit & Push Script"
echo "======================================"
echo ""

# Get current timestamp for commit message
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo "📝 Adding all changes..."
git add .

if [ $? -ne 0 ]; then
    echo "❌ Git add failed!"
    exit 1
fi

echo "✅ Files added successfully"

echo "📦 Committing changes..."
git commit -m "Auto-commit $timestamp"

if [ $? -ne 0 ]; then
    echo "❌ Git commit failed!"
    exit 1
fi

echo "✅ Commit created successfully"

echo "🚀 Pushing to origin main..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    exit 1
fi

echo "✅ Push completed successfully"
echo "🎉 All done! Changes deployed to production."
echo ""
echo "📋 Summary:"
echo "  - Files added: ✅"
echo "  - Commit created: ✅"
echo "  - Pushed to origin/main: ✅"
echo ""

@echo off
echo 🚀 Quick Deploy Script
echo =====================

echo 📝 Adding all changes...
git add .

echo 📦 Committing with message "1234567"...
git commit -m "1234567"

echo 🚀 Pushing to origin main...
git push origin main

echo ✅ Done! Changes deployed.
pause

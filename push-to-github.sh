#!/bin/bash
# Script to push Hive to GitHub

echo "🐝 Pushing Hive to GitHub..."

# Remove build artifacts from git if they were accidentally added
echo "Cleaning up build artifacts..."
git rm -rf --cached dist/ hive* 2>/dev/null || true
git rm --cached .github-readme-optimization.md 2>/dev/null || true

# Add all source files
echo "Adding files..."
git add .gitignore
git add hive.config.ts
git add package.json
git add bun.lock
git add LICENSE
git add README.md
git add GETTING_STARTED.md
git add PROJECT_OVERVIEW.md
git add src/
git add scripts/

# Commit
echo "Committing..."
git commit -m "🐝 Hive - Lightweight fullstack desktop framework

- Bun + Webview architecture
- Hot reload support
- Cross-platform builds (macOS, Linux, Windows)
- Webview bindings for <1ms frontend-backend communication
- 8KB minified frontend bundle
- Production-ready with minification & source maps
- Complete documentation (README, GETTING_STARTED, PROJECT_OVERVIEW)"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main --force

echo "✅ Done! Check your repo at: https://github.com/eddime/hive"


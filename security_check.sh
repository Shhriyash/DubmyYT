#!/bin/bash

echo "🔒 DubMyYT Security Check Before GitHub Upload"
echo "=============================================="
echo

# Check for .env files
echo "🔍 Checking for .env files..."
if find . -name ".env" -not -path "./node_modules/*" | grep -q .; then
    echo "❌ DANGER: .env files found!"
    find . -name ".env" -not -path "./node_modules/*"
    echo "🚨 Remove these files before uploading to GitHub!"
    exit 1
else
    echo "✅ No .env files found"
fi
echo

# Check for API keys in code
echo "🔍 Checking for potential API keys..."
if grep -r -i "api.*key\|secret\|token" --exclude-dir=node_modules --exclude="*.md" --exclude="security_check.sh" . | grep -v "your_.*_key_here\|API_KEY\|SUPABASE_KEY\|template"; then
    echo "❌ POTENTIAL RISK: API keys found in code!"
    echo "🚨 Review the files above and ensure no real keys are present!"
else
    echo "✅ No hardcoded API keys detected"
fi
echo

# Check for local paths
echo "🔍 Checking for local file paths..."
if grep -r "G:\\\|G:/" --exclude-dir=node_modules --exclude="*.md" --exclude="security_check.sh" . | grep -v "example\|template"; then
    echo "❌ WARNING: Local paths found!"
    echo "🚨 Replace with relative paths!"
else
    echo "✅ No hardcoded local paths found"
fi
echo

# Check .gitignore exists
echo "🔍 Checking .gitignore..."
if [ -f ".gitignore" ]; then
    echo "✅ .gitignore file exists"
    if grep -q "\.env" .gitignore; then
        echo "✅ .gitignore includes .env files"
    else
        echo "❌ WARNING: .gitignore doesn't include .env files!"
    fi
else
    echo "❌ DANGER: No .gitignore file found!"
    exit 1
fi
echo

# Final verdict
echo "🎯 SECURITY CHECK COMPLETE"
echo "=========================="
echo "If all checks passed, your project is ready for GitHub!"
echo "Run the upload commands from GITHUB_UPLOAD_GUIDE.md"
echo

@echo off
echo ========================================
echo    DubMyYT GitHub Upload Assistant
echo ========================================
echo.

echo [1/6] Checking current directory...
cd /d "G:\dem\DubMyYT"
echo Current directory: %CD%
echo.

echo [2/6] Initializing Git repository...
git init
echo.

echo [3/6] Checking Git status...
git status
echo.

echo [4/6] Adding files to Git...
git add .
echo.

echo [5/6] Checking what files will be committed...
echo Files to be committed:
git diff --cached --name-only
echo.

echo [6/6] Ready to commit!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Review the files listed above
echo 2. Ensure no .env files are included
echo 3. If everything looks good, run:
echo    git commit -m "Initial commit - DubMyYT Platform"
echo 4. Create GitHub repository at github.com
echo 5. Add remote and push:
echo    git remote add origin https://github.com/YOUR_USERNAME/DubMyYT.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
echo WARNING: Never commit sensitive data!
echo ========================================
pause

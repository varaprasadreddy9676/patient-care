@echo off
echo Building the project for production...
ionic build --prod

echo Syncing with Capacitor...
npx cap sync

echo Opening the browser platform...
npx cap open browser

echo Production build completed successfully!
pause

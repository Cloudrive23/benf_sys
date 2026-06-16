@echo off
cd /d c:\benf_sys
copy /Y .env.local.safe .env
echo Switched to local PostgreSQL database.
call npx prisma generate
call npm run dev
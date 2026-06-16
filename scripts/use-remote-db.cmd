@echo off
cd /d c:\benf_sys
copy /Y .env.remote.safe .env
echo Switched to remote Supabase database.
call npx prisma generate
call npm run dev
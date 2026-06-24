@echo off
echo Saving local database state to seed.sql...
call npx supabase db dump --data-only > supabase/seed.sql
echo Backup complete! Next time Supabase is reset, all your devices and gateways will be restored automatically.
timeout /t 5

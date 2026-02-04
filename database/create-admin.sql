-- Create Admin User untuk Refresh Breeze
-- Username: staffERBE
-- Password: hijauERBE

-- CARA TERBAIK: Via API POST (password auto-hashed dengan bcrypt)
-- Jalankan command ini di terminal PowerShell:
-- 
-- Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"staffERBE","password":"hijauERBE","full_name":"Staff Refresh Breeze"}'
--
-- Atau gunakan Postman/Thunder Client:
-- POST http://localhost:5000/api/auth/register
-- Body JSON:
-- {
--   "username": "staffERBE",
--   "password": "hijauERBE",
--   "full_name": "Staff Refresh Breeze"
-- }

-- Verify admin created
SELECT id, username, full_name, created_at 
FROM admin_users 
WHERE username = 'staffERBE';

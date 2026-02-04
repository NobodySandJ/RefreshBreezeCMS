-- Buat Admin User: staffERBE
-- Password: hijauERBE
-- 
-- Copy dan paste SQL ini di Supabase SQL Editor, lalu RUN
-- Hash bcrypt untuk password 'hijauERBE' (perlu di-generate ulang dengan bcrypt):

INSERT INTO admin_users (username, password_hash, full_name) 
VALUES (
  'staffERBE',
  '$2b$10$CT/umVetXw27cNT7SoryWOdHcJfT.UvDVAT8z3eJoIyXJzXbk72SO',
  'Staff Refresh Breeze'
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;

-- Verify
SELECT id, username, full_name, created_at 
FROM admin_users 
WHERE username = 'staffERBE';

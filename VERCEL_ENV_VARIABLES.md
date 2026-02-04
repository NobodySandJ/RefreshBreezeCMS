# 🔐 Environment Variables for Vercel Deployment

Copy semua environment variables ini ke **Vercel Dashboard** → Project Settings → Environment Variables

---

## 📦 Backend Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://zwrhcxqfnshcgyfuuzbl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cmhjeHFmbnNoY2d5ZnV1emJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA5Njk1MSwiZXhwIjoyMDg1NjcyOTUxfQ.7p7YN8OEEBChTa6VeFV09O6YjL8d_AZjK1E_4lsP6KE

# JWT Secret (JANGAN SAMA DENGAN DEVELOPMENT!)
JWT_SECRET=refresh_breeze_production_secret_2026_strong_key

# Frontend URL (ganti dengan URL Vercel kamu)
FRONTEND_URL=https://refresh-breeze-v3.vercel.app
```

---

## 🎨 Frontend Environment Variables

```bash
# Supabase Configuration (Public Keys - Aman)
VITE_SUPABASE_URL=https://zwrhcxqfnshcgyfuuzbl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cmhjeHFmbnNoY2d5ZnV1emJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY5NTEsImV4cCI6MjA4NTY3Mjk1MX0.xLwFxezQoxYnzHiHPQvhvxK66uPga5LvHm0K1M2w7-8

# API URL - TIDAK PERLU di set! 
# (Karena production pakai relative path /api otomatis)
# VITE_API_URL=/api
```

---

## ⚙️ Cara Setting di Vercel Dashboard

### 1. Buka Vercel Dashboard
- Go to: https://vercel.com/nobodysandj/projects/refresh-breeze-v3
- Klik **Settings** → **Environment Variables**

### 2. Tambahkan Environment Variables

**PENTING:** Pilih environment untuk setiap variable:
- ✅ **Production** (wajib)
- ✅ **Preview** (optional, untuk testing)
- ✅ **Development** (optional)

### 3. Variable yang WAJIB di-set:

#### Backend:
| Key | Value | Environment |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `PORT` | `5000` | Production |
| `SUPABASE_URL` | `https://zwrhcxqfnshcgyfuuzbl.supabase.co` | Production |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJI...` (Service Role Key) | Production |
| `JWT_SECRET` | `refresh_breeze_production_secret_2026_strong_key` | Production |
| `FRONTEND_URL` | `https://refresh-breeze-v3.vercel.app` | Production |

#### Frontend:
| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://zwrhcxqfnshcgyfuuzbl.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` (Anon Key) | Production |

---

## 🔒 Security Notes

1. **JWT_SECRET**: Gunakan string yang BERBEDA dari development
   - Generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   
2. **SUPABASE_SERVICE_KEY**: Ini adalah **private key** - JANGAN share!

3. **VITE_SUPABASE_ANON_KEY**: Ini adalah **public key** - aman untuk di-expose

4. **FRONTEND_URL**: Update dengan URL production Vercel kamu

---

## 🚀 After Setting Environment Variables

1. **Redeploy**: Vercel otomatis redeploy setelah env variables ditambah
2. **Atau manual**: Settings → Deployments → [Latest] → Redeploy

---

## ✅ Checklist

- [ ] Semua backend env variables sudah di-set
- [ ] Semua frontend env variables sudah di-set
- [ ] `FRONTEND_URL` sudah diganti dengan URL Vercel production
- [ ] `JWT_SECRET` sudah diganti dengan secret yang kuat
- [ ] Redeploy berhasil
- [ ] Test API endpoint: `https://refresh-breeze-v3.vercel.app/api/health`
- [ ] Test frontend: `https://refresh-breeze-v3.vercel.app`
- [ ] Test admin login: `https://refresh-breeze-v3.vercel.app/admin`

---

## 🐛 Troubleshooting

**CORS Error?**
- Pastikan `FRONTEND_URL` di backend env sama dengan URL Vercel

**API 404?**
- Check `/api/health` endpoint works
- Lihat Vercel Function Logs

**Build Failed?**
- Check Vercel build logs
- Pastikan semua dependencies ter-install


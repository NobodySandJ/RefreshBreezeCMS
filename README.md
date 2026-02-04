# 🌬️ Refresh Breeze - Website Penjualan Cheki

Website fullstack untuk penjualan Cheki (foto polaroid) dengan member Refresh Breeze. Dibangun dengan **React.js**, **Tailwind CSS**, **Express.js**, **Supabase**, dan **Supabase Storage** untuk manajemen file.

[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

---

## 🌟 Fitur Utama

### 🛍️ Customer Features

- ✅ **Shopping Cart System** - Tambah/kurangi item dengan smooth animations
- ✅ **Event-Based Orders** - Pilih event terlebih dahulu sebelum checkout
- ✅ **Simplified Checkout** - Hanya 2 field: Nama + Kontak (IG/WA)
- ✅ **Auto-Detect Contact** - Backend otomatis detect phone number vs Instagram username
- ✅ **Image Auto-Compression** - Upload bukti bayar auto-compress (60-80% size reduction)
- ✅ **Responsive Design** - Mobile-first dengan Tailwind breakpoints
- ✅ **Toast Notifications** - Centered, non-blocking feedback
- ✅ **Dynamic Pricing** - 25k per member, 30k group member

### 🔐 Admin CMS Features

- ✅ **JWT Authentication** - Secure login dengan bcrypt password hashing
- ✅ **Dashboard Overview** - Real-time order statistics
- ✅ **Multi-Filter System**:
  - Status (Pending/Checked/Completed)
  - Type (OTS/Pre-Order)
  - Event (filter by specific event)
  - Date Range (week/month/custom)
  - Search (nama/email/order number)
- ✅ **OTS Orders** - Create manual orders untuk on-the-spot sales (with event selection)
- ✅ **Excel Export** - Download filtered orders dengan **total pendapatan** calculation
- ✅ **Bulk Delete** - Delete orders by: all, event, weeks, months
- ✅ **Event Management** - Create/Edit/Delete events dengan lineup member
- ✅ **Payment Proof Display** - Clickable links to Supabase Storage
- ✅ **Detailed Items View** - Show "Cheki YanYee x2" format
- ✅ **Status Color Coding**:
  - ⚪ **Putih** = Pending (baru masuk)
  - 🔵 **Biru** = Checked (payment verified)
  - 🟢 **Hijau** = Completed (cheki diambil)

---

## 🛠️ Tech Stack

### Frontend

- **React 18** + **Vite** - Fast build tool and modern React
- **Tailwind CSS** - Utility-first responsive design
- **Framer Motion** - Smooth animations
- **SweetAlert2** - Beautiful modals and alerts
- **React Router v6** - Client-side routing
- **Axios** - HTTP requests
- **React Toastify** - Toast notifications
- **React Icons** - Icon library

### Backend

- **Node.js** + **Express** - RESTful API server
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Storage** - File storage for payment proofs
- **Sharp** - High-performance image compression
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **ExcelJS** - Excel file generation
- **Multer** - Multipart form-data handling

### Infrastructure

- **Vercel** - Frontend & Backend hosting
- **Supabase** - Database & Storage
- **GitHub** - Version control

---

## 📁 Project Structure

```
RB Remake/
├── frontend/                # React frontend
│   ├── public/
│   │   ├── data/           # Member data (JSON)
│   │   │   └── members.json
│   │   └── images/         # Static images
│   │       ├── members/    # Member photos (HARDCODED)
│   │       ├── events/     # Event photos
│   │       └── logos/      # Logo & branding
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # API & Supabase clients
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Express backend
│   ├── config/             # Database & Google Drive config
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── server.js
│   └── package.json
│
├── database/                # Database schema
│   ├── schema.sql          # Supabase schema
│   └── README.md
│
├── scripts/                 # Helper scripts
│   ├── generate-placeholders.ps1
│   └── README.md
│
├── IMAGES_GUIDE.md         # Image management guide
└── README.md
```

## 🚀 Quick Start

### 1. Setup Database (Supabase)

1. Buat project di [Supabase](https://supabase.com)
2. Jalankan SQL di `database/schema.sql` di SQL Editor
3. Copy URL dan Service Key

### 2. Setup Google Drive API

1. Buat project di [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Buat Service Account → Download credentials JSON
4. Buat folder di Google Drive → Share dengan email service account
5. Copy Folder ID dari URL

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan credentials Anda
npm run dev
```

**Backend .env:**

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_random_secret_string
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
FRONTEND_URL=http://localhost:3000
```

### 4. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env dengan Supabase URL & Anon Key
npm run dev
```

**Frontend .env:**

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 4. Setup Member Photos (NEW!)

```bash
# Generate placeholder SVG images
.\scripts\generate-placeholders.ps1

# Or manually:
# 1. Prepare photos (800x1000px, 4:5 ratio, JPG format)
# 2. Rename: sinta.jpg, cally.jpg, naomi.jpg, amel.jpg, luna.jpg, bella.jpg, zara.jpg, group.jpg
# 3. Copy to: frontend/public/images/members/
# 4. Refresh browser (Ctrl+F5)
```

**📸 See detailed guide:** [IMAGES_GUIDE.md](IMAGES_GUIDE.md)

### 5. Create Admin User

Gunakan API endpoint untuk membuat admin pertama kali:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password",
  "full_name": "Admin Refresh Breeze",
  "secret": "REFRESH_BREEZE_SETUP_2026"
}
```

Atau gunakan Postman/Thunder Client.

## 📱 Cara Menggunakan

### Customer Flow:

1. Buka homepage → pilih member
2. Add to cart
3. Scroll ke "Konfirmasi Pembayaran"
4. Transfer sesuai nominal
5. Upload bukti transfer
6. Submit form
7. Tunggu email konfirmasi

### Admin Flow:

1. Login di `/admin/login`
2. **Lihat semua pesanan** di tab Orders
3. **Filter berdasarkan**:
   - Status (Pending/Checked/Completed)
   - Periode (Minggu/Bulan/Custom)
   - Search nama/email
4. **Ubah status** dengan dropdown di setiap row
5. **Klik "Detail"** untuk lihat bukti pembayaran
6. **Export Excel** untuk rekap periode tertentu
7. **Order OTS** untuk input manual di venue
8. **Manage Events** di tab Events

## 🎨 Fitur Status Warna

### Sistem Warna Otomatis:

- **🟦 PENDING (Putih)**: Pesanan baru masuk, belum diproses
- **🟦 CHECKED (Biru)**: Admin sudah cek pembayaran, validasi OK
- **🟢 COMPLETED (Hijau)**: Customer sudah ambil tiket fisik di venue

Admin tinggal ubah dropdown status di tabel.

## 📊 Export Excel

Fitur export menghasilkan file `.xlsx` dengan kolom:

- Order Number
- Nama Lengkap
- WhatsApp
- Email
- Instagram
- Items (detail cheki yang dibeli)
- Total Harga
- Status
- Tanggal Order

Filter by date range sebelum export untuk rekap bulanan/mingguan.

## 🔐 Security

- JWT authentication untuk admin
- Google Drive service account (bukan user credentials)
- Image compression sebelum upload (max 200KB)
- Row Level Security (optional di Supabase)
- CORS protection
- Environment variables untuk semua secrets

## 🎯 API Endpoints## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Supabase account
- Git

### 1️⃣ Clone & Install

```bash
git clone https://github.com/your-username/rb-remake.git
cd rb-remake

# Install dependencies
npm install

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Setup frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 2️⃣ Setup Supabase Database

```bash
# Login to Supabase Dashboard
# Go to SQL Editor
# Run database/schema.sql
# Run database/dummy-data.sql (optional)
# Create admin: Run generate-hash.js then use output in SQL Editor
```

### 3️⃣ Setup Supabase Storage

```bash
# In Supabase Dashboard > Storage
# Create bucket: payment-proofs
# Set Public Access: ON
# Create policy for authenticated write, public read
```

### 4️⃣ Run Development Server

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:3000 for customer site  
Open http://localhost:3000/admin/login for admin (staffERBE / hijauERBE)

---

## 📖 API Endpoints

### Public Endpoints

- `GET /api/events` - Get all events (upcoming & past)
- `GET /api/members` - Get member data from JSON
- `GET /api/config` - Get payment config (rekening, prices)
- `GET /api/faqs` - Get FAQ list
- `POST /api/orders` - Create customer order (requires event_id, payment_proof)
- `POST /api/upload/payment-proof` - Upload & compress payment image

### Admin Protected Endpoints (Requires JWT)

- `POST /api/auth/login` - Admin login (returns JWT token)
- `GET /api/orders` - Get filtered orders (status, type, event, date, search)
- `GET /api/orders/:id` - Get single order detail
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/export/excel` - Export orders to Excel with totals
- `POST /api/orders/ots` - Create OTS order (requires event_id)
- `POST /api/orders/bulk-delete` - Bulk delete orders (all/event/weeks/months)
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

---

## 🔐 Security Features

✅ **Environment Variables** - All secrets in `.env` files  
✅ **JWT Authentication** - Secure admin access  
✅ **Password Hashing** - bcrypt with 10 rounds  
✅ **Input Validation** - All endpoints validate input  
✅ **CORS Protection** - Whitelist frontend domain  
✅ **SQL Injection Safe** - Supabase client parameterized queries  
✅ **File Upload Security** - Size limits, type validation, compression  
✅ **Row Level Security** - Supabase RLS ready  
✅ **No Secrets in Code** - All credentials via env vars

**Full details:** [SECURITY.md](SECURITY.md)

---

## 📱 Responsive Design

✅ **Mobile-First** - Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px)  
✅ **Touch-Friendly** - Buttons ≥ 44x44px  
✅ **Hamburger Menu** - Mobile navigation  
✅ **Responsive Grids** - Auto-adjust columns  
✅ **Scrollable Tables** - Horizontal scroll on mobile  
✅ **Adaptive Modals** - Full-width on mobile  
✅ **Centered Toasts** - Non-blocking notifications

**Tested on:** iPhone SE, iPhone 12, iPad, iPad Pro, Desktop, Ultra-wide

**Full report:** [PERFORMANCE.md](PERFORMANCE.md)

---

## ⚡ Performance Optimizations

✅ **Image Compression** - Sharp library (60-80% size reduction)  
✅ **Vite Build** - Tree-shaking, minification, code splitting  
✅ **Database Indexes** - Fast queries on foreign keys  
✅ **Lazy Loading** - Components loaded on-demand  
✅ **No Sourcemaps** - Production builds lightweight  
✅ **Progressive JPEG** - Faster image loading  
✅ **CDN Ready** - Vercel automatic CDN

---

## 🌐 Deployment Guide

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Login to vercel.com
   - Import repository
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   Add in Vercel Dashboard > Settings > Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`
   - All backend env vars

4. **Deploy Backend Separately**
   - Create new Vercel project
   - Root Directory: `backend`
   - Framework: Node.js

**Detailed guide:** [DEPLOY.md](DEPLOY.md)

---

## 📚 Documentation

- 📖 [SETUP.md](SETUP.md) - Detailed setup instructions
- 🚀 [DEPLOY.md](DEPLOY.md) - Deployment to Vercel/production
- 🔐 [SECURITY.md](SECURITY.md) - Security checklist & best practices
- ⚡ [PERFORMANCE.md](PERFORMANCE.md) - Responsiveness & optimization report
- 🧪 [TESTING.md](TESTING.md) - Testing checklist (if exists)

---

- **Project Summary:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🤝 Contributing

Untuk development lokal:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

© 2026 Refresh Breeze. All rights reserved.

## 💬 Support

Untuk pertanyaan atau issue:

- Email: [contact@refreshbreeze.com]
- Instagram: [@refbreeze](https://instagram.com/refbreeze)

---

**Made with ❤️ for Refresh Breeze**

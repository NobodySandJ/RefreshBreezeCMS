-- ============================================
-- REFRESH BREEZE - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (OPTIONAL - UNCOMMENT JIKA INGIN RESET)
-- ============================================
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS event_gallery CASCADE;
-- DROP TABLE IF EXISTS event_lineup CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS member_gallery CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;
-- DROP TABLE IF EXISTS faqs CASCADE;
-- DROP TABLE IF EXISTS config CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================
-- TABLE: members
-- ============================================
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(50) UNIQUE NOT NULL,
    nama_panggung VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    hadir BOOLEAN DEFAULT true,
    image_url TEXT,
    jikoshoukai TEXT,
    tanggal_lahir VARCHAR(50),
    hobi TEXT,
    instagram VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: member_gallery
-- ============================================
CREATE TABLE member_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: events
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    tanggal INT NOT NULL,
    bulan VARCHAR(50) NOT NULL,
    tahun INT NOT NULL,
    lokasi TEXT NOT NULL,
    event_time VARCHAR(50),
    cheki_time VARCHAR(50),
    is_past BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: event_lineup (Many-to-Many)
-- ============================================
CREATE TABLE event_lineup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id)
);

-- ============================================
-- TABLE: event_gallery
-- ============================================
CREATE TABLE event_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    tipe VARCHAR(50),
    path TEXT NOT NULL,
    kredit VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instagram VARCHAR(100),
    total_harga INT NOT NULL,
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    -- Status: pending (putih), checked (biru), completed (hijau)
    is_ots BOOLEAN DEFAULT false,
    -- On The Spot order dari admin
    created_by VARCHAR(50) DEFAULT 'customer',
    -- 'customer' atau 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: config (Payment Info & Pricing)
-- ============================================
CREATE TABLE config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config
INSERT INTO config (key, value)
VALUES ('harga_cheki_per_member', '25000'),
    ('harga_cheki_grup', '30000'),
    ('payment_bank', 'BCA'),
    ('payment_rekening', '0902683273'),
    ('payment_atas_nama', 'Natasya Angelina Putri');

-- ============================================
-- TABLE: faqs
-- ============================================
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanya TEXT NOT NULL,
    jawab TEXT NOT NULL,
    urutan INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: admin_users (untuk login admin)
-- ============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES untuk Performance
-- ============================================
CREATE INDEX idx_orders_status ON orders(status);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_events_is_past ON events(is_past);

CREATE INDEX idx_member_id ON members(member_id);

-- ============================================
-- FUNCTIONS & TRIGGERS untuk auto updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at BEFORE
UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE
UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_updated_at BEFORE
UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- Aktifkan jika ingin security per row
-- ============================================
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON orders FOR SELECT USING (true);
-- CREATE POLICY "Allow admin full access" ON orders USING (auth.role() = 'admin');
-- ============================================
-- SAMPLE DATA - MEMBERS
-- ============================================
INSERT INTO members (
        member_id,
        nama_panggung,
        tagline,
        hadir,
        image_url,
        jikoshoukai,
        tanggal_lahir,
        hobi,
        instagram
    )
VALUES (
        'yanyee',
        'YanYee 🪽',
        'Anggun, Hangat, Cerah',
        true,
        'foto/CVRYanyee.webp',
        '"manis, lembut, dan selalu siap membuat harimu jadi lebih hangat seperti cookies yang baru matang🍪. haloo semuaa, aku yan yee!🪽"',
        '22 November',
        'Makeup, dance, baking',
        '@ho_yan.yee'
    ),
    (
        'sinta',
        'Sinta 💚',
        'Pemalu, Penasaran',
        true,
        'foto/CVRSinta.webp',
        '"Si pemalu tetapi suka hal-hal baru, haloo aku Sintaa"',
        '12 Oktober',
        'Memasak, menyanyi, menari, nonton anime, tidur',
        '@sii_ntaa'
    ),
    (
        'cissi',
        'Cissi 🦋',
        'Imajinatif, Penari',
        true,
        'foto/CVRCissi.webp',
        '"Aiyaiya, i''m your little butterfly~ Kupu-kupu yang suka menari dan bisa membuatmu bahagia, halo halo semuanya aku Cissi"',
        '22 Agustus',
        'Dance dan melamun',
        '@bakedciz'
    ),
    (
        'channie',
        'Channie ✨',
        'Kreatif, Menghibur',
        true,
        'foto/CVRChannie.webp',
        '"Semungil bintang yang akan menerangi hatimu seperti bulan, halo semuanya aku Channie!"',
        '8 September',
        'Dance, bikin koreo, nulis, makan gorengan',
        '@zzuchannie'
    ),
    (
        'acaa',
        'Acaa 💙',
        'Ceria, Usil, Lincah',
        true,
        'foto/CVRAca.webp',
        '"Citcitcutcuit dengarlah kicauanku yang akan meramaikan hatimuuu"',
        '25 Agustus',
        'Nyanyi, turu, main emel, berak, repeat',
        '@caafoxy'
    ),
    (
        'cally',
        'Cally 🪼',
        'Lembut, Weirdo',
        true,
        'foto/CVRCally.webp',
        '"Mengapung lembut dihatimu seperti ubur ubur yang menari di laut🪼~ Hallo aku Cally!!!"',
        '5 September',
        'Menonton film, mempertanyakan eksistensi diri sendiri, menyanyi',
        '@calismilikitiw'
    ),
    (
        'piya',
        'Piya 🐰',
        'Periang, Lucu',
        true,
        'foto/CVRPiya.webp',
        '"Pyon! pyon! seperti kelinci yang melompat tinggi aku akan melompat ke posisi tertinggi di hatimu 🐰 ~ Hallo aku Piya !!"',
        '1 Januari',
        'Gambar dan main rosbloz',
        '@matcvie_'
    ),
    (
        'group',
        'Group',
        'Kompak & Ceria',
        true,
        'foto/group.webp',
        'Grup idola asal Tulungagung yang siap membawa hembusan angin segar untukmu!',
        NULL,
        NULL,
        NULL
    );

-- ============================================
-- SAMPLE DATA - FAQS
-- ============================================
INSERT INTO faqs (tanya, jawab, urutan)
VALUES (
        'Bagaimana cara memesan Cheki?',
        'Pilih Cheki member yang Anda inginkan, klik "Add", lalu scroll ke bawah ke bagian "Keranjang Anda" dan "Detail Pemesanan" untuk mengisi data diri dan mengunggah bukti transfer.',
        1
    ),
    (
        'Apa saja metode pembayaran yang diterima?',
        'Saat ini kami hanya menerima pembayaran melalui transfer bank ke rekening BCA yang tertera di bagian "Notes Pembayaran".',
        2
    ),
    (
        'Apa itu Cheki?',
        'Cheki adalah sesi foto instan (mirip Polaroid) bersama member idola pilihan Anda. Ini adalah kesempatan untuk mendapatkan kenang-kenangan eksklusif langsung dengan oshi Anda di event.',
        3
    ),
    (
        'Bagaimana jika saya sudah membayar tapi batal datang?',
        'Jika Anda sudah melakukan Pre-Order (PO) tetapi tidak bisa datang, mohon segera konfirmasi ulang kepada kami melalui Direct Message (DM) Instagram Refresh Breeze untuk penanganan lebih lanjut.',
        4
    ),
    (
        'Setelah checkout berhasil, apa langkah selanjutnya?',
        'Simpan bukti transfer dan Order ID Anda. Saat hari event, datang ke booth kami dan tunjukkan bukti transfer atau data diri Anda untuk menukarkannya dengan tiket Cheki fisik.',
        5
    );

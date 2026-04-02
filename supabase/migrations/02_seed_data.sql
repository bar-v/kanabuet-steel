-- ==============================
-- 02_seed_data.sql
-- Deskripsi: Memasukkan data dummy untuk keperluan testing berdasarkan struktur PRD baru
-- ==============================

-- Bersihkan data lama jika ada (agar file ini bisa di-run berulang kali dengan bersih)
TRUNCATE TABLE project_evaluations, receipts, material_usage, materials, project_progress, projects, users CASCADE;

-- 1. Insert Users (Owner & Supervisor)
INSERT INTO users (id, name, role, email) VALUES
('11111111-1111-1111-1111-111111111111', 'Bapak Owner', 'owner', 'owner@kanabuet.com'),
('22222222-2222-2222-2222-222222222222', 'Andi Supervisor', 'supervisor', 'andi.sup@kanabuet.com'),
('33333333-3333-3333-3333-333333333333', 'Budi Lapangan', 'supervisor', 'budi.lap@kanabuet.com');

-- 2. Insert Projects
INSERT INTO projects (id, name, client_name, client_phone, description, status, start_date, end_date, address, raw_address, latitude, longitude, geocode_latitude, geocode_longitude, supervisor_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pembuatan Kanopi Balkon Besi Tempa', 'Bapak Reza', '081234567890', 'Kanopi dengan desain minimalis untuk lantai 2', 'in_progress', '2023-11-01', '2023-11-15', 'Jl. Merdeka No. 10', 'Jl. Merdeka No. 10, Kuta Alam', 5.5501, 95.3175, 5.5501, 95.3175, '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pagar Besi Kompleks Perumahan', 'PT. Indah Jaya', '085211223344', 'Pagar besi tinggi 2m sepanjang 100m', 'completed', '2023-10-01', '2023-10-20', 'Perumahan Indah Permai', 'Perumahan Indah Permai, Banda Aceh', 5.5532, 95.3122, 5.5530, 95.3120, '33333333-3333-3333-3333-333333333333'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Struktur Baja Ringan Gudang', 'CV. Logistik Lancar', '089876543210', 'Fabrikasi kolom dan kuda-kuda atap', 'planning', '2023-12-01', NULL, 'Kawasan Industri', 'Kawasan Industri Aceh Besar', 5.5600, 95.3100, 5.5605, 95.3105, '22222222-2222-2222-2222-222222222222');

-- 3. Insert Project Progress (Dokumentasi Timeline)
INSERT INTO project_progress (project_id, update_date, percentage, notes, photo_path) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2023-11-02', 10, 'Persiapan material dan pemotongan besi selesai', 'photos/kanopi-day1.jpg'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2023-11-07', 50, 'Rangka utama sudah dirakit', 'photos/kanopi-day7.jpg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2023-10-20', 100, 'Pagar selesai dicat dan diserahterimakan', 'photos/pagar-done.jpg');

-- 4. Insert Global Inventory Materials
INSERT INTO materials (id, name, unit, initial_stock, remaining_stock) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Besi Hollow 4x4 (Tebal 1.2mm)', 'Batang', 100, 80),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Besi Siku L (4x4)', 'Batang', 50, 45),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Kawat Las RD-460', 'Kotak', 20, 15),
('12345678-1234-1234-1234-123456789012', 'Cat Besi Anti Karat', 'Kaleng', 10, 8);

-- 5. Insert Material Usage (Jejak Penggunaan)
INSERT INTO material_usage (project_id, material_id, amount_used, usage_date, notes) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 20, '2023-11-02', 'Untuk tiang kanopi lantai 2'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, '2023-11-05', 'Pengelasan rangka'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, '2023-10-02', 'Rangka pagar miring'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '12345678-1234-1234-1234-123456789012', 2, '2023-10-18', 'Finishing cat pagar');

-- 6. Insert Receipts (Arsip Bon)
INSERT INTO receipts (project_id, store_name, purchase_date, total_cost, photo_path) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Toko Besi Makmur', '2023-11-01', 1250000.00, 'receipts/bon-makmur-1.jpg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Toko Cat Warna Warni', '2023-10-15', 300000.00, 'receipts/bon-cat-1.jpg');

-- 7. Insert Project Evaluations
INSERT INTO project_evaluations (project_id, issues, solutions, notes, rating) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sempat terkendala hujan selama 3 hari berturut-turut pada tahap pengecatan', 'Menggunakan terpal dan memindahkan proses cat ke gudang terpal darurat', 'Proyek telat 1 hari dari target internal tapi klien puas', 4);
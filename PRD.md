# PRD.md
Kanabuet Steel Project Management System

## 1. Product Overview
Kanabuet Steel Project Management System adalah aplikasi web yang dirancang untuk membantu bengkel las konstruksi dalam mengelola proyek secara digital.

Sistem ini memungkinkan pemilik bengkel dan supervisor untuk:
- mengelola data proyek
- memantau progres pekerjaan
- mendokumentasikan progres melalui foto
- mengelola stok material
- mencatat pembelian material dari supplier
- mengarsipkan bon pembelian
- melakukan evaluasi proyek

Aplikasi dirancang sebagai web responsif yang dapat digunakan melalui desktop maupun perangkat mobile sehingga supervisor dapat menginput data langsung dari lokasi proyek.

2. Problem Statement
Banyak bengkel las masih mengelola proyek secara manual menggunakan catatan kertas dan komunikasi melalui aplikasi pesan.
Masalah utama yang sering terjadi:
- Progres proyek sulit dipantau secara sistematis
- Dokumentasi pekerjaan tidak tersimpan dengan baik
- Penggunaan material tidak tercatat secara terstruktur
- Bon pembelian sering hilang atau tidak terdokumentasi
- Evaluasi proyek tidak terdokumentasi untuk referensi berikutnyas

Akibatnya pemilik bengkel kesulitan melakukan pengawasan proyek dan evaluasi operasional.

3. Product Goals
Tujuan utama sistem ini adalah:
- Menyediakan sistem manajemen proyek yang terstruktur
- Menyediakan dokumentasi proyek yang terpusat
- Mempermudah monitoring progres pekerjaan
- Mengelola stok material proyek
- Menyediakan arsip digital pembelian material
- Mendukung evaluasi proyek untuk peningkatan operasional

4. Target Users
4.1 Owner (Pemilik Bengkel)

Tanggung jawab:
- memonitor seluruh proyek
- melihat laporan progres
- melihat penggunaan material
- mengevaluasi proyek

Kebutuhan utama:
- dashboard proyek
- laporan progres
- arsip dokumentasi proyek

4.2 Supervisor Lapangan

Tanggung jawab:
- mengelola proyek
- mengupdate progres pekerjaan
- mencatat penggunaan material
- mengunggah dokumentasi pekerjaan

Kebutuhan utama:
- input progres proyek
- upload foto pekerjaan
- mencatat penggunaan material
- menyimpan bon pembelian

5. Core System Features
5.1 Authentication

Fitur login untuk mengamankan akses sistem.

Fungsi:
- login pengguna
- logout pengguna
- manajemen role pengguna

Role pengguna:
- owner
- supervisor

Teknologi:
- Supabase Authentication

5.2 Project Management

Fitur untuk membuat dan mengelola proyek.

Data proyek yang disimpan:
- project_id
- user_id
- project_name
- client_name
- client_phone
- description
- status
- start_date
- estimated_finish
- project_location
- raw_address
- latitude
- longitude
- geocode_latitude
- geocode_longitude
- start_date
- estimated_finish
- project_status
- supervisor_id
- description

Status proyek:
- pending
- on_progress
- completed
- cancelled

5.3 Progress Monitoring

Supervisor dapat memperbarui progres proyek secara berkala.

Data progres:
- progress_id
- project_id
- user_id
- update_date
- percentage
- notes
- photo_url

Fungsi:
- menambahkan update progres
- melihat timeline progres
- melihat riwayat pekerjaan

5.4 Photo Documentation
Fitur untuk menyimpan dokumentasi foto pekerjaan.

Fungsi:
- upload foto proyek
- galeri foto proyek
- preview foto

Media penyimpanan:
- Supabase Storage

6. Material Management System

Modul ini digunakan untuk mengelola stok material yang digunakan dalam proyek.

Modul material terdiri dari beberapa bagian utama:
- suppliers
- materials
- material_transactions
- material_usage
- low_stock_alert

6.1 Supplier Management

Fitur untuk mencatat supplier material.

Data supplier:
- supplier_id
- supplier_name
- address
- phone
- created_at

Satu supplier dapat menyediakan banyak material.

6.2 Material Master Data

Digunakan untuk mencatat material yang tersedia di bengkel.

Data material:
- material_id
- supplier_id
- material_name
- category
- unit
- current_stock
- minimum_stock
- supplier_id
- created_at
- updated_at

Contoh material:
- Besi Hollow 40x40
- Besi WF
- Plat Baja
- Elektroda Las
- Cat Besi

<!-- 6.3 Material Transactions

Setiap perubahan stok material harus dicatat sebagai transaksi.

Data transaksi:

- transaction_id
- material_id
- transaction_type
- quantity
- project_id
- supplier_id
- transaction_date
- notes -->

<!-- Jenis transaksi:
- IN       (material masuk / pembelian)
- OUT      (material digunakan proyek)
- ADJUST   (koreksi stok)

Perhitungan stok:
- current_stock = total(IN) - total(OUT) -->

6.4 Material Usage for Projects

Supervisor mencatat material yang digunakan dalam proyek.

Data penggunaan material:

- usage_id
- project_id
- material_id
- quantity
- usage_date
- notes

Data ini juga tercatat sebagai transaksi OUT pada sistem material.

6.5 Low Stock Notification

Sistem memberikan peringatan jika stok material hampir habis.

Logika sistem:
- if current_stock <= minimum_stock
→ trigger warning

Notifikasi ditampilkan pada:

dashboard
indikator peringatan material

<!-- 7. Digital Receipt Archive

Fitur untuk menyimpan bon pembelian material.

Data bon:

- receipt_id
- project_id
- supplier_id
- purchase_date
- total_cost
- receipt_photo
- notes

Fungsi:
- upload foto bon
- arsip bon per proyek
- riwayat pembelian material

8. Project Evaluation

Evaluasi dilakukan setelah proyek selesai.

Data evaluasi:

- evaluation_id
- project_id
- issues
- solutions
- notes
- rating
- created_at
- created_by

Tujuan:
- mendokumentasikan kendala proyek
- memberikan referensi untuk proyek berikutnya -->

9. Dashboard

Dashboard memberikan ringkasan sistem kepada pemilik bengkel.

Informasi yang ditampilkan:

- total_projects
- active_projects
- completed_projects
- recent_progress_updates
- low_stock_materials
- recent_activities

Komponen visual:
- progress bar proyek
- timeline aktivitas
- statistik proyek

10. High Level Data Entities

Entitas utama dalam sistem:
- users
- projects
- project_progress
- materials
- suppliers
<!-- - material_transactions -->
<!-- - receipts -->
<!-- - project_evaluations -->
- activity_logs

11. Technology Stack

Frontend:
- Next.js
- React
- TypeScript
- TailwindCSS

Backend:
- Next.js API Routes

Database:
- PostgreSQL (Supabase)

Storage:
- Supabase Storage

Authentication:
- Supabase Auth

## 11.1 Supporting Libraries & Services

Sistem memanfaatkan beberapa package, library, dan layanan pendukung untuk membantu proses pengembangan serta meningkatkan efisiensi operasional aplikasi.

### Frontend Utility

Digunakan untuk membantu pengelolaan tampilan dan interaksi pengguna.

Kemungkinan library:
- react-hook-form  
  Digunakan untuk pengelolaan form dan validasi input pengguna.

- zod  
  Digunakan untuk validasi schema data pada form input.

- clsx / tailwind-merge  
  Membantu pengelolaan class TailwindCSS secara dinamis.

- lucide-react  
  Menyediakan ikon antarmuka yang ringan dan konsisten.

---

### Data Fetching & State Management

Digunakan untuk sinkronisasi data antara frontend dan backend.

Kemungkinan library:
- TanStack Query (React Query)  
  Digunakan untuk caching data, sinkronisasi data server, dan optimasi request API.

- Axios / Fetch API  
  Digunakan untuk komunikasi data dengan backend dan layanan Supabase.

---

### Image & File Handling

Digunakan untuk mendukung dokumentasi proyek dan arsip digital.

Kemungkinan library:
- browser-image-compression  
  Digunakan untuk melakukan kompresi gambar sebelum proses upload guna mengurangi ukuran file dan mempercepat pengiriman data.

- react-dropzone  
  Membantu proses upload file melalui drag-and-drop maupun input file biasa.

---

### Maps & Location Services

Digunakan untuk mendukung validasi lokasi proyek.

Kemungkinan layanan/library:
- Google Maps API
- Leaflet
- Mapbox

Fungsi:
- pengambilan koordinat GPS
- geocoding alamat
- validasi lokasi proyek melalui peta digital

---

### Progressive Web App (PWA)

Digunakan untuk mendukung penggunaan sistem pada perangkat mobile.

Kemungkinan library:
- next-pwa

Fungsi:
- instalasi aplikasi pada perangkat mobile
- caching halaman tertentu
- dukungan penggunaan dasar secara offline

---

### UI Components

Digunakan untuk mempercepat pengembangan antarmuka sistem.

Kemungkinan library:
- shadcn/ui
- Radix UI

Fungsi:
- komponen dialog
- tabel data
- dropdown
- toast notification
- modal interaktif

---

### Additional Utilities

Digunakan sebagai utilitas pendukung sistem.

Kemungkinan library:
- date-fns  
  Pengolahan format tanggal dan waktu.

- uuid  
  Pembuatan identifier unik.

- dotenv  
  Pengelolaan environment variable aplikasi.

12. Non Functional Requirements
Responsiveness

Sistem harus dapat digunakan pada:
- desktop
- tablet
- mobile

Security:
- authentication login
- role based access control
- input validation

Performance:
- upload foto maksimal 5MB
- galeri foto tetap responsif

Data Backup:
- Database menggunakan backup otomatis dari Supabase.

## 13. Development Roadmap

Pengembangan sistem dilakukan secara bertahap untuk memastikan setiap fitur yang dibangun memiliki tujuan yang jelas serta dapat diuji secara bertahap sesuai dengan kebutuhan proyek.

---

### Phase 1 — Minimum Viable Product (MVP)

Fase ini berfokus pada pembangunan fitur inti sistem agar aplikasi sudah dapat digunakan untuk mengelola proyek secara dasar.

Fitur utama:
- Authentication (login pengguna)
- Project management (tambah, ubah, dan lihat proyek)
- Assign anggota proyek
- Progress monitoring (persentase, catatan)
- Photo documentation (upload dokumentasi progres)
- Dashboard sederhana

Output:
- Sistem sudah memiliki alur utama
- Data proyek dapat dikelola dan dipantau

---

### Phase 2 — Operasional Proyek

Fase ini menambahkan fitur pendukung untuk membantu pengelolaan sumber daya proyek.

Fitur:
- Material management (data material)
- Supplier management
- Material usage tracking (penggunaan material per proyek)
- Digital receipt archive (opsional, arsip bon)

Output:
- Sistem mampu mencatat penggunaan material
- Data operasional proyek lebih terstruktur

### Phase 3 — Pengembangan Lanjutan

Fase ini merupakan pengembangan tambahan untuk meningkatkan nilai guna sistem.

Fitur:
- Offline support (Progressive Web App / PWA)

- Mendukung kebutuhan penggunaan lanjutan

14. System Scope
Sistem ini dirancang untuk:
- manajemen proyek bengkel las
- dokumentasi pekerjaan
- pengelolaan material proyek

Sistem tidak mencakup:
- sistem akuntansi penuh
- sistem payroll pekerja
- sistem manajemen pelanggan
Sistem Informasi Manajemen Proyek Bengkel Las Konstruksi

Project: Kanabuet Steel Project Management System
Type: Web Application (Responsive / PWA)

1. Latar Belakang

Bengkel las konstruksi umumnya mengelola proyek secara manual menggunakan catatan kertas, pesan WhatsApp, dan dokumentasi foto yang tidak terstruktur. Hal ini menyebabkan:

Kesulitan memantau progres proyek
Dokumentasi pekerjaan tidak terarsip dengan baik
Penggunaan material sulit dilacak
Evaluasi operasional proyek tidak terdokumentasi

Sistem ini dirancang untuk membantu pemilik bengkel dan supervisor dalam mengelola proyek konstruksi secara digital melalui aplikasi web.

2. Tujuan Sistem

Tujuan utama sistem:

Mengelola data proyek konstruksi
Memantau progres proyek secara visual (foto dokumentasi)
Mengelola penggunaan material
Mengarsipkan bon dan dokumen proyek
Menyediakan evaluasi operasional proyek
Menyediakan dashboard monitoring bagi pemilik

3. Target Pengguna
1. Owner / Pemilik Bengkel

Hak akses:

Melihat seluruh proyek
Melihat dashboard kinerja proyek
Mengakses laporan evaluasi
Melihat penggunaan material

2. Supervisor Lapangan

Hak akses:

Membuat proyek baru
Mengupdate progres proyek
Upload foto progres
Menginput penggunaan material
Upload bon pembelian
4. Fitur Utama Sistem
4.1 Manajemen Proyek

Fitur untuk mengelola proyek konstruksi.

Data yang disimpan
ID proyek
Nama proyek
Klien
Lokasi proyek
Koordinat lokasi (Google Maps)
Tanggal mulai
Estimasi selesai
Status proyek
Supervisor penanggung jawab
Deskripsi proyek
Status proyek
Planning
On Progress
Completed
Cancelled
4.2 Monitoring Progres Proyek

Supervisor dapat mengupdate progres proyek secara berkala.

Data progres
ID progres
ID proyek
Tanggal update
Persentase progres
Catatan pekerjaan
Foto dokumentasi
Fungsi
Upload foto pekerjaan
Melihat timeline progres
Riwayat update proyek
4.3 Dokumentasi Foto Proyek

Foto menjadi bukti pekerjaan lapangan.

Fitur
Upload foto dari HP
Galeri foto per proyek
Foto per tanggal progres
Preview gambar
Penyimpanan
Supabase Storage
4.4 Inventaris Material Proyek

Untuk mencatat material yang digunakan pada proyek.

Data material
ID material
Nama material
Satuan
Stok awal
Stok tersisa
Data penggunaan material
ID penggunaan
ID proyek
ID material
Jumlah digunakan
Tanggal penggunaan
Catatan
4.5 Arsip Bon Digital

Penyimpanan digital bon pembelian material.

Data bon
ID bon
ID proyek
Nama toko
Tanggal pembelian
Total biaya
Foto bon
Fungsi
Upload foto bon
Arsip per proyek
Melihat riwayat pembelian
4.6 Evaluasi Operasional Proyek

Digunakan untuk evaluasi setelah proyek selesai.

Data evaluasi
ID evaluasi
ID proyek
Kendala yang terjadi
Solusi yang dilakukan
Catatan tambahan
Penilaian proyek
Tujuan
Dokumentasi pengalaman proyek
Referensi untuk proyek berikutnya
5. Dashboard Sistem

Dashboard digunakan oleh owner untuk melihat ringkasan proyek.

Informasi dashboard
Total proyek
Proyek aktif
Proyek selesai
Progres proyek terbaru
Penggunaan material terbaru
Aktivitas terbaru supervisor
Visualisasi
Progress bar proyek
Timeline aktivitas
Statistik proyek
6. Fitur Lokasi Proyek

Supervisor dapat menandai lokasi proyek langsung dari lapangan.

Metode input lokasi
Klik tombol Pilih Lokasi
Sistem membuka Google Maps / Map picker
Supervisor menaruh pin lokasi
Sistem menyimpan koordinat
Data yang disimpan
latitude
longitude
alamat lokasi

7. Teknologi yang Digunakan
Frontend
Next.js
React
TailwindCSS
TypeScript
Backend

Menggunakan Next.js Fullstack

Fungsi backend:

API route
Validasi data
Upload file
Database
PostgreSQL
Hosted di Supabase
Storage
Supabase Storage

Digunakan untuk:

Foto progres proyek
Foto bon pembelian
Authentication
Supabase Auth

Role user:

Owner
Supervisor
8. Struktur Data Utama (High Level)

Tabel utama sistem:

users
projects
project_progress
materials
material_usage
receipts
project_evaluations

Relasi utama:

users
   |
projects
   |
   |---- project_progress
   |---- material_usage
   |---- receipts
   |---- project_evaluations
9. Kebutuhan Non-Fungsional
Responsif

Sistem harus dapat digunakan pada:

Desktop
Tablet
Smartphone
Keamanan
Authentication login
Role based access
Validasi input
Kinerja
Upload foto maksimal 5MB
Sistem tetap responsif saat membuka galeri foto
Backup

Database harus memiliki sistem backup dari Supabase.

10. Batasan Sistem
Sistem hanya digunakan oleh internal bengkel
Tidak mencakup sistem akuntansi penuh
Tidak mencakup sistem payroll pekerja

11. Roadmap Pengembangan
Tahap 1 (MVP)
Authentication
Manajemen proyek
Monitoring progres
Upload foto proyek
Tahap 2
Inventaris material
Arsip bon digital
Tahap 3
Dashboard analitik
Evaluasi proyek
Fitur lokasi proyek
12. Saran Fitur Tambahan (Yang Sebenarnya Penting)

Ini bagian yang sering tidak terpikirkan mahasiswa, padahal sangat berguna.

1. Activity Log

Semua aktivitas dicatat.

Contoh:

Supervisor A mengupdate progres proyek
Supervisor B menambahkan material
Owner mengubah status proyek

Ini penting kalau data berubah dan semua orang mulai saling menyalahkan.

2. Notifikasi

Contoh:

Proyek mendekati deadline
Update progres baru
Material hampir habis
3. Export Laporan

Owner bisa export:

Laporan proyek
Laporan penggunaan material
Dokumentasi proyek

Format:

PDF
Excel
4. Progressive Photo Timeline

Foto bisa dilihat seperti timeline:

Day 1   : Persiapan rangka
Day 7   : Pemasangan struktur
Day 15  : Finishing

Ini membuat sistem terlihat jauh lebih profesional.

5. Offline Upload (opsional tapi keren)

Supervisor sering di lokasi tanpa sinyal.

Solusi:

Simpan foto sementara
Upload ketika internet tersedia

Bisa dicapai dengan PWA + local storage.

13. Saran Teknologi Tambahan (Supaya Proyeknya Terlihat Lebih “Serius”)

Tambahkan ini jika ingin terlihat lebih matang:

Map

Gunakan:

Leaflet.js
OpenStreetMap

Alasannya:

Gratis
Tidak perlu billing Google Maps
Image Optimization

Gunakan:

Next.js Image
atau Sharp

Agar foto proyek tidak terlalu berat.

Validation

Gunakan:

Zod

Untuk validasi form.

Kesimpulan

Sistem ini memiliki core modules:

Project Management
Progress Monitoring
Photo Documentation
Material Tracking
Receipt Archive
Project Evaluation
Dashboard Monitoring

Dengan teknologi:

Next.js
Supabase
PostgreSQL
Supabase Storage
TailwindCSS

Arsitektur ini cukup realistis untuk TA D3, tidak terlalu sederhana tetapi juga tidak berlebihan.
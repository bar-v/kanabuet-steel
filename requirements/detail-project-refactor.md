# DETAIL_PROJECT_REFACTOR.md

## Tujuan

Menyederhanakan dan menyatukan halaman Detail Proyek antara Owner dan Supervisor untuk mengurangi duplikasi kode, menjaga konsistensi UI, serta mempermudah pemeliharaan sistem.

---

# Arsitektur Routing

Tetap gunakan route terpisah:

```txt
/dashboard/projects/[id]
/dashboard/supervisor/projects/[id]
```

Alasan:

* Menjaga struktur sidebar masing-masing role.
* Menjaga layout Owner dan Supervisor tetap independen.
* Mempermudah pengaturan hak akses.
* Mempermudah pengembangan fitur role-specific di masa depan.
* Tidak mengganggu performa maupun PWA.

Route tidak perlu digabung.

---

# Shared Detail Project Component

Gunakan satu komponen detail proyek yang dipakai oleh kedua route.

Contoh:

```tsx
<ProjectDetailPage
  role="owner"
  data={project}
/>

<ProjectDetailPage
  role="supervisor"
  data={project}
/>
```

Perbedaan role ditangani melalui props dan permission, bukan dengan membuat dua halaman UI yang berbeda.

---

# Data Fetching

## Kondisi Saat Ini

Owner:

```txt
Supabase Client → Database
```

Supervisor:

```txt
Frontend → API Route → Database
```

Pola ini tidak konsisten.

---

## Arsitektur Yang Direkomendasikan

Gunakan API Route untuk seluruh role.

```txt
Frontend
    ↓
API Route Next.js
    ↓
Supabase PostgreSQL
```

Contoh endpoint:

```txt
/api/projects/[id]
/api/projects/[id]/progress
/api/projects/[id]/materials
/api/projects/[id]/members
/api/projects/[id]/documentation
```

Keuntungan:

* Logic bisnis terpusat.
* Validasi role lebih mudah.
* Query database tidak tersebar di frontend.
* Lebih mudah dikembangkan.
* Lebih konsisten.

---

# Struktur Halaman Detail Proyek

## Header

Menampilkan:

* Nama proyek
* Status proyek
* Progress pekerjaan
* Lokasi proyek
* Klien
* Tanggal mulai
* Target selesai
* Tombol Google Maps

---

# Navigation Tab

Gunakan tab yang sama untuk seluruh role.

```txt
Overview
Progress
Material
Tim
```

Dokumentasi tidak dibuat sebagai tab terpisah.

---

# Tab Overview

Overview berfungsi sebagai ringkasan proyek.

## Deskripsi Proyek

Menampilkan deskripsi pekerjaan yang sedang dilakukan.

---

## Aktivitas Terbaru

Menampilkan beberapa aktivitas terakhir.

Contoh:

* Pembaruan progres 65%
* Validasi lokasi berhasil
* Penggunaan material terbaru

Tersedia tombol:

```txt
Semua >
```

Aksi:

* Membuka modal riwayat progress lengkap.

---

## Dokumentasi

Menampilkan preview dokumentasi terbaru.

Contoh:

```txt
Foto 1
Foto 2
Foto 3
```

Tersedia tombol:

```txt
Lihat Semua >
```

Aksi:

* Membuka modal galeri dokumentasi lengkap.

---

## Lokasi Proyek

Menampilkan:

* Peta lokasi
* Koordinat GPS
* Tombol buka Google Maps

---

# Tab Progress

Menampilkan seluruh riwayat progress proyek.

Isi:

* Timeline progress
* Persentase progress
* Catatan pekerjaan
* Dokumentasi terkait progress

Hak akses:

Owner:

```txt
View Only
```

Supervisor:

```txt
Tambah Progress
Upload Dokumentasi Progress
```

---

# Tab Material

Menampilkan:

* Daftar material proyek
* Riwayat penggunaan material
* Jumlah penggunaan

Hak akses:

Owner:

```txt
View Only
```

Supervisor:

```txt
Input Penggunaan Material
```

---

# Tab Tim

Menampilkan:

* Supervisor proyek
* Daftar anggota proyek
* Peran anggota proyek

Hak akses:

Owner:

```txt
Tambah anggota
Edit anggota
Hapus anggota
```

Supervisor:

```txt
View Only
```

---

# Hak Akses Owner

Owner dapat:

* Melihat seluruh proyek
* Mengedit proyek
* Mengelola anggota proyek
* Melihat seluruh progress
* Melihat seluruh dokumentasi
* Melihat seluruh penggunaan material

---

# Hak Akses Supervisor

Supervisor dapat:

* Validasi lokasi
* Menambah progress
* Mengunggah dokumentasi
* Mencatat penggunaan material

Supervisor tidak dapat:

* Mengubah informasi proyek utama
* Mengelola anggota proyek
* Menghapus data proyek

---

# Prinsip Implementasi

* Pertahankan route terpisah.
* Gunakan satu komponen Detail Proyek bersama.
* Gunakan API Route sebagai lapisan data untuk seluruh role.
* Gunakan conditional rendering hanya untuk aksi dan permission.
* Hindari duplikasi UI antara Owner dan Supervisor.
* Dokumentasi tidak dibuat sebagai tab.
* Dokumentasi ditampilkan sebagai preview pada Overview.
* Riwayat aktivitas terbaru ditampilkan pada Overview.
* Modal digunakan untuk menampilkan seluruh dokumentasi dan seluruh riwayat progress.
* Fokus pada konsistensi UI, maintainability, dan kesiapan PWA.

---

# Struktur Akhir

```txt
Detail Proyek
│
├── Header
│
├── Overview
│   ├── Deskripsi Proyek
│   ├── Aktivitas Terbaru
│   ├── Dokumentasi Preview
│   └── Lokasi Proyek
│
├── Progress
│
├── Material
│
└── Tim
```

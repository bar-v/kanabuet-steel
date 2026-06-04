# DESIGN.md

## Identitas Proyek

**Nama Sistem:** Kanabuet Steel  
**Jenis Sistem:** Sistem Informasi Manajemen Proyek  
**Platform:** Web (Mobile-First Responsive)

---

# 1. Pendekatan Desain

Perancangan antarmuka sistem menggunakan pendekatan **mobile-first responsive**. Pendekatan ini dipilih karena sistem ditujukan untuk mendukung aktivitas supervisor di lapangan yang lebih sering menggunakan perangkat mobile dalam melakukan pencatatan progres, validasi lokasi, dokumentasi pekerjaan, dan pengelolaan material proyek secara langsung dari lokasi kerja.

Desain antarmuka difokuskan pada pengalaman pengguna di perangkat mobile terlebih dahulu, kemudian dikembangkan secara responsif agar tetap optimal ketika diakses melalui perangkat desktop oleh owner untuk kebutuhan monitoring dan evaluasi proyek.

Setiap mockup dirancang dengan struktur navigasi yang konsisten menggunakan **sidebar navigation** pada setiap frame untuk mempermudah perpindahan antar fitur sistem serta menjaga konsistensi pengalaman pengguna.

Perancangan mockup difokuskan pada fitur inti sistem agar mampu merepresentasikan alur utama operasional proyek tanpa membuat rancangan antarmuka yang terlalu kompleks. Pendekatan ini dipilih agar proses perancangan tetap efisien dan tetap sesuai dengan ruang lingkup penelitian pada proposal tugas akhir.

---

# 2. Prinsip Desain

Beberapa prinsip yang digunakan dalam perancangan antarmuka sistem:

- **Sederhana dan efisien**  
  Antarmuka dirancang untuk meminimalkan langkah pengguna dalam melakukan aktivitas utama.

- **Konsistensi**  
  Penggunaan warna, tombol, ikon, sidebar, dan layout dibuat seragam pada seluruh halaman.

- **Keterbacaan tinggi**  
  Pemilihan warna, kontras, dan tipografi difokuskan agar informasi tetap mudah dibaca pada perangkat mobile.

- **Berbasis aktivitas**  
  Setiap tampilan merepresentasikan proses bisnis yang terdapat pada activity diagram sistem.

- **Mobile usability**  
  Komponen antarmuka disusun agar nyaman digunakan dengan sentuhan jari pada layar smartphone.

- **Informasi mudah dipindai**  
  Layout menggunakan struktur card dan section agar pengguna dapat memahami informasi dengan cepat.

---

# 3. Struktur Layout Sistem

Setiap halaman sistem menggunakan struktur layout yang konsisten untuk menjaga pengalaman pengguna.

## Struktur utama layout:

- Sidebar navigation
- Header halaman
- Area konten utama
- Action button utama
- Bottom spacing untuk mobile scrolling

---

## Sidebar Navigation

Sidebar digunakan sebagai navigasi utama sistem dan ditampilkan pada seluruh halaman mockup.

### Menu sidebar:

- Dashboard
- Proyek
- Progress
- Material
- Evaluasi
- Pengaturan
- Logout

Pada perangkat mobile, sidebar dapat ditampilkan dalam bentuk:
- collapsible sidebar
- drawer navigation
- hamburger menu

Sedangkan pada desktop sidebar ditampilkan secara permanen di sisi kiri layar.

---

# 4. Skema Warna (Color Palette)

Desain menggunakan konsep **Industrial Dark + Fire Accent** yang merepresentasikan karakteristik bengkel las dan pekerjaan konstruksi.

---

## 4.1 Warna Utama

| Elemen | Warna | Kode Hex |
|---|---|---|
| Main (Background) | Dark Charcoal | #1F2933 |
| Surface | Dark Slate | #273444 |
| Secondary | Steel Gray | #9CA3AF |
| Border | Soft Gray | #4B5563 |

---

## 4.2 Warna Aksen

| Elemen | Warna | Kode Hex |
|---|---|---|
| Accent (Primary Action) | Burnt Orange | #F97316 |
| Highlight | Soft Yellow | #FACC15 |

---

## 4.3 Warna Status

| Status | Warna |
|---|---|
| Success | Hijau |
| Warning | Kuning |
| Error | Merah |
| Information | Biru |

---

## Penggunaan Warna

- Background utama menggunakan warna gelap (#1F2933)
- Sidebar menggunakan warna sedikit lebih gelap dari area konten
- Tombol utama menggunakan warna oranye (#F97316)
- Highlight (#FACC15) digunakan untuk progres dan notifikasi penting
- Warna status digunakan sesuai kondisi data sistem

---

# 5. Standar Ukuran dan Layout Mockup

Perancangan mockup sistem menggunakan pendekatan mobile-first dengan ukuran frame yang konsisten untuk menjaga keseragaman desain dan mempermudah proses pengembangan antarmuka sistem.

Ukuran frame dipilih berdasarkan ukuran perangkat mobile modern yang umum digunakan sehingga tampilan sistem tetap realistis dan representatif terhadap implementasi sebenarnya.

---

## 5.1 Ukuran Frame Mobile

Ukuran utama mockup mobile yang digunakan adalah:

| Jenis | Ukuran |
|---|---|
| Mobile Primary Frame | 390 × 844 px |

Ukuran tersebut merepresentasikan dimensi smartphone modern dengan orientasi portrait dan digunakan sebagai standar utama seluruh mockup sistem.

### Karakteristik penggunaan:
- Layout mobile-first
- Vertical scrolling interface
- Fokus pada penggunaan satu tangan
- Optimasi keterbacaan pada layar kecil

---

## 5.2 Ukuran Frame Desktop

Sebagai pendukung responsive layout, sistem juga mempertimbangkan tampilan desktop untuk kebutuhan owner dalam melakukan monitoring proyek.

| Jenis | Ukuran |
|---|---|
| Desktop Responsive Frame | 1440 × 1024 px |

Frame desktop hanya digunakan pada beberapa halaman tertentu seperti dashboard monitoring dan manajemen proyek.

---

## 5.3 Struktur Layout Mobile

Struktur layout mobile dirancang secara konsisten pada seluruh mockup.

### Komponen utama layout:
- Top navigation bar
- Sidebar / drawer navigation
- Content section
- Action button area
- Vertical scrolling area

### Karakteristik layout:
- Konten menggunakan vertical scrolling
- Sidebar dapat dibuka dan ditutup pada perangkat mobile
- Layout berbasis card untuk meningkatkan keterbacaan
- Komponen dibuat responsif terhadap ukuran layar

---

## 5.4 Sidebar Navigation

Sidebar digunakan sebagai navigasi utama sistem dan ditampilkan secara konsisten pada seluruh halaman mockup.

### Menu utama sidebar:
- Dashboard
- Proyek
- Progress
- Material
- Evaluasi
- Pengaturan
- Logout

### Implementasi mobile:
Pada perangkat mobile sidebar menggunakan:
- collapsible sidebar
- drawer navigation
- hamburger menu

### Implementasi desktop:
Pada perangkat desktop sidebar ditampilkan secara permanen di sisi kiri layar.

---

## 5.5 Standar Spacing dan Komponen

Untuk menjaga konsistensi desain antarmuka, digunakan standar spacing dan komponen berikut:

| Elemen | Ukuran |
|---|---|
| Padding utama | 16–20 px |
| Gap antar komponen | 12–16 px |
| Border radius card | 12–16 px |
| Tinggi top navbar | 56–64 px |
| Lebar sidebar mobile | 240–260 px |

---

## 5.6 Pendekatan Responsiveness

Desain sistem dikembangkan menggunakan pendekatan responsive layout sehingga tampilan dapat menyesuaikan ukuran layar perangkat pengguna.

### Karakteristik responsiveness:
- Mobile sebagai prioritas utama
- Grid dan card bersifat fleksibel
- Sidebar menyesuaikan ukuran layar
- Konten menggunakan vertical scrolling
- Komponen UI beradaptasi terhadap orientasi layar

---
## 5.7 Distribusi Mockup Berdasarkan Perangkat

Perancangan mockup disesuaikan dengan konteks penggunaan masing-masing pengguna sistem.

Halaman yang berkaitan dengan aktivitas lapangan dan operasional harian supervisor difokuskan menggunakan tampilan mobile karena lebih sering diakses melalui smartphone secara langsung di lokasi proyek.

Sedangkan halaman yang berkaitan dengan monitoring dan pengelolaan data dalam jumlah besar dirancang menggunakan tampilan desktop responsive agar informasi dapat ditampilkan secara lebih optimal.

### Mockup Berbasis Mobile
- Login Page
- Dashboard Supervisor
- Detail Project
- Update Progress
- Validasi Lokasi

### Mockup Berbasis Desktop / Responsive
- Dashboard Owner
- Manajemen Proyek
- Material Management

Pendekatan tersebut digunakan untuk menjaga kenyamanan penggunaan sistem sesuai kebutuhan aktivitas masing-masing pengguna.

## 5.8 Catatan Perancangan Mockup

Beberapa pertimbangan yang digunakan dalam proses perancangan mockup:

- Mengutamakan keterbacaan informasi pada perangkat mobile
- Menghindari tampilan yang terlalu padat
- Menjaga konsistensi warna, spacing, dan navigasi
- Memastikan tombol dan komponen mudah disentuh pada layar smartphone
- Menggunakan struktur card untuk mempermudah pemindaian informasi
- Mengutamakan kemudahan monitoring proyek di lapangan

Jika konten tidak muat dalam satu layar mobile, maka tampilan dirancang menggunakan vertical scrolling atau pemisahan section ke halaman lainnya.

---

# 6. Struktur Mockup

Mockup dirancang berdasarkan fitur utama sistem serta proses bisnis yang telah didefinisikan dalam activity diagram.

Seluruh mockup menggunakan pendekatan:
- mobile-first
- responsive layout
- sidebar navigation
- vertical scrolling layout

Setiap frame mockup dirancang menggunakan sidebar navigation yang konsisten untuk mempermudah perpindahan antar fitur sistem baik pada perangkat mobile maupun desktop.

Jumlah mockup difokuskan pada fitur inti sistem agar mampu merepresentasikan alur utama operasional proyek secara efisien dan tidak berlebihan pada tahap proposal.

---

## 6.1 Mockup Login Page

**Role:** Owner & Supervisor

### Tujuan
Menampilkan halaman autentikasi pengguna sebelum masuk ke sistem.

### Komponen Utama
- Logo sistem
- Input email
- Input password
- Tombol login

### Fitur yang Direpresentasikan
- Authentication
- Role-based access

### Catatan Desain
- Layout sederhana dan fokus pada autentikasi
- Tampilan dioptimalkan untuk perangkat mobile
- Tidak menggunakan sidebar

---

## 6.2 Mockup Dashboard Owner

**Role:** Owner

### Tujuan
Menampilkan ringkasan keseluruhan kondisi proyek dan operasional bengkel.

### Komponen Utama
- Sidebar navigation
- Statistik proyek
- Ringkasan progres proyek
- Aktivitas terbaru
- Warning stok material
- Quick action button

### Statistik Ringkas
- Total proyek
- Proyek aktif
- Proyek selesai
- Warning material

### Fitur yang Direpresentasikan
- Monitoring proyek
- Dashboard analytics
- Monitoring material
- Ringkasan aktivitas sistem

### Fokus Desain
- Informasi ringkas dan mudah dipahami
- Layout card responsif
- Monitoring cepat pada perangkat mobile

---

## 6.3 Mockup Dashboard Supervisor

**Role:** Supervisor

### Tujuan
Membantu supervisor melakukan monitoring pekerjaan lapangan secara cepat melalui perangkat mobile.

### Komponen Utama
- Sidebar navigation
- Daftar proyek aktif
- Shortcut update progres
- Upload dokumentasi
- Jadwal pekerjaan

### Fitur yang Direpresentasikan
- Monitoring pekerjaan lapangan
- Quick action progres proyek
- Mobile workflow

### Fokus Desain
- Navigasi sederhana
- Interaksi cepat
- Optimasi penggunaan satu tangan pada perangkat mobile

---

## 6.4 Mockup Manajemen Proyek

**Role:** Owner

### Tujuan
Mengelola data proyek yang sedang berjalan maupun yang telah selesai.

### Komponen Utama
- Sidebar navigation
- Daftar proyek
- Status proyek
- Progress bar
- Tombol tambah proyek
- Tombol edit proyek
- Tombol detail proyek

### Fitur yang Direpresentasikan
- Create project
- Read project
- Update project
- Monitoring status proyek
- Assign supervisor

### Fokus Desain
- Daftar proyek mudah dipindai
- Status proyek mudah dikenali
- Navigasi menuju detail proyek cepat diakses

---

## 6.5 Mockup Detail Project

**Role:** Owner & Supervisor

### Tujuan
Menampilkan informasi detail suatu proyek secara lengkap dan terstruktur.

### Komponen Utama
- Sidebar navigation
- Informasi proyek
- Timeline progres
- Dokumentasi foto
- Data supervisor
- Status proyek

### Struktur Tab
- Overview
- Progress
- Material
- Tim

### Fitur yang Direpresentasikan
- Detail monitoring proyek
- Timeline progres
- Dokumentasi proyek
- Informasi material proyek

### Fokus Desain
- Menggunakan vertical scrolling
- Informasi dipisahkan per section atau tab
- Mobile readability

---

## 6.6 Mockup Update Progress

**Role:** Supervisor

### Tujuan
Memungkinkan supervisor memperbarui progres pekerjaan langsung dari lokasi proyek.

### Komponen Utama
- Sidebar navigation
- Input persentase progres
- Catatan pekerjaan
- Upload foto
- Preview gambar
- Tombol simpan progres

### Fitur yang Direpresentasikan
- Create progress update
- Upload dokumentasi pekerjaan
- Dokumentasi progres proyek

### Fokus Desain
- Form sederhana dan cepat digunakan
- Dukungan upload foto melalui perangkat mobile
- Optimasi penggunaan di lapangan

---

## 6.7 Mockup Validasi Lokasi

**Role:** Supervisor

### Tujuan
Membantu memastikan bahwa pembaruan progres dilakukan langsung dari lokasi proyek.

### Komponen Utama
- Sidebar navigation
- Map view
- Current location pin
- Tombol ambil lokasi
- Latitude dan longitude
- Input alamat manual
- Tombol konfirmasi lokasi

### Fitur yang Direpresentasikan
- GPS validation
- Location verification
- Geolocation integration

### Fokus Desain
- Mobile GPS interaction
- Tampilan map responsif
- Kemudahan validasi lokasi di lapangan

---

## 6.8 Mockup Material Management

**Role:** Owner

### Tujuan
Mengelola data material dan memantau ketersediaan stok material proyek.

### Komponen Utama
- Sidebar navigation
- Daftar material
- Informasi stok
- Warning minimum stok
- Tombol tambah material
- Tombol edit material
- Tombol hapus material

### Fitur yang Direpresentasikan
- Create material
- Read material
- Update material
- Delete material
- Monitoring stok material

### Fokus Desain
- Informasi stok mudah dipantau
- Status warning mudah dikenali
- Layout card/table responsif

---

# 7. Responsiveness

Desain dikembangkan menggunakan pendekatan responsive layout.

### Karakteristik responsiveness:
- Mobile menjadi prioritas utama
- Layout menyesuaikan ukuran layar
- Sidebar berubah sesuai perangkat
- Grid dan card bersifat fleksibel
- Konten menggunakan vertical scrolling
- Komponen menyesuaikan orientasi layar

Pada perangkat mobile, sidebar dapat ditampilkan dalam bentuk:
- drawer navigation
- collapsible sidebar
- hamburger menu

Sedangkan pada desktop sidebar akan tampil secara permanen pada sisi kiri layar.

---

# 8. Catatan Implementasi

Beberapa kemampuan sistem yang dipertimbangkan dalam desain:

- Kompresi gambar sebelum upload
- Validasi input pengguna
- Integrasi GPS dan geolocation
- Pengelolaan file dokumentasi proyek
- Upload dokumentasi melalui kamera mobile
- Responsive sidebar navigation
- Progressive Web App (PWA)

Fitur-fitur tersebut tidak selalu ditampilkan secara eksplisit dalam mockup, namun tetap menjadi bagian dari perilaku sistem pada implementasi akhir.

---

# 9. Kesimpulan

Perancangan desain sistem difokuskan pada kemudahan penggunaan di lapangan melalui pendekatan mobile-first responsive. Struktur antarmuka dibuat konsisten menggunakan sidebar navigation pada setiap halaman untuk mempermudah navigasi pengguna.

Desain sistem dirancang agar mampu mendukung aktivitas monitoring proyek, dokumentasi pekerjaan, validasi lokasi, pengelolaan material, dan evaluasi operasional secara efisien baik melalui perangkat mobile maupun desktop.
### Rule: Validasi Lokasi Sebelum Pembaruan Progres

- Supervisor hanya dapat mengakses fitur pembaruan progres setelah lokasi proyek berhasil divalidasi.
- Jika lokasi proyek belum divalidasi, sistem menampilkan card "Validasi Lokasi" saja dan card "Aksi Cepat" lainnya menjadi disabled dan menampilkan pesan:
  "Lokasi proyek harus divalidasi terlebih dahulu sebelum progres dapat diperbarui."
- Supervisor tetap dapat melihat detail proyek, informasi klien, alamat proyek, dan instruksi pekerjaan.
- Supervisor dapat menjalankan aksi "Validasi Lokasi" sebagai langkah awal sebelum mencatat progres.
- Setelah validasi lokasi berhasil, sistem mengubah status lokasi menjadi `aktif`.
- Setelah lokasi tervalidasi, card "Aksi Cepat" lainnya menjadi aktif kembali.
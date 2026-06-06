### Requirement: Active Project Selection with Session Memory

- Dashboard supervisor tidak menetapkan proyek aktif secara otomatis saat pertama kali diakses.
- Supervisor memilih proyek dari halaman "Semua Proyek".
- Setelah proyek dipilih:
  - Sistem menyimpan `active_project_id` ke `localStorage`.
  - Dashboard diperbarui berdasarkan proyek aktif tersebut.
  - Seluruh fitur aksi cepat mengacu pada `active_project_id`.
- Saat supervisor membuka kembali dashboard, sistem membaca `active_project_id` dari `localStorage`.
- Jika `active_project_id` masih valid, dashboard langsung menampilkan data proyek tersebut.
- Jika proyek sudah selesai, dihapus, atau tidak dapat diakses, sistem menghapus `active_project_id` dari `localStorage` dan meminta supervisor memilih proyek kembali.
- Supervisor dapat mengganti proyek aktif kapan saja melalui halaman "Semua Proyek".
- Perubahan proyek aktif akan memperbarui nilai `active_project_id` di `localStorage`.
# 📘 Entities & Relationships (Revised - Stable Design)

## 1. users

| Attribute  | Type      | Note             |
| ---------- | --------- | ---------------- |
| user_id         | uuid      | PK               |
| auth_id    | text      | Supabase Auth ID |
| name       | text      |                  |
| role       | text      | admin / worker   |
| email      | text      |                  |
| created_at | timestamp |                  |

---

## 2. projects

| Attribute         | Type      | Note                              |
| ----------------- | --------- | --------------------------------- |
| project_id                | uuid      | PK                                |
| project_name      | text      |                                   |
| client_name       | text      |                                   |
| client_phone      | text      |                                   |
| description       | text      |                                   |
| status            | text      | pending / on_progress / completed |
| start_date        | date      |                                   |
| estimated_finish  | date      |                                   |
| supervisor_id     | uuid      | FK → users.id                     |
| project_location  | text      |                                   |
| raw_address       | text      |                                   |
| latitude          | float     | Manual coordinate                 |
| longitude         | float     | Manual coordinate                 |
| geocode_latitude  | float     | API coordinate                    |
| geocode_longitude | float     | API coordinate                    |
| created_at        | timestamp |                                   |
| updated_at        | timestamp |                                   |

---

## 3. project_members

| Attribute       | Type      | Note             |
| --------------- | --------- | ---------------- |
| project_member_id              | uuid      | PK               |
| project_id      | uuid      | FK → projects.id |
| user_id         | uuid      | FK → users.id    |
| role_in_project | text      | worker           |
| assigned_at     | timestamp |                  |

> ⚠️ Supervisor **tidak dimasukkan** ke tabel ini (sudah direpresentasikan di `projects.supervisor_id`)

---

## 4. project_progress

| Attribute   | Type      | Note             |
| ----------- | --------- | ---------------- |
| project_progress_id          | uuid      | PK               |
| project_id  | uuid      | FK → projects.id |
| update_date | date      |                  |
| percentage  | int       | 0–100            |
| notes       | text      |                  |
| photo       | text      | Photo URL        |
| created_at  | timestamp |                  |

---

## 5. suppliers

| Attribute     | Type      | Note |
| ------------- | --------- | ---- |
| supplier_id   | uuid      | PK   |
| supplier_name | text      |      |
| address       | text      |      |
| created_at    | timestamp |      |

---

## 6. materials

| Attribute     | Type      | Note                       |
| ------------- | --------- | -------------------------- |
| material_id   | uuid      | PK                         |
| supplier_id   | uuid      | FK → suppliers.supplier_id |
| material_name | text      |                            |
| category      | text      |                            |
| unit          | text      | kg / bar / sheet / etc     |
| current_stock | int       | Cached stock value         |
| minimum_stock | int       | Low stock alert threshold  |
| created_at    | timestamp |                            |
| updated_at    | timestamp |                            |

---

## 7. material_usage ✅ (NEW - Explicit Project Usage)

| Attribute   | Type | Note                       |
| ----------- | ---- | -------------------------- |
| usage_id    | uuid | PK                         |
| project_id  | uuid | FK → projects.id           |
| material_id | uuid | FK → materials.material_id |
| quantity    | int  |                            |
| usage_date  | date |                            |
| notes       | text |                            |
| created_by  | uuid | FK → users.id              |

---

## 8. material_transactions (REVISED)

| Attribute        | Type      | Note                                    |
| ---------------- | --------- | --------------------------------------- |
| transaction_id   | uuid      | PK                                      |
| material_id      | uuid      | FK → materials.material_id              |
| transaction_type | text      | IN / OUT / ADJUST                       |
| quantity         | int       |                                         |
| transaction_date | date      |                                         |
| project_id       | uuid      | FK → projects.id (optional)             |
| receipt_id       | uuid      | FK → receipts.receipt_id (nullable)     |
| usage_id         | uuid      | FK → material_usage.usage_id (nullable) |
| notes            | text      |                                         |
| created_at       | timestamp |                                         |

---

## 9. receipts

| Attribute     | Type      | Note                       |
| ------------- | --------- | -------------------------- |
| receipt_id    | uuid      | PK                         |
| project_id    | uuid      | FK → projects.id           |
| supplier_id   | uuid      | FK → suppliers.supplier_id |
| purchase_date | date      |                            |
| total_cost    | float     |                            |
| receipt_photo | text      | receipt photo URL          |
| notes         | text      |                            |
| created_at    | timestamp |                            |

---

## 10. item_receipts

| Attribute   | Type  | Note                       |
| ----------- | ----- | -------------------------- |
| item_id     | uuid  | PK                         |
| receipt_id  | uuid  | FK → receipts.receipt_id   |
| material_id | uuid  | FK → materials.material_id |
| quantity    | int   |                            |
| unit_price  | float |                            |

---

# 🔗 Relationships

| #  | Entity A  | Relationship        | Entity B              | Cardinality |
| -- | --------- | ------------------- | --------------------- | ----------- |
| 1  | users     | Ditugaskan ke       | project_members       | 1 : N       |
| 2  | projects  | Memiliki Anggota    | project_members       | 1 : N       |
| 3  | projects  | Memiliki            | project_progress      | 1 : N       |
| 4  | suppliers | Menyediakan         | materials             | 1 : N       |
| 5  | projects  | Menggunakan         | material_usage        | 1 : N       |
| 6  | materials | Digunakan dalam     | material_usage        | 1 : N       |
| 7  | materials | Dicatat dalam       | material_transactions | 1 : N       |
| 8  | projects  | Melakukan Pembelian | receipts              | 1 : N       |
| 9  | suppliers | Menyuplai           | receipts              | 1 : N       |
| 10 | receipts  | Memiliki            | item_receipts         | 1 : N       |
| 11 | materials | Tercatat sebagai    | item_receipts         | 1 : N       |

---

# 🧭 Design Notes

### Location Coordinates

* `geocode_latitude` & `geocode_longitude` → hasil API (otomatis)
* `latitude` & `longitude` → hasil penyesuaian manual (user drag map)

---

# ⚙️ System Workflow (CRITICAL)

## 1. Pembelian Material

1. Input `receipts`
2. Input `item_receipts`
3. **SYSTEM otomatis:**

   * insert `material_transactions (IN)`
   * update `materials.current_stock`

---

## 2. Penggunaan Material

1. Input `material_usage`
2. **SYSTEM otomatis:**

   * insert `material_transactions (OUT)`
   * update `materials.current_stock`

---

# ⚠️ DEVELOPMENT NOTES (WAJIB DIPATUHI)

## 🔒 1. Single Source of Truth

* **Stock hanya boleh berubah melalui `material_transactions`**
* Jangan pernah update `current_stock` langsung dari fitur lain

---

## 🚫 2. Forbidden Actions

* ❌ User input `material_transactions` secara manual
* ❌ Update stok tanpa transaction
* ❌ Duplikasi logika antara receipt dan transaction

---

## 🔁 3. Data Flow Rule

* `item_receipts` → menghasilkan transaction **IN**
* `material_usage` → menghasilkan transaction **OUT**

---

## 🧠 4. Separation of Concerns

| Concept           | Table                 |
| ----------------- | --------------------- |
| Dokumen pembelian | receipts              |
| Detail pembelian  | item_receipts         |
| Aktivitas proyek  | material_usage        |
| Perubahan stok    | material_transactions |

---

## ⚡ 5. Future-Safe Notes

Untuk pengembangan selanjutnya:

* Tambahkan **approval system** di `material_usage`
* Tambahkan **audit log** untuk transaksi
* Hindari mengubah struktur inti tanpa mempertimbangkan alur:

  ```
  event → transaction → stock
  ```

---

# 🎯 Purpose

Dokumen ini digunakan untuk:

* Menjadi acuan desain database relasional
* Menjamin konsistensi alur data sistem
* Menghindari bug akibat duplikasi logika
* Mendukung pengembangan fitur lanjutan tanpa merusak sistem

---

# 🧠 Final Reminder

Kalau kamu mulai “mempermudah” dengan cara:

> langsung update stok tanpa transaction

itu bukan simplifikasi…
itu awal dari sistem yang pelan-pelan rusak tanpa kamu sadar.

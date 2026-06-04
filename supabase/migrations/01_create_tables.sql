-- ============================================================
-- Kanabuet Steel — Database Schema
-- ============================================================

-- ── Enum Types ──────────────────────────────────────────────

CREATE TYPE system_role AS ENUM (
    'owner',
    'supervisor'
);

CREATE TYPE project_status AS ENUM (
    'menunggu_validasi',
    'aktif',
    'tertunda',
    'selesai'
);

-- ── Tables ───────────────────────────────────────────────────

-- Tabel pengguna sistem (owner & supervisor)
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    fullname VARCHAR(100) NOT NULL,
    
    email VARCHAR(100) UNIQUE NOT NULL,
    
    password_hash TEXT NOT NULL,
    
    system_role system_role NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel proyek
CREATE TABLE projects (
    project_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    project_name    VARCHAR(150) NOT NULL,

    client_name     VARCHAR(100) NOT NULL,

    client_phone    VARCHAR(20),

    -- Alamat teks proyek (diisi manual saat pembuatan proyek)
    project_address TEXT NOT NULL,

    -- Koordinat GPS perangkat supervisor (diambil saat validasi lokasi)
    latitude        DECIMAL(10,8),

    longitude       DECIMAL(11,8),

    description     TEXT,

    status          project_status NOT NULL
                        DEFAULT 'menunggu_validasi',

    start_date      DATE,

    estimated_finish DATE,

    created_at      TIMESTAMP DEFAULT NOW()
);

-- Tabel anggota proyek
-- Tidak terhubung ke tabel users; data pekerja disimpan langsung di sini.
-- Dropdown pemilihan pekerja mengambil data unik dari histori tabel ini.
CREATE TABLE project_members (
    member_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    project_id   BIGINT NOT NULL
                     REFERENCES projects(project_id)
                     ON DELETE CASCADE,

    member_name  VARCHAR(100) NOT NULL,

    phone_number VARCHAR(20),

    -- Jabatan dalam proyek, mis. 'Tukang Las', 'Supervisor', 'Helper'
    project_role VARCHAR(50) NOT NULL
);

-- Tabel update progres proyek
CREATE TABLE project_progress (
    progress_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    project_id  BIGINT NOT NULL
                    REFERENCES projects(project_id)
                    ON DELETE CASCADE,

    -- Pengguna yang mencatat update (supervisor)
    recorded_by BIGINT
                    REFERENCES users(user_id)
                    ON DELETE SET NULL,

    percentage  INT NOT NULL
                    CHECK (percentage BETWEEN 0 AND 100),

    notes       TEXT,

    photo_url   TEXT,

    update_date DATE DEFAULT CURRENT_DATE,

    created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabel supplier material
CREATE TABLE suppliers (
    supplier_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    supplier_name VARCHAR(100) NOT NULL,

    phone         VARCHAR(20),

    address       TEXT
);

-- Tabel master material
CREATE TABLE materials (
    material_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    supplier_id   BIGINT
                      REFERENCES suppliers(supplier_id)
                      ON DELETE SET NULL,

    material_name VARCHAR(100) NOT NULL,

    category      VARCHAR(50),

    unit          VARCHAR(30) NOT NULL,

    current_stock INT NOT NULL
                      DEFAULT 0
                      CHECK (current_stock >= 0),

    minimum_stock INT NOT NULL
                      DEFAULT 0
                      CHECK (minimum_stock >= 0),

    created_at    TIMESTAMP DEFAULT NOW()
);

-- Tabel pencatatan penggunaan material per proyek
CREATE TABLE material_usage (
    usage_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    project_id  BIGINT NOT NULL
                    REFERENCES projects(project_id)
                    ON DELETE CASCADE,

    material_id BIGINT NOT NULL
                    REFERENCES materials(material_id)
                    ON DELETE CASCADE,

    quantity    INT NOT NULL
                    CHECK (quantity > 0),

    usage_date  DATE DEFAULT CURRENT_DATE,

    notes       TEXT,

    created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabel restock material
CREATE TABLE restocks (
    restock_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    material_id BIGINT NOT NULL
                    REFERENCES materials(material_id)
                    ON DELETE CASCADE,

    supplier_id BIGINT
                    REFERENCES suppliers(supplier_id)
                    ON DELETE SET NULL,

    performed_by BIGINT
                    REFERENCES users(user_id)
                    ON DELETE SET NULL,

    quantity    INT NOT NULL
                    CHECK (quantity > 0),

    date        DATE DEFAULT CURRENT_DATE,

    created_at  TIMESTAMP DEFAULT NOW()
);


-- ── Functions ─────────────────────────────────────────────────

-- Function: Validasi stok sebelum insert penggunaan material
CREATE OR REPLACE FUNCTION check_material_stock()
RETURNS TRIGGER AS $$
DECLARE
    available_stock INT;
BEGIN
    SELECT current_stock
    INTO available_stock
    FROM materials
    WHERE material_id = NEW.material_id;

    IF NEW.quantity > available_stock THEN
        RAISE EXCEPTION
        'Stok material tidak mencukupi. Stok tersedia: %, diminta: %',
        available_stock, NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Kurangi stok setelah insert penggunaan material
CREATE OR REPLACE FUNCTION reduce_material_stock()
RETURNS TRIGGER AS $$
BEGIN

    UPDATE materials
    SET current_stock = current_stock - NEW.quantity
    WHERE material_id = NEW.material_id;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

-- Function: Tambah stok setelah restock
CREATE OR REPLACE FUNCTION increase_material_stock()
RETURNS TRIGGER AS $$
BEGIN

    UPDATE materials
    SET current_stock = current_stock + NEW.quantity
    WHERE material_id = NEW.material_id;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


-- ── Triggers ──────────────────────────────────────────────────

-- Trigger: Validasi stok sebelum insert penggunaan
CREATE TRIGGER trg_check_material_stock
BEFORE INSERT ON material_usage
FOR EACH ROW
EXECUTE FUNCTION check_material_stock();

-- Trigger: Kurangi stok setelah insert penggunaan
CREATE TRIGGER trg_reduce_material_stock
AFTER INSERT ON material_usage
FOR EACH ROW
EXECUTE FUNCTION reduce_material_stock();

-- Trigger: Tambah stok setelah restock
CREATE TRIGGER trg_increase_material_stock
AFTER INSERT ON restocks
FOR EACH ROW
EXECUTE FUNCTION increase_material_stock();



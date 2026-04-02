    -- ==============================
    -- 01_create_tables.sql
    -- Deskripsi: Membuat tabel utama sesuai struktur PRD Kanabuet Steel
    -- ==============================

    -- 1. Tabel Users (Asumsi relasi ke sistem Auth Supabase, atau berdiri sendiri untuk profil)
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_id UUID, -- Relasi opsional jika menggunakan auth.users dari Supabase
        name TEXT NOT NULL,
        role TEXT CHECK (role IN ('owner', 'supervisor')) DEFAULT 'supervisor',
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 2. Tabel Projects
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        description TEXT,
        status TEXT CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planning',
        start_date DATE,
        end_date DATE,
        address TEXT,
        raw_address TEXT,
        latitude FLOAT,
        longitude FLOAT,
        geocode_latitude FLOAT,
        geocode_longitude FLOAT,
        supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 3. Tabel Project Progress (Monitoring Progres Proyek & Dokumentasi Foto)
    CREATE TABLE IF NOT EXISTS project_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        update_date DATE DEFAULT CURRENT_DATE,
        percentage INT CHECK (percentage >= 0 AND percentage <= 100),
        notes TEXT,
        photo_path TEXT, -- URL dari Supabase Storage
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 4. Tabel Materials (Inventaris Utama Bengkel)
    CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        initial_stock INT DEFAULT 0,
        remaining_stock INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 5. Tabel Material Usage (Penggunaan Material di Lapangan)
    CREATE TABLE IF NOT EXISTS material_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
        amount_used INT NOT NULL CHECK (amount_used > 0),
        usage_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 6. Tabel Receipts (Arsip Bon Digital)
    CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        store_name TEXT NOT NULL,
        purchase_date DATE DEFAULT CURRENT_DATE,
        total_cost NUMERIC(12,2) NOT NULL,
        photo_path TEXT NOT NULL, -- URL dari Supabase Storage
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 7. Tabel Project Evaluations (Evaluasi Operasional Proyek)
    CREATE TABLE IF NOT EXISTS project_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
        issues TEXT,
        solutions TEXT,
        notes TEXT,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
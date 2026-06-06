-- ============================================================
-- Migration: Tambah supervisor_id ke tabel projects
-- ============================================================
-- Supervisor hanya bisa melihat proyek yang ditugaskan kepadanya.

ALTER TABLE projects
ADD COLUMN supervisor_id BIGINT
    REFERENCES users(user_id)
    ON DELETE SET NULL;

-- Index untuk query filter berdasarkan supervisor
CREATE INDEX idx_projects_supervisor_id ON projects(supervisor_id);

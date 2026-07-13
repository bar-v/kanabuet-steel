// lib/types/database.ts
// Type definitions untuk semua tabel Supabase Kanabuet Steel

export type SystemRole = 'owner' | 'supervisor';

export type ProjectStatus =
  | 'menunggu_validasi'
  | 'aktif'
  | 'tertunda'
  | 'selesai';

//  Tabel: users 
export interface User {
  user_id: number;
  fullname: string;
  email: string;
  password_hash: string;
  system_role: SystemRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

//  Tabel: projects 
export interface Project {
  project_id: number;
  project_name: string;
  client_name: string;
  client_phone: string | null;
  project_address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  estimated_finish: string | null;
  supervisor_id: number | null;
  created_at: string;
}

// Project dengan progress terbaru (join)
export interface ProjectWithProgress extends Project {
  latest_progress?: number | null; // persentase terbaru dari project_progress
  members_count?: number;
}

// Tabel: project_members
export interface ProjectMember {
  member_id: number;
  project_id: number;
  member_name: string;
  phone_number: string | null;
  project_role: string;
}

// Data unik pekerja dari histori project_members (untuk dropdown)
export interface WorkerHistoryItem {
  member_name: string;
  phone_number: string | null;
  project_role: string;
}

// Tabel: project_progress
export interface ProjectProgress {
  progress_id: number;
  project_id: number;
  recorded_by: number | null;
  percentage: number;
  notes: string | null;
  photo_url: string | null;
  update_date: string;
  created_at: string;
}

export interface ProjectProgressWithUser extends ProjectProgress {
  users: Pick<User, 'fullname'> | null;
}

//  Tabel: suppliers 
export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone: string | null;
  address: string | null;
}

//  Tabel: materials 
export interface Material {
  material_id: number;
  supplier_id: number | null;
  material_name: string;
  specification: string | null;
  category: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  created_at: string;
}

export interface MaterialWithSupplier extends Material {
  suppliers: Pick<Supplier, 'supplier_name'> | null;
}

// Material yang stoknya di bawah minimum (low stock alert)
export interface LowStockMaterial extends Material {
  stock_ratio: number; // current_stock / minimum_stock
}

//  Tabel: material_usage 
export interface MaterialUsage {
  usage_id: number;
  project_id: number;
  material_id: number;
  quantity: number;
  usage_date: string;
  notes: string | null;
  unit_price_snapshot: number;
  total_cost: number;
  created_at: string;
}

export interface MaterialUsageWithDetails extends MaterialUsage {
  materials: Pick<Material, 'material_name' | 'unit' | 'specification'> | null;
  projects: Pick<Project, 'project_name'> | null;
}

//  Tabel: restocks 
export interface Restock {
  restock_id: number;
  material_id: number;
  supplier_id: number | null;
  quantity: number;
  date: string;
  purchase_unit_price: number;
  total_purchase_price: number;
  created_at: string;
}

export interface RestockWithDetails extends Restock {
  materials: Pick<Material, 'material_name' | 'unit' | 'specification'> | null;
  suppliers: Pick<Supplier, 'supplier_name'> | null;
}

//  Form input types 

export interface CreateProjectInput {
  project_name: string;
  client_name: string;
  client_phone?: string;
  project_address: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  start_date?: string;
  estimated_finish?: string;
  status?: ProjectStatus;
  supervisor_id?: number | null;
}

export interface CreateProjectMemberInput {
  project_id: number;
  member_name: string;
  phone_number?: string;
  project_role: string;
}

export interface CreateProgressInput {
  project_id: number;
  percentage: number;
  notes?: string;
  photo_url?: string;
  update_date?: string;
}

export interface CreateSupplierInput {
  supplier_name: string;
  phone?: string;
  address?: string;
}

export interface CreateMaterialInput {
  supplier_id?: number | null;
  material_name: string;
  specification?: string;
  category?: string;
  unit: string;
  current_stock?: number;
  minimum_stock?: number;
  unit_price?: number;
}

export interface CreateRestockInput {
  material_id: number;
  supplier_id?: number | null;
  performed_by?: number | null;
  quantity: number;
  date?: string;
  purchase_unit_price?: number;
  total_purchase_price?: number;
}

export interface CreateUserInput {
  fullname: string;
  email: string;
  password: string; // plaintext, akan di-hash sebelum insert
  system_role: SystemRole;
}

//  Dashboard Stats 

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  pending_projects: number;
  low_stock_count: number;
}

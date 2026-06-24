import {
  LayoutGrid,
  FolderOpen,
  TrendingUp,
  Package,
  ShoppingCart,
  MapPin,
  ClipboardList,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  Icon: React.ElementType;
  href: string;
  matchPatterns?: string[]; // Jika ada sub-rute yang perlu mengaktifkan menu ini
};

export const OWNER_NAV: NavItem[] = [
  { label: "Dashboard", Icon: LayoutGrid, href: "/dashboard" },
  { label: "Proyek", Icon: FolderOpen, href: "/dashboard/projects", matchPatterns: ["/dashboard/projects"] },
  { label: "Material", Icon: Package, href: "/dashboard/materials", matchPatterns: ["/dashboard/materials"] },
  { label: "Supplier", Icon: ShoppingCart, href: "/dashboard/suppliers", matchPatterns: ["/dashboard/suppliers"] },

  { label: "Pengawas", Icon: Users, href: "/dashboard/users", matchPatterns: ["/dashboard/users"] },
];

export const SUPERVISOR_NAV: NavItem[] = [
  { label: "Dashboard", Icon: LayoutGrid, href: "/dashboard/supervisor" },
  { label: "Proyek", Icon: FolderOpen, href: "/dashboard/supervisor/projects", matchPatterns: ["/dashboard/supervisor/projects"] },
  { label: "Update Progres", Icon: TrendingUp, href: "/dashboard/supervisor/progress", matchPatterns: ["/dashboard/supervisor/progress"] },
  { label: "Material Keluar", Icon: ClipboardList, href: "/dashboard/supervisor/materials", matchPatterns: ["/dashboard/supervisor/materials"] },
  { label: "Validasi Lokasi", Icon: MapPin, href: "/dashboard/supervisor/location", matchPatterns: ["/dashboard/supervisor/location"] },
];

export function isNavActive(pathname: string, href: string, matchPatterns?: string[]) {
  if (pathname === href) return true;
  if (matchPatterns) {
    return matchPatterns.some(pattern => pathname.startsWith(pattern) && pathname !== href);
  }
  return false;
}

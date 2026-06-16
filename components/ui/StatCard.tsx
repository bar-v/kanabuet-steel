import { C } from "@/lib/utils/theme";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string | React.ReactNode;
  color: string;
  iconBg: string;
  border?: string;
  Icon: LucideIcon;
  isLoading?: boolean;
  size?: "sm" | "md"; // sm for projects/materials, md for dashboard
}

export default function StatCard({
  label,
  value,
  color,
  iconBg,
  border,
  Icon,
  isLoading = false,
  size = "sm",
}: StatCardProps) {
  const isMd = size === "md";
  const iconSizeClass = isMd ? "w-10 h-10" : "w-9 h-9";
  const iconPixelSize = isMd ? 20 : 18;
  const valueClass = isMd ? "text-3xl" : "text-2xl";
  const labelClass = isMd ? "text-xs mt-0.5 font-semibold" : "text-[11px] font-bold uppercase tracking-wider";
  const gapClass = isMd ? "gap-3" : "gap-2";

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col shadow-sm ${gapClass} ${border ? border : ""} hover:shadow-md transition-shadow`}
      style={{ background: C.card, borderColor: border ? undefined : C.border }}
    >
      <div className={`${iconSizeClass} rounded-lg flex items-center justify-center ${iconBg} ${color}`}>
        <Icon size={iconPixelSize} />
      </div>
      <div>
        <p className={`${valueClass} font-black ${color}`}>
          {isLoading ? (
             <span className={`inline-block bg-slate-100 rounded animate-pulse ${isMd ? 'w-10 h-8' : 'w-8 h-6'}`} />
          ) : value}
        </p>
        <p className={labelClass} style={{ color: isMd ? C.subtext : C.muted }}>
          {label}
        </p>
      </div>
    </div>
  );
}

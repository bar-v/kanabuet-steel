"use client";

import Image from "next/image";
import { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X, ArrowLeft } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

import { C } from "@/lib/utils/theme";

export default function SupervisorProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return (
    <DashboardShell role="supervisor" title="Detail Proyek" backUrl="/dashboard/supervisor/projects">
      <ProjectDetailClient projectId={projectId} role="supervisor" />
    </DashboardShell>
  );
}

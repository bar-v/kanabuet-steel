"use client";

import { use } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

interface Props { params: Promise<{ id: string }>; }

export default function ProjectDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  
  return (
    <DashboardShell title="Detail Proyek" backUrl="/dashboard/projects">
      <ProjectDetailClient projectId={resolvedParams.id} role="owner" />
    </DashboardShell>
  );
}

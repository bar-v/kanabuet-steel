"use client";

import { use } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";



export default function SupervisorProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return (
    <DashboardShell role="supervisor" title="Detail Proyek" backUrl="/dashboard/supervisor/projects">
      <ProjectDetailClient projectId={projectId} role="supervisor" />
    </DashboardShell>
  );
}

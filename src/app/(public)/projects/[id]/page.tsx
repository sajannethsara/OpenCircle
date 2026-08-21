import * as React from "react"
import { ProjectDetails } from "./_components/project-details"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProjectDetails projectId={id} />
}

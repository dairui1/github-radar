'use client'

import { useParams } from 'next/navigation'
import { ProjectDetailPage } from '@/components/project-detail-page'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  return <ProjectDetailPage projectId={projectId} />
}
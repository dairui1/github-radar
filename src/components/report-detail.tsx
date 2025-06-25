'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function ReportDetail({ projectId, reportId }: { projectId: string; reportId: string }) {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-2xl font-bold mt-4">Report Details</h1>
      <p className="text-muted-foreground">Project ID: {projectId}</p>
      <p className="text-muted-foreground">Report ID: {reportId}</p>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, FileText, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  title: string
  content: string
  summary: string
  reportType: string
  reportDate: string
  issuesCount: number
  discussionsCount: number
  createdAt: string
  project: {
    id: string
    name: string
    githubUrl: string
  }
}

export default function ReportDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchReport(id as string)
    }
  }, [id])

  const fetchReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      } else if (response.status === 404) {
        setError('Report not found')
      } else {
        setError('Failed to load report')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const formatMarkdown = (content: string) => {
    // Simple markdown to HTML conversion for display
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return null
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <p className="text-muted-foreground">{report.summary}</p>
        </div>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{report.project.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(report.project.githubUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Report Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(report.reportDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issues Analyzed</p>
              <p className="font-medium">{report.issuesCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discussions Analyzed</p>
              <p className="font-medium">{report.discussionsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
          <CardDescription>
            AI-generated analysis of recent GitHub activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-4">${formatMarkdown(report.content)}</p>` 
            }}
          />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Generated on {format(new Date(report.createdAt), 'PPP p')}</p>
      </div>
    </div>
  )
}
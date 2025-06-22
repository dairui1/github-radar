'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  title: string
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

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?limit=5')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (reportId: string) => {
    // Navigate to report detail page (to be implemented)
    window.open(`/reports/${reportId}`, '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>
            Your generated reports will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No reports generated yet. Add a project and sync it to generate your first report.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Reports
        </CardTitle>
        <CardDescription>
          Latest generated reports from your monitored projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{report.title}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {report.reportType}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.reportDate), 'MMM d, yyyy')}
                  </span>
                  <span>Issues: {report.issuesCount}</span>
                  <span>Discussions: {report.discussionsCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Project: {report.project.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(report.project.githubUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewReport(report.id)}
              >
                View Report
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
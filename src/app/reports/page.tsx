'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Report {
  id: string
  title: string
  summary: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  reportDate: string
  createdAt: string
  issuesCount: number
  discussionsCount: number
  project: {
    id: string
    name: string
    githubUrl: string
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  useEffect(() => {
    fetchReports()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?limit=${limit}&offset=${page * limit}`)
      if (response.ok) {
        const data = await response.json()
        const reportsArray = data.reports || []
        if (page === 0) {
          setReports(reportsArray)
        } else {
          setReports(prev => [...prev, ...reportsArray])
        }
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'DAILY':
        return <Calendar className="h-5 w-5" />
      case 'WEEKLY':
        return <TrendingUp className="h-5 w-5" />
      case 'MONTHLY':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getReportBadge = (type: string) => {
    switch (type) {
      case 'DAILY':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Daily</Badge>
      case 'WEEKLY':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Weekly</Badge>
      case 'MONTHLY':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Monthly</Badge>
      default:
        return null
    }
  }

  if (loading && page === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            All generated reports across your projects
          </p>
        </div>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getReportIcon(report.reportType)}
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      {getReportBadge(report.reportType)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {report.summary}
                    </CardDescription>
                  </div>
                  <Link href={`/reports/${report.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{report.project.name}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                  <span>•</span>
                  <span>{report.issuesCount} issues</span>
                  <span>•</span>
                  <span>{report.discussionsCount} discussions</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No reports yet</CardTitle>
            <CardDescription>
              Reports will appear here once they are generated for your projects
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
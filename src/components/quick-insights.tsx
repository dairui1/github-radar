'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertCircle,
  MessageSquare
} from 'lucide-react'

interface Project {
  id: string
  isActive: boolean
  lastSyncAt?: string
}

interface Report {
  createdAt: string
  issuesCount?: number
  discussionsCount?: number
}

interface InsightData {
  activeProjects: number
  totalProjects: number
  recentReports: number
  pendingSyncs: number
  totalIssues: number
  totalDiscussions: number
  trendsComparedToLastWeek: {
    issues: number
    discussions: number
    reports: number
  }
}

export function QuickInsights() {
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch('/api/projects')
      const projects: Project[] = await projectsRes.json()
      
      // Fetch recent reports (last 7 days)
      const reportsRes = await fetch('/api/reports?limit=50')
      const reportsData = await reportsRes.json()
      const reports: Report[] = reportsData.reports || []
      
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      
      const recentReports = reports.filter((r) => new Date(r.createdAt) > weekAgo)
      const previousWeekReports = reports.filter((r) => {
        const date = new Date(r.createdAt)
        return date > twoWeeksAgo && date <= weekAgo
      })
      
      // Calculate totals and trends
      const totalIssues = recentReports.reduce((sum, r) => sum + (r.issuesCount || 0), 0)
      const totalDiscussions = recentReports.reduce((sum, r) => sum + (r.discussionsCount || 0), 0)
      
      const prevIssues = previousWeekReports.reduce((sum, r) => sum + (r.issuesCount || 0), 0)
      const prevDiscussions = previousWeekReports.reduce((sum, r) => sum + (r.discussionsCount || 0), 0)
      
      setInsights({
        activeProjects: projects.filter((p) => p.isActive).length,
        totalProjects: projects.length,
        recentReports: recentReports.length,
        pendingSyncs: projects.filter((p) => {
          if (!p.lastSyncAt) return true
          const lastSync = new Date(p.lastSyncAt)
          return now.getTime() - lastSync.getTime() > 24 * 60 * 60 * 1000
        }).length,
        totalIssues,
        totalDiscussions,
        trendsComparedToLastWeek: {
          issues: prevIssues > 0 ? ((totalIssues - prevIssues) / prevIssues) * 100 : 0,
          discussions: prevDiscussions > 0 ? ((totalDiscussions - prevDiscussions) / prevDiscussions) * 100 : 0,
          reports: previousWeekReports.length > 0 ? ((recentReports.length - previousWeekReports.length) / previousWeekReports.length) * 100 : 0
        }
      })
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading || !insights) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{insights.activeProjects}</span>
            <span className="text-sm text-muted-foreground">/ {insights.totalProjects}</span>
          </div>
          <Progress value={(insights.activeProjects / insights.totalProjects) * 100} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{insights.recentReports}</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(insights.trendsComparedToLastWeek.reports)}
              <span className={`text-sm ${getTrendColor(insights.trendsComparedToLastWeek.reports)}`}>
                {Math.abs(insights.trendsComparedToLastWeek.reports).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Generated this week</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Issues Tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{insights.totalIssues}</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(insights.trendsComparedToLastWeek.issues)}
              <span className={`text-sm ${getTrendColor(insights.trendsComparedToLastWeek.issues)}`}>
                {Math.abs(insights.trendsComparedToLastWeek.issues).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{insights.totalDiscussions}</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(insights.trendsComparedToLastWeek.discussions)}
              <span className={`text-sm ${getTrendColor(insights.trendsComparedToLastWeek.discussions)}`}>
                {Math.abs(insights.trendsComparedToLastWeek.discussions).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
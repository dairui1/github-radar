'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  MessageSquare, 
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

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

interface Project {
  id: string
  name: string
  lastSyncAt?: string
  isActive: boolean
}

interface ActivityItem {
  id: string
  type: 'report' | 'sync' | 'project'
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
  badge?: React.ReactNode
  link?: string
  metadata?: {
    issuesCount?: number
    discussionsCount?: number
    projectName?: string
  }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = async () => {
    try {
      setRefreshing(true)
      
      // Fetch recent reports
      const reportsRes = await fetch('/api/reports?limit=10')
      const reportsData = await reportsRes.json()
      const reports: Report[] = reportsData.reports || []
      
      // Fetch projects for sync status
      const projectsRes = await fetch('/api/projects')
      const projects: Project[] = await projectsRes.json()
      
      // Convert to activity items
      const reportActivities: ActivityItem[] = reports.map(report => ({
        id: `report-${report.id}`,
        type: 'report',
        title: report.title,
        description: report.summary.substring(0, 150) + '...',
        timestamp: report.createdAt,
        icon: getReportIcon(report.reportType),
        badge: getReportBadge(report.reportType),
        link: `/projects/${report.project.id}/reports/${report.id}`,
        metadata: {
          issuesCount: report.issuesCount,
          discussionsCount: report.discussionsCount,
          projectName: report.project.name
        }
      }))
      
      // Add recent sync activities
      const syncActivities: ActivityItem[] = projects
        .filter(p => p.lastSyncAt && new Date(p.lastSyncAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .map(project => ({
          id: `sync-${project.id}-${project.lastSyncAt}`,
          type: 'sync',
          title: `${project.name} synced`,
          description: 'GitHub data synchronized successfully',
          timestamp: project.lastSyncAt!,
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          link: `/projects/${project.id}`,
          metadata: {
            projectName: project.name
          }
        }))
      
      // Combine and sort by timestamp
      const allActivities = [...reportActivities, ...syncActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15)
      
      setActivities(allActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'DAILY':
        return <Calendar className="h-5 w-5 text-green-500" />
      case 'WEEKLY':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'MONTHLY':
        return <FileText className="h-5 w-5 text-purple-500" />
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Latest Activity</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchActivities}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-2">Start by adding projects to monitor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {activity.link ? (
                        <Link href={activity.link} className="hover:underline">
                          {activity.title}
                        </Link>
                      ) : (
                        activity.title
                      )}
                    </h3>
                    {activity.badge}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                    {activity.metadata?.projectName && (
                      <span>{activity.metadata.projectName}</span>
                    )}
                    {activity.metadata?.issuesCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {activity.metadata.issuesCount} issues
                      </span>
                    )}
                    {activity.metadata?.discussionsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {activity.metadata.discussionsCount} discussions
                      </span>
                    )}
                  </div>
                </div>
                {activity.link && (
                  <Link href={activity.link}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
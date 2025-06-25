import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AIService, AIProvider } from '@/lib/ai'
import { getEnvironmentApiKey } from '@/lib/ai-config'
import { mergeReportConfig } from '@/lib/report-config'
import { format, subDays, subWeeks, subMonths } from 'date-fns'

function extractHighlights(content: string): string[] {
  const highlights: string[] = []
  
  // Extract sections marked as critical or important
  const criticalPattern = /🔴.*$/gm
  const warningPattern = /🟡.*$/gm
  const successPattern = /🟢.*$/gm
  
  const criticalMatches = content.match(criticalPattern) || []
  const warningMatches = content.match(warningPattern) || []
  const successMatches = content.match(successPattern) || []
  
  highlights.push(...criticalMatches.slice(0, 3))
  highlights.push(...warningMatches.slice(0, 2))
  highlights.push(...successMatches.slice(0, 2))
  
  return highlights
}

interface DataItem {
  author: string
  createdAt: Date
}

interface StatsData {
  current?: {
    stars: number
    forks: number
    openIssues: number
    commitsLastWeek: number
  }
}

function calculateMetrics(
  data: { 
    issues: DataItem[], 
    discussions: DataItem[], 
    pullRequests: DataItem[] 
  },
  stats?: StatsData
): Record<string, unknown> {
  const now = new Date()
  const dayAgo = subDays(now, 1)
  const weekAgo = subDays(now, 7)
  
  const recentIssues = data.issues.filter(i => new Date(i.createdAt) > dayAgo).length
  const weeklyIssues = data.issues.filter(i => new Date(i.createdAt) > weekAgo).length
  
  const uniqueAuthors = new Set([
    ...data.issues.map(i => i.author),
    ...data.discussions.map(d => d.author),
    ...data.pullRequests.map(p => p.author),
  ]).size
  
  return {
    activity: {
      daily: {
        issues: recentIssues,
        discussions: data.discussions.filter(d => new Date(d.createdAt) > dayAgo).length,
        pullRequests: data.pullRequests.filter(p => new Date(p.createdAt) > dayAgo).length,
      },
      weekly: {
        issues: weeklyIssues,
        discussions: data.discussions.filter(d => new Date(d.createdAt) > weekAgo).length,
        pullRequests: data.pullRequests.filter(p => new Date(p.createdAt) > weekAgo).length,
      },
    },
    engagement: {
      uniqueAuthors,
      totalActivity: data.issues.length + data.discussions.length + data.pullRequests.length,
    },
    repository: stats?.current ? {
      stars: stats.current.stars,
      forks: stats.current.forks,
      openIssues: stats.current.openIssues,
      weeklyCommits: stats.current.commitsLastWeek,
    } : null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, reportType = 'DAILY', detailLevel = 'detailed' } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate date range based on report type
    let startDate: Date
    const today = new Date()
    
    switch (reportType) {
      case 'WEEKLY':
        startDate = subWeeks(today, 1)
        break
      case 'MONTHLY':
        startDate = subMonths(today, 1)
        break
      default: // DAILY
        startDate = subDays(today, 1)
    }

    // Fetch recent data
    const rawData = await prisma.rawData.findMany({
      where: {
        projectId,
        OR: [
          { createdAt: { gte: startDate } },
          { updatedAt: { gte: startDate } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'No recent data found for report generation' },
        { status: 404 }
      )
    }

    // Group data by type
    const issues = rawData
      .filter(item => item.type === 'ISSUE')
      .map(item => ({
        title: item.title,
        body: item.body,
        author: item.author,
        createdAt: item.createdAt,
      }))

    const discussions = rawData
      .filter(item => item.type === 'DISCUSSION')
      .map(item => ({
        title: item.title,
        body: item.body,
        author: item.author,
        createdAt: item.createdAt,
      }))

    const pullRequests = rawData
      .filter(item => item.type === 'PULL_REQUEST')
      .map(item => ({
        title: item.title,
        body: item.body,
        author: item.author,
        createdAt: item.createdAt,
      }))

    // Get current and previous stats
    const [currentStats, previousStats] = await Promise.all([
      prisma.projectStats.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.projectStats.findFirst({
        where: { 
          projectId,
          createdAt: { lt: startDate }
        },
        orderBy: { createdAt: 'desc' },
      })
    ])

    // Parse JSON fields if stats exist
    const stats = currentStats ? {
      current: {
        ...currentStats,
        languages: JSON.parse(currentStats.languages),
        topContributors: JSON.parse(currentStats.topContributors),
      },
      previous: previousStats ? {
        ...previousStats,
        languages: JSON.parse(previousStats.languages),
        topContributors: JSON.parse(previousStats.topContributors),
      } : undefined
    } : undefined

    // Create AI service with project-specific configuration
    const ai = new AIService({
      provider: project.aiProvider as AIProvider,
      model: project.aiModel,
      apiKey: getEnvironmentApiKey(project.aiProvider as AIProvider),
    })

    // Merge project config with defaults
    const reportConfig = mergeReportConfig(project.reportConfig)

    // Generate AI report
    const aiReport = await ai.generateReport(
      project.name,
      { issues, discussions, pullRequests, stats },
      reportType as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      { 
        detailLevel: detailLevel as 'summary' | 'detailed',
        config: reportConfig
      }
    )

    // Extract highlights and metrics from the report
    const highlights = extractHighlights(aiReport.content)
    const metrics = calculateMetrics({ issues, discussions, pullRequests }, stats)

    // Save report to database
    const report = await prisma.report.create({
      data: {
        projectId,
        title: `${project.name} ${reportType.toLowerCase()} Report - ${format(today, 'yyyy-MM-dd')}${detailLevel === 'summary' ? ' (Summary)' : ''}`,
        content: aiReport.content,
        summary: aiReport.summary,
        reportType,
        detailLevel,
        reportDate: today,
        issuesCount: issues.length,
        discussionsCount: discussions.length,
        pullRequestsCount: pullRequests.length,
        highlights: JSON.stringify(highlights),
        metrics: JSON.stringify(metrics),
        metadata: JSON.stringify({
          generatedAt: new Date(),
          reportPeriod: {
            start: startDate,
            end: today,
          },
          dataSourceCounts: {
            issues: rawData.filter(d => d.type === 'ISSUE').length,
            discussions: rawData.filter(d => d.type === 'DISCUSSION').length,
            pullRequests: rawData.filter(d => d.type === 'PULL_REQUEST').length,
          },
        }),
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
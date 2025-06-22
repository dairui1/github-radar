import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AIService } from '@/lib/ai'
import { format, subDays, subWeeks, subMonths } from 'date-fns'

const ai = new AIService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, reportType = 'DAILY' } = body

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

    // Generate AI report
    const aiReport = await ai.generateReport(
      project.name,
      { issues, discussions, pullRequests },
      reportType as 'DAILY' | 'WEEKLY' | 'MONTHLY'
    )

    // Save report to database
    const report = await prisma.report.create({
      data: {
        projectId,
        title: `${project.name} ${reportType.toLowerCase()} Report - ${format(today, 'yyyy-MM-dd')}`,
        content: aiReport.content,
        summary: aiReport.summary,
        reportType,
        reportDate: today,
        issuesCount: issues.length,
        discussionsCount: discussions.length,
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
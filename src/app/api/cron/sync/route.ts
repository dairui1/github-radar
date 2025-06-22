import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GitHubService } from '@/lib/github'
import { AIService } from '@/lib/ai'
import { format, subDays } from 'date-fns'

const github = new GitHubService()
const ai = new AIService()

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting scheduled sync job...')

    // Get all active projects
    const activeProjects = await prisma.project.findMany({
      where: { isActive: true },
    })

    let totalSynced = 0
    let reportsGenerated = 0

    for (const project of activeProjects) {
      try {
        console.log(`Syncing project: ${project.name}`)

        const since = project.lastSyncAt?.toISOString()

        // Fetch data from GitHub
        const [issues, discussions, pullRequests] = await Promise.all([
          github.getIssues(project.owner, project.repo, since),
          github.getDiscussions(project.owner, project.repo),
          github.getPullRequests(project.owner, project.repo, since)
        ])

        let syncedCount = 0

        // Store issues
        for (const issue of issues) {
          try {
            await prisma.rawData.upsert({
              where: {
                projectId_githubId_type: {
                  projectId: project.id,
                  githubId: issue.number,
                  type: 'ISSUE',
                },
              },
              create: {
                projectId: project.id,
                type: 'ISSUE',
                githubId: issue.number,
                title: issue.title,
                body: issue.body || '',
                author: issue.user?.login || 'unknown',
                url: issue.html_url,
                createdAt: new Date(issue.created_at),
                updatedAt: issue.updated_at ? new Date(issue.updated_at) : null,
              },
              update: {
                title: issue.title,
                body: issue.body || '',
                updatedAt: issue.updated_at ? new Date(issue.updated_at) : null,
                syncedAt: new Date(),
              },
            })
            syncedCount++
          } catch (error) {
            console.error(`Error syncing issue ${issue.number}:`, error)
          }
        }

        // Store discussions
        for (const discussion of discussions) {
          try {
            await prisma.rawData.upsert({
              where: {
                projectId_githubId_type: {
                  projectId: project.id,
                  githubId: discussion.number,
                  type: 'DISCUSSION',
                },
              },
              create: {
                projectId: project.id,
                type: 'DISCUSSION',
                githubId: discussion.number,
                title: discussion.title,
                body: discussion.body || '',
                author: discussion.author?.login || 'unknown',
                url: discussion.url,
                createdAt: new Date(discussion.createdAt),
                updatedAt: discussion.updatedAt ? new Date(discussion.updatedAt) : null,
              },
              update: {
                title: discussion.title,
                body: discussion.body || '',
                updatedAt: discussion.updatedAt ? new Date(discussion.updatedAt) : null,
                syncedAt: new Date(),
              },
            })
            syncedCount++
          } catch (error) {
            console.error(`Error syncing discussion ${discussion.number}:`, error)
          }
        }

        // Store pull requests
        for (const pr of pullRequests) {
          try {
            await prisma.rawData.upsert({
              where: {
                projectId_githubId_type: {
                  projectId: project.id,
                  githubId: pr.number,
                  type: 'PULL_REQUEST',
                },
              },
              create: {
                projectId: project.id,
                type: 'PULL_REQUEST',
                githubId: pr.number,
                title: pr.title,
                body: pr.body || '',
                author: pr.user?.login || 'unknown',
                url: pr.html_url,
                createdAt: new Date(pr.created_at),
                updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
              },
              update: {
                title: pr.title,
                body: pr.body || '',
                updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
                syncedAt: new Date(),
              },
            })
            syncedCount++
          } catch (error) {
            console.error(`Error syncing pull request ${pr.number}:`, error)
          }
        }

        // Update project sync time
        await prisma.project.update({
          where: { id: project.id },
          data: { lastSyncAt: new Date() },
        })

        totalSynced += syncedCount

        // Generate daily report if there's new data
        if (syncedCount > 0) {
          try {
            // Get data from the last 24 hours
            const yesterday = subDays(new Date(), 1)
            
            const recentData = await prisma.rawData.findMany({
              where: {
                projectId: project.id,
                OR: [
                  { createdAt: { gte: yesterday } },
                  { updatedAt: { gte: yesterday } },
                ],
              },
              orderBy: { createdAt: 'desc' },
            })

            if (recentData.length > 0) {
              // Group data by type
              const issuesData = recentData
                .filter(item => item.type === 'ISSUE')
                .map(item => ({
                  title: item.title,
                  body: item.body,
                  author: item.author,
                  createdAt: item.createdAt,
                }))

              const discussionsData = recentData
                .filter(item => item.type === 'DISCUSSION')
                .map(item => ({
                  title: item.title,
                  body: item.body,
                  author: item.author,
                  createdAt: item.createdAt,
                }))

              const pullRequestsData = recentData
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
                { 
                  issues: issuesData, 
                  discussions: discussionsData, 
                  pullRequests: pullRequestsData 
                },
                'DAILY'
              )

              // Save report
              await prisma.report.create({
                data: {
                  projectId: project.id,
                  title: `${project.name} Daily Report - ${format(new Date(), 'yyyy-MM-dd')}`,
                  content: aiReport.content,
                  summary: aiReport.summary,
                  reportType: 'DAILY',
                  reportDate: new Date(),
                  issuesCount: issuesData.length,
                  discussionsCount: discussionsData.length,
                },
              })

              reportsGenerated++
              console.log(`Generated report for project: ${project.name}`)
            }
          } catch (error) {
            console.error(`Error generating report for project ${project.name}:`, error)
          }
        }

        console.log(`Synced ${syncedCount} items for project: ${project.name}`)
      } catch (error) {
        console.error(`Error processing project ${project.name}:`, error)
      }
    }

    console.log(`Sync job completed. Total synced: ${totalSynced}, Reports generated: ${reportsGenerated}`)

    return NextResponse.json({
      success: true,
      projectsProcessed: activeProjects.length,
      totalSynced,
      reportsGenerated,
    })
  } catch (error) {
    console.error('Error in scheduled sync job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
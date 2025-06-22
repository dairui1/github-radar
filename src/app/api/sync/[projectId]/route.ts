import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GitHubService } from '@/lib/github'

const github = new GitHubService()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.isActive) {
      return NextResponse.json(
        { error: 'Project is not active' },
        { status: 400 }
      )
    }

    const since = project.lastSyncAt?.toISOString()

    // Fetch issues
    const issues = await github.getIssues(project.owner, project.repo, since)
    
    // Fetch discussions
    const discussions = await github.getDiscussions(project.owner, project.repo)
    
    // Fetch pull requests
    const pullRequests = await github.getPullRequests(project.owner, project.repo, since)

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
        console.error('Error syncing issue:', issue.number, error)
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
        console.error('Error syncing discussion:', discussion.number, error)
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
        console.error('Error syncing pull request:', pr.number, error)
      }
    }

    // Update project sync time
    await prisma.project.update({
      where: { id: project.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      syncedCount,
      issues: issues.length,
      discussions: discussions.length,
      pullRequests: pullRequests.length,
    })
  } catch (error) {
    console.error('Error syncing project:', error)
    return NextResponse.json(
      { error: 'Failed to sync project' },
      { status: 500 }
    )
  }
}
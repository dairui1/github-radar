import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GitHubService } from '@/lib/github'

const github = new GitHubService()

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, githubUrl, description } = body

    if (!name || !githubUrl) {
      return NextResponse.json(
        { error: 'Name and GitHub URL are required' },
        { status: 400 }
      )
    }

    const parsedUrl = github.parseGitHubUrl(githubUrl)
    if (!parsedUrl) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      )
    }

    const { owner, repo } = parsedUrl

    // Verify repository exists and is accessible
    try {
      await github.getRepository(owner, repo)
    } catch {
      return NextResponse.json(
        { error: 'Repository not found or not accessible' },
        { status: 404 }
      )
    }

    // Check if project already exists
    const existingProject = await prisma.project.findUnique({
      where: { githubUrl },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project already exists' },
        { status: 409 }
      )
    }

    // Get default AI configuration from settings
    const defaultProviderSetting = await prisma.settings.findUnique({
      where: { key: 'DEFAULT_AI_PROVIDER' },
    })
    const defaultModelSetting = await prisma.settings.findUnique({
      where: { key: 'DEFAULT_AI_MODEL' },
    })
    
    const aiProvider = defaultProviderSetting?.value || 'openai'
    const aiModel = defaultModelSetting?.value || 'gpt-4o-mini'

    const project = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl,
        owner,
        repo,
        aiProvider,
        aiModel,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { reportConfig: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const config = project.reportConfig ? JSON.parse(project.reportConfig) : null

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching project config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const body = await request.json()
    const { config } = body

    // Validate that config is an object
    if (config && typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      )
    }

    await prisma.project.update({
      where: { id },
      data: { 
        reportConfig: config ? JSON.stringify(config) : null 
      },
    })

    return NextResponse.json({ 
      message: 'Configuration updated successfully',
      config: config || null
    })
  } catch (error) {
    console.error('Error updating project config:', error)
    return NextResponse.json(
      { error: 'Failed to update project configuration' },
      { status: 500 }
    )
  }
}
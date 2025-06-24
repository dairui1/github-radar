import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const settingsSchema = z.object({
  key: z.string(),
  value: z.string(),
  encrypted: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' },
    })
    
    // Mask sensitive values for security
    const maskedSettings = settings.map(setting => ({
      ...setting,
      value: setting.encrypted ? '••••••••' : setting.value,
    }))
    
    return NextResponse.json(maskedSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = settingsSchema.parse(body)
    
    const setting = await prisma.settings.upsert({
      where: { key: parsed.key },
      update: {
        value: parsed.value,
        encrypted: parsed.encrypted,
      },
      create: {
        key: parsed.key,
        value: parsed.value,
        encrypted: parsed.encrypted,
      },
    })
    
    return NextResponse.json({
      ...setting,
      value: setting.encrypted ? '••••••••' : setting.value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error saving setting:', error)
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      )
    }
    
    await prisma.settings.delete({
      where: { key },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}
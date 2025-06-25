import { NextRequest, NextResponse } from 'next/server'

interface OpenRouterModel {
  id: string
  name: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch models from OpenRouter' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Extract and format model IDs
    const models = data.data
      ?.map((model: OpenRouterModel) => model.id)
      ?.sort((a: string, b: string) => {
        // Sort by provider/model name
        const [providerA] = a.split('/')
        const [providerB] = b.split('/')
        
        // Prioritize certain providers
        const priority = ['anthropic', 'openai', 'google', 'meta-llama', 'mistralai']
        const indexA = priority.indexOf(providerA)
        const indexB = priority.indexOf(providerB)
        
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        
        return a.localeCompare(b)
      }) || []
    
    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
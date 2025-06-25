import { prisma } from '@/lib/db'
import { AIProvider } from './ai'

export async function getApiKey(provider: AIProvider): Promise<string | undefined> {
  try {
    // Map provider to the setting key
    const keyMap: Record<AIProvider, string> = {
      openai: 'OPENAI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
    }
    
    const settingKey = keyMap[provider]
    if (!settingKey) return undefined
    
    // First check database
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    })
    
    if (setting?.value && setting.value !== '••••••••') {
      return setting.value
    }
    
    // Fall back to environment variables
    return process.env[settingKey]
  } catch (error) {
    console.error(`Error fetching API key for ${provider}:`, error)
    // Fall back to environment variables on error
    const keyMap: Record<AIProvider, string> = {
      openai: 'OPENAI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
    }
    
    const settingKey = keyMap[provider]
    return settingKey ? process.env[settingKey] : undefined
  }
}

export async function getGithubToken(): Promise<string | undefined> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'GITHUB_TOKEN' },
    })
    
    if (setting?.value && setting.value !== '••••••••') {
      return setting.value
    }
    
    return process.env.GITHUB_TOKEN
  } catch (error) {
    console.error('Error fetching GitHub token:', error)
    return process.env.GITHUB_TOKEN
  }
}

export async function getBaseUrl(provider: AIProvider): Promise<string | undefined> {
  try {
    if (provider !== 'openai') return undefined
    
    const setting = await prisma.settings.findUnique({
      where: { key: 'OPENAI_BASE_URL' },
    })
    
    return setting?.value || undefined
  } catch (error) {
    console.error(`Error fetching base URL for ${provider}:`, error)
    return undefined
  }
}
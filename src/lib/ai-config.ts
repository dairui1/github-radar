import { AIProvider } from './ai'

export interface AIProviderConfig {
  name: string
  label: string
  models: { value: string; label: string }[]
  requiresCustomApiKey?: boolean
  defaultModel: string
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    name: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    name: 'deepseek',
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
    defaultModel: 'deepseek-chat',
  },
  openrouter: {
    name: 'openrouter',
    label: 'OpenRouter',
    models: [
      { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
      { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
      { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.2-90b-instruct', label: 'Llama 3.2 90B' },
      { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B' },
      { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    ],
    requiresCustomApiKey: true,
    defaultModel: 'openai/gpt-4o-mini',
  },
  anthropic: {
    name: 'anthropic',
    label: 'Anthropic (Coming Soon)',
    models: [
      { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
    defaultModel: 'claude-3.5-sonnet',
  },
  google: {
    name: 'google',
    label: 'Google (Coming Soon)',
    models: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
    ],
    defaultModel: 'gemini-pro',
  },
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return AI_PROVIDERS[provider]
}

export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
    case 'deepseek':
    case 'openrouter':
      return true
    case 'anthropic':
    case 'google':
      return false // Will be enabled when implemented
    default:
      return false
  }
}

export function getEnvironmentApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY
    case 'google':
      return process.env.GOOGLE_API_KEY
    default:
      return undefined
  }
}
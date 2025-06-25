import { AIProvider } from './ai'

export interface AIProviderConfig {
  name: string
  label: string
  models: { value: string; label: string }[]
  requiresCustomApiKey?: boolean
  requiresBaseURL?: boolean
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
    label: 'Anthropic',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
    requiresCustomApiKey: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  google: {
    name: 'google',
    label: 'Google',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
      { value: 'gemini-pro', label: 'Gemini Pro' },
    ],
    requiresCustomApiKey: true,
    defaultModel: 'gemini-1.5-flash',
  },
  azure: {
    name: 'azure',
    label: 'Azure OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo' },
    ],
    requiresCustomApiKey: true,
    requiresBaseURL: true,
    defaultModel: 'gpt-4o-mini',
  },
  mistral: {
    name: 'mistral',
    label: 'Mistral AI',
    models: [
      { value: 'mistral-large-latest', label: 'Mistral Large' },
      { value: 'mistral-medium-latest', label: 'Mistral Medium' },
      { value: 'mistral-small-latest', label: 'Mistral Small' },
      { value: 'codestral-latest', label: 'Codestral' },
      { value: 'open-mistral-7b', label: 'Mistral 7B' },
      { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7B' },
      { value: 'open-mixtral-8x22b', label: 'Mixtral 8x22B' },
    ],
    requiresCustomApiKey: true,
    defaultModel: 'mistral-small-latest',
  },
  cohere: {
    name: 'cohere',
    label: 'Cohere',
    models: [
      { value: 'command-r-plus', label: 'Command R+' },
      { value: 'command-r', label: 'Command R' },
      { value: 'command', label: 'Command' },
      { value: 'command-light', label: 'Command Light' },
    ],
    requiresCustomApiKey: true,
    defaultModel: 'command-r',
  },
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return AI_PROVIDERS[provider]
}

export function isProviderAvailable(provider: AIProvider): boolean {
  // All providers are now available
  return !!provider
}

export function getEnvironmentApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY
    case 'google':
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
    case 'azure':
      return process.env.AZURE_API_KEY
    case 'mistral':
      return process.env.MISTRAL_API_KEY
    case 'cohere':
      return process.env.COHERE_API_KEY
    default:
      return undefined
  }
}
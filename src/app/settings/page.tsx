'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, Eye, EyeOff, Plus, X, RefreshCw } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
  encrypted: boolean
}

interface ProviderConfig {
  provider: string
  apiKey: string
  models: string[]
  customModelsKey: string
  baseUrlKey?: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'openai',
    apiKey: 'OPENAI_API_KEY',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    customModelsKey: 'OPENAI_CUSTOM_MODELS',
    baseUrlKey: 'OPENAI_BASE_URL',
  },
  {
    provider: 'deepseek',
    apiKey: 'DEEPSEEK_API_KEY',
    models: ['deepseek-chat', 'deepseek-coder'],
    customModelsKey: 'DEEPSEEK_CUSTOM_MODELS',
    baseUrlKey: 'DEEPSEEK_BASE_URL',
  },
  {
    provider: 'openrouter',
    apiKey: 'OPENROUTER_API_KEY',
    models: [], // Will be loaded dynamically
    customModelsKey: 'OPENROUTER_CUSTOM_MODELS',
  },
]

const DEFAULT_REPORT_PROMPT = `Generate a comprehensive {timeframe} report for the GitHub project "{projectName}". 

Please analyze the following data and provide insights:

## Recent Issues ({issueCount} items):
{issues}

## Recent Discussions ({discussionCount} items):
{discussions}

## Recent Pull Requests ({prCount} items):
{pullRequests}

Please provide:

1. **Executive Summary**: A brief overview of the project's activity
2. **Key Highlights**: Most important developments, decisions, or discussions
3. **Issue Analysis**: 
   - Common themes or problems
   - Critical bugs or feature requests
   - Community engagement level
4. **Development Activity**: 
   - Notable pull requests and code changes
   - Development trends
5. **Community Engagement**: 
   - Discussion topics and community responses
   - Active contributors
6. **Action Items**: What might need attention going forward

Format the report in clear markdown with proper headings and bullet points. Keep it concise but informative.`

const DEFAULT_SUMMARY_PROMPT = `Summarize the following GitHub project report in 2-3 sentences, highlighting the most important points:

{content}

Summary:`

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, Setting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [customModels, setCustomModels] = useState<Record<string, string[]>>({})
  const [newModelInputs, setNewModelInputs] = useState<Record<string, string>>({})
  const [defaultProvider, setDefaultProvider] = useState('openai')
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini')
  const [openRouterModels, setOpenRouterModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [reportPrompt, setReportPrompt] = useState(DEFAULT_REPORT_PROMPT)
  const [summaryPrompt, setSummaryPrompt] = useState(DEFAULT_SUMMARY_PROMPT)

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      const settingsMap: Record<string, Setting> = {}
      const customModelsMap: Record<string, string[]> = {}
      
      data.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting
        if (!setting.encrypted || setting.value === '••••••••') {
          setFormData(prev => ({ ...prev, [setting.key]: '' }))
        } else {
          setFormData(prev => ({ ...prev, [setting.key]: setting.value }))
        }
        
        // Load custom models
        PROVIDERS.forEach(provider => {
          if (setting.key === provider.customModelsKey) {
            try {
              customModelsMap[provider.provider] = JSON.parse(setting.value)
            } catch {
              customModelsMap[provider.provider] = []
            }
          }
        })
      })
      
      // Load default AI configuration
      if (settingsMap['DEFAULT_AI_PROVIDER']) {
        setDefaultProvider(settingsMap['DEFAULT_AI_PROVIDER'].value)
      }
      if (settingsMap['DEFAULT_AI_MODEL']) {
        setDefaultModel(settingsMap['DEFAULT_AI_MODEL'].value)
      }
      
      // Load prompt templates
      if (settingsMap['REPORT_PROMPT_TEMPLATE']) {
        setReportPrompt(settingsMap['REPORT_PROMPT_TEMPLATE'].value)
      }
      if (settingsMap['SUMMARY_PROMPT_TEMPLATE']) {
        setSummaryPrompt(settingsMap['SUMMARY_PROMPT_TEMPLATE'].value)
      }
      
      setSettings(settingsMap)
      setCustomModels(customModelsMap)
      
      // Fetch OpenRouter models if API key exists
      if (settingsMap['OPENROUTER_API_KEY'] && settingsMap['OPENROUTER_API_KEY'].value && settingsMap['OPENROUTER_API_KEY'].value !== '••••••••') {
        fetchOpenRouterModels(settingsMap['OPENROUTER_API_KEY'].value)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchOpenRouterModels = async (apiKey: string) => {
    if (!apiKey || apiKey === '••••••••') return
    
    setLoadingModels(true)
    try {
      const response = await fetch('/api/openrouter/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setOpenRouterModels(data.models || [])
      }
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const saveSetting = async (key: string, value: string, encrypted: boolean = false) => {
    setSaving(key)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, encrypted }),
      })

      if (!response.ok) {
        throw new Error('Failed to save setting')
      }

      const updatedSetting = await response.json()
      setSettings(prev => ({
        ...prev,
        [key]: updatedSetting,
      }))
      
      toast({
        title: 'Success',
        description: `${key} saved successfully`,
      })
    } catch (error) {
      console.error('Error saving setting:', error)
      toast({
        title: 'Error',
        description: `Failed to save ${key}`,
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }


  const handleProviderSave = async (provider: ProviderConfig) => {
    const value = formData[provider.apiKey] || ''
    if (!value) {
      toast({
        title: 'Error',
        description: 'API key cannot be empty',
        variant: 'destructive',
      })
      return
    }
    
    // Save API key
    await saveSetting(provider.apiKey, value, true)
    
    // Save base URL for OpenAI if provided
    if (provider.baseUrlKey && formData[provider.baseUrlKey]) {
      await saveSetting(provider.baseUrlKey, formData[provider.baseUrlKey])
    }
    
    // Fetch OpenRouter models after saving API key
    if (provider.provider === 'openrouter') {
      await fetchOpenRouterModels(value)
    }
  }

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const addCustomModel = async (provider: ProviderConfig) => {
    const modelName = newModelInputs[provider.provider]?.trim()
    if (!modelName) {
      toast({
        title: 'Error',
        description: 'Model name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    const currentModels = customModels[provider.provider] || []
    if (currentModels.includes(modelName)) {
      toast({
        title: 'Error',
        description: 'Model already exists',
        variant: 'destructive',
      })
      return
    }

    const updatedModels = [...currentModels, modelName]
    await saveSetting(provider.customModelsKey, JSON.stringify(updatedModels))
    
    setCustomModels(prev => ({
      ...prev,
      [provider.provider]: updatedModels
    }))
    setNewModelInputs(prev => ({ ...prev, [provider.provider]: '' }))
  }

  const removeCustomModel = async (provider: ProviderConfig, modelToRemove: string) => {
    const currentModels = customModels[provider.provider] || []
    const updatedModels = currentModels.filter(model => model !== modelToRemove)
    
    await saveSetting(provider.customModelsKey, JSON.stringify(updatedModels))
    
    setCustomModels(prev => ({
      ...prev,
      [provider.provider]: updatedModels
    }))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your AI providers, API keys, and prompts
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GitHub Configuration</CardTitle>
            <CardDescription>
              Configure your GitHub access token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">GitHub Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="github-token"
                      type={showKeys['GITHUB_TOKEN'] ? 'text' : 'password'}
                      placeholder={settings['GITHUB_TOKEN'] ? '••••••••' : 'Enter your GitHub token'}
                      value={formData['GITHUB_TOKEN'] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, 'GITHUB_TOKEN': e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey('GITHUB_TOKEN')}
                    >
                      {showKeys['GITHUB_TOKEN'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => saveSetting('GITHUB_TOKEN', formData['GITHUB_TOKEN'] || '', true)}
                    disabled={saving === 'GITHUB_TOKEN'}
                  >
                    {saving === 'GITHUB_TOKEN' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for accessing private repositories. Create one at{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">
                    github.com/settings/tokens
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Default AI Configuration</CardTitle>
            <CardDescription>
              Configure the default AI provider and model used for all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-provider">AI Provider</Label>
                <Select
                  value={defaultProvider}
                  onValueChange={(value) => {
                    setDefaultProvider(value)
                    // Reset default model when provider changes
                    const provider = PROVIDERS.find(p => p.provider === value)
                    if (provider) {
                      if (value === 'openrouter' && openRouterModels.length > 0) {
                        setDefaultModel(openRouterModels[0])
                      } else if (provider.models.length > 0) {
                        setDefaultModel(provider.models[0])
                      }
                    }
                  }}
                >
                  <SelectTrigger id="default-provider">
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider.provider} value={provider.provider}>
                        {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Provider-specific configuration */}
              {defaultProvider && (
                <>
                  {(() => {
                    const provider = PROVIDERS.find(p => p.provider === defaultProvider)
                    if (!provider) return null
                    
                    return (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={provider.apiKey}>API Key</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id={provider.apiKey}
                                type={showKeys[provider.apiKey] ? 'text' : 'password'}
                                placeholder={settings[provider.apiKey] ? '••••••••' : 'Enter your API key'}
                                value={formData[provider.apiKey] || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, [provider.apiKey]: e.target.value }))}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleShowKey(provider.apiKey)}
                              >
                                {showKeys[provider.apiKey] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              onClick={() => handleProviderSave(provider)}
                              disabled={saving === provider.apiKey}
                            >
                              {saving === provider.apiKey ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              Save
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.provider === 'openai' && (
                              <>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a> to create an API key.</>
                            )}
                            {provider.provider === 'deepseek' && (
                              <>Visit <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline">platform.deepseek.com</a> to create an API key. DeepSeek offers powerful chat and coding models.</>
                            )}
                            {provider.provider === 'openrouter' && (
                              <>Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a> to create an API key. OpenRouter provides access to multiple AI models.</>
                            )}
                          </p>
                        </div>
                        
                        {provider.baseUrlKey && (
                          <div className="space-y-2">
                            <Label htmlFor={provider.baseUrlKey}>Base URL (Optional)</Label>
                            <Input
                              id={provider.baseUrlKey}
                              placeholder={
                                provider.provider === 'openai' ? 'https://api.openai.com/v1 (default)' :
                                provider.provider === 'deepseek' ? 'https://api.deepseek.com (default)' :
                                ''
                              }
                              value={formData[provider.baseUrlKey] || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, [provider.baseUrlKey!]: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                              {provider.provider === 'openai' && 'Use this to connect to OpenAI-compatible providers (e.g., Azure OpenAI, LocalAI)'}
                              {provider.provider === 'deepseek' && 'Override the default DeepSeek API endpoint if needed'}
                            </p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="default-model">AI Model</Label>
                <Select
                  value={defaultModel}
                  onValueChange={setDefaultModel}
                >
                  <SelectTrigger id="default-model">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultProvider === 'openrouter' ? (
                      <>
                        {openRouterModels.length > 0 ? (
                          openRouterModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {loadingModels ? 'Loading models...' : 'Save API key to load models'}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {PROVIDERS.find(p => p.provider === defaultProvider)?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {customModels[defaultProvider]?.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Custom Models
                        </div>
                        {customModels[defaultProvider].map((model) => (
                          <SelectItem key={`custom-${model}`} value={model}>
                            {model} (Custom)
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom model management */}
              {defaultProvider && (
                <div className="space-y-2">
                  <Label htmlFor={`${defaultProvider}-custom-model`}>Add Custom Model</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${defaultProvider}-custom-model`}
                      placeholder="Enter model name"
                      value={newModelInputs[defaultProvider] || ''}
                      onChange={(e) => setNewModelInputs(prev => ({ 
                        ...prev, 
                        [defaultProvider]: e.target.value 
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const provider = PROVIDERS.find(p => p.provider === defaultProvider)
                          if (provider) addCustomModel(provider)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => {
                        const provider = PROVIDERS.find(p => p.provider === defaultProvider)
                        if (provider) addCustomModel(provider)
                      }}
                      disabled={!newModelInputs[defaultProvider]?.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {customModels[defaultProvider]?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Custom models:</p>
                      <div className="flex flex-wrap gap-2">
                        {customModels[defaultProvider].map(model => (
                          <span key={model} className="px-2 py-1 bg-secondary rounded-md text-xs flex items-center gap-1">
                            {model}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => {
                                const provider = PROVIDERS.find(p => p.provider === defaultProvider)
                                if (provider) removeCustomModel(provider, model)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {defaultProvider === 'openai' && 'Examples: gpt-4-turbo-preview, gpt-4-vision-preview'}
                    {defaultProvider === 'deepseek' && 'Examples: deepseek-chat-v2, deepseek-coder-v2'}
                    {defaultProvider === 'openrouter' && 'Examples: anthropic/claude-3-opus, google/gemini-pro-1.5'}
                  </p>
                </div>
              )}
              
              <Button
                onClick={async () => {
                  setSaving('DEFAULT_AI_CONFIG')
                  try {
                    await saveSetting('DEFAULT_AI_PROVIDER', defaultProvider)
                    await saveSetting('DEFAULT_AI_MODEL', defaultModel)
                    toast({
                      title: 'Success',
                      description: 'Default AI configuration saved successfully',
                    })
                  } catch (error) {
                    console.error('Error saving default AI config:', error)
                    toast({
                      title: 'Error',
                      description: 'Failed to save default AI configuration',
                      variant: 'destructive',
                    })
                  } finally {
                    setSaving(null)
                  }
                }}
                disabled={saving === 'DEFAULT_AI_CONFIG'}
                className="w-full"
              >
                {saving === 'DEFAULT_AI_CONFIG' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save AI Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Prompt Templates</CardTitle>
            <CardDescription>
              Customize the prompts used for generating reports and summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="report-prompt">Report Generation Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportPrompt(DEFAULT_REPORT_PROMPT)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  id="report-prompt"
                  className="min-h-[200px] font-mono text-sm"
                  value={reportPrompt}
                  onChange={(e) => setReportPrompt(e.target.value)}
                  placeholder="Enter report generation prompt..."
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{projectName}'}, {'{timeframe}'}, {'{issueCount}'}, {'{issues}'}, {'{discussionCount}'}, {'{discussions}'}, {'{prCount}'}, {'{pullRequests}'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="summary-prompt">Summary Generation Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSummaryPrompt(DEFAULT_SUMMARY_PROMPT)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  id="summary-prompt"
                  className="min-h-[100px] font-mono text-sm"
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  placeholder="Enter summary generation prompt..."
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{content}'}
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  setSaving('PROMPTS')
                  try {
                    await saveSetting('REPORT_PROMPT_TEMPLATE', reportPrompt)
                    await saveSetting('SUMMARY_PROMPT_TEMPLATE', summaryPrompt)
                    toast({
                      title: 'Success',
                      description: 'Prompt templates saved successfully',
                    })
                  } catch (error) {
                    console.error('Error saving prompts:', error)
                    toast({
                      title: 'Error',
                      description: 'Failed to save prompt templates',
                      variant: 'destructive',
                    })
                  } finally {
                    setSaving(null)
                  }
                }}
                disabled={saving === 'PROMPTS'}
                className="w-full"
              >
                {saving === 'PROMPTS' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Prompt Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
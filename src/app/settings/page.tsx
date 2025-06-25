'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, Trash2, Eye, EyeOff, Plus, X } from 'lucide-react'

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
    provider: 'openrouter',
    apiKey: 'OPENROUTER_API_KEY',
    models: [], // Will be loaded dynamically
    customModelsKey: 'OPENROUTER_CUSTOM_MODELS',
  },
]

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

  const deleteSetting = async (key: string) => {
    try {
      const response = await fetch(`/api/settings?key=${key}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete setting')
      }

      setSettings(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
      
      setFormData(prev => ({ ...prev, [key]: '' }))
      
      toast({
        title: 'Success',
        description: `${key} deleted successfully`,
      })
    } catch (error) {
      console.error('Error deleting setting:', error)
      toast({
        title: 'Error',
        description: `Failed to delete ${key}`,
        variant: 'destructive',
      })
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
          Configure your AI providers and API keys
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>
                Configure your API keys for different AI providers. These keys will be stored securely in your database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PROVIDERS.map((provider) => (
                <div key={provider.provider} className="space-y-4 pb-6 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">{provider.provider}</h3>
                    {settings[provider.apiKey] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSetting(provider.apiKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
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
                  </div>
                  
                  {provider.baseUrlKey && (
                    <div className="space-y-2">
                      <Label htmlFor={provider.baseUrlKey}>Base URL (Optional)</Label>
                      <Input
                        id={provider.baseUrlKey}
                        placeholder={provider.provider === 'openai' ? 'https://api.openai.com/v1 (default)' : ''}
                        value={formData[provider.baseUrlKey] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [provider.baseUrlKey!]: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use this to connect to OpenAI-compatible providers (e.g., Azure OpenAI, LocalAI)
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Available Models</h4>
                      <div className="space-y-2">
                        {provider.provider === 'openrouter' ? (
                          <div className="text-sm text-muted-foreground">
                            {loadingModels ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading models...</span>
                              </div>
                            ) : openRouterModels.length > 0 ? (
                              <>
                                <p className="font-medium mb-1">Available models ({openRouterModels.length}):</p>
                                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                                  {openRouterModels.map(model => (
                                    <span key={model} className="px-2 py-1 bg-secondary rounded-md text-xs">
                                      {model}
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-muted-foreground">Save your API key to load available models</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Default models:</p>
                            <div className="flex flex-wrap gap-2">
                              {provider.models.map(model => (
                                <span key={model} className="px-2 py-1 bg-secondary rounded-md text-xs">
                                  {model}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {customModels[provider.provider]?.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Custom models:</p>
                            <div className="flex flex-wrap gap-2">
                              {customModels[provider.provider].map(model => (
                                <span key={model} className="px-2 py-1 bg-secondary rounded-md text-xs flex items-center gap-1">
                                  {model}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => removeCustomModel(provider, model)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`${provider.provider}-custom-model`}>Add Custom Model</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id={`${provider.provider}-custom-model`}
                          placeholder="Enter model name (e.g., gpt-4-turbo-preview)"
                          value={newModelInputs[provider.provider] || ''}
                          onChange={(e) => setNewModelInputs(prev => ({ 
                            ...prev, 
                            [provider.provider]: e.target.value 
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomModel(provider)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => addCustomModel(provider)}
                          disabled={!newModelInputs[provider.provider]?.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add custom model names that are supported by {provider.provider}
                        {provider.provider === 'openai' && ' (e.g., gpt-4-turbo-preview, gpt-4-vision-preview)'}
                        {provider.provider === 'openrouter' && ' (e.g., anthropic/claude-3-opus, google/gemini-pro-1.5)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Get API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">OpenAI</h4>
                <p className="text-sm text-muted-foreground">
                  Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a> to create an API key.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">OpenRouter</h4>
                <p className="text-sm text-muted-foreground">
                  Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a> to create an API key. OpenRouter provides access to multiple AI models including Claude, Llama, and Mistral.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
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
                  <Label htmlFor="default-provider">Default AI Provider</Label>
                  <Select
                    value={defaultProvider}
                    onValueChange={setDefaultProvider}
                  >
                    <SelectTrigger id="default-provider">
                      <SelectValue placeholder="Select default provider" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="default-model">Default AI Model</Label>
                  <Select
                    value={defaultModel}
                    onValueChange={setDefaultModel}
                  >
                    <SelectTrigger id="default-model">
                      <SelectValue placeholder="Select default model" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultProvider === 'openrouter' ? (
                        <>
                          {openRouterModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
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
                >
                  {saving === 'DEFAULT_AI_CONFIG' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Default Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
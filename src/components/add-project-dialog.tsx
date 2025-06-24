'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AI_PROVIDERS, isProviderAvailable } from '@/lib/ai-config'
import { AIProvider } from '@/lib/ai'
import { toast } from 'sonner'

interface AddProjectDialogProps {
  open: boolean
  onClose: () => void
  onProjectAdded: (project: {
    id: string
    name: string
    description?: string
    githubUrl: string
    isActive: boolean
    lastSyncAt?: string
    createdAt: string
    _count: {
      reports: number
    }
  }) => void
}

export function AddProjectDialog({ open, onClose, onProjectAdded }: AddProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    githubUrl: '',
    description: '',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
  })
  const [customModels, setCustomModels] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (open) {
      fetchCustomModels()
    }
  }, [open])

  const fetchCustomModels = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      const modelsMap: Record<string, string[]> = {}
      
      // Extract custom models from settings
      const customModelKeys = {
        openai: 'OPENAI_CUSTOM_MODELS',
        openrouter: 'OPENROUTER_CUSTOM_MODELS',
      }
      
      Object.entries(customModelKeys).forEach(([provider, key]) => {
        const setting = data.find((s: { key: string; value: string }) => s.key === key)
        if (setting && setting.value) {
          try {
            modelsMap[provider] = JSON.parse(setting.value)
          } catch {
            modelsMap[provider] = []
          }
        }
      })
      
      setCustomModels(modelsMap)
    } catch (error) {
      console.error('Error fetching custom models:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.githubUrl) {
      toast.error('Name and GitHub URL are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newProject = await response.json()
        onProjectAdded(newProject)
        toast.success('Project added successfully')
        setFormData({ name: '', githubUrl: '', description: '', aiProvider: 'openai', aiModel: 'gpt-4o-mini' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add project')
      }
    } catch (error) {
      console.error('Error adding project:', error)
      toast.error('Failed to add project')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-fill name from GitHub URL
    if (field === 'githubUrl' && value && !formData.name) {
      const match = value.match(/github\.com\/[^\/]+\/([^\/]+)/i)
      if (match) {
        const repoName = match[1].replace(/\.git$/, '')
        setFormData(prev => ({ ...prev, name: repoName }))
      }
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', githubUrl: '', description: '', aiProvider: 'openai', aiModel: 'gpt-4o-mini' })
      onClose()
    }
  }

  const handleProviderChange = (provider: string) => {
    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
    setFormData(prev => ({
      ...prev,
      aiProvider: provider,
      aiModel: providerConfig.defaultModel,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Add a GitHub repository to monitor its issues and discussions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="githubUrl">GitHub URL *</Label>
            <Input
              id="githubUrl"
              placeholder="https://github.com/owner/repo"
              value={formData.githubUrl}
              onChange={(e) => handleInputChange('githubUrl', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="My Project"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this project"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select
              value={formData.aiProvider}
              onValueChange={handleProviderChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_PROVIDERS)
                  .filter(([key]) => isProviderAvailable(key as AIProvider))
                  .map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aiModel">AI Model</Label>
            <Select
              value={formData.aiModel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, aiModel: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS[formData.aiProvider as keyof typeof AI_PROVIDERS]?.models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
                {customModels[formData.aiProvider]?.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Custom Models
                    </div>
                    {customModels[formData.aiProvider].map((model) => (
                      <SelectItem key={`custom-${model}`} value={model}>
                        {model} (Custom)
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
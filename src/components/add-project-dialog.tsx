'use client'

import { useState } from 'react'
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
    aiProvider: string
    aiModel: string
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
  })

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
        setFormData({ name: '', githubUrl: '', description: '' })
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
      setFormData({ name: '', githubUrl: '', description: '' })
      onClose()
    }
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
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MoreHorizontal, 
  ExternalLink, 
  RotateCw, 
  FileText, 
  Trash2, 
  Power,
  PowerOff,
  Edit 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { EditProjectDialog } from '@/components/edit-project-dialog'

interface Project {
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
}

interface ProjectCardProps {
  project: Project
  onUpdated: (project: Project) => void
  onDeleted: (projectId: string) => void
}

export function ProjectCard({ project, onUpdated, onDeleted }: ProjectCardProps) {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/sync/${project.id}`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Synced ${result.syncedCount} items successfully`)
        // Update last sync time
        const updatedProject = {
          ...project,
          lastSyncAt: new Date().toISOString(),
        }
        onUpdated(updatedProject)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sync project')
      }
    } catch (error) {
      console.error('Error syncing project:', error)
      toast.error('Failed to sync project')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          reportType: 'DAILY',
        }),
      })

      if (response.ok) {
        toast.success('Report generated successfully')
        // Update report count
        const updatedProject = {
          ...project,
          _count: {
            ...project._count,
            reports: project._count.reports + 1,
          },
        }
        onUpdated(updatedProject)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !project.isActive,
        }),
      })

      if (response.ok) {
        const updatedProject = await response.json()
        onUpdated(updatedProject)
        toast.success(`Project ${updatedProject.isActive ? 'activated' : 'deactivated'}`)
      } else {
        toast.error('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted(project.id)
        toast.success('Project deleted successfully')
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  return (
    <Card className={`relative ${!project.isActive ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 mr-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {project.name}
              {!project.isActive && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  Inactive
                </span>
              )}
            </CardTitle>
            {project.description && (
              <CardDescription className="text-sm">
                {project.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(project.githubUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSync} disabled={syncing || !project.isActive}>
                <RotateCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGenerateReport} disabled={loading || !project.isActive}>
                <FileText className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleActive}>
                {project.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reports:</span>
            <span className="font-medium">{project._count.reports}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last sync:</span>
            <span className="font-medium">
              {project.lastSyncAt 
                ? format(new Date(project.lastSyncAt), 'MMM d, HH:mm')
                : 'Never'
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {format(new Date(project.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
      <EditProjectDialog
        project={{
          id: project.id,
          name: project.name,
          description: project.description || null,
          aiProvider: project.aiProvider,
          aiModel: project.aiModel,
        }}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </Card>
  )
}
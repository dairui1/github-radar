'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Github, Calendar, Activity, Settings } from 'lucide-react'
import { AddProjectDialog } from '@/components/add-project-dialog'
import { ProjectCard } from '@/components/project-card'
import { RecentReports } from '@/components/recent-reports'
import { useRouter } from 'next/navigation'

interface Project {
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
}

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectAdded = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
    setShowAddDialog(false)
  }

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    )
  }

  const handleProjectDeleted = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Github className="h-8 w-8" />
            GitHub Radar
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and summarize GitHub project activities with AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p._count.reports, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Monitoring</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects being tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdated={handleProjectUpdated}
                onDeleted={handleProjectDeleted}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to GitHub Radar</CardTitle>
            <CardDescription>
              Start by adding your first GitHub project to monitor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports */}
      <RecentReports />

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onProjectAdded={handleProjectAdded}
      />
    </div>
  )
}

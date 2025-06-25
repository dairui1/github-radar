'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Github, Settings, ChevronRight } from 'lucide-react'
import { AddProjectDialog } from '@/components/add-project-dialog'
import { ActivityFeed } from '@/components/activity-feed'
import { QuickInsights } from '@/components/quick-insights'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Github className="h-8 w-8" />
            GitHub Radar
          </h1>
          <p className="text-muted-foreground mt-1">
            Your GitHub projects activity dashboard
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

      {/* Quick Insights */}
      <QuickInsights />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Sidebar - Projects and Quick Actions */}
        <div className="space-y-6">
          {/* Projects Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No projects yet
                  </p>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project._count.reports} reports
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                  {projects.length > 5 && (
                    <Link href="/projects">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View all {projects.length} projects
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/reports')}
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                View All Reports
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/projects')}
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Manage Projects
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onProjectAdded={handleProjectAdded}
      />
    </div>
  )
}

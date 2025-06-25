export interface ReportConfig {
  // Focus areas for the report
  focusAreas?: {
    issues?: boolean
    pullRequests?: boolean
    discussions?: boolean
    security?: boolean
    performance?: boolean
    documentation?: boolean
  }
  
  // Metrics to emphasize
  metrics?: {
    stars?: boolean
    forks?: boolean
    contributors?: boolean
    codeVelocity?: boolean
    communityEngagement?: boolean
  }
  
  // Report preferences
  preferences?: {
    includeCharts?: boolean
    maxIssuesShown?: number
    maxPRsShown?: number
    highlightNewContributors?: boolean
    includeCodeSnippets?: boolean
  }
  
  // Custom sections
  customSections?: Array<{
    title: string
    description: string
    keywords?: string[]
  }>
  
  // Alert thresholds
  alerts?: {
    criticalIssueKeywords?: string[]
    securityKeywords?: string[]
    performanceKeywords?: string[]
    minResponseTime?: number // hours
  }
}

export const defaultReportConfig: ReportConfig = {
  focusAreas: {
    issues: true,
    pullRequests: true,
    discussions: true,
    security: true,
    performance: true,
    documentation: false,
  },
  metrics: {
    stars: true,
    forks: true,
    contributors: true,
    codeVelocity: true,
    communityEngagement: true,
  },
  preferences: {
    includeCharts: false,
    maxIssuesShown: 50,
    maxPRsShown: 30,
    highlightNewContributors: true,
    includeCodeSnippets: false,
  },
  alerts: {
    criticalIssueKeywords: ['critical', 'urgent', 'blocker', 'security'],
    securityKeywords: ['vulnerability', 'exploit', 'CVE'],
    performanceKeywords: ['slow', 'performance', 'memory leak', 'crash'],
    minResponseTime: 24,
  },
}

export function mergeReportConfig(
  custom?: string | null,
  defaults: ReportConfig = defaultReportConfig
): ReportConfig {
  if (!custom) return defaults
  
  try {
    const parsed = JSON.parse(custom)
    return {
      focusAreas: { ...defaults.focusAreas, ...parsed.focusAreas },
      metrics: { ...defaults.metrics, ...parsed.metrics },
      preferences: { ...defaults.preferences, ...parsed.preferences },
      customSections: parsed.customSections || defaults.customSections,
      alerts: { ...defaults.alerts, ...parsed.alerts },
    }
  } catch (error) {
    console.error('Failed to parse report config:', error)
    return defaults
  }
}
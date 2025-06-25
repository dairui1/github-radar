import { openai } from '@ai-sdk/openai'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { LanguageModel } from 'ai'
import { getApiKey, getBaseUrl } from './settings'
import { ReportConfig } from './report-config'

export type AIProvider = 'openai' | 'openrouter' | 'anthropic' | 'google'
export type AIModel = string

export interface AIConfig {
  provider: AIProvider
  model: AIModel
  apiKey?: string
  baseURL?: string
}

export class AIService {
  private config: AIConfig

  constructor(config?: AIConfig) {
    this.config = config || {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: undefined
    }
  }

  private async getModel(): Promise<LanguageModel> {
    const apiKey = this.config.apiKey || await getApiKey(this.config.provider)
    
    if (!apiKey) {
      throw new Error(`No API key found for provider: ${this.config.provider}. Please configure it in Settings.`)
    }
    
    switch (this.config.provider) {
      case 'openai':
        const baseURL = this.config.baseURL || await getBaseUrl(this.config.provider)
        if (baseURL) {
          const customOpenAI = createOpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
          })
          return customOpenAI(this.config.model)
        }
        return openai(this.config.model)
      
      case 'openrouter':
        const openrouter = createOpenAI({
          apiKey: apiKey,
          baseURL: this.config.baseURL || 'https://openrouter.ai/api/v1',
        })
        return openrouter(this.config.model)
      
      case 'anthropic':
        // Will be implemented when @ai-sdk/anthropic is added
        throw new Error('Anthropic provider not yet implemented')
      
      case 'google':
        // Will be implemented when @ai-sdk/google is added
        throw new Error('Google provider not yet implemented')
      
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }
  }
  async generateReport(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date; labels?: string[] }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date; state?: string }>
      stats?: {
        current: Record<string, unknown>
        previous?: Record<string, unknown>
      }
    },
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY',
    options?: {
      detailLevel?: 'summary' | 'detailed'
      config?: ReportConfig
    }
  ) {
    const detailLevel = options?.detailLevel || 'detailed'
    const prompt = detailLevel === 'summary' 
      ? this.buildSummaryPrompt(projectName, data, reportType, options?.config)
      : this.buildPrompt(projectName, data, reportType, options?.config)
    
    try {
      const { text } = await generateText({
        model: await this.getModel(),
        prompt,
        maxTokens: detailLevel === 'summary' ? 1000 : 3000,
        temperature: 0.7,
      })

      return {
        content: text,
        summary: await this.generateSummary(text),
      }
    } catch (error) {
      console.error('Error generating report:', error)
      throw new Error('Failed to generate AI report')
    }
  }

  private buildPrompt(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date; labels?: string[] }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date; state?: string }>
      stats?: {
        current: Record<string, unknown>
        previous?: Record<string, unknown>
      }
    },
    reportType: string,
    config?: ReportConfig
  ): string {
    const timeframe = reportType.toLowerCase()
    
    // Calculate trends if we have previous stats
    let trendsSection = ''
    if (data.stats?.current && data.stats?.previous) {
      const starChange = data.stats.current.stars - (data.stats.previous.stars || 0)
      const forkChange = data.stats.current.forks - (data.stats.previous.forks || 0)
      const issueChange = data.stats.current.openIssues - (data.stats.previous.openIssues || 0)
      
      trendsSection = `
## Repository Trends:
- Stars: ${data.stats.current.stars} (${starChange >= 0 ? '+' : ''}${starChange})
- Forks: ${data.stats.current.forks} (${forkChange >= 0 ? '+' : ''}${forkChange})
- Open Issues: ${data.stats.current.openIssues} (${issueChange >= 0 ? '+' : ''}${issueChange})
- Weekly Activity: ${data.stats.current.commitsLastWeek} commits, ${data.stats.current.uniqueAuthorsLastWeek} unique authors
- Top Contributors: ${(data.stats.current.topContributors as Array<{ login: string }>)?.slice(0, 3).map((c) => `@${c.login}`).join(', ')}
`
    }
    
    const prompt = `Generate a comprehensive ${timeframe} report for the GitHub project "${projectName}". 

You are an expert GitHub project analyst. Your task is to analyze the following data and provide actionable insights with trend analysis, issue clustering, and impact assessment.

${trendsSection}

## Recent Issues (${data.issues.length} items):
${data.issues.slice(0, config?.preferences?.maxIssuesShown || 50).map(issue => `
- **${issue.title}** by @${issue.author} (${issue.createdAt.toLocaleDateString()})
  ${issue.body.slice(0, 200)}${issue.body.length > 200 ? '...' : ''}
`).join('\n')}

## Recent Discussions (${data.discussions.length} items):
${data.discussions.slice(0, 30).map(discussion => `
- **${discussion.title}** by @${discussion.author} (${discussion.createdAt.toLocaleDateString()})
  ${discussion.body.slice(0, 200)}${discussion.body.length > 200 ? '...' : ''}
`).join('\n')}

## Recent Pull Requests (${data.pullRequests.length} items):
${data.pullRequests.slice(0, config?.preferences?.maxPRsShown || 30).map(pr => `
- **${pr.title}** by @${pr.author} (${pr.createdAt.toLocaleDateString()})${pr.state ? ` [${pr.state}]` : ''}
  ${pr.body.slice(0, 200)}${pr.body.length > 200 ? '...' : ''}
`).join('\n')}

Please provide a structured report with the following sections:

1. **Executive Summary** (3-4 sentences)
   - Overall project health and activity level
   - Key metrics and their trends
   - Most significant developments

2. **Trend Analysis**
   - Compare current activity with historical patterns
   - Identify acceleration or deceleration in different areas
   - Highlight any anomalies or significant changes

3. **Issue Clustering & Analysis**
   - Group similar issues into themes (e.g., "Performance", "UI/UX", "Security", "Documentation")
   - For each cluster, provide:
     - Number of issues
     - Severity assessment (Critical/High/Medium/Low)
     - Common root causes if identifiable
     - Estimated impact on users

4. **Development Velocity**
   - PR merge rate and time to merge
   - Code review activity
   - Key contributors and their focus areas
   - Technical debt indicators

5. **Community Health Metrics**
   - Response time to issues
   - Engagement rate (comments, reactions)
   - New vs returning contributors
   - Geographic/timezone distribution if apparent

6. **Risk Assessment**
   - Critical unresolved issues
   - Security concerns
   - Maintainer burnout indicators
   - Technical debt accumulation

7. **Recommendations** (Prioritized)
   - Immediate actions (next 1-3 days)
   - Short-term improvements (next week)
   - Strategic considerations (next month)

8. **Notable Achievements**
   - Resolved critical issues
   - Successful feature launches
   - Community milestones

Use data-driven insights and avoid generic statements. Include specific issue numbers, PR numbers, and contributor names where relevant. Format with clear markdown, use tables for metrics where appropriate, and highlight critical items with bold or emoji indicators (🔴 Critical, 🟡 Warning, 🟢 Good).

${config?.customSections ? `
Additional Custom Sections to Include:
${config.customSections.map(section => `
- **${section.title}**: ${section.description}
  Keywords to watch for: ${section.keywords?.join(', ') || 'None'}
`).join('\n')}
` : ''}

${config?.alerts ? `
Alert Criteria:
- Critical Issue Keywords: ${config.alerts.criticalIssueKeywords?.join(', ')}
- Security Keywords: ${config.alerts.securityKeywords?.join(', ')}
- Performance Keywords: ${config.alerts.performanceKeywords?.join(', ')}
${config.alerts.minResponseTime ? `- Flag issues without response for more than ${config.alerts.minResponseTime} hours` : ''}
` : ''}

${config?.focusAreas ? `
Focus Areas (emphasize these aspects):
${Object.entries(config.focusAreas).filter(([, enabled]) => enabled).map(([area]) => `- ${area}`).join('\n')}
` : ''}`

    return prompt
  }

  private buildSummaryPrompt(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date; labels?: string[] }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date; state?: string }>
      stats?: {
        current: Record<string, unknown>
        previous?: Record<string, unknown>
      }
    },
    reportType: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _config?: ReportConfig
  ): string {
    const timeframe = reportType.toLowerCase()
    
    // Stats summary
    let statsLine = ''
    if (data.stats?.current) {
      const s = data.stats.current as {
        stars: number
        forks: number  
        openIssues: number
        commitsLastWeek: number
      }
      statsLine = `Repository: ${s.stars} stars, ${s.forks} forks, ${s.openIssues} open issues, ${s.commitsLastWeek} commits last week\n`
    }
    
    const prompt = `Generate a concise ${timeframe} executive summary for the GitHub project "${projectName}".

${statsLine}
Activity Summary:
- ${data.issues.length} new/updated issues
- ${data.discussions.length} discussions
- ${data.pullRequests.length} pull requests

Provide a brief report (max 500 words) with ONLY these sections:

1. **Project Status** (1-2 sentences)
   - Overall health indicator (🟢 Healthy, 🟡 Needs Attention, 🔴 Critical)
   - Key metric highlights

2. **Top 3 Priorities**
   - Most critical issues or decisions needed
   - Use bullet points with specific issue/PR numbers

3. **Key Metrics**
   - Activity trends (↑ ↓ →)
   - Community engagement level
   - Development velocity

4. **Action Required** (if any)
   - Immediate steps needed
   - Critical blockers

Keep it executive-friendly, data-driven, and actionable. Focus on what matters most.`

    return prompt
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: await this.getModel(),
        prompt: `Summarize the following GitHub project report in 2-3 sentences, highlighting the most important points:

${content}

Summary:`,
        maxTokens: 150,
        temperature: 0.5,
      })

      return text.trim()
    } catch (error) {
      console.error('Error generating summary:', error)
      // Fallback to first paragraph if AI fails
      const firstParagraph = content.split('\n\n')[0]
      return firstParagraph.slice(0, 200) + (firstParagraph.length > 200 ? '...' : '')
    }
  }
}
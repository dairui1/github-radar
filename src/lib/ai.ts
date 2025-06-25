import { openai } from '@ai-sdk/openai'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { LanguageModel } from 'ai'
import { getApiKey, getBaseUrl } from './settings'
import { prisma } from './db'

export type AIProvider = 'openai' | 'openrouter' | 'deepseek' | 'anthropic' | 'google'
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
      
      case 'deepseek':
        const deepseek = createOpenAI({
          apiKey: apiKey,
          baseURL: this.config.baseURL || 'https://api.deepseek.com',
        })
        return deepseek(this.config.model)
      
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
      issues: Array<{ title: string; body: string; author: string; createdAt: Date }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date }>
    },
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ) {
    const prompt = await this.buildPrompt(projectName, data, reportType)
    
    try {
      const { text } = await generateText({
        model: await this.getModel(),
        prompt,
        maxTokens: 2000,
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

  private async buildPrompt(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date }>
    },
    reportType: string
  ): Promise<string> {
    const timeframe = reportType.toLowerCase()
    
    // Try to get custom prompt template from settings
    let promptTemplate: string | null = null
    try {
      const setting = await prisma.settings.findUnique({
        where: { key: 'REPORT_PROMPT_TEMPLATE' },
      })
      if (setting?.value) {
        promptTemplate = setting.value
      }
    } catch (error) {
      console.error('Error fetching report prompt template:', error)
    }
    
    // Use default template if custom not found
    if (!promptTemplate) {
      promptTemplate = `Generate a comprehensive {timeframe} report for the GitHub project "{projectName}". 

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
    }
    
    // Format issues, discussions, and PRs
    const issuesText = data.issues.map(issue => `
- **${issue.title}** by @${issue.author} (${issue.createdAt.toLocaleDateString()})
  ${issue.body.slice(0, 200)}${issue.body.length > 200 ? '...' : ''}
`).join('\n')
    
    const discussionsText = data.discussions.map(discussion => `
- **${discussion.title}** by @${discussion.author} (${discussion.createdAt.toLocaleDateString()})
  ${discussion.body.slice(0, 200)}${discussion.body.length > 200 ? '...' : ''}
`).join('\n')
    
    const pullRequestsText = data.pullRequests.map(pr => `
- **${pr.title}** by @${pr.author} (${pr.createdAt.toLocaleDateString()})
  ${pr.body.slice(0, 200)}${pr.body.length > 200 ? '...' : ''}
`).join('\n')
    
    // Replace variables in template
    const prompt = promptTemplate
      .replace(/{projectName}/g, projectName)
      .replace(/{timeframe}/g, timeframe)
      .replace(/{issueCount}/g, String(data.issues.length))
      .replace(/{issues}/g, issuesText)
      .replace(/{discussionCount}/g, String(data.discussions.length))
      .replace(/{discussions}/g, discussionsText)
      .replace(/{prCount}/g, String(data.pullRequests.length))
      .replace(/{pullRequests}/g, pullRequestsText)

    return prompt
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      // Try to get custom summary prompt template from settings
      let promptTemplate: string | null = null
      try {
        const setting = await prisma.settings.findUnique({
          where: { key: 'SUMMARY_PROMPT_TEMPLATE' },
        })
        if (setting?.value) {
          promptTemplate = setting.value
        }
      } catch (error) {
        console.error('Error fetching summary prompt template:', error)
      }
      
      // Use default template if custom not found
      if (!promptTemplate) {
        promptTemplate = `Summarize the following GitHub project report in 2-3 sentences, highlighting the most important points:

{content}

Summary:`
      }
      
      // Replace variables in template
      const prompt = promptTemplate.replace(/{content}/g, content)
      
      const { text } = await generateText({
        model: await this.getModel(),
        prompt,
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
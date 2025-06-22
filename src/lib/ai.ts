import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export class AIService {
  async generateReport(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date }>
    },
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ) {
    const prompt = this.buildPrompt(projectName, data, reportType)
    
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
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

  private buildPrompt(
    projectName: string,
    data: {
      issues: Array<{ title: string; body: string; author: string; createdAt: Date }>
      discussions: Array<{ title: string; body: string; author: string; createdAt: Date }>
      pullRequests: Array<{ title: string; body: string; author: string; createdAt: Date }>
    },
    reportType: string
  ): string {
    const timeframe = reportType.toLowerCase()
    
    const prompt = `Generate a comprehensive ${timeframe} report for the GitHub project "${projectName}". 

Please analyze the following data and provide insights:

## Recent Issues (${data.issues.length} items):
${data.issues.map(issue => `
- **${issue.title}** by @${issue.author} (${issue.createdAt.toLocaleDateString()})
  ${issue.body.slice(0, 200)}${issue.body.length > 200 ? '...' : ''}
`).join('\n')}

## Recent Discussions (${data.discussions.length} items):
${data.discussions.map(discussion => `
- **${discussion.title}** by @${discussion.author} (${discussion.createdAt.toLocaleDateString()})
  ${discussion.body.slice(0, 200)}${discussion.body.length > 200 ? '...' : ''}
`).join('\n')}

## Recent Pull Requests (${data.pullRequests.length} items):
${data.pullRequests.map(pr => `
- **${pr.title}** by @${pr.author} (${pr.createdAt.toLocaleDateString()})
  ${pr.body.slice(0, 200)}${pr.body.length > 200 ? '...' : ''}
`).join('\n')}

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

    return prompt
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
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
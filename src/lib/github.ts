import { Octokit } from '@octokit/rest'
import { getGithubToken } from './settings'

export class GitHubService {
  private octokit: Octokit | null = null

  private async getOctokit() {
    if (!this.octokit) {
      const token = await getGithubToken()
      if (!token) {
        throw new Error('GitHub token not configured. Please configure it in Settings.')
      }
      this.octokit = new Octokit({
        auth: token,
      })
    }
    return this.octokit
  }

  async getRepository(owner: string, repo: string) {
    try {
      const octokit = await this.getOctokit()
      const { data } = await octokit.rest.repos.get({
        owner,
        repo,
      })
      return data
    } catch (error) {
      console.error('Error fetching repository:', error)
      throw new Error('Failed to fetch repository information')
    }
  }

  async getIssues(owner: string, repo: string, since?: string) {
    try {
      const octokit = await this.getOctokit()
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        since,
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      })
      
      // Filter out pull requests (GitHub API includes PRs in issues)
      return data.filter(issue => !issue.pull_request)
    } catch (error) {
      console.error('Error fetching issues:', error)
      throw new Error('Failed to fetch issues')
    }
  }

  async getDiscussions(owner: string, repo: string) {
    try {
      const query = `
        query($owner: String!, $repo: String!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            discussions(first: 100, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                number
                title
                body
                createdAt
                updatedAt
                author {
                  login
                }
                url
              }
            }
          }
        }
      `

      const octokit = await this.getOctokit()
      const response = await octokit.graphql(query, {
        owner,
        repo,
      })

      type Discussion = {
        id: string
        number: number
        title: string
        body: string
        createdAt: string
        updatedAt: string
        author: { login: string } | null
        url: string
      }

      return (response as { repository: { discussions: { nodes: Discussion[] } } }).repository.discussions.nodes
    } catch (error) {
      console.error('Error fetching discussions:', error)
      // Fallback to empty array if discussions are not enabled
      return []
    }
  }

  async getPullRequests(owner: string, repo: string, since?: string) {
    try {
      const octokit = await this.getOctokit()
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      })
      
      if (since) {
        const sinceDate = new Date(since)
        return data.filter(pr => new Date(pr.updated_at) > sinceDate)
      }
      
      return data
    } catch (error) {
      console.error('Error fetching pull requests:', error)
      throw new Error('Failed to fetch pull requests')
    }
  }

  async getRepositoryStats(owner: string, repo: string) {
    try {
      const octokit = await this.getOctokit()
      
      // Get repository details
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo,
      })
      
      // Get contributors stats
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      })
      
      // Get recent commits (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        since: thirtyDaysAgo.toISOString(),
        per_page: 100,
      })
      
      // Get languages
      const { data: languages } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      })
      
      return {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        openIssues: repoData.open_issues_count,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        language: repoData.language,
        languages,
        contributorsCount: contributors.length,
        topContributors: contributors.slice(0, 10).map(c => ({
          login: c.login,
          contributions: c.contributions,
          avatar_url: c.avatar_url,
        })),
        recentCommitsCount: commits.length,
        lastCommitDate: commits[0]?.commit.author?.date || null,
      }
    } catch (error) {
      console.error('Error fetching repository stats:', error)
      throw new Error('Failed to fetch repository statistics')
    }
  }

  async getRecentActivity(owner: string, repo: string, days: number = 7) {
    try {
      const octokit = await this.getOctokit()
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toISOString()
      
      // Get commit activity
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        since: sinceStr,
        per_page: 100,
      })
      
      // Get issue events
      const { data: issueEvents } = await octokit.rest.issues.listEventsForRepo({
        owner,
        repo,
        per_page: 100,
      })
      
      const recentIssueEvents = issueEvents.filter(
        event => new Date(event.created_at) > since
      )
      
      return {
        commits: commits.length,
        issueEvents: recentIssueEvents.length,
        uniqueAuthors: new Set(commits.map(c => c.author?.login).filter(Boolean)).size,
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return {
        commits: 0,
        issueEvents: 0,
        uniqueAuthors: 0,
      }
    }
  }

  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/i)
    if (!match) return null
    
    const [, owner, repo] = match
    return { 
      owner, 
      repo: repo.replace(/\.git$/, '') 
    }
  }
}
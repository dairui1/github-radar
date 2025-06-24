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
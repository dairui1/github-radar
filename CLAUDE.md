# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Radar is a Next.js 15 application for monitoring GitHub repositories and generating AI-powered reports. Built with TypeScript, Prisma (SQLite), and multi-provider AI integration supporting OpenAI, Claude (via OpenRouter), Llama, Mistral, and more.

## Development Commands

```bash
# Development server with Turbopack
pnpm dev
# or npm run dev

# Production build
pnpm build
# or npm run build

# Production server
pnpm start
# or npm start

# Linting
pnpm lint
# or npm run lint

# Database operations
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create migration (development)
```

## Architecture

### App Router Structure
- `src/app/` - Next.js App Router pages and API routes
  - `page.tsx` - Home dashboard with project cards and stats
  - `settings/` - Settings page for AI provider configuration
  - `reports/[id]/` - Individual report detail pages
- `src/app/api/` - Backend API endpoints
  - `projects/` - CRUD operations for projects
  - `reports/` - Report generation and retrieval
  - `sync/` - GitHub data synchronization
  - `cron/` - Scheduled task endpoints
  - `settings/` - Settings management
  - `openrouter/` - OpenRouter model fetching
  - `health/` - Health check endpoint
- `src/components/` - React components
  - `ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
  - `ProjectCard.tsx` - Project display with actions
  - `AddProjectDialog.tsx` - Add new project form
  - `RecentReports.tsx` - Report list component
- `src/lib/` - Core utilities and services
  - `ai.ts` - AI service with provider abstraction
  - `ai-config.ts` - AI provider configuration
  - `db.ts` - Prisma database client
  - `github.ts` - GitHub API integration
  - `settings.ts` - Settings service
  - `utils.ts` - Utility functions

### Database Models (Prisma Schema)
- **Project**: GitHub repositories being monitored
  - `id`, `name`, `description`, `githubUrl`, `owner`, `repo`
  - `isActive` - Toggle monitoring on/off
  - `lastSyncAt` - Last data sync timestamp
  - `aiProvider`, `aiModel` - Per-project AI configuration
  - Relations: has many Reports and RawData
- **Report**: AI-generated reports (daily/weekly/monthly)
  - `id`, `projectId` (relation), `title`, `content`, `summary`
  - `reportType` - DAILY, WEEKLY, MONTHLY
  - `reportDate`, `createdAt`
  - `issuesCount`, `discussionsCount` - Statistics
- **RawData**: Cached GitHub data (issues, discussions, PRs)
  - `id`, `projectId` (relation), `type`, `githubId`
  - `title`, `body`, `author`, `url`
  - `createdAt`, `updatedAt`, `syncedAt`
  - Unique constraint on (projectId, githubId, type)
- **Settings**: Configuration and API keys
  - `id`, `key`, `value`, `encrypted`
  - Stores API keys and global settings

### Key Integration Points
- GitHub API via Octokit (`src/lib/github.ts`)
- Multi-provider AI via Vercel AI SDK (`src/lib/ai.ts`)
  - Supports OpenAI, OpenRouter (with Claude, Llama, Mistral, etc.)
  - Provider configuration per project (`src/lib/ai-config.ts`)
- Prisma ORM (`src/lib/db.ts`)

## Environment Variables

### Required
```env
DATABASE_URL=file:./dev.db              # SQLite database path
GITHUB_TOKEN=your_github_token          # GitHub personal access token
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Application URL
CRON_SECRET=your_cron_secret            # Secret for cron endpoint authentication
```

### AI Provider Keys (at least one required)
```env
OPENAI_API_KEY=your_openai_key          # For OpenAI GPT models
OPENROUTER_API_KEY=your_openrouter_key  # For Claude, Llama, Mistral via OpenRouter
```

> Note: API keys can also be configured through the Settings page UI after initial setup.

## Technology Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **Database**: SQLite with Prisma ORM
- **UI**: 
  - Tailwind CSS v4 with shadcn/ui components
  - Lucide React for icons
  - React Hook Form with Zod validation
- **AI Integration**: 
  - Vercel AI SDK for unified AI interface
  - OpenAI SDK for GPT models
  - OpenRouter for Claude, Llama, Mistral access
  - Custom provider support (Azure OpenAI, LocalAI)
- **GitHub**: Octokit.js for API integration
- **State Management**: React Server Components + Client Components
- **Deployment**: Docker with standalone output
- **Package Manager**: pnpm (preferred) or npm

## API Endpoints

### Projects Management
- `GET /api/projects` - List all projects with report counts
- `POST /api/projects` - Create new project (validates GitHub URL)
- `PUT /api/projects/[id]` - Update project (activate/deactivate, change AI settings)
- `DELETE /api/projects/[id]` - Delete project (cascades to reports and raw data)

### Reports
- `GET /api/reports` - List all reports (supports pagination)
- `GET /api/reports/[id]` - Get specific report details
- `POST /api/reports/generate` - Generate new AI report
  - Body: `{ projectId, reportType: "DAILY" | "WEEKLY" | "MONTHLY" }`

### Synchronization
- `POST /api/sync/[projectId]` - Manually sync GitHub data for project
  - Fetches issues, discussions, pull requests
  - Updates lastSyncAt timestamp
- `POST /api/cron/sync` - Automated sync endpoint
  - Protected by CRON_SECRET header
  - Syncs all active projects

### Settings
- `GET /api/settings` - Get all settings (API keys masked)
- `POST /api/settings` - Create/update setting
  - Body: `{ key, value, encrypted?: boolean }`
- `DELETE /api/settings?key=[key]` - Delete specific setting

### Utilities
- `GET /api/health` - Health check (returns status and timestamp)
- `POST /api/openrouter/models` - Fetch available OpenRouter models
  - Requires OpenRouter API key in settings

## Development Workflow

### Adding New Features
1. **Database Changes**: Update `prisma/schema.prisma` and run migrations
2. **API Routes**: Add new routes in `src/app/api/`
3. **UI Components**: Use shadcn/ui components from `src/components/ui/`
4. **Type Safety**: Define types/interfaces for all data structures
5. **Error Handling**: Use try-catch blocks and return appropriate HTTP status codes

### Working with AI Providers
1. **Add New Provider**: Extend `src/lib/ai.ts` with new provider class
2. **Configure Models**: Update `src/lib/ai-config.ts` with model definitions
3. **Settings Integration**: Add provider settings in `src/app/settings/`
4. **Test Integration**: Verify with different report types

### Best Practices
1. **Security**: Never expose API keys in client code or logs
2. **Performance**: Use React Server Components for data fetching
3. **Error Messages**: Provide clear, actionable error messages
4. **Type Safety**: Leverage TypeScript for all new code
5. **Database**: Use Prisma transactions for related operations

## Common Tasks

### Update Database Schema
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

### Add New AI Provider
1. Create provider class in `src/lib/ai.ts`
2. Add configuration in `src/lib/ai-config.ts`
3. Update settings UI in `src/app/settings/page.tsx`
4. Test with report generation

### Debug API Endpoints
1. Check request/response in browser DevTools
2. Review server logs for errors
3. Test with curl or API client
4. Verify environment variables

## Deployment Checklist
1. Set all required environment variables
2. Run database migrations
3. Build production bundle
4. Test health endpoint
5. Configure cron jobs for automation
6. Monitor logs for errors
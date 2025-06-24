# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Radar is a Next.js 15 application for monitoring GitHub repositories and generating AI-powered reports. Built with TypeScript, Prisma (SQLite), and OpenAI integration.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint

# Database operations
npx prisma generate
npx prisma db push
npx prisma studio
```

## Architecture

### App Router Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - Backend API endpoints (projects, reports, sync, cron)
- `src/components/` - React components including shadcn/ui components
- `src/lib/` - Core utilities (ai.ts, db.ts, github.ts, utils.ts)

### Database Models
- **Project**: GitHub repositories being monitored
- **Report**: AI-generated reports (daily/weekly/monthly)
- **RawData**: Cached GitHub data (issues, discussions, PRs)

### Key Integration Points
- GitHub API via Octokit (`src/lib/github.ts`)
- Multi-provider AI via Vercel AI SDK (`src/lib/ai.ts`)
  - Supports OpenAI, OpenRouter (with Claude, Llama, Mistral, etc.)
  - Provider configuration per project (`src/lib/ai-config.ts`)
- Prisma ORM (`src/lib/db.ts`)

## Required Environment Variables

```env
DATABASE_URL=file:./dev.db
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key  # Required for OpenRouter provider
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_cron_secret
```

## Technology Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS v4 with shadcn/ui components
- **AI**: Vercel AI SDK with OpenAI
- **GitHub**: Octokit.js
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Docker with standalone output

## API Endpoints

- `/api/projects` - CRUD operations for monitored repositories
- `/api/reports` - Report generation and retrieval
- `/api/sync` - GitHub data synchronization
- `/api/cron` - Scheduled task endpoints
- `/api/health` - Health check endpoint
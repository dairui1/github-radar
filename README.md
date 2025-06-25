# GitHub Radar 📡

An intelligent GitHub project monitoring system that automatically tracks issues, discussions, and pull requests from your favorite repositories, then generates AI-powered daily reports to keep you informed about what's happening in the open source world.

## ✨ Features

- **🔍 Multi-Repository Monitoring**: Track multiple GitHub repositories simultaneously
- **🤖 Multi-Provider AI Support**: Generate reports using OpenAI, Claude (via OpenRouter), Llama, Mistral, and more
- **📱 Mobile-First Design**: Responsive web interface optimized for mobile devices
- **⚡ Real-time Sync**: Manual and automatic synchronization with GitHub
- **📊 Analytics Dashboard**: Project statistics and monitoring insights
- **🔄 Automated Scheduling**: Configurable cron jobs for data collection
- **🛠️ Per-Project Configuration**: Different AI models/providers for each monitored project
- **🔐 Secure Settings Storage**: Encrypted API keys stored in database
- **🎨 Settings UI**: User-friendly interface for managing API keys and configuration
- **🐳 Docker Ready**: Easy deployment with Docker and Docker Compose

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router + Turbopack)
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS v4 + shadcn/ui
- **AI**: Vercel AI SDK with multiple providers
  - OpenAI (GPT-4, GPT-3.5)
  - OpenRouter (Claude, Llama, Mistral, and more)
  - Support for custom OpenAI-compatible endpoints
- **GitHub API**: Octokit.js
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- Docker and Docker Compose (for deployment)
- GitHub Personal Access Token
- At least one AI provider API key:
  - OpenAI API Key (for GPT models)
  - OpenRouter API Key (for Claude, Llama, Mistral, etc.)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd github-radar-app
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Fill in your `.env` file:
```env
DATABASE_URL="file:./dev.db"
GITHUB_TOKEN="your_github_token_here"
OPENAI_API_KEY="your_openai_api_key_here"           # Optional if using OpenRouter
OPENROUTER_API_KEY="your_openrouter_key_here"       # Optional if using OpenAI
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your_secret_key_here"
```

> **Note**: You need at least one AI provider API key. You can configure additional providers later through the Settings page.

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:
```bash
pnpm dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### First Time Setup

1. **Configure AI Providers**: Navigate to Settings page (`/settings`) to configure your API keys
2. **Add Your First Project**: Click "Add Project" and enter a GitHub repository URL
3. **Sync Data**: Click the sync button to fetch the latest data from GitHub
4. **Generate Report**: Click "Generate Report" to create your first AI-powered summary

## 🐳 Production Deployment

### Using Docker Compose (Recommended)

1. Make sure you have your `.env` file configured
2. Run the deployment script:
```bash
./scripts/deploy.sh
```

### Manual Docker Deployment

```bash
# Build the image
docker-compose build

# Set up database
docker-compose run --rm github-radar npx prisma db push

# Start the application
docker-compose up -d

# Optional: Enable automatic sync
docker-compose --profile with-scheduler up -d
```

## 📚 Usage Guide

### Managing AI Providers

1. Navigate to **Settings** (`/settings`)
2. Configure your AI provider API keys:
   - **OpenAI**: For GPT-4 and GPT-3.5 models
   - **OpenRouter**: For Claude, Llama, Mistral, and more
3. Set default provider and model for new projects
4. (Optional) Add custom models or configure base URLs for OpenAI-compatible providers

### Adding a Project

1. Click "Add Project" on the dashboard
2. Enter the GitHub repository URL (e.g., `https://github.com/owner/repo`)
3. Provide a project name and optional description
4. Select AI provider and model (or use defaults)
5. Click "Add Project"

### Syncing Data

- **Manual Sync**: Click the sync button on any project card
- **Automatic Sync**: Enable the cron scheduler for hourly synchronization

### Generating Reports

- **Manual**: Click "Generate Report" and select report type (daily/weekly/monthly)
- **Automatic**: Set up cron jobs for scheduled report generation
- **Per-Project AI**: Each project can use different AI providers/models

### API Endpoints

The application provides several API endpoints:

#### Projects
- `GET /api/projects` - List all projects with report counts
- `POST /api/projects` - Create a new project
- `PUT /api/projects/{id}` - Update project (activate/deactivate)
- `DELETE /api/projects/{id}` - Delete project and related data

#### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/{id}` - Get specific report
- `POST /api/reports/generate` - Generate AI report

#### Synchronization
- `POST /api/sync/{projectId}` - Sync GitHub data for a project
- `POST /api/cron/sync` - Scheduled sync endpoint (protected)

#### Settings
- `GET /api/settings` - Get all settings (keys masked)
- `POST /api/settings` - Create/update setting
- `DELETE /api/settings?key={key}` - Delete setting

#### Utilities
- `GET /api/health` - Health check endpoint
- `POST /api/openrouter/models` - Get available OpenRouter models

## 🔧 Configuration

### GitHub Token Setup

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with these permissions:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
   - `read:discussion` (for discussions)

### AI Provider Setup

#### OpenAI
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add it to Settings page or environment variables

#### OpenRouter
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up and get your API key
3. Add it to Settings page or environment variables
4. Access models like Claude 3.5, Llama 3, Mistral, and more

#### Custom Providers
- Support for Azure OpenAI, LocalAI, or any OpenAI-compatible API
- Configure base URL in Settings page
- Use custom model names as needed

### Cron Scheduling

The application supports automatic synchronization via cron jobs. Configure the frequency by modifying the `docker-compose.yml` file or setting up external cron jobs that call the `/api/cron/sync` endpoint.

## 📊 Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Mobile Web UI     │────│   Next.js 15 App    │────│   GitHub API        │
│   (React/Tailwind)  │    │   (App Router)       │    │   (Octokit)         │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │                            
                                      ▼                            
                             ┌──────────────────────┐    ┌─────────────────────┐
                             │   SQLite Database    │    │   AI Providers      │
                             │   (Prisma ORM)       │    │ - OpenAI            │
                             │ - Projects           │    │ - OpenRouter        │
                             │ - Reports            │    │ - Custom Endpoints  │
                             │ - RawData            │    └─────────────────────┘
                             │ - Settings           │
                             └──────────────────────┘
```

### Key Components

- **Frontend**: Next.js 15 with App Router, React Server Components, and Tailwind CSS v4
- **API Layer**: RESTful API routes with type-safe request/response handling
- **Database**: SQLite with Prisma ORM for data persistence
- **AI Service**: Abstracted AI provider interface supporting multiple models
- **GitHub Integration**: Octokit for fetching issues, PRs, and discussions
- **Settings Service**: Secure configuration management with encryption support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](../../issues) for existing solutions
2. Create a new issue with detailed information
3. Join our [Discussions](../../discussions) for community support

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) for the amazing React framework
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Prisma](https://prisma.io) for database management
- [OpenAI](https://openai.com) for GPT models
- [OpenRouter](https://openrouter.ai/) for multi-model AI access
- [Octokit](https://github.com/octokit/octokit.js) for GitHub API integration

---

Made with ❤️ for the open source community

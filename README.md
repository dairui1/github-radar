# GitHub Radar 📡

An intelligent GitHub project monitoring system that automatically tracks issues, discussions, and pull requests from your favorite repositories, then generates AI-powered daily reports to keep you informed about what's happening in the open source world.

## ✨ Features

- **🔍 Multi-Repository Monitoring**: Track multiple GitHub repositories simultaneously
- **🤖 AI-Powered Reports**: Automated daily/weekly/monthly reports using OpenAI GPT
- **📱 Mobile-First Design**: Responsive web interface optimized for mobile devices
- **⚡ Real-time Sync**: Manual and automatic synchronization with GitHub
- **📊 Analytics Dashboard**: Project statistics and monitoring insights
- **🔄 Automated Scheduling**: Configurable cron jobs for data collection
- **🐳 Docker Ready**: Easy deployment with Docker and Docker Compose

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: Vercel AI SDK + OpenAI
- **GitHub API**: Octokit.js
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for deployment)
- GitHub Personal Access Token
- OpenAI API Key

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd github-radar-app
```

2. Install dependencies:
```bash
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
OPENAI_API_KEY="your_openai_api_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your_secret_key_here"
```

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

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

### Adding a Project

1. Click "Add Project" on the dashboard
2. Enter the GitHub repository URL (e.g., `https://github.com/owner/repo`)
3. Provide a project name and optional description
4. Click "Add Project"

### Syncing Data

- **Manual Sync**: Click the sync button on any project card
- **Automatic Sync**: Enable the cron scheduler for hourly synchronization

### Generating Reports

- **Manual**: Click "Generate Report" on any project
- **Automatic**: Reports are auto-generated when new data is synced

### API Endpoints

The application provides several API endpoints:

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `POST /api/sync/{projectId}` - Sync project data
- `POST /api/reports/generate` - Generate AI report
- `GET /api/reports` - List reports
- `POST /api/cron/sync` - Scheduled sync endpoint

## 🔧 Configuration

### GitHub Token Setup

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with these permissions:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
   - `read:discussion` (for discussions)

### OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add it to your environment variables

### Cron Scheduling

The application supports automatic synchronization via cron jobs. Configure the frequency by modifying the `docker-compose.yml` file or setting up external cron jobs that call the `/api/cron/sync` endpoint.

## 📊 Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Mobile Web UI     │────│   Next.js App       │────│   GitHub API        │
│   (React/Tailwind)  │    │   (API Routes)       │    │   (Data Source)     │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │                            
                                      ▼                            
                             ┌──────────────────────┐    ┌─────────────────────┐
                             │   SQLite Database    │    │   OpenAI API        │
                             │   (Prisma ORM)       │    │   (Report Generation)│
                             └──────────────────────┘    └─────────────────────┘
```

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
- [OpenAI](https://openai.com) for AI-powered report generation

---

Made with ❤️ for the open source community

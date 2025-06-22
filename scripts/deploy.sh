#!/bin/bash

# GitHub Radar Deployment Script

set -e

echo "🚀 Starting GitHub Radar deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with the required environment variables."
    echo "Required variables:"
    echo "  DATABASE_URL"
    echo "  GITHUB_TOKEN"
    echo "  OPENAI_API_KEY"
    echo "  CRON_SECRET"
    echo "  NEXT_PUBLIC_APP_URL"
    exit 1
fi

# Create data directory for database
mkdir -p data

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start the application
echo "🏗️  Building Docker image..."
docker-compose build

echo "🔄 Setting up database..."
# Initialize database
docker-compose run --rm github-radar npx prisma db push

echo "🚀 Starting application..."
docker-compose up -d

echo "✅ GitHub Radar has been deployed successfully!"
echo "📱 Application is available at: http://localhost:3000"
echo "🔧 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"

# Optional: Set up cron job scheduler
read -p "🕒 Do you want to enable automatic synchronization? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏰ Starting cron scheduler..."
    docker-compose --profile with-scheduler up -d
    echo "✅ Automatic sync enabled (runs every hour)"
fi

echo "🎉 Deployment complete!"
#!/bin/bash

echo "🚀 Viking Chess Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Starting deployment process..."

# 1. Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# 2. Generate database migrations
print_status "Generating database migrations..."
npm run db:generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate migrations"
    exit 1
fi
print_success "Database migrations generated"

# 3. Build the application
print_status "Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi
print_success "Application built successfully"

# 4. Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing globally..."
    npm install -g vercel
fi

# 5. Deploy to Vercel
print_status "Deploying to Vercel..."
print_warning "Make sure you have set the following environment variables in Vercel:"
echo "  - DATABASE_URL"
echo "  - NEXTAUTH_URL"
echo "  - NEXTAUTH_SECRET"
echo ""
print_status "Deploying..."

vercel --prod
if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
print_status "Don't forget to run database migrations on your production database"
print_status "You can do this by connecting to your Neon database and running the migration SQL"
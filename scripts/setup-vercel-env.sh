#!/bin/bash

echo "🚀 Setting up Vercel Environment Variables"
echo "=========================================="
echo ""
echo "Run these commands in your terminal after installing Vercel CLI:"
echo ""
echo "1. Install Vercel CLI (if not already installed):"
echo "   npm i -g vercel"
echo ""
echo "2. Login to Vercel:"
echo "   vercel login"
echo ""
echo "3. Link your project:"
echo "   vercel link"
echo ""
echo "4. Set environment variables:"
echo ""

# Read the current .env file and convert to vercel env commands
if [ -f ".env" ]; then
    echo "# Database Configuration"
    echo "vercel env add DATABASE_URL production"
    echo "# When prompted, paste: $(grep DATABASE_URL .env | cut -d'=' -f2- | tr -d '"')"
    echo ""
    
    echo "# NextAuth Configuration"
    echo "vercel env add NEXTAUTH_URL production"
    echo "# When prompted, enter your production URL: https://your-app-name.vercel.app"
    echo ""
    
    echo "vercel env add NEXTAUTH_SECRET production"
    echo "# When prompted, enter a long random string (generate one below)"
    echo ""
    
    echo "5. Generate a secure NEXTAUTH_SECRET:"
    echo "   openssl rand -base64 32"
    echo ""
    
    echo "6. Deploy your app:"
    echo "   vercel --prod"
    echo ""
else
    echo "❌ .env file not found!"
    echo "Make sure you're in the project root directory."
fi

echo "📝 Alternative: Set via Vercel Dashboard"
echo "======================================="
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the variables manually"
echo ""
echo "Required Variables:"
echo "- DATABASE_URL (your Neon PostgreSQL connection string)"
echo "- NEXTAUTH_URL (your production URL)"
echo "- NEXTAUTH_SECRET (a long random string)"
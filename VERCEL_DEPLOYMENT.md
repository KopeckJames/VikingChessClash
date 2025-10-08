# 🚀 Vercel Deployment Guide

## Quick Fix for Current Error

The error `Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist` means you need to set up environment variables in Vercel.

### Method 1: Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Select your project**
3. **Navigate to Settings → Environment Variables**
4. **Add these variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_h9slZHJF6mur@ep-tiny-scene-ad8s3c18-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Production |

5. **Redeploy your application**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production

# Deploy
vercel --prod
```

## Environment Variables Needed

### Required Variables

- **`DATABASE_URL`**: Your Neon PostgreSQL connection string
- **`NEXTAUTH_URL`**: Your production domain (e.g., `https://viking-chess.vercel.app`)
- **`NEXTAUTH_SECRET`**: A secure random string for JWT signing

### Optional Variables (for OAuth)

- **`GOOGLE_CLIENT_ID`**: Google OAuth client ID
- **`GOOGLE_CLIENT_SECRET`**: Google OAuth client secret
- **`GITHUB_ID`**: GitHub OAuth app ID
- **`GITHUB_SECRET`**: GitHub OAuth app secret

## Generate Secure Secret

```bash
# Generate a secure NEXTAUTH_SECRET
openssl rand -base64 32
```

## Database Setup

Your Neon database should already be configured. If you need to run migrations:

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate
```

## Deployment Steps

1. **Set environment variables** (see methods above)
2. **Commit your changes**
3. **Push to your repository**
4. **Vercel will auto-deploy**

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check DATABASE_URL is correct
   - Ensure Neon database is active
   - Verify SSL settings

2. **NextAuth errors**
   - Ensure NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Verify callback URLs

3. **Build failures**
   - Check all dependencies are in package.json
   - Ensure TypeScript types are correct
   - Verify API routes are properly configured

### Logs and Debugging

- **View deployment logs**: Vercel Dashboard → Deployments → View Function Logs
- **Check runtime logs**: Vercel Dashboard → Functions → View Logs
- **Monitor performance**: Vercel Dashboard → Analytics

## Post-Deployment Checklist

- [ ] Environment variables set
- [ ] Database connection working
- [ ] Authentication working
- [ ] AI games saving stats
- [ ] User registration working
- [ ] Game completion tracking working

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test database connection
4. Check NextAuth configuration
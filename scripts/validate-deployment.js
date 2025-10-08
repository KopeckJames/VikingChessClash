#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that all production requirements are met
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REQUIRED_FILES = [
  'vercel.json',
  '.env.production',
  'next.config.js',
  'package.json',
  'prisma/schema.prisma',
  '.github/workflows/ci-cd.yml',
  'lighthouserc.json',
  'playwright.config.ts',
  'jest.config.js',
  'DEPLOYMENT_CHECKLIST.md',
]

const REQUIRED_SCRIPTS = ['build', 'start', 'db:migrate', 'db:generate', 'test', 'lint']

const REQUIRED_DEPENDENCIES = [
  '@prisma/client',
  '@sentry/nextjs',
  '@upstash/redis',
  'next',
  'react',
]

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET']

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath} exists`)
    return true
  } else {
    console.log(`❌ ${filePath} missing`)
    return false
  }
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found')
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

  console.log('\n📦 Checking package.json...')

  // Check scripts
  let scriptsValid = true
  REQUIRED_SCRIPTS.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script "${script}" defined`)
    } else {
      console.log(`❌ Script "${script}" missing`)
      scriptsValid = false
    }
  })

  // Check dependencies
  let depsValid = true
  REQUIRED_DEPENDENCIES.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dependency "${dep}" installed`)
    } else {
      console.log(`❌ Dependency "${dep}" missing`)
      depsValid = false
    }
  })

  return scriptsValid && depsValid
}

function checkEnvironmentFiles() {
  console.log('\n🔧 Checking environment configuration...')

  const envExamplePath = path.join(process.cwd(), '.env.example')
  const envProductionPath = path.join(process.cwd(), '.env.production')

  let envValid = true

  if (fs.existsSync(envExamplePath)) {
    console.log('✅ .env.example exists')
  } else {
    console.log('❌ .env.example missing')
    envValid = false
  }

  if (fs.existsSync(envProductionPath)) {
    console.log('✅ .env.production exists')

    // Check for required environment variables
    const envContent = fs.readFileSync(envProductionPath, 'utf8')
    REQUIRED_ENV_VARS.forEach(envVar => {
      if (envContent.includes(envVar)) {
        console.log(`✅ Environment variable "${envVar}" configured`)
      } else {
        console.log(`❌ Environment variable "${envVar}" missing`)
        envValid = false
      }
    })
  } else {
    console.log('❌ .env.production missing')
    envValid = false
  }

  return envValid
}

function checkVercelConfig() {
  console.log('\n🚀 Checking Vercel configuration...')

  const vercelConfigPath = path.join(process.cwd(), 'vercel.json')

  if (!fs.existsSync(vercelConfigPath)) {
    console.log('❌ vercel.json missing')
    return false
  }

  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'))

    // Check required Vercel config sections
    const requiredSections = ['headers', 'env', 'functions']
    let configValid = true

    requiredSections.forEach(section => {
      if (vercelConfig[section]) {
        console.log(`✅ Vercel config section "${section}" configured`)
      } else {
        console.log(`❌ Vercel config section "${section}" missing`)
        configValid = false
      }
    })

    return configValid
  } catch (error) {
    console.log('❌ vercel.json is invalid JSON')
    return false
  }
}

function checkNextConfig() {
  console.log('\n⚡ Checking Next.js configuration...')

  const nextConfigPath = path.join(process.cwd(), 'next.config.js')

  if (!fs.existsSync(nextConfigPath)) {
    console.log('❌ next.config.js missing')
    return false
  }

  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')

  // Check for production optimizations
  const optimizations = ['swcMinify', 'compress', 'poweredByHeader', 'headers']

  const configValid = true
  optimizations.forEach(opt => {
    if (nextConfigContent.includes(opt)) {
      console.log(`✅ Next.js optimization "${opt}" configured`)
    } else {
      console.log(`⚠️ Next.js optimization "${opt}" not found`)
    }
  })

  return configValid
}

function checkTestingSetup() {
  console.log('\n🧪 Checking testing setup...')

  const testFiles = [
    'jest.config.js',
    'jest.setup.js',
    'playwright.config.ts',
    'e2e/auth.spec.ts',
    'e2e/game.spec.ts',
    'e2e/performance.spec.ts',
    'e2e/integration.spec.ts',
  ]

  let testingValid = true
  testFiles.forEach(file => {
    if (checkFile(file)) {
      // File exists, already logged
    } else {
      testingValid = false
    }
  })

  return testingValid
}

function checkCICD() {
  console.log('\n🔄 Checking CI/CD setup...')

  const cicdPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')

  if (!fs.existsSync(cicdPath)) {
    console.log('❌ CI/CD workflow missing')
    return false
  }

  const cicdContent = fs.readFileSync(cicdPath, 'utf8')

  // Check for required jobs
  const requiredJobs = ['lint-and-test', 'build', 'security-scan', 'deploy-production']

  let cicdValid = true
  requiredJobs.forEach(job => {
    if (cicdContent.includes(job)) {
      console.log(`✅ CI/CD job "${job}" configured`)
    } else {
      console.log(`❌ CI/CD job "${job}" missing`)
      cicdValid = false
    }
  })

  return cicdValid
}

function checkMonitoring() {
  console.log('\n📊 Checking monitoring setup...')

  const monitoringFiles = [
    'lib/monitoring.ts',
    'lib/redis.ts',
    'lib/rate-limit.ts',
    'app/api/health/route.ts',
  ]

  let monitoringValid = true
  monitoringFiles.forEach(file => {
    if (checkFile(file)) {
      // File exists, already logged
    } else {
      monitoringValid = false
    }
  })

  return monitoringValid
}

function main() {
  console.log('🔍 Validating deployment configuration...\n')

  let allValid = true

  // Check all required files
  console.log('📁 Checking required files...')
  REQUIRED_FILES.forEach(file => {
    if (!checkFile(file)) {
      allValid = false
    }
  })

  // Check package.json
  if (!checkPackageJson()) {
    allValid = false
  }

  // Check environment configuration
  if (!checkEnvironmentFiles()) {
    allValid = false
  }

  // Check Vercel configuration
  if (!checkVercelConfig()) {
    allValid = false
  }

  // Check Next.js configuration
  if (!checkNextConfig()) {
    allValid = false
  }

  // Check testing setup
  if (!checkTestingSetup()) {
    allValid = false
  }

  // Check CI/CD setup
  if (!checkCICD()) {
    allValid = false
  }

  // Check monitoring setup
  if (!checkMonitoring()) {
    allValid = false
  }

  // Final result
  console.log('\n' + '='.repeat(50))
  if (allValid) {
    console.log('🎉 All deployment requirements satisfied!')
    console.log('✅ Ready for production deployment')
    process.exit(0)
  } else {
    console.log('❌ Some deployment requirements are missing')
    console.log('📋 Please check the items above and refer to DEPLOYMENT_CHECKLIST.md')
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  checkFile,
  checkPackageJson,
  checkEnvironmentFiles,
  checkVercelConfig,
  checkNextConfig,
  checkTestingSetup,
  checkCICD,
  checkMonitoring,
}

# 🚀 CI/CD Pipeline Guide

## Overview

This project implements a comprehensive CI/CD (Continuous Integration/Continuous Deployment) pipeline using GitHub Actions. The pipeline ensures code quality, security, and reliable deployments across multiple environments.

## 🏗️ Pipeline Architecture

### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
Runs on every push and pull request to `dev` and `main` branches.

**Jobs:**
- **Lint and Type Check**: ESLint, TypeScript validation, Prettier formatting
- **Testing**: Jest unit tests with coverage reporting
- **Security Scan**: npm audit and Snyk vulnerability scanning
- **Build Test**: Ensures the application builds successfully
- **Docker Build Test**: Validates Docker image creation

### 2. **Web Deployment Pipeline**
- **Staging** (`.github/workflows/deploy-web.staging.yml`): Deploys to staging on `dev` branch
- **Production** (`.github/workflows/deploy-web.prod.yml`): Deploys to production on `main` branch

### 3. **API Deployment Pipeline** (`.github/workflows/api-deploy.yml`)
Handles API service deployment with testing and security checks.

### 4. **Code Formatting** (`.github/workflows/format.yml`)
Automatically formats code using Prettier and commits changes.

## 🔧 Key Features

### ✅ **Code Quality**
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Static type checking
- **Prettier**: Automatic code formatting
- **Jest**: Unit testing with coverage

### 🔒 **Security**
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Advanced security scanning
- **Content Security Policy**: Security headers
- **HTTPS enforcement**: Secure communication

### 🐳 **Containerization**
- **Multi-stage Docker builds**: Optimized image sizes
- **Build caching**: Faster builds
- **Health checks**: Container monitoring
- **Non-root users**: Security best practices

### 📊 **Monitoring**
- **Health check endpoints**: `/api/health`
- **Deployment status**: Automatic verification
- **Error handling**: Graceful failure management

## 🚀 Deployment Flow

### Staging Deployment
1. Push to `dev` branch
2. CI pipeline runs (lint, test, security, build)
3. Docker image built and pushed to Docker Hub
4. Webhook triggers staging server deployment
5. Health check verifies deployment success

### Production Deployment
1. Push to `main` branch
2. CI pipeline runs (lint, test, security, build)
3. Docker image built and pushed to Docker Hub
4. Webhook triggers production server deployment
5. Health check verifies deployment success

## 📋 Required Secrets

Configure these secrets in your GitHub repository:

### Docker Hub
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_KEY`: Supabase anon key

### Deployment Webhooks
- `WEBHOOK_URL_DEV`: Staging deployment webhook URL
- `WEBHOOK_URL_PROD`: Production deployment webhook URL
- `API_WEBHOOK_URL_STAGING`: API staging webhook URL
- `API_WEBHOOK_URL_PROD`: API production webhook URL

### URLs for Health Checks
- `STAGING_URL`: Staging environment URL
- `PRODUCTION_URL`: Production environment URL

### Security
- `SNYK_TOKEN`: Snyk security scanning token

## 🛠️ Local Development

### Running Tests
```bash
cd web
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Code Quality
```bash
cd web
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run type-check        # TypeScript check
npm run prettier:check    # Check formatting
npm run prettier:write    # Format code
```

### Docker Development
```bash
# Development
make run-dev

# Production
make run-prod

# View logs
make logs-dev
make logs-prod
```

## 📈 Best Practices Implemented

### 1. **Branch Protection**
- CI must pass before merging
- Code review requirements
- Up-to-date branch requirements

### 2. **Environment Separation**
- Staging and production environments
- Environment-specific configurations
- Isolated testing environments

### 3. **Security First**
- Dependency scanning
- Security headers
- Non-root containers
- HTTPS enforcement

### 4. **Monitoring & Observability**
- Health check endpoints
- Deployment verification
- Error tracking
- Performance monitoring

### 5. **Automation**
- Automatic formatting
- Automated testing
- Automated deployments
- Automated security scanning

## 🔄 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to dev/main | Code quality & security |
| `deploy-web.staging.yml` | Push to dev | Staging deployment |
| `deploy-web.prod.yml` | Push to main | Production deployment |
| `api-deploy.yml` | Push to dev/main (api changes) | API deployment |
| `format.yml` | Push/PR to any branch | Code formatting |

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check environment variables

2. **Test Failures**
   - Run tests locally first
   - Check test environment setup
   - Verify mock configurations

3. **Deployment Failures**
   - Check webhook URLs
   - Verify Docker Hub credentials
   - Check server connectivity

4. **Security Scan Failures**
   - Update vulnerable dependencies
   - Review Snyk recommendations
   - Check for exposed secrets

### Debug Commands
```bash
# Check workflow status
gh run list

# View workflow logs
gh run view <run-id>

# Rerun failed workflow
gh run rerun <run-id>
```

## 📚 Learning Resources

For junior developers wanting to learn more about CI/CD:

1. **GitHub Actions Documentation**: https://docs.github.com/en/actions
2. **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
3. **Security Scanning**: https://snyk.io/docs/
4. **Testing Best Practices**: https://jestjs.io/docs/getting-started
5. **DevOps Roadmap**: https://roadmap.sh/devops

## 🎯 Next Steps

Consider implementing these advanced features:

1. **Performance Testing**: Lighthouse CI, WebPageTest
2. **E2E Testing**: Playwright, Cypress
3. **Infrastructure as Code**: Terraform, CloudFormation
4. **Monitoring**: Prometheus, Grafana
5. **Logging**: ELK Stack, Fluentd
6. **Feature Flags**: LaunchDarkly, ConfigCat
7. **Blue-Green Deployments**: Zero-downtime deployments
8. **Rollback Strategies**: Automatic rollback on failures

---

*This CI/CD pipeline ensures your code is always tested, secure, and ready for production deployment! 🚀* 
# Migration Checklist ✅

Use this checklist to track your migration progress.

## Step 1: Database Migration

- [ ] Run migration SQL (see MIGRATION_GUIDE.md for details)
- [ ] Verify sessions table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'sessions';`
- [ ] Verify indexes created: `\d sessions` (should show 3 indexes)

## Step 2: VPS Deployment Script

- [ ] SSH into VPS: `ssh ubuntu@your-vps`
- [ ] Navigate to: `cd ~/deployment-scripts`
- [ ] Edit: `nano deploy-notionsync.sh`
- [ ] Remove Supabase environment variables
- [ ] Add new environment variables (see DEPLOYMENT_UPDATE.md)
- [ ] Save and test: `./deploy-notionsync.sh staging`

## Step 3: GitHub OAuth App

- [ ] Go to: https://github.com/settings/developers
- [ ] Select your OAuth App
- [ ] Update callback URL to: `https://staging.notionsync.fr/api/auth/callback`
- [ ] Update callback URL to: `https://notionsync.fr/api/auth/callback` (if separate app)
- [ ] Save changes

## Step 4: GitHub Repository Secrets

- [ ] Go to: Repository → Settings → Secrets and variables → Actions
- [ ] Remove: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Remove: `NEXT_PUBLIC_SUPABASE_KEY`
- [ ] Remove: `SUPABASE_SERVICE_ROLE_KEY` (if exists)
- [ ] Add/Verify: `NEXT_PUBLIC_GITHUB_CLIENT_ID` = `[YOUR_GITHUB_CLIENT_ID]`
- [ ] Add/Verify: `GITHUB_CLIENT_ID` = `[YOUR_GITHUB_CLIENT_ID]`
- [ ] Add/Verify: `GITHUB_CLIENT_SECRET` = `[YOUR_GITHUB_CLIENT_SECRET]`

## Step 5: Testing

- [ ] Test staging login: Visit `https://staging.notionsync.fr/login`
- [ ] Complete GitHub OAuth flow
- [ ] Verify redirect to `/auth/callback`
- [ ] Verify redirect to dashboard
- [ ] Check localStorage has `session_token`
- [ ] Test production login: Visit `https://notionsync.fr/login`
- [ ] Verify same flow works on production

## Step 6: Verification

- [ ] Check application logs: `docker logs notionsync-staging-web`
- [ ] Check database: `SELECT COUNT(*) FROM sessions;` (should show active sessions)
- [ ] Test API endpoints: `curl https://staging.notionsync.fr/api/health`
- [ ] Verify no Supabase errors in logs

## Files Created

- ✅ `GITHUB_OAUTH_SETUP.md` - OAuth configuration guide
- ✅ `GITHUB_SECRETS_UPDATE.md` - Secrets update guide
- ✅ `DEPLOYMENT_UPDATE.md` - Deployment configuration guide
- ✅ `MIGRATION_GUIDE.md` - Complete migration guide
- ✅ `MIGRATION_CHECKLIST.md` - This checklist

### View VPS Deployment Script

```bash
# On VPS
cat ~/deployment-scripts/deploy-notionsync.sh
```

---

**Status:** Ready to migrate  
**Date:** $(date)

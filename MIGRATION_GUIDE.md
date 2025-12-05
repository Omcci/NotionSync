# Complete Migration Guide - Supabase to PostgreSQL

This guide walks you through all the steps needed to complete the migration from Supabase to direct PostgreSQL.

## 📋 Prerequisites

- Access to your PostgreSQL database
- Access to your VPS server
- Access to GitHub repository settings
- Access to GitHub OAuth App settings

## Step 1: Run Database Migration

### Option A: Manual execution (recommended)

Connect to your PostgreSQL database and run:

```sql
-- Copy and paste the contents of web/database_migrations/add_sessions_table.sql
-- Or execute:
\i web/database_migrations/add_sessions_table.sql
```

### Option B: Using psql directly

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f web/database_migrations/add_sessions_table.sql
```

### Verify Migration

```sql
-- Check if sessions table exists
SELECT * FROM information_schema.tables WHERE table_name = 'sessions';

-- Check table structure
\d sessions
```

## Step 2: Update VPS Deployment Script

### Location
`~/deployment-scripts/deploy-notionsync.sh` on your VPS

### Changes Required

**Remove these lines:**
```bash
-e NEXT_PUBLIC_SUPABASE_URL="https://tmlfppynimzitryqyzrg.supabase.co" \
-e NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
-e SUPABASE_SERVICE_ROLE_KEY="..." \
```

**Keep/Add these lines:**
```bash
-e DATABASE_URL="postgresql://[DB_USER]:[DB_PASSWORD]@notionsync-prod-db:5432/notionsync" \
-e GITHUB_CLIENT_ID="[YOUR_GITHUB_CLIENT_ID]" \
-e GITHUB_CLIENT_SECRET="[YOUR_GITHUB_CLIENT_SECRET]" \
-e NEXT_PUBLIC_GITHUB_CLIENT_ID="[YOUR_GITHUB_CLIENT_ID]" \
```

### Test Deployment

```bash
# On your VPS
cd ~/deployment-scripts
./deploy-notionsync.sh staging
```

## Step 3: Update GitHub OAuth App Callback URLs

### Staging Environment
1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Select your OAuth App
3. Update **Authorization callback URL** to:
   ```
   https://staging.notionsync.fr/api/auth/callback
   ```

### Production Environment
1. Same as above, or if you have a separate OAuth App:
2. Update **Authorization callback URL** to:
   ```
   https://notionsync.fr/api/auth/callback
   ```

### Verify
- Test login on staging: `https://staging.notionsync.fr/login`
- Test login on production: `https://notionsync.fr/login`
- Verify redirect to `/api/auth/callback` after GitHub authorization

## Step 4: Update GitHub Repository Secrets

### Remove Secrets
Go to: Repository → Settings → Secrets and variables → Actions

Remove:
- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (if exists)

### Add/Verify Secrets

**Required:**
- ✅ `NEXT_PUBLIC_GITHUB_CLIENT_ID` = `Ov23lijZ38JQsomOLWpN`
- ✅ `GITHUB_CLIENT_ID` = `Ov23lijZ38JQsomOLWpN` (if not already set)
- ✅ `GITHUB_CLIENT_SECRET` = `d73dfb3d5ad56e86e95741e9267cfbaec8932e6c` (if not already set)

See `GITHUB_SECRETS_UPDATE.md` for detailed instructions.

## Step 5: Test Everything

### 1. Test Database Connection
```bash
# On your VPS, test database connection
docker exec -it notionsync-prod-web node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log('✅ DB Connected:', r.rows[0])).catch(e => console.error('❌ Error:', e));
"
```

### 2. Test Authentication Flow
1. Visit staging: `https://staging.notionsync.fr/login`
2. Click "Sign in with GitHub"
3. Authorize the app
4. Verify redirect to `/auth/callback`
5. Verify redirect to dashboard
6. Check that session is stored in localStorage

### 3. Test API Endpoints
```bash
# Test health endpoint
curl https://staging.notionsync.fr/api/health

# Test session endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://staging.notionsync.fr/api/auth/session
```

### 4. Check Logs
```bash
# On VPS
docker logs notionsync-staging-web
docker logs notionsync-prod-web
```

## Troubleshooting

### Migration Issues
- **Error: relation "sessions" already exists**
  - Table already exists, migration can be skipped
  - Or drop and recreate: `DROP TABLE IF EXISTS sessions CASCADE;`

### Authentication Issues
- **Error: Invalid callback URL**
  - Verify GitHub OAuth App callback URL matches exactly
  - Check for trailing slashes or protocol mismatches

- **Error: No session token**
  - Check browser console for errors
  - Verify `/api/auth/callback` is working
  - Check that session is being created in database

### Database Connection Issues
- **Error: Connection refused**
  - Verify DATABASE_URL is correct
  - Check PostgreSQL is running
  - Verify network connectivity between containers

### Deployment Issues
- **Error: Build fails**
  - Check GitHub secrets are set correctly
  - Verify `NEXT_PUBLIC_GITHUB_CLIENT_ID` is in build args

## Rollback Plan

If something goes wrong:

1. **Revert deployment script** to previous version
2. **Revert GitHub secrets** (add back Supabase secrets temporarily)
3. **Redeploy** using old configuration
4. **Fix issues** and try again

## Support

If you encounter issues:
1. Check application logs
2. Check database logs
3. Verify all environment variables are set
4. Test each component individually

## Success Criteria

✅ Database migration completed  
✅ Sessions table exists and is accessible  
✅ VPS deployment script updated  
✅ GitHub OAuth callback URLs updated  
✅ GitHub secrets updated  
✅ Staging environment working  
✅ Production environment working  
✅ Users can log in successfully  
✅ Sessions persist across page reloads  

---

**Last Updated:** $(date)  
**Migration Version:** 1.0


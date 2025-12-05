# Deployment Update - Supabase Removal

## Changes Made

This update removes Supabase dependency and replaces it with:
- Direct PostgreSQL connections
- Session-based authentication
- Direct GitHub OAuth flow

## VPS Deployment Script Update Required

Update your VPS deployment script (`deploy-notionsync.sh`) to remove Supabase environment variables and add the new ones:

### Remove these lines:
```bash
-e NEXT_PUBLIC_SUPABASE_URL="https://tmlfppynimzitryqyzrg.supabase.co" \
-e NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
-e SUPABASE_SERVICE_ROLE_KEY="..." \
```

### Add/Keep these lines:
```bash
-e DATABASE_URL="postgresql://[DB_USER]:[DB_PASSWORD]@notionsync-prod-db:5432/notionsync" \
-e GITHUB_CLIENT_ID="[YOUR_GITHUB_CLIENT_ID]" \
-e GITHUB_CLIENT_SECRET="[YOUR_GITHUB_CLIENT_SECRET]" \
-e NEXT_PUBLIC_GITHUB_CLIENT_ID="[YOUR_GITHUB_CLIENT_ID]" \
```

## Database Migration Required

Run the sessions table migration on your PostgreSQL database:

```sql
-- Run this on your PostgreSQL database
\i web/database_migrations/add_sessions_table.sql
```

Or manually execute the SQL from `web/database_migrations/add_sessions_table.sql`

## GitHub OAuth Configuration

Make sure your GitHub OAuth App callback URL is set to:
- Staging: `https://staging.notionsync.fr/api/auth/callback`
- Production: `https://notionsync.fr/api/auth/callback`

## Environment Variables Summary

### Required for Build:
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth Client ID (public)

### Required at Runtime:
- `DATABASE_URL` - PostgreSQL connection string
- `GITHUB_CLIENT_ID` - GitHub OAuth Client ID (server-side)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret (server-side)
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth Client ID (public, for client-side)

### Removed:
- `NEXT_PUBLIC_SUPABASE_URL` - No longer needed
- `NEXT_PUBLIC_SUPABASE_KEY` - No longer needed
- `SUPABASE_SERVICE_ROLE_KEY` - No longer needed


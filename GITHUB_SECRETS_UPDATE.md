# GitHub Secrets Update

## Remove Supabase Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Remove these secrets (no longer needed):

- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (if exists)

## Add/Verify Required Secrets

### Required for Build:

- ✅ `NEXT_PUBLIC_GITHUB_CLIENT_ID` = `[YOUR_GITHUB_CLIENT_ID]`
  - Used during Docker build for client-side OAuth

### Required for Runtime (if not already set):

- ✅ `GITHUB_CLIENT_ID` = `[YOUR_GITHUB_CLIENT_ID]`
  - Used server-side for OAuth token exchange
- ✅ `GITHUB_CLIENT_SECRET` = `[YOUR_GITHUB_CLIENT_SECRET]`
  - Used server-side for OAuth token exchange (keep this secret!)

### Optional (if you want different values per environment):

- `NEXT_PUBLIC_GITHUB_CLIENT_ID_STAGING` (for staging builds)
- `NEXT_PUBLIC_GITHUB_CLIENT_ID_PRODUCTION` (for production builds)

## Verification Checklist

- [ ] Removed all Supabase-related secrets
- [ ] Added/verified `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- [ ] Verified `GITHUB_CLIENT_ID` exists (or add it)
- [ ] Verified `GITHUB_CLIENT_SECRET` exists (or add it)
- [ ] Tested staging deployment
- [ ] Tested production deployment

## Notes

- `GITHUB_CLIENT_SECRET` should be kept secret and never exposed to the client
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` is safe to expose (it's public)
- The client secret is only used server-side in `/api/auth/callback`

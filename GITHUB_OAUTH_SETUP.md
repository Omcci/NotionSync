# GitHub OAuth App Configuration

## Update Callback URLs

You need to update your GitHub OAuth App callback URLs to point to the new authentication endpoints.

### Steps:

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Select your OAuth App (or create a new one)
3. Update the **Authorization callback URL** for each environment:

#### Staging Environment:
```
https://staging.notionsync.fr/api/auth/callback
```

#### Production Environment:
```
https://notionsync.fr/api/auth/callback
```

### Important Notes:

- The callback URL must match exactly (including `https://`)
- GitHub OAuth Apps can have multiple callback URLs, but you need to add both staging and production
- If you have separate OAuth Apps for staging and production, update each one accordingly

### Current OAuth App Details (from your deployment script):
- **Client ID**: `Ov23lijZ38JQsomOLWpN`
- **Client Secret**: `d73dfb3d5ad56e86e95741e9267cfbaec8932e6c`

## Verify Configuration

After updating:
1. Test the login flow on staging
2. Verify that users are redirected to `/api/auth/callback` after GitHub authorization
3. Check that sessions are created successfully


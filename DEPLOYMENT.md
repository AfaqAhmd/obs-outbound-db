# Deployment Troubleshooting Guide

## Issue: User Login Not Working on Vercel

If user login works locally but not on Vercel, follow these steps:

### 1. Verify Prisma Client Generation

The build process should:
1. Run migrations (`prisma migrate deploy`)
2. Generate Prisma Client (`prisma generate`)
3. Build Next.js app (`next build`)

### 2. Check Vercel Build Logs

In your Vercel dashboard, check the build logs for:
- ✅ `Running migrations...`
- ✅ `Generated Prisma Client`
- ❌ Any errors related to Prisma or the User model

### 3. Force Prisma Client Regeneration

If Prisma Client is cached incorrectly:

**Option A: Clear Vercel Build Cache**
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Redeploy

**Option B: Manual Prisma Client Regeneration**
Add this to your build command temporarily:
```json
"build": "prisma migrate deploy && rm -rf node_modules/.prisma && prisma generate && next build"
```

### 4. Verify Database Connection

Ensure your `DATABASE_URL` environment variable in Vercel:
- Points to the correct database
- Has the correct credentials
- Allows connections from Vercel's IPs

### 5. Check Migration Status

Run this locally to verify migrations are applied:
```bash
npx prisma migrate status
```

All migrations should show as "Applied".

### 6. Verify User Table Exists

Check your database directly:
```sql
SELECT * FROM users LIMIT 1;
```

If the table doesn't exist, the migration didn't run. Check Vercel build logs.

### 7. Test Prisma Client

Create a test API route to verify Prisma Client:
```javascript
// app/api/test-prisma/route.js
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return Response.json({ 
      success: true, 
      userCount,
      hasUserModel: !!prisma.user 
    });
  } catch (e) {
    return Response.json({ 
      success: false, 
      error: e.message 
    }, { status: 500 });
  }
}
```

Visit `/api/test-prisma` to check if Prisma Client has the User model.

### 8. Common Issues

**Issue: "prisma.user is undefined"**
- **Solution**: Prisma Client wasn't regenerated after adding User model
- **Fix**: Clear build cache and redeploy

**Issue: "Table 'users' does not exist"**
- **Solution**: Migration didn't run
- **Fix**: Check build logs, ensure `prisma migrate deploy` runs

**Issue: "Cannot find module '@prisma/client'"**
- **Solution**: Prisma Client not generated
- **Fix**: Ensure `postinstall` script runs: `"postinstall": "prisma generate"`

### 9. Final Checklist

Before deploying:
- [ ] All migrations are committed to git
- [ ] `prisma/schema.prisma` includes User model
- [ ] `package.json` has correct build script
- [ ] `DATABASE_URL` is set in Vercel
- [ ] Build cache is cleared (if issues persist)

After deploying:
- [ ] Check build logs for errors
- [ ] Verify migrations ran successfully
- [ ] Test user login
- [ ] Test user creation in admin panel

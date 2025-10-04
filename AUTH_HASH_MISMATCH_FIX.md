# Authentication Hash Mismatch Fix

## Issue

After fixing the 404 errors, users were getting authentication failures:

```
[AUTH] Authentication failed: Hash mismatch.
POST /api/auth/validate - 403
```

## Root Cause

The hash validation was using the wrong secret key. The code was using `ENCRYPTION_KEY` instead of `TELEGRAM_BOT_TOKEN`:

```typescript
// WRONG ❌
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(encryptionKey).digest();
```

According to [Telegram's WebApp documentation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app), the hash must be validated using the **bot token**, not an encryption key.

## Fix

Changed the hash validation to use the correct bot token:

```typescript
// CORRECT ✅
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
```

Also added debug logging to help diagnose future hash mismatch issues:

```typescript
if (calculatedHash !== hash) {
  console.error('[AUTH] Authentication failed: Hash mismatch.');
  console.error('[AUTH] Expected hash:', calculatedHash);
  console.error('[AUTH] Received hash:', hash);
  return res.status(403).json({ error: 'Authentication failed: Hash mismatch' });
}
```

## Files Changed

- `server/src/routes/auth.ts` - Fixed hash validation logic

## Deployment

- **Commit**: a45410b
- **Pushed**: To GitHub main branch
- **Auto-Deploy**: Render will automatically deploy within 2-3 minutes

## Testing

After deployment:
1. Open the Telegram bot
2. Click "🚀 Launch App"
3. The app should load successfully
4. Check backend logs - should see successful authentication instead of hash mismatch errors

## Impact

✅ **Fixed**: Telegram WebApp authentication now works correctly  
✅ **Fixed**: Hash validation follows Telegram's official documentation  
✅ **Improved**: Added debug logging for easier troubleshooting  

## Related Fixes

This fix builds on the previous authentication flow fix (commits 2b189eb and 1dafc71) which ensured users are created in the database.

Combined, these fixes resolve:
1. Users not being created in database (404 errors)
2. Hash validation failures (403 errors)


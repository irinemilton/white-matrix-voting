# Debug Steps for Infinite Loading Issue

## What I've Fixed:

1. **Added retry logic** - ProtectedRoute will retry up to 3 times if profile appears incomplete
2. **Better session handling** - Server now properly saves session after profile update
3. **Full page reload** - After profile completion, page reloads to ensure fresh session
4. **Enhanced logging** - Check browser console and server logs for detailed info

## Next Steps to Debug:

### 1. Open Browser Console (F12)
Look for these logs:
- `[ProtectedRoute] Checking authentication...`
- `[ProtectedRoute] Auth check response:`
- `[ProtectedRoute] User profile check:`

### 2. Check Server Console
Look for:
- `Update LinkedIn URL attempt - Authenticated: true`
- `LinkedIn URL updated in database`
- `Session refreshed successfully`
- `Session saved. Ready to respond.`
- `User check - Authenticated: true/false`

### 3. Check Network Tab
1. Open DevTools → Network tab
2. Complete profile and click continue
3. Look for `/api/update-linkedin-url` request
   - Status should be 200
   - Response should have `user` object with `linkedin_profile_url`
4. Look for `/api/user` request (when `/voting` loads)
   - Status should be 200
   - Response should show `authenticated: true` and `user.linkedin_profile_url`

### 4. Check Cookies
1. DevTools → Application → Cookies → `http://localhost:5174`
2. Should see `connect.sid` cookie
3. If missing, session isn't being set

### 5. Test Direct API Call
In browser console, run:
```javascript
fetch('http://localhost:5000/api/user', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Should return: `{ authenticated: true, user: {...} }`

## Common Issues:

### Issue: Session cookie not being set
**Symptoms**: No `connect.sid` cookie in Application tab
**Fix**: 
- Make sure server is running on port 5000
- Check CORS is configured correctly
- Try clearing all cookies and signing in again

### Issue: `/api/user` returns `authenticated: false`
**Symptoms**: Console shows `authenticated: false`
**Fix**:
- Check server logs - should see session ID
- Verify `SESSION_SECRET` is set in `.env`
- Try signing in again

### Issue: `linkedin_profile_url` is null/empty after update
**Symptoms**: Profile check shows `hasLinkedInUrl: false` even after updating
**Fix**:
- Check server logs for "Session refreshed successfully"
- Check database directly: `SELECT linkedin_profile_url FROM users WHERE id = ?`
- The retry logic should catch this, but if it persists, check database update

### Issue: Network request fails
**Symptoms**: Console shows "Failed to fetch" or network error
**Fix**:
- Verify server is running: `http://localhost:5000/api/health`
- Check `API_BASE_URL` in `client/src/config.js`
- Check CORS configuration

## Quick Test:

1. **Clear everything**:
   - Clear browser cookies for localhost
   - Restart server: `cd server && npm start`
   - Restart client: `cd client && npm run dev`

2. **Sign in fresh**:
   - Go to `/login`
   - Sign in with Google/LinkedIn
   - Complete profile
   - Watch console logs

3. **Check what happens**:
   - After clicking "Complete Profile", check console
   - Should see "Profile updated successfully"
   - Page should reload and go to `/voting`
   - Check if `/api/user` request succeeds
   - Check response data

## If Still Not Working:

Share these details:
1. Browser console logs (especially `[ProtectedRoute]` messages)
2. Server console logs (especially around profile update)
3. Network tab screenshot showing `/api/user` request/response
4. Whether `connect.sid` cookie exists


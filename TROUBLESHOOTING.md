# Troubleshooting: Infinite Loading on /voting Page

## 🔍 Quick Diagnosis

If you're seeing infinite loading after signing in, check these in order:

### 1. Check Browser Console (Most Important!)
Open your browser's Developer Tools (F12) and check the Console tab for errors:
- Look for red error messages
- Check Network tab to see if `/api/user` request is failing

### 2. Verify Server is Running
Make sure your server is running on port 5000:
```bash
cd server
npm start
```
You should see: `Server running on port 5000`

### 3. Test Server Connection
Open in browser: `http://localhost:5000/api/health`
Should return: `{"status":"ok","timestamp":"..."}`

### 4. Check Environment Variables
Make sure your `server/.env` file has:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5174
SESSION_SECRET=your_random_secret_here
```

### 5. Common Issues & Fixes

#### Issue: "Failed to fetch" or Network Error
**Cause**: Server not running or wrong API URL
**Fix**: 
- Start the server: `cd server && npm start`
- Check `client/src/config.js` has correct `API_BASE_URL`
- Verify server is on port 5000

#### Issue: CORS Error
**Cause**: Client origin mismatch
**Fix**: 
- Check `server/.env` has `CLIENT_ORIGIN=http://localhost:5174`
- Make sure your Vite dev server is running on port 5174
- Restart both client and server after changing `.env`

#### Issue: Session Cookie Not Set
**Cause**: Cookie not being sent after OAuth redirect
**Fix**:
- Clear browser cookies for `localhost`
- Make sure you're accessing via `http://localhost:5174` (not `127.0.0.1`)
- Check browser DevTools → Application → Cookies → `localhost`
- Look for `connect.sid` cookie

#### Issue: Authentication Always Returns False
**Cause**: Session not persisting after OAuth login
**Fix**:
- Check server console logs when you hit `/api/user`
- Should see: `User check - Authenticated: true`
- If false, session might not be saved - check `SESSION_SECRET` in `.env`

### 6. Step-by-Step Debugging

1. **Check Server Logs**:
   When you visit `/voting`, check server console. You should see:
   ```
   User check - Authenticated: true/false
   User data: {...}
   Session ID: ...
   ```

2. **Check Browser Network Tab**:
   - Open DevTools → Network tab
   - Refresh `/voting` page
   - Look for request to `http://localhost:5000/api/user`
   - Check:
     - Status code (should be 200)
     - Response (should have `authenticated: true/false`)
     - Request Headers (should include `Cookie: connect.sid=...`)

3. **Check Cookies**:
   - DevTools → Application → Cookies → `http://localhost:5174`
   - Should see `connect.sid` cookie
   - If missing, session isn't being set

4. **Test OAuth Flow**:
   - After clicking "Continue with Google/LinkedIn"
   - Complete OAuth on provider site
   - Check if you're redirected back to your app
   - Check server logs for "Google login successful" or "LinkedIn login successful"

### 7. Quick Fixes to Try

1. **Restart Everything**:
   ```bash
   # Stop both servers (Ctrl+C)
   # Then restart:
   cd server && npm start
   # In another terminal:
   cd client && npm run dev
   ```

2. **Clear Browser Data**:
   - Clear cookies for `localhost`
   - Clear cache
   - Try incognito/private window

3. **Check Ports**:
   - Server: `http://localhost:5000` (check with `http://localhost:5000/api/health`)
   - Client: `http://localhost:5174` (check `vite.config.ts`)

4. **Verify .env Files**:
   - `server/.env` exists and has correct values
   - Restart server after changing `.env`

### 8. Still Not Working?

Check these specific things:

1. **API_BASE_URL in config.js**:
   ```javascript
   // Should be: http://localhost:5000
   export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
   ```

2. **Server CORS Configuration**:
   ```javascript
   // In server.js, should match your client port
   const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
   ```

3. **Session Cookie Configuration**:
   - `secure: false` (for HTTP localhost)
   - `sameSite: 'lax'` (for OAuth redirects)
   - `httpOnly: true` (security)

4. **OAuth Redirect URLs**:
   - Google: `http://localhost:5000/auth/google/callback`
   - LinkedIn: `http://localhost:5000/auth/linkedin/callback`
   - Must match exactly in OAuth provider settings

### 9. Enable More Debugging

Add this to see what's happening:

**In Browser Console** (after page loads):
```javascript
// Check if API is reachable
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Check auth status
fetch('http://localhost:5000/api/user', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If these fail, the server isn't running or there's a network issue.

---

## ✅ Expected Behavior

After signing in with Google/LinkedIn:
1. You're redirected to `/voting` (or `/profile-completion` if profile incomplete)
2. `ProtectedRoute` makes a request to `/api/user`
3. Server responds with `{ authenticated: true, user: {...} }`
4. Page loads normally

If step 2-3 fails, you'll see infinite loading.


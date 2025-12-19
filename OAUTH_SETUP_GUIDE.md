# OAuth Setup Guide - Google & LinkedIn

## 📋 Overview
This guide shows you exactly what to enter in Google and LinkedIn OAuth settings to make authentication work with your application.

---

## 🔵 Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**

### Step 2: Create OAuth 2.0 Client ID
1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in app name, user support email, developer contact
   - Add scopes: `profile`, `email`
   - Add test users if app is in testing mode

### Step 3: Configure Authorized Redirect URIs
In the OAuth client configuration, add these **Authorized redirect URIs**:

#### For Local Development:
```
http://localhost:5000/auth/google/callback
```

#### For Production (replace with your domain):
```
https://yourdomain.com/auth/google/callback
```

**Important:** 
- Add **both** localhost and production URLs if you test locally
- The URL must match **exactly** (including `http://` vs `https://` and port number)
- No trailing slashes

### Step 4: Get Your Credentials
After creating the OAuth client:
- **Client ID**: Copy this value → use as `GOOGLE_CLIENT_ID` in `.env`
- **Client Secret**: Copy this value → use as `GOOGLE_CLIENT_SECRET` in `.env`

---

## 🔷 LinkedIn OAuth Setup

### Step 1: Go to LinkedIn Developers
1. Visit: https://www.linkedin.com/developers/
2. Sign in with your LinkedIn account
3. Click **Create app** or select an existing app

### Step 2: Configure App Details
1. Fill in app name, company LinkedIn page, privacy policy URL
2. Upload an app logo (required)
3. Agree to terms and create the app

### Step 3: Configure Auth Settings
1. Go to the **Auth** tab in your app settings
2. Under **Redirect URLs**, add:

#### For Local Development:
```
http://localhost:5000/auth/linkedin/callback
```

#### For Production (replace with your domain):
```
https://yourdomain.com/auth/linkedin/callback
```

**Important:**
- Add **both** localhost and production URLs if you test locally
- The URL must match **exactly** (including `http://` vs `https://` and port number)
- No trailing slashes

### Step 4: Request API Products
Under **Products**, request access to:
- ✅ **Sign In with LinkedIn using OpenID Connect** (required)
- ✅ **Profile API** (optional, but recommended)

### Step 5: Get Your Credentials
1. Go to the **Auth** tab
2. Find your credentials:
   - **Client ID**: Copy this value → use as `LINKEDIN_CLIENT_ID` in `.env`
   - **Client Secret**: Copy this value → use as `LINKEDIN_CLIENT_SECRET` in `.env`

---

## 🔐 Environment Variables Setup

Create a `.env` file in your `server/` directory with:

```env
# Server Configuration
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_ORIGIN=http://localhost:5174

# Database
DATABASE_URL=your_postgresql_connection_string

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
```

### For Production:
```env
PORT=5000
SERVER_URL=https://yourdomain.com
CLIENT_ORIGIN=https://yourdomain.com

# ... rest of the variables
```

---

## ✅ Quick Checklist

### Google OAuth:
- [ ] Created OAuth 2.0 Client ID in Google Cloud Console
- [ ] Added redirect URI: `http://localhost:5000/auth/google/callback`
- [ ] Configured OAuth consent screen
- [ ] Copied Client ID and Client Secret to `.env`

### LinkedIn OAuth:
- [ ] Created app in LinkedIn Developers portal
- [ ] Added redirect URL: `http://localhost:5000/auth/linkedin/callback`
- [ ] Requested "Sign In with LinkedIn using OpenID Connect" product
- [ ] Copied Client ID and Client Secret to `.env`

### Both:
- [ ] Created `.env` file in `server/` directory
- [ ] Added all required environment variables
- [ ] Verified redirect URLs match exactly (no typos, correct protocol, correct port)

---

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URI in your OAuth provider doesn't match what's in your code
- **Fix**: Double-check the redirect URI in Google/LinkedIn settings matches exactly:
  - Protocol: `http://` (local) or `https://` (production)
  - Port number: `5000` (or your server port)
  - Path: `/auth/google/callback` or `/auth/linkedin/callback`
  - No trailing slashes

### "invalid_client" Error
- **Cause**: Client ID or Client Secret is incorrect
- **Fix**: Verify credentials in `.env` match what's shown in the OAuth provider console

### "access_denied" Error
- **Cause**: User denied permission or app not approved
- **Fix**: 
  - For Google: Check OAuth consent screen is configured and app is published (or add test users)
  - For LinkedIn: Ensure you've requested the required API products

---

## 📝 Notes

- **Local Development**: Use `http://localhost:5000` for both localhost testing
- **Production**: Replace with your actual domain (e.g., `https://yourapp.com`)
- **Port Numbers**: Default server port is `5000`, default client port is `5174` (check `vite.config.ts`)
- **Security**: Never commit `.env` file to version control (it should be in `.gitignore`)


# Google OAuth Consent Screen Fix

Vtopia uses **Supabase Auth** for Google OAuth — there is no `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in this codebase. The OAuth flow is configured entirely in the Supabase dashboard and Google Cloud Console.

---

## Step-by-step fix

### 1. Open Google Cloud Console
Go to [console.cloud.google.com](https://console.cloud.google.com) and select the project linked to your Supabase project.

### 2. Rename the project (if still named incorrectly)
- Left sidebar → **IAM & Admin** → **Settings**
- Change **Project name** to `Vtopia`
- Click **Save**

### 3. Update the OAuth consent screen
- Left sidebar → **APIs & Services** → **OAuth consent screen**
- Set **App name** to `Vtopia`
- Set **User support email** to `support@vtopia.world`
- Upload an **App logo** (square, min 120×120px, PNG/JPG)
- Under **Developer contact information**, add `support@vtopia.world`
- Click **Save and Continue**

### 4. Rename the OAuth 2.0 Client ID
- Left sidebar → **APIs & Services** → **Credentials**
- Click the OAuth 2.0 Client ID entry
- Change **Name** to `Vtopia Web Client`
- Confirm the **Authorized redirect URIs** includes your Supabase callback URL:
  `https://<your-project>.supabase.co/auth/v1/callback`
- Click **Save**

### 5. Check publishing status
- Back on **OAuth consent screen**, check the **Publishing status**
- If it shows **Testing**: users not in the test list will see a warning screen
- To fix: either add test user emails, or click **Publish App** → **Confirm**
- Publishing requires the app to pass Google's verification if you request sensitive scopes (email + profile are not sensitive, so publishing is straightforward)

### 6. Submit for verification (when ready for production)
- Google verification is only required if you request sensitive/restricted scopes
- For Vtopia's current scopes (email, profile, openid), no verification is needed
- Simply publishing the app removes the "unverified app" warning

---

## Supabase side (if provider settings need updating)
- Go to your Supabase project → **Authentication** → **Providers** → **Google**
- Ensure **Client ID** and **Client Secret** match the credentials in Google Cloud Console
- **Callback URL** shown in Supabase must match what's in Google's Authorized redirect URIs

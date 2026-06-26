# Social Login Setup (Apple + Google)

The code is in `lib/socialAuth.ts` and the buttons are on the Login screen.
It will not work until the provider config below is done, and it requires a
native build (expo-apple-authentication is native).

## Apple
1. Apple Developer → Certificates, IDs & Profiles → enable "Sign In with Apple"
   for the App ID `com.missionusa.prevailprayer`. Create a Services ID + a Sign in
   with Apple key (.p8).
2. Supabase → Authentication → Providers → Apple: enable, add Services ID +
   the key/team info. Add redirect/return URL.
3. app.json already sets `ios.usesAppleSignIn: true` + the
   `expo-apple-authentication` plugin (done).

## Google
1. Google Cloud Console → APIs & Services → Credentials → create an OAuth 2.0
   "Web application" client. Add the Supabase callback:
   `https://pvcxobbqbugghlqjpmph.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Providers → Google: enable, paste the Web client
   ID + secret.
3. Supabase → Authentication → URL Configuration → add `prevailprayer://` to the
   allowed redirect URLs.

## Notes
- Apple requires "Sign in with Apple" if you offer Google sign-in — both are wired.
- Uses Supabase PKCE flow (already enabled in lib/supabase.ts).
- Ships in the next native build (build 13+), not via OTA.

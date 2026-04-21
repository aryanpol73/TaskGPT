
Plan to fix Google OAuth login returning to the login page

1. Stabilize the Google sign-in flow in the app
- Update `src/pages/AuthPage.tsx` so Google login explicitly handles all three OAuth outcomes:
  - redirected to Google
  - tokens returned in the current window/popup
  - error returned from the auth broker
- After a successful non-redirect OAuth response, force a session refresh with the backend auth client and navigate directly to `/tasks`.
- Keep the correct Lovable Cloud managed OAuth method: `lovable.auth.signInWithOAuth("google", ...)`.
- Do not switch to `supabase.auth.signInWithOAuth()` because this project is using Lovable Cloud auth.

2. Add better failure visibility
- Replace the generic “Google sign-in failed” behavior with clearer toasts for:
  - popup blocked
  - sign-in cancelled
  - no tokens/session received
  - OAuth broker/provider error
- This will make it obvious whether the issue is app-side, popup/PWA-related, or Google credential-related.

3. Harden auth session detection
- Improve `AuthContext` so it reliably refreshes session state after OAuth returns.
- Ensure authenticated users on `/auth` are redirected to `/tasks` once the session is available.
- Avoid redirect loops where the app briefly thinks there is no user and shows the login page again.

4. PWA / service worker OAuth safety
- Update the service worker version and keep OAuth routes fully network-only:
  - `/~oauth`
  - `/auth`
- Add service worker update handling so installed PWAs get the fixed worker faster.
- Keep the PWA icon and notification behavior unchanged.

5. Verify the correct Google OAuth setup
- Do not create a new Google Client ID yet.
- First test with Lovable Cloud managed Google OAuth, because it requires no Google-side setup and avoids redirect URI mistakes.
- If the published app still fails after the app-side fix, then configure a custom Google OAuth client only if needed, using the callback URL from Lovable Cloud auth settings.

6. Validation after implementation
- Test Google login from:
  - the Lovable preview
  - the published URL: `https://task-gpt.lovable.app`
  - the installed PWA
- Confirm that selecting a Google account lands inside the app at `/tasks`, not back on `/auth`.
- Confirm email/password login and signup still work with create password + confirm password.

Technical notes
- The current app already uses the correct generated Lovable Cloud auth wrapper.
- The likely failure is that OAuth returns successfully but the app does not reliably refresh/navigate after the session is set, or the installed/preview environment is returning to `/auth` before session detection finishes.
- If the problem happens only in preview and not on the published URL, it may be a Lovable Cloud preview-environment OAuth configuration issue rather than an app code bug.

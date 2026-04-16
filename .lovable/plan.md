
I checked the current integration flow and found the main reason it is failing:

- Google sign-in itself is working.
- But the app never saves a usable Gmail/Calendar connection record.
- The UI decides “Connected” only by checking whether a row exists in `google_tokens`.
- That table is currently empty, so Gmail and Calendar always stay in the “Connect” state.

Why it is happening right now

1. The Connect button is reusing the normal Google login flow.
2. After the redirect, the app expects `session.provider_token` and `session.provider_refresh_token` inside `AuthContext`.
3. In the current managed Google sign-in setup, those provider tokens are not ending up in the app session path this code is listening to.
4. Because of that, nothing gets inserted into `google_tokens`.
5. `useGoogleConnected()` keeps returning `false`, so:
   - Settings still shows “Connect Gmail”
   - Mail page stays disconnected
   - Calendar page stays disconnected
   - AI cannot send mail or add calendar events
6. The redirect currently goes to `window.location.origin`, so after choosing a Google account you get sent back into the app root and the router takes you to `/tasks`, which makes it look like the connect step finished but nothing changed.
7. Settings subsection state is only stored in React state, not in the URL, so even if we returned to Settings after OAuth, it would not reliably reopen the Integrations panel after a full redirect.

What I would implement to fix it

1. Separate Google login from Google service connection
   - Keep Google sign-in for authentication only.
   - Build a dedicated Gmail/Calendar connection flow specifically for Google API access.

2. Store a real Google connection
   - Exchange the Google authorization code on the backend.
   - Save `access_token`, `refresh_token`, `expires_at`, and granted `scopes` into `google_tokens`.
   - Verify the token once before marking the integration as connected.

3. Fix the post-connect return flow
   - Return the user to Settings → Integrations instead of `/tasks`.
   - Move the active Settings section into the URL/query string so OAuth redirects can restore the same panel.

4. Make connection status accurate
   - Replace the current boolean-only check with a richer status:
     - connected
     - reconnect required
     - missing permissions
     - not connected
   - Show Gmail and Calendar separately so the UI reflects what is actually authorized.

5. Reconnect the dependent features
   - Update Mail page to load inbox data only after verified connection.
   - Update Calendar page to load events only after verified connection.
   - Keep AI assistant wired to the same verified token flow so commands like “send an email” and “add this to my calendar” work.

6. Remove the broken token capture path
   - Remove the current `AuthContext` logic that tries to capture provider tokens from the auth session after Google sign-in.
   - That logic is the reason the DB never gets populated.

7. Validate end to end
   - Connect Google from Settings
   - Confirm Settings immediately shows Connected
   - Confirm Gmail loads messages
   - Confirm Calendar loads events
   - Confirm AI can send email and create calendar events

Technical details

- I verified that Google login events are happening successfully.
- I also verified that `public.google_tokens` currently has `0` rows, which explains why the app never flips to connected.
- The files that need adjustment are mainly:
  - `src/components/settings/IntegrationsSection.tsx`
  - `src/pages/SettingsPage.tsx`
  - `src/hooks/useGoogleApi.ts`
  - `src/contexts/AuthContext.tsx`
  - `src/pages/MailPage.tsx`
  - `src/pages/CalendarPage.tsx`
  - `supabase/functions/google-api/index.ts`
  - `supabase/functions/ai-assistant/index.ts`
- I will likely add a dedicated backend function for the Google connection/exchange flow.
- After the code fix, you will probably need to reconnect Google once so a real refresh token gets stored.
- There may also be one Google Console check needed: the dedicated Gmail/Calendar OAuth redirect URI must be registered for your Google OAuth client.

So the short answer is: Google account selection is succeeding, but the app is not actually saving a Gmail/Calendar connection afterward, and the UI is using that missing saved connection as the only source of truth.

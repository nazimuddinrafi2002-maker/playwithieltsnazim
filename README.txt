PLAY IELTS WITH NAZIM — NETLIFY V11

DEPLOY
1. Extract this ZIP.
2. Deploy the extracted folder to Netlify (index.html must be at the publish root).
3. In Netlify → Site configuration → Environment variables, add:
   GEMINI_API_KEY = your private Google Gemini API key
4. Optional (recommended if you use a different Firebase project):
   FIREBASE_PROJECT_ID = play-with-ielts-nazim
   FIREBASE_WEB_API_KEY = your Firebase web API key
5. Trigger a fresh deploy.

IMPORTANT SECURITY
- Never put GEMINI_API_KEY in index.html or browser settings.
- Student Gemini chat is public to signed-in/visiting users according to your app access.
- Admin Gemini requests are checked server-side: a valid Firebase ID token and users/{uid}.role = "admin" are required.
- The AI Admin Assistant proposes supported safe changes (settings, text, CSS, navigation labels, custom sections). It does not receive unrestricted database access and cannot execute arbitrary JavaScript or silently deploy source-code changes.
- For structural HTML/JS changes, update the source file, review it, then redeploy on Netlify.
- Admin profile reads through Firestore REST must be permitted for the signed-in user by your Firestore rules. If denied, Admin AI will show an authorization error rather than bypassing your rules.

V11 FIXES
- Admin Panel Master Tools are now visible to admin users and wired: JSON backup export/import plus diagnostics.
- Folder Revision now supports selecting multiple folders together.
- Folder Revision has Active and OFF/Inactive lists with per-word ON/OFF.
- Multi-Folder Revision reads vocabulary through an explicit bridge from the Firebase module, fixing zero-word counts caused by module-scope visibility.
- Multi-Folder Revision refreshes after asynchronous vocabulary hydration.
- Daily Report history checks current-month date documents as well as the userId query, helping recover older October reports (including October 13/14) if the Firebase document still exists.
- Word Meaning Builder and bulk tools are grouped inside one expandable Smart Word Lab section.
- Gemini Admin Assistant is available directly inside the Admin Panel.
- AI-generated arbitrary HTML/JavaScript injection and destructive remove actions are disabled.
- Admin AI server requests now require Firebase admin-role verification.

TESTING LIMITATION
The HTML scripts and module syntax can be checked locally, but real Firebase permissions, the user's October report records, and the deployed Netlify environment must be verified in the user's own account after deployment.

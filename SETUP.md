# Study Shelf setup

GitHub Pages or Firebase Hosting serves the React app. Firebase
Authentication and Firestore provide sign-in and synced study progress. The
public catalog works without Firebase. Never share passwords, private keys,
Firebase Admin credentials, access tokens, or service-account JSON.

## 1. Configure Firebase

Skip Firebase setup if you only need the public catalog. Accounts and cloud
sync require a Firebase project.

1. In the [Firebase Console](https://console.firebase.google.com/), create or
   select a project and register a **Web app** under **Project settings →
   General → Your apps**.
2. Enable **Authentication → Sign-in method → Email/Password**. Enable
   **Google** too if you want Google sign-in, and configure its support email.
3. Create a Cloud Firestore database.
4. In **Authentication → Settings → Authorized domains**, add:
   - `localhost` and `127.0.0.1` for local development.
   - `<your-github-owner>.github.io` for the published site (hostname only).
   - Any custom domain you attach to GitHub Pages.
5. Add the Firebase Web app's public browser configuration to `.env.local` or
   GitHub Actions variables/secrets. Do not use a service-account key.

Firebase Web app configuration is included in the public JavaScript bundle by
design. Firestore rules protect user data.

## 2. Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set these values in `.env.local` using your Firebase Web app config:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-web-app-id
# Optional
VITE_FIREBASE_MEASUREMENT_ID=
```

`.env.local` is ignored by Git. Never put Admin credentials, private keys,
passwords, or access tokens in `VITE_` variables.

## 3. Publish on GitHub Pages

The `.github/workflows/deploy-pages.yml` workflow builds the app on pushes to
`main`. It supports repository and owner Pages URLs, including nested
React Router URLs.

1. Push this repository to GitHub and use `main` as the deployment branch.
2. To enable sign-in and cloud sync, open **Repository → Settings → Secrets
   and variables → Actions** and add these repository variables or secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` (optional)
   - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
3. Set the values from the Firebase Web app config. They are public browser
   config, not private credentials. Without them, the public catalog works
   but sign-in and account sync are unavailable.
4. Open **Repository → Settings → Pages**, set **Build and deployment →
   Source** to **GitHub Actions** (not **Deploy from a branch**).
5. Run **Actions → Deploy Study Shelf to GitHub Pages** to publish the latest
   commit. The build verifies its assets and repository base path.
6. Add the deployed hostname to Firebase Authentication's **Authorized
   domains**.

The workflow creates the `dist/404.html` fallback for direct nested routes.
Do not hand-edit generated files in `dist/`.

### If sign-in does not work

- **Firebase rejected the API key:** confirm all four required values are from
  the same Firebase Web app and project, then rerun the Pages workflow.
- **Unauthorized domain:** add the hostname shown in the address bar to
  Firebase Authentication → Settings → Authorized domains. Do not include
  `https://` or a path.
- **Provider disabled:** enable Email/Password in Firebase Authentication;
  enable Google separately to use Google sign-in.
- **Incorrect email or password:** create an account first or use
  **Forgot password?**. Passwords are not transferred from another site.
- **Guest mode:** add the Firebase values to Actions variables/secrets and
  redeploy. A local `.env.local` does not configure GitHub Pages.
- **Firestore permission denied:** deploy `firestore.rules` to the same
  Firebase project used by the app.

## 4. Deploy Firebase rules

The rules are separate from GitHub Pages deployment. Use the Firebase CLI as
the project owner:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,storage
```

`firestore.rules` protects account study data. `storage.rules` denies all
access because Study Shelf no longer supports uploads. Deploying the Storage
rule disables access to files uploaded through the old feature; it does not
delete those objects. To remove old files or stop storage charges, delete them
from the Firebase Console's Storage section. If the previous community shelf
was used, remove its old `communityBooks` metadata documents in Firestore too.

## 5. Optional Firebase Hosting

GitHub Pages is the automatic deployment target. For Firebase Hosting, use a
root-path build with `.env.local`:

```powershell
npm run build
npx firebase-tools deploy --only hosting
```

The Hosting configuration serves `dist/` and rewrites browser routes to
`index.html`. Add the Hosting domain (for example, `<project-id>.web.app`) to
Firebase Authentication's authorized domains as well.

## 6. Verify

- Check that the GitHub Actions deployment completed successfully.
- Open `/library`, a `/book/...` page, and `/dashboard/...` directly on the
  Pages domain, then refresh each route.
- Create an account with email/password, sign out, and sign in again. Test
  Google sign-in if enabled.
- Save a book and complete a study topic; verify they sync to the account.
- Test account deletion with a test account first.

For help, share the Pages URL, Firebase project ID, failed setup step, and
redacted error text. Never send passwords, private keys, Firebase Admin
credentials, access tokens, or private documents.

## Local book folders and copyright

GitHub Pages is a public static host: files included in a Pages build can be
downloaded by anyone, even if a page asks visitors to sign in. The local
`MATHS/` folder is excluded from Git so PDFs are not accidentally published.
Study Shelf does not host or accept user-uploaded PDFs. Only link or share
books you are authorized to distribute; commercial book entries point to
legitimate editions and previews.

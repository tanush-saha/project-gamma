# Study Shelf setup

GitHub Pages publishes the React app. Firebase supplies sign-in and the
authenticated user's Firestore data; Firebase Hosting is optional. This guide
is for the project owner. Never share passwords, private keys, Firebase Admin
credentials, access tokens, or service-account JSON.

## 1. Set up Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), create or
   select your project and register a **Web app** under **Project settings →
   General → Your apps**.
2. Enable **Authentication → Sign-in method → Email/Password** and **Google**.
   Configure a support email for Google sign-in.
3. Create a Cloud Firestore database.
4. In **Authentication → Settings → Authorized domains**, add:
   - `localhost` and `127.0.0.1` for local development.
   - `<your-github-owner>.github.io` for the published project site. Do not
     include `https://`, a path, or a trailing slash.
   - Any custom domain you later attach to GitHub Pages.
5. Add Firebase's web app's **public browser configuration** to the local
   `.env.local` file as described below. Never create or download a service
   account for the website.

Firebase Auth popup/redirect sign-in requires the exact published domain to be
authorized. After the first Pages deploy, confirm that host in the Firebase
Console before testing login. Firebase Web app configuration is included in
the public JavaScript bundle by design; Firestore and Storage security rules,
not hiding the web config, protect user data.

The app's core sign-in and study library do not require Firebase Storage. Leave
`VITE_FIREBASE_STORAGE_BUCKET` blank to use account, saved-book, and progress
features without cloud PDF uploads.

### Optional private PDF storage

Cloud Storage is optional and may require Firebase's billing-enabled Blaze
plan. Review current plan eligibility, quotas, and pricing before enabling
billing; a budget alert is not a spending cap. If you enable Storage, create a
bucket and deploy `storage.rules`. The app limits PDFs to 20 MB and scopes file
access to each authenticated owner.

On **Your workspace → PDF shelf**, select multiple PDFs or choose a folder.
Files are checked and uploaded one at a time to the signed-in account; each
PDF must be at most 20 MB. The upload asks you to confirm the total size first
and reports any files that fail. Review Firebase Storage pricing before
uploading, and only store files you own or are authorized to keep.

## 2. Configure local development

From the repository folder:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` with the Web app values shown by Firebase:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-web-app-id
# Optional; required only for private cloud PDF uploads.
VITE_FIREBASE_STORAGE_BUCKET=
# Optional.
VITE_FIREBASE_MEASUREMENT_ID=
```

Use the exact `storageBucket` value Firebase shows for your project; older
projects can use a different suffix. Analytics is optional. `.env.local` is
ignored by Git. Never put Admin credentials, private keys, passwords, or
access tokens in `VITE_` variables.

Start the app:

```powershell
npm run dev
```

## 3. Configure GitHub Pages and Firebase login

The included `.github/workflows/deploy-pages.yml` builds and deploys the site
when changes are pushed to `main`. It supports both a repository site
(`https://<owner>.github.io/<repository>/`) and an owner site
(`https://<owner>.github.io/`), including React Router's nested URLs.

1. Push this repository to GitHub and make sure its default deployment branch
   is `main`.
2. Open **Repository → Settings → Secrets and variables → Actions** and add
   the Firebase Web app configuration as repository variables or secrets. Use
   these exact names:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
   - `VITE_FIREBASE_STORAGE_BUCKET` (optional; enables private PDF uploads)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` (optional; not used by sign-in)
3. Set each value from your Firebase Web app configuration. These values are
   public client configuration, not private credentials; the build makes them
   visible in the website. The deployment workflow accepts either Actions
   variables or Actions secrets. Do not add a service-account key.
4. Open **Repository → Settings → Pages**, choose **GitHub Actions** as the
   build and deployment source, and save.
5. Open **Actions → Deploy Study Shelf to GitHub Pages** and monitor the
   workflow. The build intentionally fails with a clear message if a required
   Firebase variable is missing.
6. When deployment finishes, open the Pages URL shown in the workflow, then
   verify that the same hostname (without scheme or path) is in Firebase
   Authentication's authorized domains.
7. Test **Create a free account** with a test email, sign out, then sign in
   again. Also test Google sign-in if you enabled that provider. Open a
   `/dashboard/...` URL directly; GitHub Pages' generated `404.html` fallback
   allows the React app to restore nested routes.

Each push to `main` publishes a fresh build. The generated `dist/404.html`
and `dist/.nojekyll` are build artifacts; do not hand-edit them.

### If sign-in does not work

- **“Firebase rejected this app's API key”**: Check that the Actions value
  came from the Firebase **Web app** config for the same project as
  `VITE_FIREBASE_PROJECT_ID`, then rerun the Pages workflow.
- **“Add this hostname to Authorized domains”**: Add the hostname shown in
  the address bar to Firebase Authentication → Settings → Authorized domains.
  Add only the hostname, not `https://` or the repository path.
- **“Enable Email/Password sign-in”**: In Firebase Authentication →
  Sign-in method, enable Email/Password. Enable Google separately if you want
  Google sign-in and set its support email.
- **“The email or password is not correct”**: Create an account first or use
  **Forgot password?**. Passwords are not transferred from another site.
- **Firebase connection/configuration error**: Check the four required Actions
  values, your network, and the Actions build log. A local `.env.local` does
  not configure the GitHub Pages deployment.
- **Firestore `permission-denied` after sign-in**: Select the correct Firebase
  project, deploy `firestore.rules`, then retry. Authentication and Firestore
  rules are configured separately.

For private PDFs only, set `VITE_FIREBASE_STORAGE_BUCKET`, enable Firebase
Storage, deploy `storage.rules`, and review the current Firebase billing and
quotas first. Storage is not required for sign-in, saved books, or progress.

## 4. Deploy Firebase security rules

Firebase rules are separate from GitHub Pages deployment. Install/use the
Firebase CLI as the project owner and select your project:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

If Storage is enabled and you accept its billing requirements, deploy its
owner-only rules too:

```powershell
npx firebase-tools deploy --only storage
```

Rules are in `firestore.rules` and `storage.rules`. They scope private data to
the authenticated UID, restrict PDF uploads to 20 MB, disallow overwriting
uploaded bytes, and allow edits only to a PDF's display title. Account
deletion requires recent authentication and removes the account's known PDF
files, metadata, saved-book documents, reading-progress records, and profile
before deleting the Firebase Auth user.

## 5. Optional Firebase Hosting

GitHub Pages is the automatic website deployment target. Firebase Hosting can
also serve the same app if you choose, but it is not required for login or
Firestore. For Firebase Hosting, use a root-path build with `.env.local`:

```powershell
npm run build
npx firebase-tools deploy --only hosting
```

The Hosting configuration serves `dist/` and rewrites browser routes to
`index.html`. For Firebase Auth on that alternative host, add its domain (for
example, `<project-id>.web.app`) to Firebase Authentication's authorized
domains too.

## 6. Optional PDF upload CORS configuration

If private PDF reading reports a CORS error:

1. Edit `storage.cors.json` and add the exact published Pages origin, such as
   `https://<owner>.github.io` (origins do not include a repository path).
2. Install Google Cloud CLI and authenticate to the project that owns the
   Firebase Storage bucket.
3. Apply the CORS file to the exact bucket shown in Firebase:

   ```powershell
   gcloud storage buckets update gs://YOUR_STORAGE_BUCKET --cors-file=storage.cors.json
   ```

Do not make the bucket public. Keep Storage rules owner-only.

## 7. Verify

- Check the GitHub Actions Pages deployment completed successfully.
- Open `/library`, a `/book/...` page, and `/dashboard/...` directly on the
  Pages domain, then refresh each route.
- Sign up with email/password and Google, sign out, and sign in again.
- Save a book and complete a study topic; verify they remain associated with
  the account.
- If Storage is enabled, upload a small permitted PDF or folder, then read,
  rename, and remove an uploaded PDF.
- Test account deletion with a test account first.

For help, share the Pages URL, Firebase project ID, failed setup step, and
redacted error text. Never send passwords, private keys, Firebase Admin
credentials, access tokens, or private documents.

## Local book folders and copyright

GitHub Pages is a public static host: files included in a Pages build can be
downloaded by anyone, even if a page asks visitors to sign in. The local
`MATHS/` folder is excluded from Git so PDFs are not accidentally published.
Its filenames identify commercial exam-prep books, which I cannot help
redistribute. Keep those PDFs off GitHub and the public catalog. If a PDF is
yours or you have permission to store it, sign in, open
**Your workspace → PDF shelf**, and choose the PDFs or folder to upload. Each
PDF must be up to 20 MB, and Firebase Storage must be enabled. The login-only
library links to official and open sources. Private storage is per-account
under Storage rules and may incur charges.

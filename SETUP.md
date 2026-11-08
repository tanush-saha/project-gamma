# Study Shelf setup

GitHub Pages or Firebase Hosting serves the React app. Firebase supplies
sign-in, Firestore, and shared file storage. This guide is for the project
owner. Never share passwords, private keys, Firebase Admin
credentials, access tokens, or service-account JSON.

## 1. Set up Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), create or
   select your project and register a **Web app** under **Project settings →
   General → Your apps**.
2. Enable **Authentication → Sign-in method → Email/Password** and **Google**.
   Configure a support email for Google sign-in.
3. Create a Cloud Firestore database and a Firebase Storage bucket.
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

The public Community PDFs shelf stores PDF bytes in Firebase Storage and
metadata in Firestore. Firebase Hosting is only the static website host; it
does not store uploaded files by itself. Storage may require Firebase's
billing-enabled Blaze plan. Check current pricing and quotas before enabling
uploads.

### Cloud PDF shelves

The **Community PDFs** page is shared across GitHub Pages, Firebase Hosting,
and devices: signed-in users can upload PDFs, and all visitors can read and
download them. Each file is immediately public, limited to 20 MB, and can be
removed by its uploader. Only upload files you own or have explicit permission
to publish. Storage costs may apply; a budget alert is not a spending cap.

The separate **Your workspace → PDF shelf** remains private to the signed-in
account. Both shelves use Firebase Storage; the shared shelf also needs the
Firestore and Storage rules deployed below.

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
# Required for both cloud PDF shelves.
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
   - `VITE_FIREBASE_STORAGE_BUCKET` (required for cloud PDF uploads)
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
- **Firebase connection/configuration error**: Check the required Actions
  values, your network, and the Actions build log. A local `.env.local` does
  not configure the GitHub Pages deployment.
- **Firestore `permission-denied` after sign-in**: Select the correct Firebase
  project, deploy `firestore.rules`, then retry. Authentication and Firestore
  rules are configured separately.

Set the storage bucket variable in Actions for GitHub Pages builds and in
`.env.local` for Firebase Hosting builds. It must match the bucket created in
the Firebase project.

## 4. Deploy Firebase security rules

Firebase rules are separate from GitHub Pages deployment. Install/use the
Firebase CLI as the project owner and select your project:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,storage
```

Rules are in `firestore.rules` and `storage.rules`. Public community PDFs can
be read by anyone, while upload, rename, and removal are restricted to the
authenticated uploader. Private files remain owner-only. Both shelves limit
PDF uploads to 20 MB and disallow overwriting uploaded bytes. Account deletion
removes the account's private and public PDFs, metadata, saved-book documents,
reading-progress records, and profile before deleting the Firebase Auth user.

## 5. Optional Firebase Hosting

GitHub Pages is the automatic website deployment target. To serve the same app
from Firebase Hosting, use a root-path build with `.env.local`:

```powershell
npm run build
npx firebase-tools deploy --only hosting
```

The Hosting configuration serves `dist/` and rewrites browser routes to
`index.html`. For Firebase Auth on that alternative host, add its domain (for
example, `<project-id>.web.app`) to Firebase Authentication's authorized
domains too.

## 6. Storage CORS configuration

Configure the Storage bucket's CORS before uploading from the browser. Edit
`storage.cors.json` to include the exact GitHub Pages origin and Firebase
Hosting origin for this project (origins contain no path), then apply it:

1. Install Google Cloud CLI and authenticate to the project that owns the
   Firebase Storage bucket.
2. Apply the CORS file to the exact bucket shown in Firebase:

   ```powershell
   gcloud storage buckets update gs://YOUR_STORAGE_BUCKET --cors-file=storage.cors.json
   ```

The bucket itself does not need public access; the deployed Storage rules
control access to public community objects and private personal objects.

## 7. Verify

- Check the GitHub Actions Pages deployment completed successfully.
- Open `/library`, `/community`, a `/book/...` page, and `/dashboard/...`
  directly on the Pages domain, then refresh each route.
- Sign up with email/password and Google, sign out, and sign in again.
- Save a book and complete a study topic; verify they remain associated with
  the account.
- Upload a permitted PDF to `/community`, then open it in a signed-out browser
  or on the other host to confirm the file is shared. Rename/remove it as its
  uploader, then test the private shelf separately.
- Test account deletion with a test account first.

For help, share the Pages URL, Firebase project ID, failed setup step, and
redacted error text. Never send passwords, private keys, Firebase Admin
credentials, access tokens, or private documents.

## Local book folders and copyright

GitHub Pages is a public static host: files included in a Pages build can be
downloaded by anyone, even if a page asks visitors to sign in. The local
`MATHS/` folder is excluded from Git so PDFs are not accidentally published.
its filenames identify commercial exam-prep books, which I cannot help
redistribute. Keep those PDFs off GitHub and the public catalog. Only upload a
PDF you own or are explicitly authorized to share to **Community PDFs**; those
files are public and downloadable by anyone. Use **Your workspace → PDF shelf**
for files you are authorized to store privately. Each PDF must be up to 20 MB,
and Firebase Storage may incur charges.

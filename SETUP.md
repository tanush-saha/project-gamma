# Study Shelf setup

This guide covers a solo-owner Firebase setup for the React + Vite application.
The source code can live on GitHub, but Firebase Hosting serves the deployed
site. The web-app configuration is public browser configuration; never put
Firebase Admin credentials in this project or share passwords, tokens, private
keys, or service-account JSON in chat.

## What is included

- Public pages at `/`, `/library`, `/book/:id`, `/about`, `/privacy`, and
  `/terms`.
- Firebase email/password and Google Authentication routes at `/login` and
  `/signup`.
- Private nested workspace routes at `/dashboard`,
  `/dashboard/library`, `/dashboard/progress`, `/dashboard/shelf`, and
  `/dashboard/settings`.
- Firestore owner-only saved-book, completed-topic, theme, preferred-stream,
  and per-book reading-progress data.
- Optional owner-only PDF upload, reading, renaming, and deletion. Each file
  is limited to 20 MB.
- Firebase Analytics, if its measurement ID is set and the current browser
  supports Analytics.

There is no PDF OCR, AI book analysis, semantic search, or bulk ingestion
pipeline in this application.

## 1. Create your Firebase project

1. In the [Firebase Console](https://console.firebase.google.com/), create a
   project and register a Web app under **Project settings → General → Your
   apps**.
2. Enable **Authentication → Sign-in method → Email/Password** and **Google**.
3. Create a Firestore database in production mode. Select its location carefully.
4. Add `localhost` and your Firebase Hosting domain in **Authentication →
   Settings → Authorized domains**.
5. In **Project settings → Your apps**, copy the Web app config. Only use the
   Web app config with Vite; never download or add a service-account key.

Cloud Storage is optional. Firebase currently requires the billing-enabled
Blaze plan for Cloud Storage. Review the current Firebase plan, region, quotas,
and pricing before enabling billing. A budget alert is not a spending cap. If
you do not enable Storage, sign-in, discovery, saved books, and study progress
can still work; personal cloud PDF uploads will not.

## 2. Configure local development

From the project directory:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` with the Web app values shown by Firebase:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-web-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Use the exact `storageBucket` value Firebase shows for your project; older
projects can use a different suffix. Analytics is optional. `.env.local` is
ignored by Git. Vite embeds `VITE_` values in the browser build, so these are
not secret credentials. Do not put an Admin key, private key, access token, or
password in a `VITE_` variable.

Start the app:

```powershell
npm run dev
```

## 3. Select Firebase and deploy security rules

Install/use the Firebase CLI as the project owner:

```powershell
npx firebase-tools login
npx firebase-tools use --add
```

Select the Firebase project you created, then deploy Firestore rules:

```powershell
npx firebase-tools deploy --only firestore:rules
```

If you created a Storage bucket and accept its billing requirements, deploy its
rules too:

```powershell
npx firebase-tools deploy --only storage
```

Rules are in `firestore.rules` and `storage.rules`. They scope private data to
the authenticated UID, restrict PDF uploads to 20 MB, disallow overwriting
uploaded bytes, and allow edits only to a PDF's display title. Per-book
progress documents accept only an integer percentage from 0 to 100 and an
update timestamp. Account deletion requires recent authentication and removes
the account's known PDF files, metadata, saved-book documents, reading-progress
records, and profile before deleting the Firebase Auth user. If a cloud cleanup
step fails, the UI reports the error and does not silently claim deletion
succeeded.

## 4. Optional PDF upload CORS configuration

The private shelf reads PDF bytes directly from Firebase Storage. If the
browser reports a CORS error:

1. Edit `storage.cors.json` and add your exact Firebase Hosting origin (and any
   custom domain you use).
2. Install Google Cloud CLI if it is not already available and authenticate it
   to the project that owns the Firebase Storage bucket.
3. Apply the CORS file to the exact bucket shown in Firebase:

   ```powershell
   gcloud storage buckets update gs://YOUR_STORAGE_BUCKET --cors-file=storage.cors.json
   ```

Do not make the bucket public. The Storage Security Rules should remain
owner-only.

## 5. Build and deploy Firebase Hosting

Build locally with `.env.local` present so the generated site contains the
Firebase Web app configuration:

```powershell
npm run build
```

Then publish. Include Storage only if you configured a bucket:

```powershell
npx firebase-tools deploy --only hosting,firestore:rules,storage
```

Without Storage:

```powershell
npx firebase-tools deploy --only hosting,firestore:rules
```

`firebase.json` serves `dist/` and rewrites page paths to `index.html` so real
browser routes continue to work after refresh and direct links. Rebuild before
deploying after changing Firebase configuration.

## 6. Verify the product

- Sign up with email/password and Google, then sign out and sign back in.
- Open a protected `/dashboard/...` URL while signed out; successful sign-in
  should return to that destination.
- Save a public book and complete a study topic; verify they remain on the
  account after reopening the site.
- If Storage is enabled, upload a small PDF you are authorized to store, read
  it, rename it, and remove it.
- Test account deletion with a test account first. It requires recent
  authentication and removes data from that account.
- Check the Firebase Console for rule deployment and usage. Never test with
  open rules such as `allow read, write: if true`.

For help, share the project ID, Hosting URL, which setup step failed, and
redacted error text. Do not share passwords, private keys, Firebase Admin
credentials, access tokens, or private documents.

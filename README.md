# Study Shelf

Study Shelf is a reading and study product for PCM, PCB, Commerce, and
Humanities learners. The public homepage introduces the product and lets
visitors discover official and openly available book sources. A Firebase
account opens a private workspace with saved books, study progress, and a
personal cloud PDF shelf.

## Stack

- React + Vite for the app.
- React Router browser routes with a persistent, guarded nested workspace.
- Firebase Hosting for deployment.
- Firebase Authentication for email/password and Google sign-in.
- Firebase Analytics, when supported by the browser.
- Cloud Firestore for per-user profile, saved-book IDs, progress IDs, and PDF
  metadata, plus owner-scoped per-book reading-progress records.
- Optional Firebase Cloud Storage for personal PDFs, protected by owner-only
  rules. Storage currently requires Firebase's billing-enabled Blaze plan;
  no-cost usage may apply, but billing is not a hard spending cap.

Personal PDF upload is limited to 20 MB per file and is private to the
authenticated owner. Account settings include display name, preferred stream,
day/focus appearance, sign-out, and a reauthenticated account deletion flow.
Public pages include source discovery, book details, about, privacy, and terms.
The product does not currently run OCR, AI book analysis, semantic search,
bulk ingestion, public uploads, simulations, or 3D models.
Firebase plan eligibility, quotas, and pricing can change; confirm current
requirements in Firebase Console before enabling Storage or billing.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Firebase **web app**
   configuration. Never add an Admin SDK key or service-account JSON.
4. Run `npm run dev`.

The local Vite server and Firebase Hosting both serve real paths such as
`/book/chemistry-openstax` and `/dashboard/progress`; Firebase Hosting rewrites
those page requests to the React app entry point.

## Deploy

Follow [SETUP.md](./SETUP.md) for Firebase project setup, Authentication,
Firestore and Storage rules, secrets guidance, and Firebase Hosting deployment.

In short, after setup (include `storage` only if you enabled Firebase Storage):

```powershell
npm run build
npx firebase-tools deploy --only hosting,firestore:rules,storage
```

Without Storage, deploy with `npx firebase-tools deploy --only hosting,firestore:rules`.

GitHub is optional source-code hosting; the deployment target is Firebase
Hosting. The Firebase CLI publishes `dist/`. Do not upload `.env.local`,
private PDFs, account credentials, or service-account files to GitHub.

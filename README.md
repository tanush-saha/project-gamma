# Study Shelf

Study Shelf is a React + Vite reading and study product for PCM, PCB,
Commerce, and Humanities learners. GitHub Pages publishes the public site;
Firebase provides authentication and the private cloud workspace.

## Features

- Public home, source library, book details, and product/legal pages.
- A login-only study library with curated source links, plus a responsive
  protected workspace with saved books and study progress.
- Firebase email/password and Google sign-in.
- Owner-scoped Firestore profiles, saved books, progress, and PDF metadata.
- Optional private Firebase Storage shelf for PDFs (up to 20 MB per file).
- Automatic GitHub Pages deployment from the `main` branch.

Study Shelf links to books and learning resources at their providers; it does
not host third-party books. Storage may require Firebase billing. Check current
Firebase plans and usage before enabling it.
The local `MATHS/` folder is excluded from GitHub Pages; its PDFs are not
published. Only upload files to the private PDF shelf if you own them or have
permission to store them.

## Run locally

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase Web app
   configuration.
3. Run `npm run dev`.

Never put Firebase Admin credentials, service-account JSON, private keys,
passwords, or access tokens in this client application.

## Publish on GitHub Pages

Follow [SETUP.md](./SETUP.md) to enable Firebase Authentication, add the
Firebase Web app values as GitHub Actions repository variables or secrets, and select
**GitHub Actions** as the Pages deployment source. Push to `main`; the
workflow builds the app with its repository URL base path and deploys it.

The workflow also creates the `404.html` fallback needed for React Router
routes on GitHub Pages. Firebase Web app configuration is embedded in the
browser bundle; it is client configuration, not an Admin credential.

## Firebase Hosting (optional alternative)

To serve the app from Firebase Hosting instead, configure `.env.local`, run
`npm run build`, then deploy with the Firebase CLI. This root-path build is
separate from the GitHub Pages build:

```powershell
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

Add `,storage` only if you configured Firebase Cloud Storage. See
[SETUP.md](./SETUP.md) for rule deployment and account setup.

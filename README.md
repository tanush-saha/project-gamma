# Study Shelf

Study Shelf is a React + Vite reading and study product for PCM, PCB,
Commerce, and Humanities learners. GitHub Pages or Firebase Hosting serves
the site; Firebase Authentication, Firestore, and Storage provide shared cloud
features.

## Features

- Public home, source library, book details, and product/legal pages.
- A searchable resource catalog with JEE/NEET filters, saved titles, and
  reference-book edition/preview searches through Google Books.
- Official CBSE sample papers and exam archives, plus links to open-textbook
  libraries for science, mathematics, commerce, and humanities.
- A login-only study library with curated source links, plus a responsive
  protected workspace with saved books and study progress.
- Firebase email/password and Google sign-in.
- Owner-scoped Firestore profiles, saved books, progress, and private PDF shelf.
- A public community PDF shelf: signed-in users can upload PDFs up to 20 MB,
  and every visitor can read and download them.
- Automatic GitHub Pages deployment from the `main` branch.

Study Shelf links to books and learning resources at their providers; it does
not host third-party books. Community uploads are public; only upload files you
own or have permission to publish. Firebase Storage may require billing. Check
current Firebase plans and usage before uploading.
Commercial reference-book entries help locate legitimate editions and available
previews; Study Shelf does not link to unauthorized copies.
The local `MATHS/` folder is excluded from GitHub Pages; its PDFs are not
published.

The public catalog links to lawful open libraries, official exam resources,
and legitimate edition/preview searches. It does not redistribute commercial
books or third-party scans.

## Run locally

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase Web app
   configuration to use sign-in, cloud sync, and shared uploads. The public
   catalog can also run without Firebase in guest mode.
3. Run `npm run dev`.

Never put Firebase Admin credentials, service-account JSON, private keys,
passwords, or access tokens in this client application.

## Publish on GitHub Pages

Follow [SETUP.md](./SETUP.md) to optionally enable Firebase cloud features,
add the Firebase Web app values as GitHub Actions repository variables or
secrets, and select **GitHub Actions** as the Pages deployment source. Firebase
configuration is not required for the public catalog. Push to `main`; the
workflow builds the app with its repository URL base path and deploys it.

The workflow also creates the `404.html` fallback needed for React Router
routes on GitHub Pages. Firebase Web app configuration is embedded in the
browser bundle; it is client configuration, not an Admin credential.

## Firebase Hosting (alternative)

To serve the app from Firebase Hosting instead, configure `.env.local`, run
`npm run build`, then deploy only Hosting with the Firebase CLI. This root-path
build is separate from the GitHub Pages build:

```powershell
npm run build
npx firebase-tools deploy --only hosting
```

Firebase Authentication, Firestore, and Storage still need to be configured
for cloud features; deploying only Hosting does not deploy their security
rules. Deploy those rules once as described in [SETUP.md](./SETUP.md). The same
Firebase project and configuration can serve both Hosting and GitHub Pages.

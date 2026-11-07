# Study Shelf

A free, mobile-friendly study site for CBSE/NCERT Classes 11–12, built for GitHub Pages. Find recommended books for PCM, PCB, Commerce, and Humanities; follow the topic checklist; and explore five interactive simulations and four 3D models. A Firebase account can sync bookmarks and topic progress. An optional Cloudflare Worker backend adds a moderated cloud bookshelf so users can browse and share licensed PDFs from any device.

## What stays free—and where data is stored

- **Website:** hosted on GitHub Pages.
- **Accounts and progress:** Firebase Authentication and Cloud Firestore on the Spark plan; only book IDs and completed-topic IDs are synced.
- **Shared cloud books (optional):** a Cloudflare Worker, private R2 bucket, and D1 catalog. The Worker authenticates Firebase users, limits uploads, and keeps files private until a moderator approves a book. Approved files are publicly downloadable.
- **Personal PDFs:** the optional private shelf stores files in this browser’s IndexedDB on this device only. Each is limited to 20 MB.
- **Official and open books:** NCERT links lead to its official portal; OpenStax links lead to its publisher. The site does not re-host either publisher’s books.

Free-service quotas, eligibility, and pricing can change, and none of these services is unlimited. Check current provider terms and usage before uploading; no billing plan is needed by the site code itself. Avoid enabling billing unless you explicitly choose to. If a cloud service is unavailable, the GitHub Pages site and browser-local features remain available.

## Publish this project to GitHub Pages

1. Make a **public** GitHub repository (GitHub Pages is free for public repositories on GitHub Free). In GitHub Desktop, add this project folder as a local repository, review the changed-file list, commit the Study Shelf source files, and publish/push the repository. Include hidden `.github/workflows/deploy.yml` and `.nojekyll` files. You can also use Git commands, but stage only the intended site files and check `git status` before committing.
2. Do **not** upload `node_modules/`, `dist/`, `.env.local`, passwords, or other credentials. `.gitignore` already excludes these local files.
3. Keep the repository public only if you are comfortable with its contents being public—including any PDFs under `public/books/`. Review the file list and make sure no unrelated or personal files are selected for upload.
4. If the repository’s default branch is not named `main`, edit the branch under `push.branches` in `.github/workflows/deploy.yml`.
5. On GitHub, open **Repository → Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
6. To switch on real login and syncing, finish the free Firebase setup below, then open **Settings → Secrets and variables → Actions → Variables** in the GitHub repository. Add all six variables listed in the Firebase section. These are Firebase browser-app configuration values, not passwords or admin credentials. To enable community cloud books as well, add `VITE_COMMUNITY_API_URL` after deploying your Cloudflare Worker in the next section.
7. Push a commit to `main` or run **Actions → Deploy Study Shelf to GitHub Pages → Run workflow**. Wait for the green check, then open the Pages URL shown in **Settings → Pages**. For a project repository it will look like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

GitHub Pages is the host. You do **not** need `firebase deploy --only hosting`. The workflow rebuilds and publishes the site on every push to `main`. The app uses hash-based routes, which work on Pages project URLs without custom server rewrites.

### Develop on your computer

1. Install Node.js 20 or newer.
2. In the project folder run `npm install`.
3. For local-only guest use, run `npm run dev`. Books, topics, models, and simulations work without Firebase.
4. When you want free accounts and cloud sharing, follow the Firebase and Cloudflare setup steps below, add the corresponding values to a root-level `.env.local`, and restart the dev server. Vite reads these values during build/startup.
5. Run `npm run build` to generate the deployable site in `dist/`.

## Connect a free Firebase project

Create and manage your own Firebase project in the [Firebase Console](https://console.firebase.google.com/). Firebase provides Spark/free limits; do not attach billing or enable Cloud Storage for this site.

1. Create a Firebase project. In **Project settings → General → Your apps**, add a **Web app** and copy its web configuration.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. In **Authentication → Settings → Authorised domains**, add `YOUR-USERNAME.github.io`. Also add `localhost` if it is not already present, for local testing.
4. In **Firestore Database**, create the default Firestore database. Do not select or enable paid services.
5. For local development, copy `.env.example` to `.env.local` in the project root and fill in the values copied from the Firebase web app configuration:

   ```dotenv
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

6. In the GitHub repository, create **Actions → Variables** with the same six names and values. The Actions build uses these variables; without them the published site works as a local-only guest app but cannot offer real login or cross-device sync.
7. Install Firebase CLI once and publish this repository’s Firestore security rules:

   ```sh
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```

   Choose your Firebase project in `firebase use --add`. The project ID in `.firebaserc` is not a password. If this command creates `.firebaserc`, you may commit it to select the same rules target for later deployments.
8. Rebuild and deploy by pushing a commit to `main`. Try email sign-up or Google sign-in on your GitHub Pages site.

`firestore.rules` lets a signed-in user read and update only their own study profile. The retained per-user `savedBooks` subcollection rule lets existing anonymous Firebase shelves migrate their saved-book IDs; the new app stores a bounded list of progress IDs in that user’s document.

**Important:** Vite configuration values prefixed with `VITE_` are included in browser code. They are not secret passwords. Do not put an Admin SDK key, service-account file, or private credentials in GitHub variables, `.env.local`, or the website. Access control is provided by Firebase Authentication and the Firestore rules, not by hiding the web config.

## Enable the cloud bookshelf (optional)

This adds cross-device PDF sharing without Firebase Storage: Cloudflare R2 holds files in a **private** bucket; D1 stores their catalog and review status; a Worker verifies Firebase ID tokens and only streams files to the public after a moderator approves them. It is not enabled until you create and deploy these services in your own Cloudflare account.

Cloudflare’s free Workers, D1, and R2 allowances and signup requirements may change. Check the current [Cloudflare pricing](https://www.cloudflare.com/plans/developer-platform/) and usage limits first. The bucket is intentionally not public. Do not configure an R2 public URL, and do not upload any book unless its license explicitly permits redistribution.

1. Finish Firebase setup above and make sure Email/Password or Google authentication works on your Pages site. Use the same Firebase project ID for the Worker and `VITE_FIREBASE_PROJECT_ID`.
2. Create a Cloudflare account and install project dependencies with `npm install`. From the project folder run `npx wrangler login` and approve the official Cloudflare browser authorization.
3. Create the private PDF bucket: `npm run cloud:r2:create`. Do not enable a public bucket URL or custom domain.
4. Create the D1 database: `npm run cloud:d1:create`. Copy its database ID into `database_id` in `cloudflare/wrangler.toml`. The Worker bindings already refer to the intended bucket and database names.
5. In `cloudflare/wrangler.toml`, replace `FIREBASE_PROJECT_ID` with your Firebase project ID. Replace `https://YOUR-USERNAME.github.io` in `ALLOWED_ORIGINS` with the exact Pages site origin (no repository path or trailing slash). Leave the localhost origins for local development; add an exact custom-domain origin if applicable.
6. Apply the catalog schema to your remote database: `npm run cloud:d1:init`. This creates the upload, status, and moderator-review fields and indexes.
7. Choose at least one moderator. Sign in to your site with that Firebase account, then copy its UID from **Firebase Console → Authentication → Users**. Set it as a Worker secret with `npx wrangler secret put ADMIN_UIDS --config cloudflare/wrangler.toml`. For multiple moderators, enter comma-separated UIDs. Keep this secret out of the public app and repository. Without a moderator, uploads stay private and pending.
8. Deploy the Worker with `npm run cloud:deploy`. Copy the Worker URL Wrangler prints, for example `https://study-shelf-community.YOUR-ACCOUNT.workers.dev`.
9. In GitHub **Settings → Secrets and variables → Actions → Variables**, add `VITE_COMMUNITY_API_URL` with that complete Worker URL (no trailing slash). Add the same `VITE_COMMUNITY_API_URL=https://...workers.dev` line to `.env.local` for local website development. The six Firebase web configuration variables and this URL are public client configuration; **never** paste `ADMIN_UIDS`, a service-account key, or any secret into `VITE_` values.
10. Push to the GitHub Pages branch so Actions rebuilds the website. Open `https://YOUR-WORKER-URL/api/health`; an `ok` response confirms that the API is reachable. Return to the Books page to browse and submit licensed PDFs.

**Local cloud API testing:** after configuring the D1 ID, run `npm run cloud:d1:init:local` to initialize the Wrangler local D1 database, then run `npm run cloud:dev`. In a second terminal, set `VITE_COMMUNITY_API_URL=http://localhost:8787` in `.env.local` and run `npm run dev`. Firebase must still be configured, and the Worker’s localhost origin must match the development server’s origin.

### Upload and approve a book

1. Sign in to the Books page with a Firebase email/Google account, select **Share a permitted book**, and enter its original title, author/credit, source, study stream, class, and actual redistribution license. Choose a PDF up to 20 MB and confirm that you have the right to redistribute that exact file.
2. The Worker checks the PDF signature, size, license field, user identity, and per-account upload limit. It saves the file to the private R2 bucket and adds a `pending` catalog record. The uploader can preview or remove their pending file; other users cannot read it.
3. A moderator whose Firebase UID is configured in `ADMIN_UIDS` sees **Moderator Desk** on the Books page. Inspect the PDF and verify its original license and source **before** approving. Approval makes the file publicly downloadable; rejection does not publish it. The uploader or a moderator can delete a book.
4. The confirmation box and moderator review are not legal verification. Never submit copyrighted NCERT books, retail textbooks, scans, or personal copies without explicit redistribution rights. Record and follow any attribution/share-alike terms.

The site stays usable in local-only mode when Cloudflare is unconfigured or unavailable. The older **Personal books** shelf is optional and saves PDFs only in the current browser.

## About the topic checklist

`src/curriculum.js` lists Classes XI–XII topics for PCM, PCB, Commerce, and Humanities subjects, and lets learners track each unit. Physics and Chemistry are included in both science streams; Economics is available in both Commerce and Humanities. **This checklist is a navigational study aid based on NCERT textbook/course material; it is not an authoritative or exhaustive CBSE syllabus and completing it does not guarantee exam coverage.** CBSE can revise syllabi and rationalise chapters each year. Check your subject’s current official syllabus first: [CBSE 2026–27 curriculum](https://cbseacademic.nic.in/curriculum_2027.html).

To edit the study map, edit the `courses` array in `src/curriculum.js`. Each course defines class, subject, stream(s), chapters, and topic units.

## How to add books

### Add a PDF just for yourself (this browser only)

Open **Books → Add a PDF** and choose a PDF you own or may lawfully use. The file stays in this browser’s IndexedDB. To read it on another device, import it separately there. Clearing browser data will remove the local copy, so keep your own backup.

### Add a redistributable PDF to the public website repository (manual alternative)

1. Check that the book is public domain or its license explicitly permits public web distribution. Do not upload retail textbooks, scans, or a personal copy of copyrighted books.
2. Create `public/books/` in this repository and put the legally redistributable PDF there, for example `public/books/introductory-statistics.pdf`. Keep PDFs reasonably small; GitHub warns above 50 MB and rejects individual files above 100 MB. GitHub Pages publishes every file in this folder for anyone to download.
3. Add a book object to `openBooks` in `src/books.js`. Give it a unique `id`, a `track` (`PCM`, `PCB`, `Commerce`, or `Humanities`), and the matching `publicPath`:

   ```js
   {
     id: "my-public-statistics",
     title: "Introductory Statistics",
     author: "Author name",
     publisher: "Public domain / open license",
     subject: "Statistics",
     track: "Commerce",
     level: "Class XII",
     description: "A brief description of this book.",
     source: "Read / download PDF",
     cover: "STATISTICS",
     number: "14",
     color: "blue",
     publicPath: "books/introductory-statistics.pdf",
   }
   ```

   Set a unique `number` for the cover. The available cover colours are `mint`, `lilac`, `peach`, and `blue`. The website builds its download link with the correct GitHub Pages repository path.
4. Commit and push the PDF and catalog change. When the Pages workflow succeeds, find it under **Books** and download it there.

For NCERT and OpenStax textbooks, link to the publisher’s official download page instead of copying the PDF into this repository.

## Folder guide

- `src/main.jsx` — page navigation, book library, topic tracker, account and upload interfaces.
- `src/curriculum.js` — CBSE/NCERT topic map and NCERT textbook links.
- `src/Simulations.jsx` — five interactive browser simulations.
- `src/Models3D.jsx` — four mouse-rotatable 3D models.
- `src/bookshelf.js` — private, per-browser IndexedDB PDF storage.
- `src/community.js` — public Worker API URL and browser-side request helper.
- `cloudflare/worker.js` — authenticated Worker API and moderation checks.
- `cloudflare/schema.sql` — the community-books D1 schema.
- `cloudflare/wrangler.toml` — Worker bindings and origin/Firebase configuration.
- `src/firebase.js`, `firestore.rules` — optional Firebase login and protected progress sync.
- `public/books/` — create this folder only for book PDFs that may legally be published to all visitors.
- `.github/workflows/deploy.yml` — automated GitHub Pages deployment.

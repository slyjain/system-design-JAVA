# Study Reader

A browser reader with separate **Theory** (`../ToLearn/`) and **Practice** (`../PracticeSheets/`) sections. The website is static; shared checkbox state is stored in Cloud Firestore. There is no application server or login. Your Java practice code stays in dated folders under `DailyPractice/`.

## Run locally

```bash
cd study-reader
npm install
npm run dev
```

Open the **Local** address printed by Vite. If port 5173 is occupied, Vite chooses another port. `npm` is Node's package manager; `npm run dev` starts the development server. The server serves frontend files and watches your notes; it is not the shared-progress database.

You can read and search immediately. Checkboxes remain disabled until Firebase is configured. When notes change locally, Vite normally refreshes them; refresh the browser if needed.

## Subjects

In both Theory and Practice, use the **Subject** selector to browse DSA, LLD, HLD, Core CS, AI, Programming or Developer Tools. Empty categories remain selectable. Existing files at the root, and files in unrecognized folders, appear under **Unsorted**; **All subjects** shows everything.

The first folder below `ToLearn/` or `PracticeSheets/` determines the subject: for example, `ToLearn/LLD/SOLID.md` is theory and `PracticeSheets/LLD/Invoice.md` is practice. Nested folders within a subject also work. To add another subject, update `src/categories.ts` as well as the folders.

The category selector does not move files or change their IDs. If you later move an existing note into a category, its path changes and its ticks start unchecked, as described below.

## Sort by when a document was first added

Use **Sort by** to choose newest first (the default), oldest first, or name. Dates apply to whole notes and practice sheets, not individual paragraphs.

Git stores commit dates, not a file's actual creation time. The displayed date is the earliest commit that added the document, with Git's best-effort rename tracking (`git log --follow`). It can differ from when the file was originally written, especially for copied files or incomplete history. Times are displayed in the browser's time zone.

New, not-yet-committed documents and documents whose history isn't available show **Date unavailable** and appear after dated documents in either date order. Restart the local Vite server after committing a new file so it recomputes the dates. GitHub Actions checks out the full history before building the site; a local shallow clone or missing Git leaves dates unavailable rather than guessing.

## Set up shared progress

1. Create a project in the [Firebase console](https://console.firebase.google.com/). Create a **Cloud Firestore** database in a region you choose, using production mode initially. Review the provider's free quota and costs.
2. Register a **Web app** in Firebase project settings. Copy the web configuration values shown there.
3. From `study-reader/`, create your local configuration:

   ```bash
   cp .env.example .env.local
   ```

   Enter `apiKey`, `authDomain`, `projectId` and `appId` in the corresponding `VITE_FIREBASE_...` entries. Restart `npm run dev` after changing the file. Do not put quotes or semicolons from the JavaScript configuration object into the values.
4. In the Firebase console, open **Firestore Database → Rules**. Copy the contents of `firestore.rules` in this folder, review them and publish them. Without these rules the app cannot save progress.
5. Open the app in two browser windows. Tick an item in one: the other should update. Refresh and confirm it remains ticked. A successful connection is shown in the top bar.

The Firebase **web** configuration is included in browser code and is not a secret. `.env.local` is ignored by Git for convenience, not secrecy. Never put a service-account private key, admin credential or password in it or in the frontend.

### Public-write warning

This design deliberately permits **any visitor** to read and change the same checkbox states. The rules restrict the document shape and ID, but cannot prevent malicious edits, excessive writes, quota exhaustion or bills. A public site URL or a Firebase web API key is not an access control. For private or tamper-resistant progress, use authentication and stricter rules instead.

Only current items from the open note are subscribed to. A deleted or changed item is no longer shown, but its old database record is not automatically deleted. Public access also means users can query other progress records directly.

## Publish on GitHub Pages

The repository has a workflow at `.github/workflows/study-reader.yml`. It builds and deploys the reader when `ToLearn/`, `PracticeSheets/`, `study-reader/` or the workflow changes on `main`, and supports manual runs.

1. Make sure your repository and GitHub plan support Pages. In **repository Settings → Pages**, select **GitHub Actions** as the source. The resulting site and the notes it contains are public.
2. In **Settings → Secrets and variables → Actions → Variables**, add these repository variables with the same Firebase web values as `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. Commit and push the reader, workflow and notes to `main`, or run the workflow manually from the Actions tab. Open the URL in the completed Pages deployment.

The build embeds the notes. A hosted site will not see local edits until they are committed, pushed and successfully deployed. Existing Firestore progress is independent of deployments.

## How a tick stays attached to an item

The reader parses Markdown, then hashes each item's **file path, type, normalized content and duplicate occurrence** into an ID. It does not use line numbers. Therefore:

- Inserting an unrelated item leaves existing ticks alone; the new item starts unchecked.
- Editing an item or renaming its file gives it a new ID, so it starts unchecked. Putting the exact old content back at the same path can restore its old tick.
- Identical repeated items use their occurrence order. Inserting or deleting an identical duplicate before another can make ticks appear to move between duplicates.
- In theory, a paragraph, table row, code block or list item is one item. In practice, only list items and table rows are checkable; explanations, headings and code examples are not. A nested list item gets its own tick.
- Theory keeps its original IDs, so adding the practice section does not reset theory ticks. Practice IDs are namespaced by their `PracticeSheets/` paths.

The note files are never rewritten. `Learned/` is not read or modified.

## Marking an exercise from the terminal

The reader and this command use the same point IDs and shared Firestore data. From `study-reader/`:

```bash
npm run practice -- list Programming/InterfacesTask.md
npm run practice -- check Programming/InterfacesTask.md <point-id>
npm run practice -- uncheck Programming/InterfacesTask.md <point-id>
```

`list` reads the server and shows each point's current status and ID. Replace `<point-id>` with its displayed ID (at least eight unique hexadecimal characters). `check` and `uncheck` change just that point; the website updates through its existing listener. Check a point only after the user confirms completion or the work has been verified. These commands require the Firebase configuration described above and do not edit the Markdown sheet.

## Checks

```bash
npm test
npm run build
```

The tests cover note parsing and ID stability. Firebase connection and cross-browser synchronization require your configured Firebase project and should be tested separately as described above.

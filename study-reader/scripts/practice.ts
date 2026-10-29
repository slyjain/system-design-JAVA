import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { collection, doc, documentId, getDocsFromServer, getFirestore, query, setDoc, terminate, where } from 'firebase/firestore';
import { parseNote } from '../src/parser';
import { practicePoints } from '../src/practicePoints';

const usage = 'Usage: npm run practice -- list <sheet.md>\n' +
  '       npm run practice -- check|uncheck <sheet.md> <unique-id-prefix>';

async function main() {
  const [command, sheet, prefix, ...extra] = process.argv.slice(2);
  if (!sheet || extra.length || !['list', 'check', 'uncheck'].includes(command ?? '') ||
      (command === 'list' ? Boolean(prefix) : !prefix || !/^[a-f0-9]{8,64}$/.test(prefix))) {
    throw new Error(usage);
  }

  const root = realpathSync(fileURLToPath(new URL('../../PracticeSheets/', import.meta.url)));
  const name = sheet.startsWith('PracticeSheets/') ? sheet.slice('PracticeSheets/'.length) : sheet;
  const file = realpathSync(resolve(root, name));
  const path = relative(root, file);
  if (!path || path.startsWith(`..${sep}`) || path === '..' || isAbsolute(path) || !path.endsWith('.md')) {
    throw new Error('Choose a Markdown file inside PracticeSheets/.');
  }
  const note = parseNote(`PracticeSheets/${path.split(sep).join('/')}`, readFileSync(file, 'utf8'), 'practice');
  const points = practicePoints(note);
  let point = undefined;
  if (command !== 'list') {
    const matches = points.filter((item) => item.id.startsWith(prefix!));
    if (matches.length !== 1) throw new Error(`ID prefix matched ${matches.length} points; run list and choose a unique ID.`);
    point = matches[0];
  }

  const envFile = fileURLToPath(new URL('../.env.local', import.meta.url));
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  if (!Object.values(config).every((value) => Boolean(value?.trim()))) {
    throw new Error('Firebase is not configured. See study-reader/README.md.');
  }

  const db = getFirestore(initializeApp(config));
  try {
    if (command === 'list') {
      const checked = new Map<string, boolean>();
      for (let i = 0; i < points.length; i += 30) {
        const batch = points.slice(i, i + 30).map((item) => item.id);
        const snapshot = await getDocsFromServer(query(collection(db, 'checks'), where(documentId(), 'in', batch)));
        snapshot.forEach((entry) => checked.set(entry.id, entry.data().checked === true));
      }
      console.log(`${note.title} (${points.length} points)`);
      for (const item of points) {
        console.log(`[${checked.get(item.id) ? 'x' : ' '}] ${item.id.slice(0, 12)}  ${item.label.replace(/\s+/g, ' ')}`);
      }
    } else if (point) {
      await setDoc(doc(db, 'checks', point.id), { checked: command === 'check' });
      console.log(`${command === 'check' ? 'Completed' : 'Unchecked'}: ${point.label.replace(/\s+/g, ' ')}`);
    }
  } finally {
    await terminate(db);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

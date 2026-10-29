import { initializeApp } from 'firebase/app';
import { collection, doc, documentId, getFirestore, onSnapshot, query, setDoc, where } from 'firebase/firestore';

export type Progress = Record<string, boolean>;
export type Connection = 'unconfigured' | 'connecting' | 'live' | 'cached' | 'error';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configured = Object.values(config).every((value) => Boolean(value?.trim()));
const database = configured ? getFirestore(initializeApp(config)) : null;

export function subscribeProgress(
  ids: string[],
  onProgress: (progress: Progress, connection: Connection) => void,
  onError: (error: string) => void,
): () => void {
  if (!database) {
    onProgress({}, 'unconfigured');
    return () => {};
  }
  if (!ids.length) {
    onProgress({}, 'live');
    return () => {};
  }

  // Query only IDs in the open note. This avoids downloading arbitrary public
  // documents and stays within Firestore's 30-values-per-query limit.
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i + 30));
  const snapshots = new Map<number, { data: Progress; cached: boolean }>();
  const stops = batches.map((batch, index) => onSnapshot(
    query(collection(database, 'checks'), where(documentId(), 'in', batch)),
    { includeMetadataChanges: true },
    (snapshot) => {
      const data: Progress = {};
      for (const entry of snapshot.docs) {
        const checked: unknown = entry.data().checked;
        if (typeof checked === 'boolean') data[entry.id] = checked;
      }
      snapshots.set(index, { data, cached: snapshot.metadata.fromCache });
      if (snapshots.size !== batches.length) return;
      const values = [...snapshots.values()];
      onProgress(Object.assign({}, ...values.map((part) => part.data)),
        values.some((part) => part.cached) ? 'cached' : 'live');
    },
    (error) => onError(error.message),
  ));
  return () => stops.forEach((stop) => stop());
}

export async function setChecked(id: string, checked: boolean): Promise<void> {
  if (!database) throw new Error('Set up Firebase before changing shared progress.');
  await setDoc(doc(database, 'checks', id), { checked });
}

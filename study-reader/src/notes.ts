import { parseNote } from './parser';

export { parseNote } from './parser';
export type { Item, ListNode, NoteNode, TableNode } from './parser';

// Keep the original relative theory paths: Firestore ticks depend on them.
const theorySources = import.meta.glob<string>('../../ToLearn/**/*.md', {
  query: '?raw', import: 'default', eager: true,
});
const practiceSources = import.meta.glob<string>('../../PracticeSheets/**/*.md', {
  query: '?raw', import: 'default', eager: true,
});

export const theoryNotes = Object.entries(theorySources)
  .map(([path, source]) => parseNote(path.replace('../../ToLearn/', ''), source))
  .sort((a, b) => a.title.localeCompare(b.title));

// Namespace practice paths so a same-named theory file never shares ticks.
export const practiceNotes = Object.entries(practiceSources)
  .map(([path, source]) => parseNote(path.replace('../../PracticeSheets/', 'PracticeSheets/'), source, 'practice'))
  .sort((a, b) => a.title.localeCompare(b.title));

export const notes = theoryNotes;

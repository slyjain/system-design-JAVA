import type { Section } from './categories';

export type SortOrder = 'newest' | 'oldest' | 'name';
export type SortableNote = { path: string; title: string };
export type CreationDates = Record<string, string | null>;

export function firstAdded(note: SortableNote, section: Section, dates: CreationDates): string | null {
  const key = section === 'theory' ? `ToLearn/${note.path}` : note.path;
  const value = dates[key];
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

export function sortNotes<T extends SortableNote>(notes: T[], section: Section, order: SortOrder, dates: CreationDates): T[] {
  return [...notes].sort((a, b) => {
    const nameOrder = a.title.localeCompare(b.title) || a.path.localeCompare(b.path);
    if (order === 'name') return nameOrder;
    const aDate = firstAdded(a, section, dates);
    const bDate = firstAdded(b, section, dates);
    // Missing dates always go last, regardless of sort direction.
    if (!aDate) return bDate ? 1 : nameOrder;
    if (!bDate) return -1;
    const difference = Date.parse(aDate) - Date.parse(bDate);
    return (order === 'newest' ? -difference : difference) || nameOrder;
  });
}

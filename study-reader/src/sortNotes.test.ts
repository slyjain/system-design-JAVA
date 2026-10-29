import { describe, expect, it } from 'vitest';
import { firstAdded, sortNotes } from './sortNotes';

const documents = [
  { path: 'LLD/b.md', title: 'Bravo' },
  { path: 'LLD/a.md', title: 'Alpha' },
  { path: 'LLD/u.md', title: 'Unknown' },
];
const dates = {
  'ToLearn/LLD/a.md': '2024-01-01T10:00:00Z',
  'ToLearn/LLD/b.md': '2024-02-01T10:00:00Z',
  'ToLearn/LLD/u.md': null,
  'PracticeSheets/LLD/a.md': '2025-01-01T10:00:00Z',
};

describe('document sorting', () => {
  it('sorts newest or oldest first, placing unavailable dates last', () => {
    expect(sortNotes(documents, 'theory', 'newest', dates).map((note) => note.title)).toEqual(['Bravo', 'Alpha', 'Unknown']);
    expect(sortNotes(documents, 'theory', 'oldest', dates).map((note) => note.title)).toEqual(['Alpha', 'Bravo', 'Unknown']);
  });

  it('sorts by name without mutating the input', () => {
    expect(sortNotes(documents, 'theory', 'name', dates).map((note) => note.title)).toEqual(['Alpha', 'Bravo', 'Unknown']);
    expect(documents.map((note) => note.title)).toEqual(['Bravo', 'Alpha', 'Unknown']);
  });

  it('uses deterministic name and path ordering for ties and invalid dates', () => {
    const tied = [
      { path: 'z.md', title: 'Same' }, { path: 'a.md', title: 'Same' }, { path: 'x.md', title: 'X' },
    ];
    const sameDates = { 'ToLearn/z.md': '2024-01-01T00:00:00Z', 'ToLearn/a.md': '2024-01-01T00:00:00Z', 'ToLearn/x.md': 'invalid' };
    expect(sortNotes(tied, 'theory', 'newest', sameDates).map((note) => note.path)).toEqual(['a.md', 'z.md', 'x.md']);
  });

  it('looks up theory and practice using their respective paths', () => {
    expect(firstAdded({ path: 'LLD/a.md', title: 'Alpha' }, 'theory', dates)).toBe('2024-01-01T10:00:00Z');
    expect(firstAdded({ path: 'PracticeSheets/LLD/a.md', title: 'Alpha' }, 'practice', dates)).toBe('2025-01-01T10:00:00Z');
    expect(firstAdded({ path: 'unknown.md', title: 'Unknown' }, 'theory', dates)).toBeNull();
  });
});

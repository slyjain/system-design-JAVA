import { describe, expect, it } from 'vitest';
import { subjects, subjectForPath } from './categories';

describe('subject folders', () => {
  it('contains every agreed category, even before any files exist', () => {
    expect(subjects.map((subject) => subject.id)).toEqual([
      'DSA', 'LLD', 'HLD', 'Core-CS', 'AI', 'Programming', 'Developer-Tools',
    ]);
  });

  it('categorizes nested theory and practice paths without changing them', () => {
    expect(subjectForPath('LLD/SOLID.md', 'theory')).toBe('LLD');
    expect(subjectForPath('PracticeSheets/Core-CS/Threads.md', 'practice')).toBe('Core-CS');
    expect(subjectForPath('Programming/Java/Interfaces.md', 'theory')).toBe('Programming');
  });

  it('keeps existing root files and unknown folders accessible as unsorted', () => {
    expect(subjectForPath('InterfacesDocs.md', 'theory')).toBe('unsorted');
    expect(subjectForPath('PracticeSheets/InterfacesTask.md', 'practice')).toBe('unsorted');
    expect(subjectForPath('Other/file.md', 'theory')).toBe('unsorted');
    expect(subjectForPath('DSA.md', 'theory')).toBe('unsorted');
  });
});

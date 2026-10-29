export const subjects = [
  { id: 'DSA', label: 'DSA' },
  { id: 'LLD', label: 'LLD' },
  { id: 'HLD', label: 'HLD' },
  { id: 'Core-CS', label: 'Core CS' },
  { id: 'AI', label: 'AI' },
  { id: 'Programming', label: 'Programming' },
  { id: 'Developer-Tools', label: 'Developer Tools' },
] as const;

export type Subject = (typeof subjects)[number]['id'];
export type SubjectFilter = 'all' | 'unsorted' | Subject;
export type Section = 'theory' | 'practice';

/** Root-level files and unknown folders remain accessible under Unsorted. */
export function subjectForPath(path: string, section: Section): Subject | 'unsorted' {
  const relative = section === 'practice' && path.startsWith('PracticeSheets/')
    ? path.slice('PracticeSheets/'.length)
    : path;
  const [folder, ...rest] = relative.split('/');
  return rest.length && subjects.some((subject) => subject.id === folder)
    ? folder as Subject
    : 'unsorted';
}

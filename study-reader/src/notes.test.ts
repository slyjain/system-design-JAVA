import { describe, expect, it } from 'vitest';
import { notes, parseNote } from './notes';

const sample = `# Example

An introduction.

- First point
  - Nested point
- Second point

| Term | Meaning |
| --- | --- |
| One | First |
| Two | Second |

\`\`\`java
System.out.println("hello");
\`\`\`
`;

describe('note parsing and progress identity', () => {
  it('recognizes paragraphs, individual nested list items, table rows and code blocks', () => {
    const note = parseNote('Example.md', sample);
    expect(note.title).toBe('Example');
    expect(note.itemIds).toHaveLength(7);
    expect(new Set(note.itemIds).size).toBe(note.itemIds.length);
    expect(note.nodes.find((node) => node.kind === 'table')).toMatchObject({
      headers: ['Term', 'Meaning'],
      rows: [{ cells: ['One', 'First'] }, { cells: ['Two', 'Second'] }],
    });
  });

  it('preserves existing IDs when unrelated paragraphs, nested list items or table rows are inserted', () => {
    const before = parseNote('Example.md', sample);
    const after = parseNote('Example.md', sample
      .replace('An introduction.', 'A new paragraph.\n\nAn introduction.')
      .replace('  - Nested point', '  - New nested point\n  - Nested point')
      .replace('| One | First |', '| New | Added |\n| One | First |'));
    expect(after.itemIds).toHaveLength(before.itemIds.length + 3);
    expect(before.itemIds.every((id) => after.itemIds.includes(id))).toBe(true);
  });

  it('changes only the edited item ID, and changes IDs when a file is renamed', () => {
    const before = parseNote('Example.md', sample);
    const edited = parseNote('Example.md', sample.replace('First point', 'Edited point'));
    expect(before.itemIds.filter((id) => !edited.itemIds.includes(id))).toHaveLength(1);
    expect(edited.itemIds.filter((id) => !before.itemIds.includes(id))).toHaveLength(1);
    const renamed = parseNote('Renamed.md', sample);
    expect(before.itemIds.every((id) => !renamed.itemIds.includes(id))).toBe(true);
  });

  it('distinguishes duplicate items, and documents stable occurrence-based IDs', () => {
    const duplicate = parseNote('Example.md', '# Title\n\nSame.\n\nSame.\n');
    expect(duplicate.itemIds).toHaveLength(2);
    expect(duplicate.itemIds[0]).not.toBe(duplicate.itemIds[1]);
    expect(parseNote('Example.md', '# Title\n\nSame.\n\nSame.\n').itemIds).toEqual(duplicate.itemIds);
  });

  it('loads real notes, preserves reference definitions and ignores them as reading items', () => {
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.some((note) => note.path === 'InterfacesDocs.md')).toBe(true);
    const note = parseNote('Links.md', '# Links\n\n[Example][source]\n\n[source]: https://example.com\n');
    expect(note.itemIds).toHaveLength(1);
    expect(note.definitions).toContain('https://example.com');
  });
});

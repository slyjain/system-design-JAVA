import type { ListNode, Note, NoteNode } from './parser';

export type PracticePoint = { id: string; label: string };

/** Visit points in the same order as the reader, including nested list items. */
export function practicePoints(note: Note): PracticePoint[] {
  const points: PracticePoint[] = [];
  const visitList = (list: ListNode) => {
    for (const entry of list.entries) {
      if (entry.item) points.push({ id: entry.item.id, label: entry.item.label });
      entry.nested.forEach(visitList);
    }
  };
  const visit = (node: NoteNode) => {
    if (node.kind === 'item') points.push({ id: node.id, label: node.label });
    if (node.kind === 'list') visitList(node);
    if (node.kind === 'table') points.push(...node.rows.map(({ id, label }) => ({ id, label })));
  };
  note.nodes.forEach(visit);
  return points;
}

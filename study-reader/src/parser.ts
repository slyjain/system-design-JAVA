import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { toString } from 'mdast-util-to-string';
import type { List, ListItem, PhrasingContent, RootContent, Table } from 'mdast';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';

export type Item = { kind: 'item'; id: string; markdown: string; label: string };
export type ListEntry = { item: Item | null; nested: ListNode[] };
export type ListNode = { kind: 'list'; ordered: boolean; start: number; entries: ListEntry[] };
export type TableRow = { id: string; cells: string[]; label: string };
export type TableNode = {
  kind: 'table';
  headers: string[];
  align: Array<'left' | 'right' | 'center' | null>;
  rows: TableRow[];
};
export type NoteNode =
  | { kind: 'heading'; markdown: string }
  | { kind: 'divider' }
  | { kind: 'content'; markdown: string }
  | Item
  | ListNode
  | TableNode;

export type Note = {
  section: 'theory' | 'practice';
  path: string;
  title: string;
  source: string;
  nodes: NoteNode[];
  itemIds: string[];
  definitions: string;
};

function digest(value: string): string {
  return bytesToHex(sha256(utf8ToBytes(value)));
}

function markdown(children: RootContent[]): string {
  return toMarkdown({ type: 'root', children }, { extensions: [gfmToMarkdown()] }).trim();
}

function cellMarkdown(children: PhrasingContent[]): string {
  return markdown([{ type: 'paragraph', children }]);
}

/** Identity uses content instead of line numbers, so unrelated insertions don't reset progress. */
export function parseNote(path: string, source: string, section: 'theory' | 'practice' = 'theory'): Note {
  const tree = remark().use(remarkGfm).parse(source);
  const seen = new Map<string, number>();
  const itemIds: string[] = [];
  const idFor = (kind: string, content: string) => {
    const identity = JSON.stringify([path, kind, content]);
    const occurrence = seen.get(identity) ?? 0;
    seen.set(identity, occurrence + 1);
    const id = digest(JSON.stringify([identity, occurrence]));
    itemIds.push(id);
    return id;
  };
  const makeItem = (kind: string, content: RootContent[], label: string): Item | null => {
    if (!content.length) return null;
    const text = markdown(content);
    if (!text) return null;
    return { kind: 'item', id: idFor(kind, text), markdown: text, label: label.trim() || 'content' };
  };
  const makeList = (list: List): ListNode => ({
    kind: 'list',
    ordered: list.ordered ?? false,
    start: list.start ?? 1,
    entries: list.children.map((entry: ListItem) => {
      const own = entry.children.filter((child) => child.type !== 'list');
      const nested = entry.children.filter((child): child is List => child.type === 'list');
      return {
        item: makeItem('list-item', own, own.map((child) => toString(child)).join(' ')),
        nested: nested.map(makeList),
      };
    }),
  });
  const makeTable = (table: Table): TableNode => {
    const [header, ...rows] = table.children;
    return {
      kind: 'table',
      headers: header ? header.children.map((cell) => cellMarkdown(cell.children)) : [],
      align: (table.align ?? []).map((value) => value ?? null),
      rows: rows.map((row) => {
        const cells = row.children.map((cell) => cellMarkdown(cell.children));
        return { id: idFor('table-row', JSON.stringify(cells)), cells, label: row.children.map((cell) => toString(cell)).join(' — ') };
      }),
    };
  };

  const definitions = markdown(tree.children.filter((node) => node.type === 'definition'));
  const firstTitle = tree.children.find((node) => node.type === 'heading' && node.depth === 1);
  const title = firstTitle ? toString(firstTitle) : path.split('/').pop()?.replace(/\.md$/, '') || path;
  const nodes: NoteNode[] = [];
  for (const node of tree.children) {
    if (node === firstTitle) continue;
    if (node.type === 'heading') nodes.push({ kind: 'heading', markdown: markdown([node]) });
    else if (node.type === 'thematicBreak') nodes.push({ kind: 'divider' });
    else if (node.type === 'list') nodes.push(makeList(node));
    else if (node.type === 'table') nodes.push(makeTable(node));
    // Definitions are included for link resolution, but are not reading items.
    else if (node.type !== 'definition') {
      if (section === 'practice') nodes.push({ kind: 'content', markdown: markdown([node]) });
      else {
        const item = makeItem(node.type, [node], toString(node));
        if (item) nodes.push(item);
      }
    }
  }
  return { section, path, title, source, nodes, itemIds, definitions };
}

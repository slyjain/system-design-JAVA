import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import creationDates from 'virtual:note-creation-times';
import { subjects, subjectForPath } from './categories';
import type { Section, SubjectFilter } from './categories';
import { practiceNotes, theoryNotes } from './notes';
import type { Item, ListNode, NoteNode, TableNode } from './notes';
import { firstAdded, sortNotes } from './sortNotes';
import type { SortableNote, SortOrder } from './sortNotes';
import { setChecked, subscribeProgress } from './progress';
import type { Connection, Progress } from './progress';

type ReadingProps = {
  progress: Progress;
  pending: Set<string>;
  disabled: boolean;
  action: 'understood' | 'completed';
  definitions: string;
  onToggle: (id: string, checked: boolean) => void;
};

function Markdown({ text, definitions, inline = false }: { text: string; definitions: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={inline ? { p: 'span' } : undefined}
    >
      {definitions ? `${text}\n\n${definitions}` : text}
    </ReactMarkdown>
  );
}

function Tick({ id, label, progress, pending, disabled, action, onToggle }: ReadingProps & { id: string; label: string }) {
  const checked = progress[id] === true;
  return (
    <input
      className="tick"
      type="checkbox"
      aria-label={`Mark as ${action}: ${label.replace(/\s+/g, ' ').slice(0, 120)}`}
      checked={checked}
      disabled={disabled || pending.has(id)}
      onChange={(event) => onToggle(id, event.target.checked)}
    />
  );
}

function ReadingItem({ item, ...props }: ReadingProps & { item: Item }) {
  return (
    <div className={`reading-item${props.progress[item.id] ? ' is-understood' : ''}`}>
      <Tick id={item.id} label={item.label} {...props} />
      <div className="markdown item-content"><Markdown text={item.markdown} definitions={props.definitions} /></div>
    </div>
  );
}

function ReadingList({ list, ...props }: ReadingProps & { list: ListNode }) {
  const entries = list.entries.map((entry, index) => (
    <li key={entry.item?.id ?? `empty-${index}`}>
      {entry.item && <ReadingItem item={entry.item} {...props} />}
      {entry.nested.map((nested, nestedIndex) => <ReadingList key={nestedIndex} list={nested} {...props} />)}
    </li>
  ));
  return list.ordered ? <ol className="reading-list" start={list.start}>{entries}</ol> : <ul className="reading-list">{entries}</ul>;
}

function ReadingTable({ table, ...props }: ReadingProps & { table: TableNode }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">{props.action === 'completed' ? 'Completed' : 'Understood'}</span></th>
            {table.headers.map((header, index) => (
              <th scope="col" key={index} style={{ textAlign: table.align[index] ?? undefined }}>
                <Markdown text={header} definitions={props.definitions} inline />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id} className={props.progress[row.id] ? 'is-understood' : ''}>
              <td><Tick id={row.id} label={row.label} {...props} /></td>
              {row.cells.map((cell, index) => (
                <td key={index} style={{ textAlign: table.align[index] ?? undefined }}>
                  <Markdown text={cell} definitions={props.definitions} inline />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadingNode({ node, ...props }: ReadingProps & { node: NoteNode }) {
  switch (node.kind) {
    case 'heading': return <div className="markdown section-heading"><Markdown text={node.markdown} definitions={props.definitions} /></div>;
    case 'divider': return <hr />;
    case 'content': return <div className="markdown practice-content"><Markdown text={node.markdown} definitions={props.definitions} /></div>;
    case 'item': return <ReadingItem item={node} {...props} />;
    case 'list': return <ReadingList list={node} {...props} />;
    case 'table': return <ReadingTable table={node} {...props} />;
  }
}

const statusText: Record<Connection | 'idle', string> = {
  idle: 'Choose a note',
  unconfigured: 'Preview only · Firebase not configured',
  connecting: 'Connecting to shared progress…',
  live: 'Shared progress connected',
  cached: 'Cached progress · connection may be offline',
  error: 'Could not load shared progress',
};

function addedDate(note: SortableNote, section: Section): string {
  const date = firstAdded(note, section, creationDates);
  return date ? `First added ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date))}` : 'Date unavailable';
}

export default function App() {
  const [section, setSection] = useState<Section>('theory');
  const [subject, setSubject] = useState<SubjectFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [selectedPaths, setSelectedPaths] = useState(() => ({
    theory: sortNotes(theoryNotes, 'theory', 'newest', creationDates)[0]?.path ?? '',
    practice: sortNotes(practiceNotes, 'practice', 'newest', creationDates)[0]?.path ?? '',
  }));
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<Progress>({});
  const [connection, setConnection] = useState<Connection | 'idle'>('connecting');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const notes = section === 'theory' ? theoryNotes : practiceNotes;
  const orderedNotes = useMemo(() => sortNotes(notes, section, sort, creationDates), [notes, section, sort]);
  const subjectNotes = useMemo(() => subject === 'all'
    ? orderedNotes
    : orderedNotes.filter((note) => subjectForPath(note.path, section) === subject), [orderedNotes, section, subject]);
  const selected = subjectNotes.find((note) => note.path === selectedPaths[section]) ?? subjectNotes[0];
  const selectedPath = selected?.path;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? subjectNotes.filter((note) => `${note.path}\n${note.title}\n${note.source}`.toLowerCase().includes(term)) : subjectNotes;
  }, [subjectNotes, search]);

  const changeSection = (next: Section) => {
    setSection(next);
    setSearch('');
  };

  useEffect(() => {
    setProgress({});
    setConnection(selected ? 'connecting' : 'idle');
    setError('');
    if (!selected) return;
    return subscribeProgress(selected.itemIds, (next, status) => {
      setProgress(next);
      setConnection(status);
    }, (message) => {
      setConnection('error');
      setError(message);
    });
  }, [selected]);

  const toggle = async (id: string, checked: boolean) => {
    setError('');
    setPending((previous) => new Set(previous).add(id));
    try {
      await setChecked(id, checked);
    } catch (reason) {
      setError(`Couldn't save this change: ${reason instanceof Error ? reason.message : 'unknown error'}`);
    } finally {
      setPending((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  };

  const understood = selected?.itemIds.filter((id) => progress[id]).length ?? 0;
  const total = selected?.itemIds.length ?? 0;
  const progressAvailable = connection === 'live' || connection === 'cached';
  const rootFolder = section === 'practice' ? 'PracticeSheets' : 'ToLearn';
  const suggestedFolder = subject === 'all' || subject === 'unsorted' ? `${rootFolder}/` : `${rootFolder}/${subject}/`;
  const readingProps: ReadingProps = {
    progress,
    pending,
    disabled: connection === 'unconfigured' || connection === 'connecting' || connection === 'error' || connection === 'idle',
    action: section === 'practice' ? 'completed' : 'understood',
    definitions: selected?.definitions ?? '',
    onToggle: (id, checked) => { void toggle(id, checked); },
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Study notes">
        <div className="brand"><span className="brand-mark" aria-hidden="true">S</span><div><strong>Study Reader</strong><span>Your learning space</span></div></div>
        <div className="library-heading"><span>YOUR LIBRARY</span><span>{notes.length} {section === 'practice' ? 'SHEETS' : 'NOTES'}</span></div>
        <div className="section-switch" role="group" aria-label="Library section">
          <button type="button" aria-pressed={section === 'theory'} onClick={() => changeSection('theory')}>Theory</button>
          <button type="button" aria-pressed={section === 'practice'} onClick={() => changeSection('practice')}>Practice</button>
        </div>
        <label className="subject-label" htmlFor="subject">Subject</label>
        <select id="subject" className="subject-select" value={subject} onChange={(event) => setSubject(event.target.value as SubjectFilter)}>
          <option value="all">All subjects ({notes.length})</option>
          <option value="unsorted">Unsorted ({notes.filter((note) => subjectForPath(note.path, section) === 'unsorted').length})</option>
          {subjects.map(({ id, label }) => (
            <option key={id} value={id}>{label} ({notes.filter((note) => subjectForPath(note.path, section) === id).length})</option>
          ))}
        </select>
        <label className="subject-label" htmlFor="sort">Sort by</label>
        <select id="sort" className="subject-select" value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A–Z)</option>
        </select>
        <label className="search-label" htmlFor="search-notes">Search {section === 'practice' ? 'practice sheets' : 'notes'}</label>
        <input id="search-notes" className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={section === 'practice' ? 'Search practice…' : 'Search notes…'} />
        <nav className="note-list" aria-label="Choose a note">
          {filtered.map((note) => (
            <button className={`note-link${note.path === selectedPath ? ' active' : ''}`} key={note.path}
              onClick={() => setSelectedPaths((previous) => ({ ...previous, [section]: note.path }))} aria-current={note.path === selectedPath ? 'page' : undefined}>
              <span className="note-icon" aria-hidden="true">▤</span><span className="note-copy"><span className="note-title">{note.title}</span><small className="note-date">{addedDate(note, section)}</small></span>
            </button>
          ))}
          {filtered.length === 0 && <p className="empty-search">{search.trim() ? 'No notes match your search.' : 'No notes in this subject yet.'}</p>}
        </nav>
        <div className="sidebar-foot">One place to learn, revisit and grow.</div>
      </aside>

      <main className="main-content">
        <header className="topbar"><span>{section === 'practice' ? 'PRACTICE' : 'THEORY'} <span aria-hidden="true">/</span> READER</span><span className={`connection ${connection}`} role="status"><span className="status-dot" />{statusText[connection]}</span></header>
        {selected ? (
          <article className="document">
            <div className="eyebrow"><span className="eyebrow-dot" /> {section === 'practice' ? 'PRACTICE SHEET' : 'STUDY NOTE'}</div>
            <h1>{selected.title}</h1>
            <p className="file-name">{selected.path} <span aria-hidden="true">·</span> <span title="First Git commit that added this document; it may differ from its actual creation date.">{addedDate(selected, section)}</span></p>
            <div className="progress-card">
              <div><strong>{section === 'practice' ? 'Keep track of your practice.' : 'Keep track of what clicks.'}</strong><p>{section === 'practice' ? 'Tick a point when you complete it.' : 'Tick an item when you understand it.'} Progress is shared with everyone.</p></div>
              <div className="progress-number"><strong>{progressAvailable ? understood : '—'}<span> / {total}</span></strong><small>{section === 'practice' ? 'COMPLETED' : 'UNDERSTOOD'}</small></div>
              <div className="progress-track" role="progressbar" aria-label={section === 'practice' ? 'Points completed' : 'Items understood'} aria-valuemin={0} aria-valuemax={total} aria-valuenow={progressAvailable ? understood : undefined}>
                <span style={{ width: `${total ? (understood / total) * 100 : 0}%` }} />
              </div>
            </div>
            {connection === 'unconfigured' && <p className="notice">Reading is available, but ticks are disabled until Firebase is configured. See <code>study-reader/README.md</code>.</p>}
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            <div className="note-body">{selected.nodes.map((node, index) => <ReadingNode key={index} node={node} {...readingProps} />)}</div>
            <footer className="document-footer">End of note <span aria-hidden="true">✳</span> Keep learning at your own pace.</footer>
          </article>
        ) : <div className="empty-state"><p>No {section === 'practice' ? 'practice sheets' : 'theory notes'} in this subject yet.</p><p>Add a Markdown file under <code>{suggestedFolder}</code>.</p></div>}
      </main>
    </div>
  );
}

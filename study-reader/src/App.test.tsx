// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const fake = vi.hoisted(() => ({
  progress: {} as Record<string, boolean>,
  listeners: new Set<(value: Record<string, boolean>, connection: 'live') => void>(),
  unconfigured: false,
}));

vi.mock('./notes', () => ({
  theoryNotes: [{
    path: 'Example.md', title: 'Example', source: 'first idea', definitions: '',
    itemIds: ['item-one'],
    nodes: [{ kind: 'item', id: 'item-one', markdown: 'First idea', label: 'First idea' }],
  }, {
    path: 'LLD/Design.md', title: 'Design', source: 'design idea', definitions: '',
    itemIds: ['lld-theory'],
    nodes: [{ kind: 'item', id: 'lld-theory', markdown: 'Design idea', label: 'Design idea' }],
  }],
  practiceNotes: [{
    path: 'PracticeSheets/Example.md', title: 'Exercise', source: 'practice point', definitions: '',
    itemIds: ['practice-one'],
    nodes: [
      { kind: 'content', markdown: 'Practice explanation' },
      { kind: 'item', id: 'practice-one', markdown: 'Practice point', label: 'Practice point' },
    ],
  }, {
    path: 'PracticeSheets/LLD/Exercise.md', title: 'Design Exercise', source: 'design practice', definitions: '',
    itemIds: ['lld-practice'],
    nodes: [{ kind: 'item', id: 'lld-practice', markdown: 'Design practice', label: 'Design practice' }],
  }],
}));

vi.mock('virtual:note-creation-times', () => ({
  default: {
    'ToLearn/Example.md': '2024-02-01T00:00:00Z',
    'ToLearn/LLD/Design.md': '2024-01-01T00:00:00Z',
    'PracticeSheets/Example.md': '2024-02-01T00:00:00Z',
    'PracticeSheets/LLD/Exercise.md': '2024-01-01T00:00:00Z',
  },
}));

vi.mock('./progress', () => ({
  subscribeProgress: (_ids: string[], callback: (value: Record<string, boolean>, connection: 'live' | 'unconfigured') => void) => {
    if (fake.unconfigured) {
      callback({}, 'unconfigured');
      return () => {};
    }
    fake.listeners.add(callback);
    callback(fake.progress, 'live');
    return () => fake.listeners.delete(callback);
  },
  setChecked: async (id: string, checked: boolean) => {
    fake.progress = { ...fake.progress, [id]: checked };
    fake.listeners.forEach((listener) => listener(fake.progress, 'live'));
  },
}));

beforeEach(() => {
  fake.progress = {};
  fake.listeners.clear();
  fake.unconfigured = false;
  window.localStorage.clear();
});
afterEach(cleanup);

describe('reader UI with a simulated progress service', () => {
  it('reflects a checked item in two reader instances', async () => {
    const user = userEvent.setup();
    render(<App />);
    render(<App />);
    const boxes = screen.getAllByRole('checkbox', { name: /first idea/i }) as HTMLInputElement[];
    expect(boxes.every((box) => !box.checked)).toBe(true);
    await user.click(boxes[0]);
    await waitFor(() => expect(boxes.every((box) => box.checked)).toBe(true));
  });

  it('allows reading but disables checkboxes without Firebase configuration', () => {
    fake.unconfigured = true;
    render(<App />);
    expect(screen.getByText(/Firebase not configured/)).toBeTruthy();
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('filters notes by their content', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /search notes/i }), 'missing');
    expect(screen.getByText('No notes match your search.')).toBeTruthy();
  });

  it('switches sections, preserves theory ticks, and marks practice as completed', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox', { name: /mark as understood: first idea/i }));
    await user.click(screen.getByRole('button', { name: 'Practice' }));
    expect(screen.getByText('Practice explanation')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    await user.click(screen.getByRole('checkbox', { name: /mark as completed: practice point/i }));
    expect(fake.progress['practice-one']).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Theory' }));
    expect((screen.getByRole('checkbox', { name: /first idea/i }) as HTMLInputElement).checked).toBe(true);
  });

  it('filters theory and practice by subject, including existing unsorted notes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByRole('combobox', { name: 'Subject' });
    await user.selectOptions(select, 'LLD');
    expect(screen.getByRole('heading', { name: 'Design' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Example/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Practice' }));
    expect(screen.getByRole('heading', { name: 'Design Exercise' })).toBeTruthy();
    await user.selectOptions(select, 'unsorted');
    expect(screen.getByRole('heading', { name: 'Exercise' })).toBeTruthy();
  });

  it('shows empty subjects without implying the connection is still loading', async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByRole('combobox', { name: 'Subject' });
    expect(screen.getByRole('option', { name: 'AI (0)' })).toBeTruthy();
    await user.selectOptions(select, 'AI');
    expect(screen.getByText('No theory notes in this subject yet.')).toBeTruthy();
    expect(screen.getByText('Choose a note')).toBeTruthy();
    await user.selectOptions(select, 'all');
    expect(screen.getByRole('heading', { name: 'Example' })).toBeTruthy();
  });

  it('sorts document navigation by first-added time or name', async () => {
    const user = userEvent.setup();
    render(<App />);
    const names = () => within(screen.getByRole('navigation', { name: 'Choose a note' }))
      .getAllByRole('button').map((button) => button.querySelector('.note-title')?.textContent);
    expect(names()).toEqual(['Example', 'Design']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'oldest');
    expect(names()).toEqual(['Design', 'Example']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'name');
    expect(names()).toEqual(['Design', 'Example']);
  });

  it('changes the theme without changing checked study progress', async () => {
    const user = userEvent.setup();
    render(<App />);
    const checkbox = screen.getByRole('checkbox', { name: /first idea/i }) as HTMLInputElement;
    await user.click(checkbox);
    const button = screen.getByRole('button', { name: 'Dark mode' });
    const previous = button.getAttribute('aria-pressed');
    await user.click(button);
    expect(button.getAttribute('aria-pressed')).not.toBe(previous);
    expect(checkbox.checked).toBe(true);
    expect(fake.progress['item-one']).toBe(true);
  });
});

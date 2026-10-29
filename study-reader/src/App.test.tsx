// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
  }],
  practiceNotes: [{
    path: 'PracticeSheets/Example.md', title: 'Exercise', source: 'practice point', definitions: '',
    itemIds: ['practice-one'],
    nodes: [
      { kind: 'content', markdown: 'Practice explanation' },
      { kind: 'item', id: 'practice-one', markdown: 'Practice point', label: 'Practice point' },
    ],
  }],
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
});

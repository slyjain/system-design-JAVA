// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, useTheme } from './useTheme';

function ThemeHarness() {
  const { theme, toggleTheme } = useTheme();
  return <button type="button" aria-pressed={theme === 'dark'} onClick={toggleTheme}>Dark mode</button>;
}

function mockSystemTheme(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    get matches() { return matches; },
    addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => listeners.add(callback),
    removeEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => listeners.delete(callback),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => query));
  return {
    set(dark: boolean) {
      matches = dark;
      listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('display theme', () => {
  it('follows system changes until a manual preference is chosen', async () => {
    const user = userEvent.setup();
    const system = mockSystemTheme(true);
    const view = render(<ThemeHarness />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    act(() => system.set(false));
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    act(() => system.set(false));
    expect(document.documentElement.dataset.theme).toBe('dark');
    view.unmount();
    expect(system.listenerCount()).toBe(0);
  });

  it('restores a saved preference after reopening the app', async () => {
    const user = userEvent.setup();
    mockSystemTheme(false);
    const view = render(<ThemeHarness />);
    await user.click(screen.getByRole('button', { name: 'Dark mode' }));
    view.unmount();
    render(<ThemeHarness />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark mode' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('lets a saved light preference override a dark system', () => {
    mockSystemTheme(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<ThemeHarness />);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('still toggles for this visit when browser storage is blocked', async () => {
    const user = userEvent.setup();
    mockSystemTheme(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeHarness />);
    await user.click(screen.getByRole('button', { name: 'Dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

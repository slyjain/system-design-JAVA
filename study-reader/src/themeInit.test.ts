import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from './useTheme';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];

function initialTheme(saved: string | null, systemDark: boolean, blocked = false): string | undefined {
  if (!script) throw new Error('Theme initialization script not found');
  const document = { documentElement: { dataset: {} as { theme?: string } } };
  runInNewContext(script, {
    document,
    window: { matchMedia: () => ({ matches: systemDark }) },
    localStorage: { getItem: (key: string) => {
      expect(key).toBe(THEME_STORAGE_KEY);
      if (blocked) throw new Error('blocked');
      return saved;
    } },
  });
  return document.documentElement.dataset.theme;
}

describe('theme before first paint', () => {
  it('uses saved preferences before the system setting', () => {
    expect(initialTheme('dark', false)).toBe('dark');
    expect(initialTheme('light', true)).toBe('light');
  });
  it('falls back to the system when there is no usable saved preference', () => {
    expect(initialTheme(null, true)).toBe('dark');
    expect(initialTheme('invalid', false)).toBe('light');
    expect(initialTheme(null, true, true)).toBe('dark');
  });
});

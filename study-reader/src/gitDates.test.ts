import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { firstCommittedAt, hasCompleteGitHistory, noteCreationTimes } from '../gitDates';

const scratchDirs: string[] = [];
afterEach(() => {
  for (const dir of scratchDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('Git creation dates', () => {
  it('follows a rename, leaves uncommitted files undated, and detects shallow history', () => {
    const base = existsSync('/tmp/opencode') ? '/tmp/opencode' : tmpdir();
    const scratch = mkdtempSync(join(base, 'study-reader-git-test-'));
    scratchDirs.push(scratch);
    const repo = join(scratch, 'repo');
    mkdirSync(repo);
    const git = (args: string[], date?: string) => execFileSync('git', args, {
      cwd: repo,
      stdio: 'pipe',
      env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) },
    });
    git(['init', '--quiet']);
    git(['config', 'user.email', 'test@example.invalid']);
    git(['config', 'user.name', 'Test']);
    mkdirSync(join(repo, 'ToLearn'));
    writeFileSync(join(repo, 'ToLearn', 'old.md'), '# First note\nContent\n');
    git(['add', 'ToLearn/old.md']);
    git(['-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'Add note'], '2024-01-01T12:00:00Z');
    git(['mv', 'ToLearn/old.md', 'ToLearn/new.md']);
    git(['-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'Rename note'], '2024-02-01T12:00:00Z');
    writeFileSync(join(repo, 'ToLearn', 'uncommitted.md'), '# New\n');

    expect(hasCompleteGitHistory(repo)).toBe(true);
    expect(new Date(firstCommittedAt(repo, 'ToLearn/new.md')!).toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(firstCommittedAt(repo, 'ToLearn/uncommitted.md')).toBeNull();
    const dates = noteCreationTimes(repo);
    expect(new Date(dates['ToLearn/new.md']!).toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(dates['ToLearn/uncommitted.md']).toBeNull();

    const shallow = join(scratch, 'shallow');
    execFileSync('git', ['clone', '--quiet', '--depth=1', pathToFileURL(repo).href, shallow], { stdio: 'pipe' });
    expect(hasCompleteGitHistory(shallow)).toBe(false);
    expect(noteCreationTimes(shallow)).toEqual({ 'ToLearn/new.md': null });
  });
});

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

const virtualId = 'virtual:note-creation-times';
const resolvedId = `\0${virtualId}`;

/** A shallow clone can hide a file's real first commit, so don't guess. */
export function hasCompleteGitHistory(root: string): boolean {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).trim() === 'false';
  } catch {
    return false;
  }
}

/** Git stores commit dates, not file birth times; rename following is best-effort. */
export function firstCommittedAt(root: string, path: string): string | null {
  try {
    const output = execFileSync('git', ['log', '--follow', '--diff-filter=A', '--format=%cI', '--', path], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).trim();
    const oldest = output.split('\n').at(-1);
    return oldest && Number.isFinite(Date.parse(oldest)) ? oldest : null;
  } catch {
    return null;
  }
}

function markdownPaths(root: string, dir: string): string[] {
  try {
    return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return markdownPaths(root, path);
      return entry.isFile() && entry.name.endsWith('.md') ? [path.split(sep).join('/')] : [];
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export function noteCreationTimes(root: string): Record<string, string | null> {
  const complete = hasCompleteGitHistory(root);
  const paths = ['ToLearn', 'PracticeSheets'].flatMap((dir) => markdownPaths(root, dir));
  return Object.fromEntries(paths.map((path) => [path, complete ? firstCommittedAt(root, path) : null]));
}

export function noteDatesPlugin(root: string): Plugin {
  return {
    name: 'study-reader-note-creation-times',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      return `export default ${JSON.stringify(noteCreationTimes(root))};`;
    },
    configureServer(server) {
      const directories = ['ToLearn', 'PracticeSheets'].map((dir) => join(root, dir));
      server.watcher.add(directories);
      const onFileSetChanged = (file: string) => {
        if (!file.endsWith('.md') || !directories.some((dir) => {
          const path = relative(dir, file);
          return path && !path.startsWith(`..${sep}`) && path !== '..';
        })) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', onFileSetChanged);
      server.watcher.on('unlink', onFileSetChanged);
    },
  };
}

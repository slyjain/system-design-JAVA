# GitHub CLI: `gh`

`gh` is the **GitHub command-line interface**: use it to work with GitHub from a terminal. `git` still handles your local history and can push or fetch; `gh` adds GitHub features such as issues, pull requests and Actions.

## The pattern

`gh <thing> <action> [options]`: for example, `gh run list` means "list workflow runs". Use `--help` to discover options:

```bash
gh --help
gh run --help
gh run view --help
```

Inside a Git repository, `gh` normally infers the GitHub repository from its remotes. Use `-R OWNER/REPO` to specify another one. Some operations require authentication; `gh auth status` checks it and `gh auth login` starts interactive login. Don't paste access tokens into notes or chat.

## Repositories, issues and pull requests

| Command | What it does |
|---|---|
| `gh repo view` | Show the current repository's details. |
| `gh repo view --web` | Open the repository in your browser. |
| `gh issue list` | List open issues; `gh issue view 123` shows one. |
| `gh pr list` | List open pull requests; `gh pr view 123` shows one. |
| `gh pr checks 123` | Show checks for pull request 123. |
| `gh issue create` / `gh pr create` | Interactive commands that **create** an issue or pull request on GitHub. |

Replace `123` with a real issue or pull-request number. An empty list can simply mean there are no open items. `--web` on supported `view` commands opens the corresponding page.

## Actions: workflow versus run

A **workflow** is the recipe (`.github/workflows/study-reader.yml`); a **run** is one execution of that recipe. The workflow ID shown by `gh workflow list` and the run ID shown by `gh run list` are different.

```bash
gh workflow list
gh workflow view study-reader.yml
gh run list --workflow study-reader.yml --limit 5
```

Choose a **run ID** from the last command, then inspect it:

```bash
RUN_ID=40928010866                  # replace with the run ID you want
gh run view "$RUN_ID"              # jobs and their status
gh run view "$RUN_ID" --log-failed # logs from failed steps
gh run watch "$RUN_ID" --exit-status # watch until finished; fail if the run fails
```

To start a new run manually:

```bash
gh workflow run study-reader.yml --ref main
```

**This changes remote state:** it starts a real workflow, including deployment if successful. It isn't needed when a matching push has already triggered one. The repository's automatic triggers are described in `study-reader/README.md`.

## Filtering output

`--json` chooses fields; `--jq` filters that JSON using jq syntax. `gh` evaluates `--jq` itself, so the separate `jq` program isn't required:

```bash
gh run list --workflow study-reader.yml --limit 3 --json databaseId,status,conclusion --jq '.[] | "\(.databaseId) \(.status) \(.conclusion)"'
```

`.[]` visits each run, and `\(...)` inserts each field into the output string. Single quotes stop the shell from interpreting the jq expression.

## Practice

From this repository: run `gh workflow list`, then `gh run list --workflow study-reader.yml --limit 3`. Pick a run ID and use `gh run view` to see what happened. These commands only read; don't start a workflow just to inspect it.

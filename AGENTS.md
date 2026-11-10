# Working on the manykind plugin

This repo is the Manykind plugin for Claude Code (and Codex). It ships skills
that help developers define, design, build, evaluate and ship workflows on
Manykind. This file is for whoever changes the plugin itself.

## Layout

```
.claude-plugin/plugin.json       plugin manifest (name, version)
.claude-plugin/marketplace.json  marketplace "manykind-ai", one plugin "manykind"
.codex-plugin/plugin.json        the same plugin for Codex (skills only)
hooks/                           SessionStart update check (Node, no deps)
skills/<name>/SKILL.md           one skill per folder: frontmatter + short body
skills/<name>/references/*.md    detail a skill loads on demand
skills/<name>/templates/*.md     files a skill writes into the user's project
skills/workflows/references/checks.md  platform checks used by design and reviews
evals/                           scenario evals (see evals/README.md)
REVIEW.md                        checklist for reviewing a change
CHANGELOG.md                     one entry per version
```

There are no subagents yet. The next candidate is a **verifying reviewer**:
it runs in its own context, checks a workflow against
`skills/workflows/references/checks.md` by executing what it can (`mk
validate`, tests, SQL replayed in `sqlite3`, `mk run --dry-run`), and tags
each finding executed or read-only. Subagents go in `agents/<name>.md` and
are listed here.

## Principles

- **Prefer retrieval over embedded facts.** Flags, fields, limits and error
  codes change. Skills tell the agent to look them up: `mk <cmd> --help`,
  `mk schema <name>`, the installed SDK types, one docs page fetched with
  `curl` (`skills/workflows/references/docs.md`). Embed only design knowledge
  that changes slowly.
- **Document released features only.** Anything that needs a CLI or SDK
  newer than the oldest supported one (CLI 5.0) carries its minimum version
  (`CLI >= x.y`). Check the released `@manykind-ai/cli`
  (`npm view @manykind-ai/cli version`, its CHANGELOG) before naming a
  command or flag. Never describe a proposal or a planned change as if it
  existed.
- **Skills suggest, they never block.** The platform gates at release. A
  skill can say what is missing; it never refuses to continue.
- **Skills short, detail in references.** A `SKILL.md` body says when and
  how; tables, flag lists and error catalogues go in `references/`.
- **No one's private conventions.** Never encode one customer's, or our own
  dogfood repo's, table names, campaign fields, folder layout or vault ids.
  Use neutral examples.
- **Manykind names, behaviour first.** Builder-facing text (docs, templates,
  CLI output, plugin) uses Manykind names and describes behaviour; it never
  names Cere Network components.
- **Checks are platform-generic.** `checks.md` holds what applies to any
  workflow (reruns, keys, stores, failures, expressions, CLI version), never
  checks for one use case.
- **Shape the output by the request.** A review, readiness check, bug hunt or
  small fix gets a ranked findings list and no new files. `define` and
  `design` run for a new workflow or set, or when the goal, data or steps
  change, and their descriptions say so.
- **The two living files belong to the developer.** `intent.md` and
  `design.md` (per workflow, or one pair per set of workflows with no
  per-workflow copies) are edited in place. Skills never reject them, never
  strip sections or comments they didn't write, and keep any extra headings.
  They hold no `TBD` stubs: unknowns are left out or listed under
  `## Open questions`.

## Adding or changing a skill

1. Create `skills/<name>/SKILL.md` with frontmatter `name` and `description`.
   The description decides when the skill loads: write it as the requests a
   developer would type ("Use when someone wants…"), and name the files and
   words that should trigger it.
2. Keep the body short. Start with the retrieval note, then the process.
   Move anything long into `references/` and link it with a relative path.
3. Templates hold headings and one-line HTML comments, nothing else.
4. Add or update a scenario in `evals/` that should load the skill.
5. Run validation and the evals (below), then bump the version.

## Versioning

Semver. Every change that ships bumps the version in all three manifests:
`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and the plugin
entry in `.claude-plugin/marketplace.json`. Add a `CHANGELOG.md` entry with
the new version and one line per change. Wording-only fixes are a patch; a
new skill, template or section is a minor.

## Validation

```sh
claude plugin validate .           # manifests, skills, hooks
```

Two warnings are expected: `CLAUDE.md` at the root isn't loaded as plugin
context (it is for people changing the plugin, not for users), and there is
no icon yet. Anything else is a finding.

The CI workflow (`.github/workflows/validate.yml`) runs the same checks
without Claude: JSON manifests parse, the three versions agree, every
`SKILL.md` has `name` and `description`, and the hook script parses. Run its
steps locally before you commit.

## Evals

`evals/` holds one folder per scenario: a request, the skills it should load,
and what a good result contains. How to run them by hand or with
`claude plugin eval`: [evals/README.md](./evals/README.md).

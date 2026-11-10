# Changelog

## 0.1.0

First release of the `manykind` plugin for Claude Code and Codex. Install
with `/plugin marketplace add manykind-ai/plugin` and
`/plugin install manykind@manykind-ai`.

- Skills:
  - `workflows`: background knowledge (anatomy of a workflow, where data
    lives, composing workflows through shared keys, the two living files, the
    CLI version, driving the CLI as an agent). It shapes the output by
    the request: a review, a production-readiness check, a bug hunt or a
    small fix gets a ranked findings list (file:line, how each was checked,
    the fix) and no new files.
  - `define`: writes `intent.md` (Goal, Outcome, Trigger, Done when,
    Examples), the problem first, for a new workflow or set or when the goal
    changes.
  - `design`: writes `design.md` (Steps, Data, Parameters, Composes with),
    how it works on the platform, after `intent.md` or when steps or data
    change. It also reverse-engineers an existing workflow.
  - `develop`: workflow and agent code, cubbies and migrations, the memory
    bank, widgets, tests, and running a workflow once against a vault.
  - `evaluate`: datasets seeded from `intent.md` Examples, experiments,
    baselines and version comparisons with `mk eval`.
  - `deploy`: release, deploy and roll back workflows; build, push, deploy
    and publish agents; credentials.
- Sets of workflows (a funnel, a content factory): one `intent.md` and one
  `design.md` in the parent folder, with per-workflow details as sections of
  the set's `design.md` and one Data table that checks who writes and reads
  each table by which key.
- A platform-generic checklist (`workflows/references/checks.md`) used when
  designing and reviewing: idempotent reruns, keys that match across
  workflows, cubby versus memory-bank visibility, failure mid-run, supported
  expressions, and the installed CLI version.
- Retrieval first: `--help`, `mk schema`, the installed SDK types, then one
  docs page fetched with `curl` (`workflows/references/docs.md`). The
  skills need the Manykind CLI (`@manykind-ai/cli`) 5.0 or newer.
- A SessionStart hook says, once a day, when the plugin or the project's CLI
  is behind. Opt out with `MK_NO_UPDATE_NOTIFIER=1`.
- Development docs (`AGENTS.md`, `REVIEW.md`), scenario evals in `evals/`
  (`claude plugin eval` format), and a CI workflow that validates manifests,
  versions, skill frontmatter and the hook.

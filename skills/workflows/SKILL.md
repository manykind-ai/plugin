---
name: workflows
description: Background knowledge for building on Manykind. Covers what a workflow is (triggers, steps, gates, runs, Result), where its data lives (cubbies, migrations, shared workspaces, the memory bank), how workflows build on each other's data through shared keys and events, the two files a new workflow or set keeps (intent.md and design.md), and the platform checks for designing and reviewing. It decides the output's shape: a review, "is it production-ready", a bug hunt or a small fix gets a ranked findings list, not new files. Use whenever you work on a Manykind workflow, in code (a manykind.config.ts with defineWorkflow, the manykind or mk CLI) or in the console (ROC): creating one, changing what it does or when it runs, reviewing it, debugging a run, or deciding how it should store or share data, even when the request doesn't say "Manykind".
---

# Manykind workflows

Your knowledge of Manykind's CLI, SDK and APIs may be out of date. **Prefer
retrieval over pre-training.** This skill holds design knowledge that changes
slowly. It is not the source of truth for commands, flags or fields.

## Retrieval sources

Look these up before you cite a command, a flag, a field name or a limit.
Don't rely on what you remember or on this skill alone.

| Source | How to retrieve | Use for |
|---|---|---|
| CLI help | `mk --help`, `mk help <command>` | Commands, flags, defaults, examples |
| Find a command | `mk help "<task>"` | Which command does a task |
| Schemas | `mk schema`, `mk schema workflow`, `mk schema step`, `mk schema cubby`, `mk schema cli.<command>` | Graph, step, cubby and config fields; each command's JSON output; error `reason` codes |
| Vault contents | `mk vault inspect --vault <id>` | Which workflows, cubby tables, connections, schedules and webhooks already exist |
| Installed SDK types | `node_modules/@manykind-ai/agent-sdk/dist/**/*.d.ts` | Exact TypeScript signatures for the version the project uses |
| Developer docs | One page at a time with `curl`; see [references/docs.md](./references/docs.md) for how and for the key pages | Concepts and guides |
| CLI changelog | `node_modules/@manykind-ai/cli/CHANGELOG.md`, `npm view @manykind-ai/cli version` | What changed and when |

When this skill and the CLI or the schemas disagree, **trust the CLI**.

## Shape the output by the request

| The request | Output | intent.md / design.md |
|---|---|---|
| Review it, "is it production-ready?", find the bugs, harden it, a small fix | A **ranked findings list**, most severe first. Each finding: `file:line`, what breaks and when, how you checked it (**executed**: you ran it; or **read-only**: you read code or docs), and the fix | Not created. Don't write them for a review |
| A new workflow, or a new set of workflows | `define` (problem first: `intent.md`), then `design` (how it works on the platform: `design.md`), then build | Created |
| A change to the goal, the outcome or the trigger | `intent.md` updated (`define`); `design.md` too if steps or data move | Updated |
| A change to steps or data (a table, a key, a connector) | `design.md` updated (`design`) | Updated |
| A prompt tweak, a parameter value, a copy change | The edit itself | Unchanged |

For a review, work through [references/checks.md](./references/checks.md)
and execute what is cheap to execute (`mk validate`, tests, SQL replayed in
`sqlite3`, `mk run --dry-run`). If the review shows that the goal or the data
model must change, say so as a finding and offer `define` or `design`
afterwards; don't start them unasked.

## CLI version

The skills need the Manykind CLI, `@manykind-ai/cli` 5.0 or newer: `manykind`,
short form `mk`. Check the project's CLI first: the `@manykind-ai/cli` version in
`package.json`, or `npx mk --version`. In a project the CLI is a
dev-dependency, so run it as `npx mk …`.

A project without it has none of the commands the skills name. Either add the
dev-dependency (`pnpm add -D @manykind-ai/cli@latest`, then rebuild), or do that
step in the console (ROC): the workflow's Editor has Save, Release and Deploy.
Say which one you chose. If `--help` doesn't list a command a skill names, use
the fallback the skill gives.

## Anatomy of a workflow

A workflow is an agent whose manifest carries a **graph**. You can author it in
code with `defineWorkflow` in `manykind.config.ts`, or draw it in the console (ROC).
Both use the same model, and a workflow can be exported from one and imported
into the other.

- **Triggers** start a run. The common ones:
  - a manual or API start (`workflow.start`);
  - a connector event, such as a Slack message or an email;
  - a schedule;
  - a webhook.

  A workflow can have several triggers that feed the same chain.
- **Steps** (nodes) do the work. Choose the kind by what the step *is*:

  | The step… | Kind family |
  |---|---|
  | Computes something deterministic: reshaping data, joining, scoring by a rule | `transform` (one expression) or `code` (statements). No I/O, no clock, no model |
  | Needs judgement | `agent` (an agent answers) or `model` (one model call) |
  | Needs a person's decision | `human`. The run parks at no cost until the answer arrives |
  | Reads or writes the workflow's SQL store | `cubbyQuery` / `cubbyExec` |
  | Does one thing in an external system (send Slack, send email) | `action` through a vault connector. Credentials never reach the workflow |
  | Tells the rest of the platform something happened | `publish` (an event) |
  | Reads accepted organisational knowledge | `recall` |
  | Fans out per item, branches, or waits for branches | `split`/`aggregate`, `branch`, `join` |
  | Calls another workflow as a sub-run | `workflow` |
  | Ends the run with its Result | `output` |

  The authoritative list of kinds and their params comes from `mk schema step`.
- **Edges** connect steps. An edge can carry a `when` gate, a small
  declarative condition on the previous step's output. Gates are evaluated in
  order and the first one that passes wins.
- **Expressions** such as `={{ $json.field }}` pull values from the item that
  is moving through the graph.
- **The Result** is what the `output` step declares: its fields and their
  types. Evaluations score it, other systems read it, and it is the
  workflow's contract. Change it on purpose.
- **A run** has an id and a context. Every step's events, answers and logs
  land in that context. A run ends `done` or `failed`, or it parks `waiting` on
  a person or an agent. An idle timeout bounds how long it can wait.
- **Versions.** Building gives you a bundle. A *release* numbers a version and
  runs the checks. A *deploy* makes a version live (`latest`). Rollback means
  deploying an older release.

## Where data lives

| Store | Belongs to | Use for |
|---|---|---|
| **Cubby** (SQLite, per agent service) | This workflow's agent service | The rows the workflow produces and reads back: decisions, outcomes, state between runs |
| **Workspace** (`ctx.workspace`, per vault scope) | Everyone authorised in the scope | Rows another agent service must read, for example a curator in another service |
| **Memory bank** (per vault) | The organisation | *Accepted* knowledge (principles, findings, metrics), typed and linked, with privacy on every record |
| **Connector** (Slack, email, CRM…) | The external system | Where people see the outcome. Not a database to query later |

Rules that keep data usable later:

- **Key every row to the root record.** That is the funnel's stable subject: a
  lead id, a candidate id, a campaign id, an incident id. Never key on a
  display name. The shared key is what lets another workflow join your rows
  with its own.
- **Put `run_id`, the workflow version and a timestamp on every row.**
- **Keep signals in columns with a closed vocabulary, not free text.** Record
  outcomes in an append-only table. Don't UPDATE a decision row. A
  "current verdict" row that a rescore overwrites is fine when every
  version of it is also kept in an append-only history table.
- **Migrations are numbered SQL files, one folder per cubby.** Never edit a
  migration that has already shipped; add the next number. The platform
  applies migrations in order on every instance.
- **Workflows don't write the memory bank directly.** A workflow writes its own
  cubby or a workspace table. A *curator* agent (a harvester or an analyzer)
  proposes records from those rows, and a person accepts them. `remember` and
  `relate` steps in a workflow are discouraged, and newer SDKs warn on them.
  So a `recall` step doesn't see another workflow's cubby rows until they have
  been proposed and accepted; to use them right away, read the table. The
  details are in the `develop` skill's memory-bank reference.
- The runner keeps its own internal `runs` table. Don't read it or build on
  it.

## Composing workflows

Workflows build on each other's **data**. They don't call each other per
item:

- **Producer:** the workflow writes keyed rows (cubby or workspace) and can
  `publish` an event when something worth reacting to happens.
- **Consumer:** the workflow is triggered on its own terms (a schedule, an
  event, a person asking) and reads what has accumulated by key. For example,
  a weekly report joins every review of a campaign by campaign id.
- Use a `workflow` step only when the second workflow really is one sub-task
  of this run.

Before you design new storage, check what already exists in the vault
(`mk vault inspect`). Reuse existing keys and tables instead of creating
parallel ones.

## The two files: intent.md and design.md

A workflow (or a set of workflows) keeps two living files: next to its code,
or for a console-only workflow in any local folder named after it. They are
written in two steps, problem first: `intent.md` says what the workflow is
for, then `design.md` says how it works on the platform. They are written for
a new workflow or set, and updated when the goal or the data and steps
change; a review doesn't create them. The developer owns them and edits them
in place.

| File | Answers | Sections |
|---|---|---|
| `intent.md` | **Why**: what outcome, for whom, when it is done | Goal, Outcome, Trigger, Done when, Examples |
| `design.md` | **How**: steps, data, knobs, neighbours | Steps, Data, Parameters, Composes with |

- History comes from git and from workflow releases. There are no change
  folders and no dated specs. For one large change, a temporary `plan.md`
  next to them is fine. Delete it once the change is built.
- Extra sections such as diagrams, notes or open questions are always
  welcome. Never strip content you didn't write.
- **No `TBD` stubs.** Leave out what isn't known yet, or list it under one
  `## Open questions` heading.
- **When to update which file:**
  - Update **intent.md** when the goal, the outcome, the trigger or the done
    condition changes.
  - Update **design.md** when steps are added, removed or reordered, when
    data changes (a table, a column that matters, a key, a connector, what
    reaches the memory bank), or when a parameter is added or removed.
  - **Neither file changes** for a prompt tweak, a new parameter *value*, a
    copy change or a bug fix that leaves the behaviour as designed.
- **A set of workflows** (a funnel, or a factory such as research → content
  → distribution → analytics on one cubby) keeps one `intent.md` and one
  `design.md` in the parent folder and no per-workflow copies: each
  workflow's details are a section of the set's `design.md`. A workflow gets
  its own files only when its goal differs from the set's. The set's Data
  section is where the links between workflows are checked: who writes each
  table, who reads it, by which key. Details:
  [references/sets.md](./references/sets.md).
- `intent.md` → Examples become the workflow's first evaluation dataset
  (skill `evaluate`). They are optional while you define the workflow and
  required before release.

Nothing in this plugin blocks or gates you. The platform applies its gates at
release: the AI review plus the datasets marked required.

## The developer loop

For a new workflow or set, or a change to its goal, data or steps. A review
or a bug fix skips steps 1 and 2 (see the table at the top).

1. **Define**: `intent.md` (skill `define`). For an existing workflow, start by
   reverse-engineering it.
2. **Design**: `design.md` (skill `design`).
3. **Build**: code with `defineWorkflow` (skill `develop`), or in the console.
   Check with `mk validate`.
4. **Try it**: `mk run <workflow> --input <fixture>` against a vault, then read
   the trace with `mk runs get` / `mk runs logs`, or use the console's Run
   button.
5. **Evaluate**: datasets and experiments (skill `evaluate`).
6. **Ship**: `mk release` → `mk deploy <version>` (or Release and Deploy in
   the console; skill `deploy`).

## Driving the CLI as an agent

- When stdout is not a terminal, every command prints **JSON**. Results go to
  stdout and progress goes to stderr. Use `--format json|ndjson|text` to pick
  explicitly.
- An error has the shape `{status, reason, message, hint?, next[]}`.
  - Switch on `reason`, never on `message`.
  - `next[]` lists runnable follow-up commands. Run one only after you check
    that it is what the user wants.
- **Exit codes:**

  | Code | Meaning |
  |---|---|
  | 0 | ok |
  | 1 | failed |
  | 2 | usage error, or action required |
  | 4 | auth |

- **Nothing prompts when the CLI runs non-interactively.**
  - A command that needs confirmation returns `action_required` (exit 2) and
    suggests `--yes`. Pass `--yes` only after the user has agreed to that
    specific action.
  - Use `--dry-run` on mutations to show the plan first.
- **Secrets:**
  - Never ask for a secret, accept one or echo one.
  - Tell the user which environment variable to set in their own shell, and
    report only whether it is set.

## Skill map

| Skill | When |
|---|---|
| `define` | A new workflow or set, a change to what one is for, or an existing one documented. Not for reviews |
| `design` | After `define`, or when steps, storage, keys or parameters change. Not for reviews |
| `develop` | Writing or changing workflow or agent code, cubbies, widgets, tests |
| `evaluate` | Datasets, experiments, comparing versions |
| `deploy` | Release, deploy, rollback, push, credentials |

---
name: develop
description: Write, extend and debug Manykind workflow and agent code. Covers defineWorkflow graphs (steps, edges, gates, Result), agent engagements and event handlers, cubbies and SQL migrations, the memory bank, widgets and unit tests, then validating, building and running a workflow once against a vault. Use when writing or changing code in a Manykind project (manykind.config.ts, src/, migrations, widgets, unit tests), trying a workflow once against a test vault, or debugging a build, a lint error or a run.
---

# Develop a Manykind workflow or agent

Your knowledge of the Manykind SDK and CLI may be out of date. **Prefer
retrieval over pre-training.** The references here are starting points, not
the source of truth.

| Source | How to retrieve | Use for |
|---|---|---|
| CLI help | `mk help <command>`; `mk help "<task>"` | Flags, defaults, which command |
| Schemas | `mk schema workflow`, `step`, `edge`, `cubby`, `config`, `error` | Field names and shapes |
| Installed SDK | `node_modules/@manykind-ai/agent-sdk/dist/**/*.d.ts`, `node_modules/@manykind-ai/testing` | Exact signatures for this project's version |
| Docs | One page with `curl`: the `workflows` skill's `references/docs.md` | Guides |
| Changelog | `node_modules/@manykind-ai/cli/CHANGELOG.md` | What changed |

The CLI is `mk` (`manykind`), 5.0 or newer (the `workflows` skill, CLI
version). In a project it is a dev-dependency, so run it as `npx mk …`. Run `pnpm install` once after
`mk init`.

## Before you change behaviour

If the change alters a workflow's goal, steps or data, update `intent.md` or
`design.md` next to it in the same change (rules in the `workflows` skill).
A prompt tweak, a parameter value or a bug fix needs neither.

## Workflows in code

A workflow is `export default defineWorkflow({...})` (from
`@manykind-ai/agent-sdk/config`) in `manykind.config.ts`. It takes:

- an id and a version;
- `goal` and `card`;
- `nodes` and `edges`;
- `cubbies` (each with its own migrations folder);
- optionally `models` and `schedules`.

Field names come from `mk schema workflow-spec` or the installed
`define-workflow` types.

- **Node ids are stable.** Edges reference them, so renaming a node is a graph
  change. Edge `from`/`to` are typed against the declared ids.
- **Gates** (`when`) are checked in declaration order, and the first one that
  passes wins. Make branches mutually exclusive, and say so in a comment.
- **Expressions:** `={{ $json.x }}` reads the current item, and `$runId` is the
  run.
  - In SQL steps, every run value is a **bound `?` argument**. Never splice
    one into the SQL text. Only build-time constants may be part of the SQL
    string.
  - `code`/`transform` bodies are self-contained. They have no imports, no
    `await`, no I/O and no clock.
- **The `output` step declares the Result.** That covers its fields and their
  types. Evaluations score it.
- **Secrets and connections** stay out of the code. An `action` step names a
  connection, and the vault holds its credentials.

### Check, build, try

```sh
npx mk validate                        # every issue at once: graph, lints, cron, migrations. --strict fails on warnings
npx mk build                           # lint + bundle into dist/<id>/
npx mk run <workflowId> --input fixture.json --vault <id> --dry-run   # shows what would be sent
npx mk run <workflowId> --input fixture.json --vault <id> --yes       # one real run: outcome + per-step trace
npx mk runs get <runId>                # a past run, same shape
npx mk runs logs <runId> --follow      # events and task logs as NDJSON
```

- **`mk run` is a real run.** Its steps can post to Slack, send email or call
  other real connectors. Name the vault and the connectors it will touch.
  On a vault the user named as a test vault, one go-ahead covers the
  run → fix → run loop; anywhere else, ask before each `--yes` (skill
  `deploy`, "Ask by target").
- A fixture has the same shape as an evaluation case `input`. `--case
  <dataset>:<caseId>` reuses a dataset case.
- `--version <v>` runs a pushed version that isn't live yet.

## Agents in code: the loop

An agent is a TypeScript project. It has a declarative manifest
(`manykind.config.ts` with `defineAgent`) and a default-exported **engagement**
class (`src/agent.ts`). The class's methods handle events and the lifecycle.
`mk build` lints and bundles it, and the agent runtime executes the bundle
with Web globals plus one Manykind surface, `ctx`.

1. **Understand the project.** Read `manykind.config.ts` and the entry class it
   points at.
2. **Author the agent class.** Use `@OnEvent("type")` methods and the
   `@OnStart` / `@OnClose` hooks on the `@Engagement` default export.
3. **Add state.** Declare a cubby in `cubbies[]`, write its SQL migrations,
   and read and write through `ctx.cubby("alias")`.
4. **Add UI (optional).** Ship a self-contained widget folder declared in
   `widgets[]`.
5. **Test.** Use `@manykind-ai/testing` (`testAgent` / `testPlatform`) under
   Vitest.
6. **Run `mk typegen`** after any `manykind.config.ts` change (models, cubbies,
   engagements, event schemas). Then run `mk build`.

## Routing: read the reference before you edit that layer

| You are… | Read |
|---|---|
| Orienting in an unfamiliar project | [anatomy.md](./references/anatomy.md) |
| Writing handlers, lifecycle, multi-engagement, models | [engagements.md](./references/engagements.md) |
| Adding or querying persistent state, migrations | [cubbies.md](./references/cubbies.md) |
| Reading or writing the org memory bank (curators, readers, metrics, `ctx.workspace`) | [memory-bank.md](./references/memory-bank.md) |
| Shipping a static UI | [widgets.md](./references/widgets.md) |
| Writing tests | [testing.md](./references/testing.md) |
| Debugging a build failure or a lint error | [constraints.md](./references/constraints.md) |
| Debugging a running agent or workflow (empty logs, stuck Job, cubby errors) | [troubleshooting.md](./references/troubleshooting.md) |

## Runtime constraints (always in force; see constraints.md)

- **No Node built-ins, no synchronous DB or network libraries.**
  - Use `fetch` for HTTP and `ctx.cubby` for state.
  - Use `globalThis.crypto` (WebCrypto), not `node:crypto`.
- **Literals are read statically into the manifest.**
  - The first argument of `@OnEvent("...")`, `ctx.publish("...", …)` and
    `ctx.cubby("...")` must be an inline string literal.
  - Cubby aliases and model aliases must be declared in `manykind.config.ts`.
- **Keep the context parameter named `ctx`.** The lints look for that name.
- **Each call gets a fresh instance and a fresh `ctx`.** Never keep
  per-request state on `this`.
- **Use `console.*` for logging.**
- **One engagement owns each lifecycle hook.**
- **The cubby is your working store; the memory bank is the organisation's.**
  Ask who reads the data later.
  - Only this agent service: a cubby.
  - Another agent service: `ctx.workspace`.
  - Accepted organisational knowledge: a curator proposes it with
    `ctx.memory.propose`, and a person accepts it.

  Workflows don't write the bank. The alias `"memory"` is reserved, and
  `mk build` warns about a cubby that uses it. Minimum versions are given in
  memory-bank.md.
- **Migrations are append-only.** Add the next numbered file and never edit
  one that has shipped.

## Dev commands

```sh
npx mk typegen                 # after editing manykind.config.ts
npx mk dev [widgetId]          # local widget dev server
npx mk build                   # lint + bundle → dist/<id>/{bundle.js, manifest.json}
npx mk inspect dist/<id>       # check the exposed handlers match the manifest
npx vitest run                 # simulator tests (or: pnpm test)
```

Shipping (release, push, deploy) is covered by the `deploy` skill.

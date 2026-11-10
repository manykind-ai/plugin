---
name: design
description: Write or update a Manykind workflow's design.md, the "how" file, or the design.md of a set of workflows that share data (a funnel, a content factory). It covers the steps and their kinds, the data the workflow writes and where (cubby tables, workspaces, connectors, the key that links it to other workflows' data, what reaches the memory bank), its parameters, and which workflows it reads from or feeds. Use after intent.md for a new workflow or set, when deciding how a workflow should work or store its data, when its steps or data change, or when asked to document an existing workflow's design. Not for reviewing, hardening, bug-hunting or small fixes ("is it production-ready?", "find the bugs"): those get a findings list and no design.md.
---

# Design a workflow: design.md

This skill writes the **how** of a workflow into `design.md`: how it works on
the platform, the step after `intent.md` (skill `define`) has settled the
problem. The concepts (step kinds, cubbies, workspaces, the memory bank,
composing) are in the `workflows` skill. Read it first if it isn't loaded.

**Only when it's wanted.** Run this for a new workflow or set, a change to
steps or data, or a request to document a design. A review, a
production-readiness check, a bug hunt or a small fix doesn't create
`design.md`; it gets a ranked findings list (the `workflows` skill, "Shape
the output by the request").

Your knowledge of Manykind may be out of date, so **prefer retrieval**:

| Source | How | Use for |
|---|---|---|
| Vault contents | `mk vault inspect --vault <id> [--section …]` | Existing workflows, cubby tables and columns, connections, schedules, webhooks |
| Step and cubby fields | `mk schema step`, `mk schema cubby`, `mk schema workflow` | What a kind can do and its params |
| CLI help | `mk <command> --help` | Flags |
| Docs | One page with `curl`: the `workflows` skill's `references/docs.md` (steps, triggers, cubbies, cubby schema, best practices) | Concepts |

## Where the file goes

`design.md` sits next to `intent.md`: beside `manykind.config.ts` for a workflow in
code, or in the workflow's local folder for a console-only one. If it exists,
update it in place. Change only the affected sections, and keep everything
else (diagrams, notes, extra headings).

Template: [templates/design.md](./templates/design.md). Use its `##` headings
exactly.

**A workflow in a set** (several workflows sharing data and one outcome): one
`design.md` for the set, in the parent folder
([templates/set-design.md](./templates/set-design.md)). Each workflow's steps,
own tables and parameters are a `### <workflow>` section in it; the workflows
get no `design.md` of their own. See [Sets of workflows](#sets-of-workflows).

## Process

1. **Read `intent.md`.** If there isn't one, offer the `define` skill. It is not
   a precondition: you can design from the code or the conversation.
2. **Look at what already exists before you invent anything.**
   - With a vault id: `mk vault inspect --vault <id>`. Note:
     - the cubby tables, their columns and the keys they use;
     - the connected connectors;
     - the other workflows and their schedules or webhooks.

     If a section fails (`partial_read`), say which one and carry on.
   - Without it, read what the code already shows (cubby declarations,
     migrations, `action` connections). Ask the user only what is still
     unknown, one question at a time:
     - Which connectors are connected?
     - Which existing workflows' data should this one use, and under which
       key?
3. **An existing workflow?** Reverse-engineer it. Read the graph's nodes and
   edges, its cubby declarations and migrations, its connectors and its
   Result. Write down what it **does**, then note where that differs from
   `intent.md`.
4. **Draft every section.** Ask only where a choice really matters and the
   sources don't settle it. Typical cases are the key, append-only versus
   update, and whether a person must approve before an action. Ask one
   question at a time.
5. **Run the checks** in the `workflows` skill's
   [references/checks.md](../workflows/references/checks.md) against the
   draft: reruns, matching keys, cubby versus memory bank, failure mid-run,
   supported expressions, the installed CLI. Fix the design, or record what
   is unresolved.
6. Write the file and summarise what you decided, what you reused and what is
   still open. Leave out what isn't known yet, or list it under one
   `## Open questions` heading. Never write `TBD` stubs.
7. Suggest the next step:
   - building in code: the `develop` skill;
   - building in the console: the steps to draw, in order.

## What each section must answer

**Steps.** List the steps in run order, with branches and their conditions.
For each step, give its kind and why:
- deterministic → `code`/`transform`;
- judgement → `agent`/`model`;
- a person decides → `human`;
- an external effect → `action`.

Also mark where a run can wait, and what happens on failure or on a
duplicate.

**Data.** For every table or destination, give:
- where it lives: the workflow's cubby, a workspace scope (when another agent
  service must read it), or a connector;
- **the key** that links it to the root record;
- the columns that matter, as a closed vocabulary for signals;
- whether it is append-only.

Then name the new migrations in order. Shipped ones are never edited. For the
**memory bank**, say which conclusions a curator should propose from these
rows and who accepts them. "None" is a fine answer.

**Parameters.** Values an operator might change without changing the logic:
thresholds, channels, scoring rules per segment, model choice. The SDK has
no workflow-level parameter declaration today, so record where each value
actually lives:
- a value per campaign, per segment or per vault usually lives in a setup or
  config table the workflow reads (a data row);
- otherwise it is a code constant, changed by a new release;
- a connector account is chosen when the workflow is connected to the vault.

Before you list a parameter, check whether the workflow already reads it from
data. Don't invent parameters the code doesn't have; "None" is a fine
answer. Note hard-coded values that should move into a data row, as an open
point, not as a parameter.

**Composes with.**
- Reads: which workflows' tables or events, and by which key.
- Read by: which workflows, reports or widgets use this workflow's data.

Prefer reading accumulated, keyed data to chaining workflows per item.

## Design principles

- **Don't pay a model to do arithmetic.** Joins, counts, dedupe and scoring
  rules go in `code`/`transform`. Use models for judgement only.
- **One key end to end.** If the vault already has a key for this subject,
  reuse it.
- **Make every write safe to repeat.** Runs can be redelivered and periods
  rerun, so give each write an idempotency key (a unique constraint on the
  natural key, such as the period plus the subject) so the same input writes
  the same row once.
- **Decide first, then act.** External `action` steps come after the decision
  is stored, and a `human` step comes before anything that can't be undone.
- **Keep the Result stable.** It is what evaluations score. Changing it is a
  design change.
- **Choose the smallest store that fits.** Use the cubby for the workflow's
  own rows, a workspace for rows another service must read, and the memory
  bank only for curated, accepted knowledge.

## Sets of workflows

The set's `design.md` lists the workflows in order with their triggers, with
one `### <workflow>` section each for its steps, the tables only it uses and
its own parameters. Then it holds the one **Data** table for everything they
share: each table, its store, who writes it, who reads it, the key, and
whether it is append-only. Don't write a `design.md` inside each
workflow's folder, and don't add a section for a workflow you know nothing
about yet: list it under Open questions. The Data table is where the links
between workflows are checked:

- every table a workflow reads has a writer that stores the columns the
  reader needs, under the same key and in the same store;
- workflows write cubbies (or a workspace table when the reader is in another
  agent service). They don't write the memory bank: a curator proposes
  records and a person accepts them. A workflow that reads with `recall` won't
  see another workflow's cubby rows until they are accepted. If it needs
  them now, it reads the table.

Check each row against the code (cubby declarations, migrations, the
`cubbyQuery`/`cubbyExec` SQL) or `mk vault inspect`, and write
down every mismatch under Open questions. More in the `workflows` skill's
`references/sets.md`.

## When design.md changes

Update it when steps are added, removed or reordered, when data changes
(table, key, a column that matters, connector, memory-bank use), or when a
parameter is added or removed. A prompt tweak, a parameter value or a bug fix
doesn't change it. If the goal or outcome moved, update `intent.md` too.

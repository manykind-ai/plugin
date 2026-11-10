# A set of workflows

Some workflows only make sense together: a funnel (intake → screening →
outreach → reporting) or a factory (research → content → distribution →
analytics) where every stage reads what the one before it stored. Describe
the set once, in its parent folder.

## Layout

```
marketing/                 # the set
  intent.md                # why the set exists: goal, outcome, the workflows, done when, examples
  design.md                # how it works: one section per workflow, then shared data and keys
  research/
    manykind.config.ts          # code only; no intent.md or design.md here
  content/
    …
```

Workflows built in code keep their `manykind.config.ts` in the per-workflow
folders. A console-only set uses the same parent folder.

**No per-workflow copies.** Inside a set, a workflow has no `intent.md` or
`design.md` of its own. Its trigger, steps, own tables and parameters are a
`### <workflow>` section in the set's `design.md`; its Done when items and
Examples are labelled with its name in the set's `intent.md`. A workflow gets
its own pair of files only when it has its own goal that differs from the
set's.

## When a set-level file is worth it

- Two or more workflows share a cubby or a key and are meant to be read
  together (one funnel, one report across them).
- One outcome needs all of them; none is useful alone.

A single workflow that happens to read another's data doesn't need one: its
`design.md` → Composes with names the producer.

## What goes where

| Set `intent.md` | Set `design.md` |
|---|---|
| Goal and Outcome of the whole set, who receives it | Workflows in order: trigger and what each hands on, then a `### <workflow>` section each (steps, tables only it uses, its parameters) |
| Workflows: one row each, with its trigger and what it contributes | **Data: every shared table** (below) |
| Done when: end-to-end checks, plus per-workflow checks labelled with the workflow | Memory bank use across the set |
| Examples, labelled with the workflow they test (they become its dataset) | Parameters shared by the set |
| | Composes with: anything outside the set |

No `TBD` stubs. Leave out a section or a workflow section that isn't known
yet, or list it under one `## Open questions` heading.

## The Data section is where links are checked

For every table the set shares, record who writes it, who reads it, and by
which key:

| Table | Store | Written by | Read by | Key | Append-only? |
|---|---|---|---|---|---|
| `briefs` | `marketing` cubby | research | content | `topic_id` | yes |

Check each row against the code or the vault (`mk vault inspect`)
with [checks.md](./checks.md), and record every mismatch as an open question:

- Every table someone reads has a writer, and the writer stores the columns
  the reader needs (for example the text of a post, not only an asset id).
- Writer and reader use the same key and the same store. A reader in
  another agent service can't read the writer's cubby: that table belongs in
  a workspace.
- A table that is overwritten each run can't answer "how did this change over
  time". Keep an append-only history beside it, and key it so a rerun of the
  same period doesn't add a second copy.
- A table nobody reads is either a missing reader or a table to drop.

**Cubby versus memory bank.** Workflows write cubbies (or a workspace table).
They don't write the memory bank: a curator proposes records from those rows,
and a person accepts them. So a workflow that reads with a `recall` step sees
another workflow's output only after a curator has proposed it and someone
has accepted it. If the next stage needs the rows right away, read the cubby
table with `cubbyQuery`, not the bank.

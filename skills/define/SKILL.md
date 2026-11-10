---
name: define
description: Write or update intent.md for a Manykind workflow or set of workflows, the problem-first "why" file with Goal, Outcome, Trigger, Done when and Examples, before design.md. It works from an existing workflow's code (manykind.config.ts) or a console (ROC) export, free text ("I want a workflow that…"), a Slack thread or a meeting transcript. Use when someone wants a new workflow or set, changes what a workflow is for, its outcome or its trigger, or asks for an existing workflow to be documented. Not for reviewing, hardening, bug-hunting or small fixes ("is it production-ready?", "find the bugs"): those get a findings list and no intent.md.
---

# Define a workflow: intent.md

This skill writes the **why** of a workflow into `intent.md`: the problem
first, before anything about steps or storage. The **how** goes in
`design.md` (skill `design`), as the next step. The concepts and the two-file
rule are in the `workflows` skill.

**Only when it's wanted.** Run this for a new workflow or set, a change to
the goal, the outcome or the trigger, or a request to document a workflow. A
review, a production-readiness check, a bug hunt or a small fix doesn't
create `intent.md`; it gets a ranked findings list (the `workflows` skill,
"Shape the output by the request").

Your knowledge of Manykind may be out of date, so **prefer retrieval**. To read
an existing workflow, use its files and `mk schema workflow`, or
`node_modules/@manykind-ai/agent-sdk` types. For concepts, fetch one docs page as
the `workflows` skill's `references/docs.md` describes. Don't rely on memory.

## Where the file goes

- **A workflow in code:** next to its `manykind.config.ts`.
- **A console-only workflow:** in a local folder named after the workflow.
  Ask once where. If the user has no preference, use `./workflows/<id>/`.
- **A workflow in a set** (several workflows that share data and one
  outcome): one `intent.md` for the set, in the parent folder. The workflows
  in it get no `intent.md` of their own. See
  [Sets of workflows](#sets-of-workflows).
- **The file already exists:** update it in place. Change only the sections the
  new information affects. Keep every other section, comment and extra
  heading.

Template: [templates/intent.md](./templates/intent.md). Use its `##` headings
exactly. Users may add more sections, and you never remove them.

## Sources, most useful first

1. **An existing workflow** (the main path):
   - In code: `manykind.config.ts` holds `goal`, `card`, the trigger nodes, the
     `output` Result and the edges to it. Also read the README and the
     comments.
   - From the console: the exported graph JSON holds the same fields.
   - If the CLI and the access are available, these show what it
     really does:
     - `mk vault inspect --vault <id> --agent <workflowId>` for its triggers,
       schedules, connections and versions;
     - `mk runs list --workflow <id>` and `mk runs get <runId>` for its
       recent runs.

   Describe what the workflow **does today**. Where the code and the user's
   description differ, write down both and ask which one is the intent.
2. **Conversation material.** From a Slack thread, a transcript or notes, pull
   the goal, who gets the outcome, what starts it, and any examples people
   gave.
3. **Free text from the user.**

## Process

0. **New workflow or a change to this one?** If the request adds a different
   trigger or cadence (for example a daily summary on a workflow that runs per
   batch), it is usually a new consumer workflow that reads this one's data.
   Say so, and write a new `intent.md` for it. The existing workflow's
   `design.md` then only gains a "Read by" line, plus any data the consumer
   needs that isn't stored yet. If the request describes several workflows
   that only make sense together, write a set-level file first (below).
1. Read every source you were given. Draft **every section you can** from them.
2. List the sections that are still empty or uncertain. Ask about them **one
   question at a time**, in plain words. Ask only about Goal, Outcome, Trigger
   and Done when. Ask three questions at most. If something is still unknown
   after that, leave the section out or put the question under one
   `## Open questions` heading, and move on. Never write `TBD` stubs.
3. **Examples** are optional at this stage. Fill them from the sources:
   - an existing workflow's recent runs (`mk runs get`;
     `mk eval capture <dataset> <context…>` turns real runs into cases), or
     its fixtures and tests;
   - examples people gave in the thread or the transcript.

   If there are none, leave the table empty. Tell the user that release needs
   them, and that the `evaluate` skill turns them into a dataset.
4. Write the file and summarise in two or three lines what you filled in, what
   you inferred, and what is still open.
5. Go on to `design` (how it works on the platform and stores data), or
   suggest it if the user wants to stop here. For a workflow that already
   works, its design can be reverse-engineered the same way.

## Writing rules

- Use business words. Name the outcome and who receives it. Leave out steps,
  node kinds, SQL and model names: they belong in `design.md`.
- **Done when** holds checks someone can verify, from a run's Result, its data
  or what a person sees. "Every alert gets one reply in its thread within 10
  minutes" is a check. "Works well" is not.
- **Trigger** also says what is ignored: other sources, duplicates, the
  workflow's own output.
- **Examples** pair a realistic input with its expected outcome. Use real
  shapes, with sensitive values replaced.
- Don't make up facts to fill a section. Leave it out, or list the question
  under `## Open questions`.

## Sets of workflows

Use a set-level `intent.md` when two or more workflows serve one outcome and
share data: a funnel, or a factory such as research → content → distribution
→ analytics. Template: [templates/set-intent.md](./templates/set-intent.md).

- The set's file holds the Goal, the Outcome, the workflows (one row each
  with its trigger and what it contributes), Done when for the whole set, and
  Examples.
- Per-workflow Done when items and Examples go in the same file, labelled
  with the workflow's name (the examples become that workflow's dataset).
- Don't write an `intent.md` inside each workflow's folder. A workflow gets
  its own only when it has its own goal that differs from the set's.
- Layout and the data checks across the set: the `workflows` skill's
  `references/sets.md`.

## When intent.md changes

Update it when the goal, the outcome, the trigger or the done condition
changes. A prompt tweak, a new parameter value or a bug fix doesn't change
it. If the change also alters steps or data, `design.md` changes as well.

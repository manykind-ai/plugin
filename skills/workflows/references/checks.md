# Checks for designing and reviewing a workflow

Platform checks that apply to any workflow. Use them when you write a
`design.md` and when you review existing code. For each finding, say how you
checked it: **executed** (you ran it: `mk validate`, a test, the SQL replayed
in `sqlite3`, `mk run --dry-run`) or **read-only** (you read the code or the
docs). Prefer executing when it is cheap.

1. **Reruns don't duplicate or overwrite.** Running the same period or the
   same input twice (a redelivered event, a retried schedule, a manual rerun)
   must not add a second row or silently replace a kept one. Look for an
   idempotency key: a unique constraint on the natural key (for example the
   period plus the subject key) and an insert that uses it
   (`ON CONFLICT … DO NOTHING` or a deliberate upsert into a "current" row
   with an append-only history beside it). An `INSERT` with no unique key, or
   a key that includes a nullable column, duplicates on rerun.
2. **Keys linking workflows match on both sides.** For every table one
   workflow writes and another reads: same table, same store (cubby or
   workspace), same key column with the same values and format, and the
   writer stores every column the reader selects. A reader in another agent
   service can't read the writer's cubby; that table belongs in a workspace.
3. **Cubby versus memory bank.** Workflows write cubbies (or a workspace
   table). Curators propose memory-bank records from those rows, and a person
   accepts them. A `recall` step sees only accepted records, so it never sees
   another workflow's fresh cubby rows. A step that needs them now reads the
   table.
4. **A failure mid-run.** For each external call (`action`, `model`,
   `agent`, `fetch`) and each step after a write: what is already written or
   sent when it fails, does the run end `failed` or carry on with an empty
   value, and is a rerun safe (check 1)? External effects should come after
   the decision is stored, and nothing irreversible should be sent twice.
5. **Expressions use only what the runtime supports.** Which variables
   (`$json`, `$runId`, …), functions and operators an expression can use, and
   what a `when` gate accepts, come from `mk schema step` / `mk schema edge`
  , the installed SDK types or the steps docs page. Check them
   there; don't assume JavaScript semantics inside `={{ }}`.
6. **The installed CLI supports the command.** Read the project's
   `@manykind-ai/cli` version (5.0 or newer, the `workflows` skill's CLI
   version), or run `mk <command> --help`. A command the installed
   CLI lacks is a finding, with the upgrade or the console as the fix.

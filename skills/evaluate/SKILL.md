---
name: evaluate
description: Evaluate a Manykind workflow with `mk eval`. Keep a dataset of cases in the repo (seeded from intent.md's Examples), sync it with the agent service, run it as an experiment against a workflow version, and compare experiments. Use when the user asks to test, score, benchmark, regression-check or compare workflow versions, wants to turn examples into a dataset, or mentions datasets, cases, experiments, baselines or `mk eval`.
---

# Evaluate a Manykind workflow

Your knowledge of the CLI may be out of date. **Prefer retrieval**:

| Source | How | Use for |
|---|---|---|
| CLI help | `mk eval --help`, `mk eval <sub> --help` | Flags and defaults |
| Schemas | `mk schema cli.eval` | JSON output shapes |
| Docs | One page with `curl` (the `workflows` skill's `references/docs.md`): `/agents/workflows/evaluate/overview/`, `/reference/eval/` | Concepts |

When this skill and `--help` disagree, trust `--help`. This skill describes
the Manykind CLI 5.0 or newer; without it, add the dev-dependency or use the
console's Evaluations page.

**Start from intent.md.** The rows under its `## Examples` are the first
dataset. Each row becomes one case: `input` is the trigger payload, and
`expected` is the Result fields the row's outcome implies. Write the cases
under `datasets/<dataset>/cases/`, then `mk eval push`. To try one case
without an experiment, use `mk run <workflow> --case <dataset>:<caseId>`.

`mk eval` runs a **dataset** (cases: a `workflow.start` payload and the Result it
should produce) against a **workflow version**, scores each run's Result field by
field, records duration / tokens / cost / steps, and compares the experiment with
a **baseline**. An experiment on its own blocks nothing. Only datasets marked
*Required for release* gate `mk release` (skill `deploy`). Datasets and
experiments live in the vault the workflow runs in, in the workflow's scope.
The console (ROC) **Evaluations** page reads and writes the same storage, so
either side sees the other's work.

Every command is about one workflow: `--workflow <id>` (the workflow agent's
alias), by default the one `manykind.config.ts` (or `dist/`) in the current directory
declares. Run the commands from the workflow's folder. In a scaffolded project
run it as `npx mk …`.

```bash
npx mk eval datasets                                  # the workflow's datasets
npx mk eval create <dataset> [--description …] [--max-duration-ms N] [--max-tokens N] [--max-steps N] [--max-cost X]
npx mk eval pull <dataset> [--dir datasets] [--force] # vault → repo dir
npx mk eval push <dataset> [--dir datasets] [--cut [note]] [--force] [--prune] [--restore]   # repo dir → vault
npx mk eval run <dataset> [--workflow-version v] [--dataset-version N] [--repeats N] [--concurrency N]
                           [--timeout ms] [--baseline <exp>] [--resume <exp>] [--note …]
npx mk eval experiments [dataset]                     # experiment history (★ = baseline)
npx mk eval compare <base-exp> <candidate-exp>        # how the candidate differs
npx mk eval capture <dataset> <context…>              # cases from real runs
```

Every command takes `--json`. `mk eval run --json` prints
`{ experiment, result, comparison? }` — `result` is the Result check below.

## Non-negotiable rules

- **`push`, `create`, `import`, `capture`, `baseline`, `archive`, `cancel` and
  `run` are outward-facing.** Most write the vault; `run` also starts real
  workflow runs (model calls cost money, and steps can reach real connectors)
  and, for a non-live version, adds a temporary deployment row. Confirm with
  the user before each. `datasets`, `pull`, `experiments`, `compare`, `show`,
  `cases`, `versions` and `check` only read (`pull` writes the local repo
  dir).
- **Never pass `--force`, `--prune --force`, or `--restore` on your own.** Each
  overrides a guard that protects someone's edit; surface the CLI's refusal
  verbatim and let the user choose.
- **Never ask for, accept, or echo a secret.** Tell the user which env var to
  set in their own shell and report only whether it is set.
- **Never invent flags.** In particular, use `--dataset-version` and
  `--workflow-version` — `--version` is the CLI's own version flag.

## Credentials — what every command needs

Check `mk eval <sub> --help` for the exact flags:

| Need | Flag | Env var |
|---|---|---|
| The vault the workflow runs in | `--vault <id>` (default: the wallet's own), `--scope` (default: the workflow's `requiredScopes`, else `default`) | `$MANYKIND_VAULT_ID` |
| Vault access, either a wallet | `--keystore <file>` + `--password`, or `--secret-phrase` | `$MANYKIND_KEYSTORE` + `$MANYKIND_KEYSTORE_PASSWORD`, or `$MANYKIND_SECRET_PHRASE` |
| …or the CLI access token (also needed by `run` for the orchestrator) | `--access-token` | `$MANYKIND_ACCESS_TOKEN` (ROC → Access) |
| The workflow's Agent Service (`run` only; `check` only to find the live version) | `--as-pubkey <hex>` | `$MANYKIND_AS_PUBKEY` |
| Environment | `--env dev\|stage\|prod` | `$MANYKIND_ENV` |

A member with a write grant on the scope can edit datasets and run
experiments; it doesn't have to be the owner's wallet.

## The repo dir

```
datasets/<dataset>/header.json          Header: dataset, workflowId, description, limits (no baseline — that stays on the platform)
datasets/<dataset>/cases/<caseId>.json  each case at its latest revision; file name = <id>.json
datasets/<dataset>/.versions.json       what the last pull/push synced: each case's revision and content hash, versions cut
```

Commit `header.json` and `cases/`; `.versions.json` is per-checkout sync state.

A case:

```json
{
  "id": "refund-angry",
  "input": { "text": "I want my money back NOW" },
  "expected": {
    "category": "billing",
    "confidence": ">= 0.8",
    "tags": { "$contains": "refund" },
    "reply.language": { "$oneOf": ["en", "en-GB"] }
  },
  "limits": { "maxDurationMs": 20000 }
}
```

- `input` is the `workflow.start` payload. `expected` is keyed by Result field;
  dot paths reach into nested fields. A field the output lacks **fails**.
- A plain value is deep equality (an object is a subset match); a string like
  `">= 0.8"` is a numeric band against a number. Matchers: `$eq $oneOf
  $contains $regex $between $gte $lte $exists $approx`+`$tol`. A matcher with
  several operators needs **all** of them (`{"$exists": true, "$gte": 1}`).
  `$between` is `[min, max]`, min ≤ max.
- `$regex` patterns over 256 characters, or that quantify a group containing a
  quantifier (`(a+)+`, `(\w+\s?)*`), are refused (the field fails with
  `unsafe $regex refused`) — they can hang scoring. Write anchored, flat patterns.
- Limits (`maxDurationMs maxTokens maxSteps maxCost`, header-wide or per case)
  only **warn** (counted as breaches); they never fail a case.

The scored output is the workflow's declared **Result** — its `output` node's
`params.result` (and `resultTypes`). `run` reads the version's Result (the live
deployment's graph when the version is live, else `manykind.config.ts`/`dist/` of
exactly that version) and warns before starting about cases expecting a field
the version does not return, or returns with another type; those score **n/a**,
not fail. If the user's expectations are all n/a, the fix is the dataset or the
Result declaration, not the workflow logic.

## The loop

1. **Dataset.** `mk eval create <dataset>`, or write `datasets/<dataset>/header.json`
   + cases by hand and `mk eval push <dataset>` (creates it). To start from the
   vault's copy (e.g. cases a teammate added in ROC): `mk eval pull <dataset>`.
2. **Edit cases in the repo**, then `mk eval push <dataset>`. Only changed cases
   get a new revision; nothing is rewritten in place.
3. **Run.** `mk eval run <dataset>` runs the latest dataset version (cutting a
   new one first if the cases changed) against the live workflow version.
   `--workflow-version <v>` runs a version that is pushed but not live: it is
   pinned for this experiment's runs only, then released. `--repeats 3` runs
   each case three times (for nondeterministic model output).
4. **Compare.** The run compares itself with `--baseline <exp>`, else the
   dataset's baseline (chosen in ROC). `mk eval compare <a> <b>` compares any
   two. When the dataset changed between them, only cases unchanged on both
   sides are compared (`comparedOn`), and the output says what changed — an
   edited expectation is not evidence of a regression.
5. **Resume** an experiment that died: `mk eval run <dataset> --resume <exp>`
   with the same `--workflow-version` / `--repeats`. Runs already recorded are
   reused; the rest run in fresh contexts.

## Refusals → what to hand back

All of these refuse **before writing anything**. Quote the CLI's message, then:

| Refusal | Meaning | Options for the user |
|---|---|---|
| `pull`: "case files were edited since the last pull/push and differ from the vault" | Unpushed local edits would be overwritten (or a locally edited case was removed in the vault) | `mk eval push` them first; or move the edits aside; or `pull --force` to take the vault's version |
| `push`: "changed in the vault since they were pulled, and differ from the repo" | Someone edited the case in ROC since your pull | `pull`, redo the edit, push; or `push --force` to write the repo's version over theirs |
| `push --prune`: "would delete these cases, edited in the vault since they were pulled" | You removed a case locally that someone else edited | `pull` to get it back; or `push --prune --force` to delete it, edit and all |
| `push`: "deleted or archived in the vault, and still in the repo dir" | Someone removed it in ROC | `pull` to drop it locally; give it a new id; or `push --restore` to bring it back |
| `pull`/`push`: "header.json is for workflow X, not Y" | The dir holds another workflow's dataset of the same name | `--workflow X`, or another `--dir` |
| `run`: "resume it with the same settings" | `--resume` with a different version or repeats | Re-run with the experiment's settings, or start a new experiment |
| `run`: needs `--access-token` / a wallet | Missing orchestrator or vault credential | Have the user set `$MANYKIND_ACCESS_TOKEN` (ROC → Access) |
| `run`: "has no deployment set — deploy it once before evaluating a version" | A non-live version can only be pinned on a deployed workflow | `mk deploy` first (see the `deploy` skill) |
| A run ends `error` with "has more than 100 pages" | The run's context is too long to read in full | Report it; do not treat it as a timeout |

Rule of thumb: a refusal protects someone's work. Explain which work, then let
the user pick the override.

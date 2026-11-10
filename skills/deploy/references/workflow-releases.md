# Workflow releases: `mk release` → `mk deploy <version>`

For a **workflow** (an agent whose manifest carries a graph), ship with
`mk build` → `mk release` → `mk deploy <version>`. `mk push` still works
but publishes an unchecked version with no release record and moves `latest`;
prefer `mk release` + `mk deploy <version>`.

| Step | Creates a version | Runs checks | Moves the deployment | Moves `latest` |
|---|---|---|---|---|
| `mk push` | yes | no | no | **yes** |
| `mk release` | yes (only if required datasets pass) | yes | no | no |
| `mk deploy <version>` | no | no | yes (default deployment) | **yes** |

## Why `latest` matters

vault-api delivers a workflow's events, schedules and webhooks from the
manifest `latest` names. So `latest` = the deployed version: a released but
undeployed version must not move it, and `mk deploy <version>` (or a
rollback) does.

## `mk release`

```bash
npx mk release [version] [--title <text>] [--notes <text> | --notes-file <file>] [--skip-review] [--json]
```

1. Hashes the built graph in `dist/`; reuses results already cached for that
   content hash.
2. Otherwise publishes a check candidate `0.0.0-c.<hash7>` (never `latest`) and
   runs against it:
   - the **AI review** — never blocks; `--skip-review` skips it (a review
     already cached for this graph is kept);
   - every dataset marked **Required for release** — blocks; cannot be skipped.
3. A required dataset fails → no version is created, **exit 1**.
4. Otherwise re-checks the version number right before publishing (refused if
   it already exists), then publishes the numbered version with its `release`
   block. Not deployed; `latest` does not move.

Defaults: `version` = the patch after the newest release; `--title` = the last
commit's subject; `--notes` = commit subjects since the previous release.
`--notes` and `--notes-file` are mutually exclusive.

**Publish destination** — same meanings as `mk push`:

- Storage bucket: `--bucket <id>` (default: the built manifest's bundle bucket) +
  exactly one of `--secret-phrase` / `$MANYKIND_DDC_SECRET_PHRASE` or
  `--access-token` / `$MANYKIND_DDC_ACCESS_TOKEN` (`--subject-phrase` /
  `$MANYKIND_DDC_SUBJECT_PHRASE` for a subject-bound token); `--preset`,
  `--endpoint`, `--cdn`.
- Org vault: `--vault <vaultId> --vault-scope <scope>` + `$MANYKIND_VAULT_TOKEN`
  (`--vault-token`) or `$MANYKIND_VAULT_SECRET_PHRASE` (`--secret-phrase`).

**What the checks need:**

| Flag | Env | For |
|---|---|---|
| `--cli-token` | `$MANYKIND_ACCESS_TOKEN` | orchestrator + vault-api |
| `--keystore` + `--password` / `--wallet-phrase` | `$MANYKIND_KEYSTORE` + `$MANYKIND_KEYSTORE_PASSWORD` / `$MANYKIND_SECRET_PHRASE` | ed25519 wallet for vault-api |
| `--evals-vault <id>` | `$MANYKIND_VAULT_ID` | vault the workflow runs in (default: the wallet's own) |
| `--scope <scope>` | | vault scope (default: `requiredScopes`, else `default`) |
| `--inference-key` | `$MANYKIND_INFERENCE_KEY` | Inference Gateway key the AI review is billed to |
| `--review-model` | `$MANYKIND_REVIEW_MODEL` | review model `bucket/name/version` |
| `--as-pubkey`, `--agent`, `--out`, `--env`, `--orchestrator`, `--vault-api`, `--inference-gateway`, `--timeout <ms>` | | overrides |

### Where "Required for release" is set

ROC › the workflow › **Evaluations** › the dataset heading. Rule per dataset:
**not worse than live**, or **at least N%** accuracy. With no dataset marked
required, a release is only the AI review and a number.

## `mk deploy <version>`

```bash
npx mk deploy <version> [--accept-warnings] [--dry-run] [--json] [--note <text>] [--author <who>]
```

- Shows the release's marks, repoints the **default** deployment at
  `<version>`, then moves `latest` to it.
- **Rollback** = `mk deploy <older-version>`.
- AI review warnings: a terminal asks; CI needs `--accept-warnings`.
- `--dry-run`: prints what would change (deployment and/or `latest`), changes
  nothing.
- Already live and `latest` already names it → no-op.
- Versions published with `mk push` have no release block ("Not checked") and
  stay deployable.

**Moving `latest`** — where the workflow is published:

- Storage: `--secret-phrase` / `$MANYKIND_DDC_SECRET_PHRASE` or `--ddc-access-token` /
  `$MANYKIND_DDC_ACCESS_TOKEN` (`--subject-phrase` for a subject-bound token);
  `--bucket`, `--cdn`, `--preset`, `--ddc-endpoint`.
- Org vault: `--vault <vaultId> --vault-scope <scope>` + `$MANYKIND_VAULT_TOKEN`
  (`--vault-token`) or `$MANYKIND_VAULT_SECRET_PHRASE` (`--secret-phrase`);
  `--vault-api`.

> On `mk deploy`, `--access-token` is the **CLI access token** for the
> deployment API (`$MANYKIND_ACCESS_TOKEN`) and `--endpoint` is the **platform API**.
> The storage equivalents are `--ddc-access-token` and `--ddc-endpoint`.

Without `<version>`, `mk deploy` applies the `deployments/` folder as before
([roc-deploy.md](./roc-deploy.md)).

## Reading releases

```bash
npx mk release list [--json]               # newest first, marks, what is live
npx mk release show <version> [--json]     # author, notes, AI review, experiments
npx mk release diff <from> <to> [--json]   # steps added, removed, changed
npx mk check <version> [--skip-review] [--json]   # re-run checks on an existing release; exit 1 on failure; release unchanged
npx mk eval cases <experiment> [--failed] [--json]  # an experiment's runs case by case
```

`list`/`show`/`diff` also take `--env`, `--agent`, `--out`, `--as-pubkey`,
`--bucket`, `--cdn`, `--orchestrator`, `--cli-token`. `mk check` takes the
same check flags as `mk release`.

## Errors

| Symptom | Hand back |
|---|---|
| `release`: "Not released. N required dataset(s) failed." (exit 1) | `mk eval cases <experiment> --failed`; fix, `mk build`, release again |
| "which bucket is the workflow in?" | Pass `--bucket <id>` (or push once so the manifest names one) |
| "--as-pubkey is required to run experiments" / "no Agent Service pubkey" | Pass `--as-pubkey <hex>` |
| "--vault needs --vault-scope" | Add `--vault-scope <scope>` |
| "give --notes or --notes-file, not both" | Drop one |
| `deploy`: "<v> has N review warnings. Re-run with --accept-warnings." | No terminal to ask (CI): confirm with the user, then add `--accept-warnings` |
| `release`: "<v> already exists" / "<v> was published while the checks ran; nothing was published. Release again with another number." | Version number taken: `mk release <another-version>` (or omit the version for the next patch) |
| `deploy`: "repointing "default" would not make <v> live: "<row>" (<v'>) serves the default traffic beside or instead of it. mk deploy <version> moves only that one row; change a split or another serving row in ROC, or apply a deployments/ folder with mk deploy (no version)" | Another enabled, untargeted row (split, canary) keeps serving default traffic — or, when the message instead says `"default" does not serve the default traffic (it is targeted, or outranked)`, the default row itself is targeted or outranked: remove or retarget it in ROC (or apply a `deployments/` folder), then re-run `mk deploy <v>` |
| `deploy`: "<workflow> has no "default" deployment to repoint" | Deploy once from ROC, or apply a `deployments/` folder with `mk deploy` (no version) |
| `deploy`: "<v> is deployed …, but `latest` still names … Re-run mk deploy <v> to finish. (<cause>)" | The row moved; moving `latest` failed. The parenthesis is the storage / vault-api error (credential, network): fix it, re-run `mk deploy <v>` |
| `push` prints "is a workflow: this published an unchecked version" | Informational; prefer `mk release` + `mk deploy <version>` |

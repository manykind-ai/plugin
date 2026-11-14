# Deploying an agent (not a workflow): push → deploy, credentials, prerequisites

Workflows ship with `mk release` → `mk deploy <version>`: see [workflow-releases.md](./workflow-releases.md). This page is the agent path and the credential checklist both share.

Ship an agent through this order: **`mk init` → `mk build` → `mk push` → `mk deploy`**.

**`mk deploy` is what makes an agent live and testable** (including in a
sandbox). **`mk publish` — the marketplace listing — is OPTIONAL and the LAST
step.** Publish only places the agent's card in the marketplace for discovery;
skip it entirely for debug, test, or sandbox use. An agent runs because it is
deployed, not because it is published.

In a scaffolded project run `mk` via `npx mk …` (it's a local dev-dep).

```bash
npx mk init my-agent                                 # scaffold (does NOT install deps — fast)
cd my-agent && pnpm install                           # install project deps (incl. the `mk` dev-dep)
npx mk build                                         # local: compile dist/<id>/{bundle.js,manifest.json}
npx mk push    --bucket <id>    --as-pubkey <hex>    # OUTWARD: upload bundle to the storage registry
#   …or, into an organization vault (via vault-api):  npx mk push --vault <vaultId> --vault-scope <scope> --as-pubkey 0x<hex>
npx mk deploy  --endpoint <url> --as-pubkey <hex>    # OUTWARD: apply deployments/ — makes the agent live
npx mk publish --as-pubkey <hex>                    # OPTIONAL, LAST: list the card in the marketplace ($MANYKIND_ACCESS_TOKEN)
```

**Workflows:** `mk build` → `mk release` → `mk deploy <version>` instead of
push → deploy. See [workflow-releases.md](./workflow-releases.md).

## Non-negotiable rules

- **`push`, `release`, `deploy`, and `publish` are outward-facing.** Confirm
  by target, as the skill's "Ask by target" section says, using the checklist
  below. `build` and `init` are local and safe, so run them freely.
- **Two setup steps remain human-only, done in the ROC console:** creating the
  Agent Service (which yields the AS pubkey) and minting a storage registry access
  token. Hand those back as steps; never fake them. The ROC **Deploy** button
  does the same thing as `mk deploy`.
- **Never invent flags or commands.** Everything here is grounded in the
  references.
- **Never ask for, accept, or echo a secret** (secret phrase, access token,
  vault token). Tell the user which env var to set in their own shell
  (`$MANYKIND_DDC_ACCESS_TOKEN`, `$MANYKIND_DDC_SECRET_PHRASE`, `$MANYKIND_VAULT_TOKEN`,
  `$MANYKIND_VAULT_SECRET_PHRASE`) and run the command without the secret flag so
  the CLI reads the env var. Report only whether a variable is set, never its
  value.

## The `deployments/` folder is the source of truth

An agent project declares its deployment records as files — one record per
`deployments/<name>.jsonc`, the filename stem being the record `name` (the same
convention as `migrations/<cubby>/` and `widgets/<id>/`). `mk deploy` reads the
whole folder, assembles the deployment SET, and applies it.

A record's key fields: `priority` (int, REQUIRED, **lower wins**), `targeting`
(string, REQUIRED — a CEL expression over `vault.id` / `vault.scope` /
`event.type`; `""` means always eligible), `version` (REQUIRED — a semver or the
literal `"latest"`), and `weight` (int ≥ 1, default 1, splits traffic within a
priority tier for A/B). Full field list and SET rules:
[references/roc-deploy.md](./roc-deploy.md).

The folder must contain **exactly one** record with empty `targeting` — the
mandatory default/fallthrough. Give it a HIGH priority number (e.g. 99) so more
specific, lower-priority records win. `version: "latest"` fails closed if
`latest` was never pushed — pin a semver for anything that must run.

## `mk deploy` — the command surface

```bash
npx mk deploy [--version <v>] [--endpoint <url>] \
               [--as-pubkey <hex>] [--author <who>] [--note <msg>] [--dry-run]
```

- Reads `deployments/`; **errors if the folder is absent or empty**.
- `--endpoint` (or `$MANYKIND_ENDPOINT`) selects WHERE to apply, defaulting to the
  dev environment. It is **orthogonal** to the files: the same `deployments/`
  folder applies to any environment, so never put environment names inside the
  files.
- `--version` overrides the record `version` without editing files — the
  everyday "pushed a new build, roll it out" step.
- `--deployments <path>` points at the records: a directory (default
  `deployments/`, one record per file) or a single set/record file — like
  `kubectl apply -f <file|dir>`.
- The whole set is applied at once (declarative desired state) — records removed
  locally disappear remotely on the next deploy.
- `--dry-run` shows what would be applied without applying it.

## `mk push` — bucket or vault?

`mk push` has two mutually exclusive destinations. Pick one; passing both
`--bucket` and `--vault` is an error.

| Destination | Use when | Who writes the bucket |
|---|---|---|
| `--bucket <numericId>` (direct bucket) | The bucket is one you (or a ROC token) control — e.g. a personal Agent Service bucket | The CLI writes the registry DAG itself |
| `--vault <vaultId> --vault-scope <scope>` | The agent belongs to an **organization vault** | vault-api checks you may write the scope, then writes the vault's registry bucket |

If the user names an org / vault / scope, use the vault path; if they name a
bucket id or a ROC access token, use the bucket path. If it's unclear, ask.

```bash
npx mk push --vault <vaultId> --vault-scope <scope> \
  [--as-pubkey 0x<hex>] \
  [--env dev|stage|prod] [--vault-api <url>] [--agent <id>] [--out dist]
# credential from the env: $MANYKIND_VAULT_SECRET_PHRASE (your wallet key) or $MANYKIND_VAULT_TOKEN
```

- **Credential — exactly one:** `--secret-phrase` / `$MANYKIND_VAULT_SECRET_PHRASE`
  (the phrase of the **user's own** wallet key, which must hold write on the
  scope; always signed as ed25519, the only scheme vault-api accepts) **or**
  `--vault-token` / `$MANYKIND_VAULT_TOKEN` (a wallet-api bearer token). Both =
  error; neither = error. `$MANYKIND_DDC_SECRET_PHRASE` is **never** used for a
  vault push — it names a bucket owner, not the developer.
- **Bucket-only flags are refused with `--vault`:** `--bucket`, `--access-token`,
  `--preset`, `--endpoint`, `--cdn`, `--subject-phrase`. `--vault-scope`, `--vault-api`,
  and `--vault-token` are refused without `--vault`.
- `--env` selects the vault-api endpoint (default dev); `--vault-api` overrides it.
- The alias is **bound to the scope it is first published from** — later
  versions must be pushed from that same scope.
- On success vault-api stamps the bundle/widget CIDs and `mk push` writes the
  returned manifest back to `dist/<id>/manifest.json`. Then `mk deploy` as usual.

Details: [references/credentials.md](./credentials.md#org-vault-publish-mk-push---vault).

## Before push / deploy / publish — confirm identity, bucket, target

Surface these to the user and get an explicit go-ahead before any outward call:

1. **AS pubkey** (`--as-pubkey <hex>`) — the Agent Service routing identity from
   ROC. Same value on push, deploy, and publish. A wrong pubkey means the agent
   is unroutable (`connect` rejects on an agentId prefix mismatch).
2. **Push destination** (push only) — either the bucket (`--bucket
   <numericId>`, the AS's storage registry bucket, in decimal) **or** the org
   vault and scope (`--vault <vaultId> --vault-scope <scope>`), never both.
3. **Push auth** (push only; confirm which env var is set, never its value) —
   bucket path: exactly one of `--access-token` / `$MANYKIND_DDC_ACCESS_TOKEN`
   (ROC-minted, the common team case) or `--secret-phrase` /
   `$MANYKIND_DDC_SECRET_PHRASE` (bucket owner). Vault path: exactly one of
   `$MANYKIND_VAULT_TOKEN` or `$MANYKIND_VAULT_SECRET_PHRASE`. Both =
   error; neither = error.
4. **Endpoint** (deploy) — echo the resolved `--endpoint` / `$MANYKIND_ENDPOINT` so
   the user knows which environment goes live.
5. **CLI access token** (deploy, publish) — `$MANYKIND_ACCESS_TOKEN` (or
   `--access-token`), minted in ROC → Access; confirm it is set, never echo it.

Echo the resolved AS pubkey, bucket (or vault + scope + `--env`/`--vault-api`), endpoint, and (for publish) marketplace
URL, then ask to proceed. See
[references/credentials.md](./credentials.md) for which credential each
command uses.

## Detect the missing prerequisite → hand back the exact next step

Diagnose *which* gate is unmet and return the one precise command or ROC click.
The CLI's own error strings name the gate — surface them verbatim, then act.

| Symptom / state | Missing | Hand back |
|---|---|---|
| No AS pubkey to pass `--as-pubkey` | ROC setup step 1 | "Open ROC → your Agent Service → copy the AS pubkey (hex)" |
| `push`: "no storage authorization" | ROC setup step 2 | "ROC → Agent Service → Access → generate token; `export MANYKIND_DDC_ACCESS_TOKEN=…`" (note the `bucketId`) |
| `push`: "both … provided" | Ambiguous auth | Unset one of `$MANYKIND_DDC_SECRET_PHRASE` / `$MANYKIND_DDC_ACCESS_TOKEN` |
| `push`: bundle/version not found | Build not run | `mk build` first |
| `push --vault`: "no vault-api credential" / "provide only one of --vault-token … or --secret-phrase" | Vault credential | Have the user set exactly one of `$MANYKIND_VAULT_TOKEN` / `$MANYKIND_VAULT_SECRET_PHRASE` in their shell (never paste it into chat) |
| `push --vault`: a bucket-only flag refused (`--bucket`, `--access-token`, `--preset`, `--endpoint`, `--cdn`, `--subject-phrase`) | Mixed destinations | Drop the bucket flag — a vault push has no bucket |
| `push --vault`: `ALIAS_NOT_YOURS` | Alias belongs to another scope (or is unclaimed and only the owner can claim it) | Push from the scope the alias was first published from, or rename the agent |
| `push --vault`: other 403 | No write on the scope, or scope doesn't exist | Ask the vault owner for a member-level grant on the scope, or fix `--vault-scope` |
| `push --vault`: `REGISTRY_NOT_CONFIGURED` | Org hasn't enabled agent publishing | Only the org owner can fix it: "ROC → the organization page → **Enable agent publishing**", then push again |
| `push --vault`: `REGISTRY_UNAVAILABLE` | Transient registry failure (nothing changed) | Retry the push |
| `push --vault`: 401 | Credential rejected | Check the phrase/token and the machine clock (±5 min) |
| `push --vault`: 404 "does not serve the agent publish route" | vault-api too old / not configured | Check `--env` / `--vault-api` |
| `deploy`: "no deployments/ folder" / empty folder | No records | Create `deployments/default.jsonc` (see reference), then re-run |
| Pushed, but a user's `connect` never gets served | Not deployed | `npx mk deploy --endpoint <url> --as-pubkey <hex>` (or ROC → the agent → **Deploy**) |
| `connect` rejected (agentId prefix mismatch) | Wrong AS pubkey | Re-push/deploy with the **provisioned** AS pubkey |
| Card missing from the marketplace (agent still runs) | Not published | `npx mk publish …` — optional, only for discovery |

Workflow release / deploy errors:
[references/workflow-releases.md](./workflow-releases.md#errors).

Rule of thumb: don't guess past the current gate — resolve it, then re-run.

## Shipping a new version

Workflow: `mk build` → `mk release` → `mk deploy <version>`.

Other agents:

Bump `version` in `manykind.config.ts`, then re-run build → push → `mk deploy`
(pass `--version <semver>` to roll the new build out without editing files, or
deploy `latest`). Add a lower-priority or weighted record in `deployments/` for
a controlled rollout. Re-run `mk publish` only if the marketplace card needs
refreshing — it is not required for the new version to run.

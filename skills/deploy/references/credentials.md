# Credentials and the storage bucket

Several independent credentials are involved in shipping an agent, and they
are easy to confuse:

| Command | Credential | Where it goes |
| --- | --- | --- |
| `mk push` | **storage bucket owner's** phrase, or a token from them | authorizes writes to the content-addressed bucket |
| `mk push --vault` | **Your own wallet key**, or a wallet-api token | authorizes vault-api to publish into a vault scope you can write |
| `mk deploy`, `mk publish`, `mk eval run` | **CLI access token** (`$MANYKIND_ACCESS_TOKEN`, minted in ROC → Access) | proves you may act for the Agent Service |

None of them is the Agent Service's identity. The **AS pubkey** is created
with the Agent Service in ROC and shown there; pass it with `--as-pubkey`.
There is no separate signing keypair to generate: `mk publish` is authorized
by the CLI access token, whose delegator must own the AS bucket or be a
publish-capable member of it.

## Storage bucket + credentials (`mk push`)

`mk push` uploads `dist/<agentId>/bundle.js` to storage as a content-addressed
DAG and rewrites `manifest.json` so `bundle` is `{ bucketId, cid }` instead
of embedded inline. It requires:

1. **`--bucket <numericId>`** (REQUIRED) — decimal storage bucket id. The
   substrate signer must own it. The bucket *is* the agent registry
   (`CNS "agents" → directory → per-agent record → per-version node`).
2. **Exactly one** storage write authorization:
   - `--secret-phrase <phrase>` / `$MANYKIND_DDC_SECRET_PHRASE` — the Sr25519
     phrase that **owns** the bucket.
   - `--access-token <token>` / `$MANYKIND_DDC_ACCESS_TOKEN` — a base58 token
     **granted by the bucket owner** (e.g. minted in ROC by the wallet that
     owns the AS's bucket). Use this when you don't hold the bucket's seed;
     the client is built with a throwaway signer and the token carries the
     authority. Providing **both** phrase and token is an error; providing
     **neither** is an error.
3. **`--as-pubkey <hex>`** — the AS pubkey (exactly as shown in ROC).
   Because push's signing key is unrelated to the AS identity, this is how
   the manifest gets stamped: `agentServicePubkey = <asPubkey>` and
   `agentId = <asPubkey>:<alias>`. With it stamped, bucket consumers (the
   dashboard registry read, the `connect` check) see a fully-identified
   manifest immediately — no need to wait for `mk publish`.

```bash
# Owner pushes with the bucket's secret phrase
mk push --bucket 1234 \
  --secret-phrase "$MANYKIND_DDC_SECRET_PHRASE" \
  --as-pubkey <hex>

# Teammate pushes with a ROC-minted access token (no bucket seed)
mk push --bucket 1234 \
  --access-token "$MANYKIND_DDC_ACCESS_TOKEN" \
  --as-pubkey <hex> --preset TESTNET
```

Other push flags: `--preset MAINNET|TESTNET|DEVNET` (default MAINNET),
`--endpoint <url>` (overrides preset), `--agent <id>` (when `dist/` holds
more than one), `--out <dir>` (default `dist`).

Gotchas:

- Run `mk build` first — push errors if `dist/<id>/{bundle.js,manifest.json}`
  or the manifest `version` is missing.
- `bucketId` is recorded in the manifest as a **decimal string**.
- On a bucket's first push the `agents` CNS root doesn't exist yet; push
  logs that it's creating the registry root (the internal resolve miss is
  expected, not a failure). Set `MANYKIND_DEBUG` for full storage client logs.

## Org vault publish (`mk push --vault`)

For an agent that belongs to an **organization vault**, push through
vault-api instead of writing the bucket yourself. vault-api checks that the caller
holds write on the scope (the vault owner, or a member with a member-level
grant on it), writes the vault's registry bucket, and binds the agent's alias
to the scope it is first published from, so another scope cannot replace it.

```bash
# The user has exported ONE of these in their own shell — never ask for the value:
#   MANYKIND_VAULT_SECRET_PHRASE  (their wallet key's phrase)   or   MANYKIND_VAULT_TOKEN  (wallet-api token)
mk push --vault <vaultId> --vault-scope <scope> \
  --as-pubkey 0x<agent-service-pubkey> --env dev
```

Flags:

- `--vault <vaultId>` + `--vault-scope <scope>` (both REQUIRED for this path).
  `--vault-scope`, not `--scope` — `--scope` belongs to `--kind external`.
- Exactly one credential: `--secret-phrase <phrase>` / `$MANYKIND_VAULT_SECRET_PHRASE`
  (the user's own wallet key, always signed as ed25519)
  or `--vault-token <token>` / `$MANYKIND_VAULT_TOKEN` (wallet-api bearer token).
  Both or neither is an error. **`$MANYKIND_DDC_SECRET_PHRASE` is never read here**
  — it names a bucket owner, not the developer.
- `--as-pubkey 0x<hex>` — stamps `agentId` / `agentServicePubkey` as on the
  bucket path.
- `--env dev|stage|prod` picks the vault-api endpoint; `--vault-api <url>`
  overrides it.
- `--agent <id>`, `--out <dir>` — as on the bucket path.
- Refused with `--vault`: `--bucket`, `--access-token`, `--preset`,
  `--endpoint`, `--cdn`, `--subject-phrase`. Refused without it: `--vault-scope`, `--vault-api`,
  `--vault-token`. All vault flags are refused under
  `--kind external`.

The CLI uploads the version's files with the manifest **unstamped** (no
`bundle` / widget `dag`); vault-api stamps the CIDs and returns the stored
manifest, which `mk push` writes back to `dist/<id>/manifest.json`.

Errors (the server's own code and message are appended to each):

| Code / status | Meaning | What to do |
| --- | --- | --- |
| `403 ALIAS_NOT_YOURS` | The alias is bound to another scope (or is already in the registry unclaimed, which only the vault owner can claim) | Push from the alias's own scope, or rename the agent |
| other `403` | No write on the scope, or the scope doesn't exist | Ask the vault owner for a member-level grant, or fix the scope name |
| `409 REGISTRY_NOT_CONFIGURED` | The org has not enabled agent publishing (no registry bucket/delegation recorded, or it expired) | Only the org owner can fix it: ROC → the organization page → **Enable agent publishing**; then push again |
| `503 REGISTRY_UNAVAILABLE` | Registry temporarily unreadable/unwritable; nothing changed | Retry |
| `401` | Credential rejected | Check phrase/token and clock skew (within 5 minutes) |
| `404 VAULT_NOT_FOUND` | No such vault on this vault-api | Check `--vault` and `--env` |
| `404` (no code) | This vault-api doesn't serve the publish route | Check `--vault-api` / `--env` |

The direct-bucket path above is unchanged and remains the way to publish into
a bucket that is not an org vault's registry (e.g. a personal Agent Service
bucket).

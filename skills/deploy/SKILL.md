---
name: deploy
description: Ship a Manykind workflow or agent. For a workflow that means release a checked version (mk release), make it live (mk deploy <version>) and roll back. For an agent it means build, push and deploy, with marketplace publish optional and last. Also covers credentials, dry runs, and diagnosing a missing prerequisite. Use when the user wants to ship, release, deploy, roll back, push or publish, or asks why something isn't live.
---

# Deploy a Manykind workflow or agent

Your knowledge of the CLI may be out of date. **Prefer retrieval**: run `mk
<command> --help` for flags, and `mk schema cli.deploy` / `mk schema error`
(CLI >= 5.0) for output and error codes. If the docs are available, check
https://developers.manykind.ai. When this skill and `--help` disagree, trust
`--help`. In a project, run `npx mk …`. For
the docs, fetch one page with `curl` (the `workflows` skill's
`references/docs.md`): `/agents/workflows/release/` and
`/agents/ship/push-and-deploy/`.

## Workflows: build → release → deploy

`release`, `check` and `deploy <version>` need the Manykind CLI 5.0 or newer
(`@manykind-ai/cli`). Without it, add the dev-dependency
(`pnpm add -D @manykind-ai/cli@latest`), or release and deploy from the console:
the workflow's Editor → Release, then Deploy. Don't fall back to `mk push`
without saying that it skips the checks and moves `latest`.

```sh
npx mk build
npx mk release [version]          # runs the checks, numbers a version; does NOT make it live
npx mk deploy <version> --dry-run # what would change
npx mk deploy <version>           # makes it live and moves `latest`; rollback = an older version
```

| Step | Creates a version | Runs checks | Makes it live / moves `latest` |
|---|---|---|---|
| `mk push` | yes | no | moves `latest` (unchecked) |
| `mk release` | yes, only if the required datasets pass | AI review (never blocks) + datasets marked *Required for release* (block) | no |
| `mk deploy <version>` | no | no | **yes** |

- **`latest` is the deployed version.** The vault delivers a workflow's
  events, schedules and webhooks from it.
- The gates live in the platform. Which datasets a release requires is set in
  the console: the workflow → Evaluations → the dataset heading.
- Inspect releases with:
  - `mk release list`, `mk release show <v>`, `mk release diff <a> <b>`;
  - `mk check <v>`, which re-runs the checks without changing anything.
- Flags, credentials and every refusal message:
  [references/workflow-releases.md](./references/workflow-releases.md).

## Agents: build → push → deploy (→ publish)

`mk deploy` applies the `deployments/` folder, and that is what makes an agent
live. `mk publish` only lists its card in the marketplace. It is optional and
comes last.

Details: [references/agent-deploy.md](./references/agent-deploy.md). The
`deployments/` record format is in
[references/roc-deploy.md](./references/roc-deploy.md).

## Ask by target, not by command

`push`, `run`, `release`, `deploy`, `publish` and `eval run` change something
outside the project. How you confirm depends on where the change lands. The
CLI can't tell a test vault from a shared one yet, and in a terminal `push`
and `deploy` don't ask at all, so your question is the only check.

- **Name the target before each one:** the environment (`--env` or
  endpoint), the vault and scope (or bucket), the identity (AS pubkey; say so
  if you don't have it yet) and the version.
- **Treat every target as shared unless the user says otherwise.** A target
  is a *test vault* only when the user has said, in this session, that this
  vault and scope is for testing. Anything else is shared: an organization
  vault, a vault that real users or other workflows run on, any deploy that
  moves `latest`. When in doubt, it is shared.
- **Test vault:** one go-ahead covers the loop (push → `mk run` → fix →
  push) with `--yes`, until the target changes. Before the first run, say
  which connectors the workflow calls: a test vault can still message real
  people.
- **Shared target:** run `--dry-run`, show the plan, and wait for a yes for
  that one action. A yes doesn't carry over to another version or another
  target. To try a change without making it live, use `mk release` and then
  `mk run <workflow> --version <v>`, not `mk push`, which moves `latest`
  unchecked.
- `build`, `validate`, `typegen`, `check`, `release list/show/diff` and any
  `--dry-run` are local or read-only, so run them freely.

## Non-negotiable rules

- **Dry run first** whenever the command has one (`--dry-run` is on every
  mutation, with a JSON plan). Show the plan, then apply it.
- **Without a terminal, nothing prompts.** A command that needs
  confirmation exits 2 with `status: "action_required"` and
  `reason: "confirmation_required"`, and its `next[]` holds the same command
  with `--yes`.
  - Add `--yes` only as the rules above allow.
  - `--accept-warnings` overrides review warnings. It always needs the
    user's yes for that release.
- **Never treat a failed read as empty.** If the current deployments or
  releases can't be read (`registry_read_failed`), stop and report it. Don't
  deploy over state you couldn't read.
- **Never ask for, accept or echo a secret.** Say which environment variable
  the user should set in their own shell, and report only whether it is set.
  Details: [references/credentials.md](./references/credentials.md).
- **Some steps only a human can do in the console:**
  - create the Agent Service (this gives the AS pubkey);
  - mint access tokens;
  - mark datasets as required.

  Hand these back as steps. Never fake them.

## Diagnose, then hand back one next step

The CLI names the gate it hit:
- switch on the error `reason`;
- show `message` and `hint`;
- offer the matching `next[]` command.

On older versions, quote the error line exactly. Resolve one gate at a time,
then re-run. Tables of known refusals:

- workflow release and deploy:
  [workflow-releases.md#errors](./references/workflow-releases.md#errors);
- push, deploy and publish for agents:
  [agent-deploy.md](./references/agent-deploy.md).

## After it is live

Check one real run:
- `mk runs list --workflow <id> --since 1h`;
- then `mk runs get <runId>`.

If `intent.md` → Done when lists checks, compare the run against them.

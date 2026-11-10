# Project anatomy & runtime model

A Manykind agent is authored as a TypeScript project, compiled by `mk build` into a
bundle + manifest, and executed by the Manykind agent runtime. This
reference maps the files you'll touch to what the runtime and platform
actually consume.

## What a project contains

```
my-agent/
  manykind.config.ts        # declarative agent manifest source (defineAgent)
  src/agent.ts         # default-exported engagement class w/ decorators
  migrations/          # per-cubby SQL migration dirs (one dir per cubby alias)
    history/001-init.sql
  widgets/             # optional: built, self-contained static web UIs
  test/*.test.ts       # vitest + @manykind-ai/testing simulator tests
  package.json         # depends on @manykind-ai/agent-sdk (+ -D @manykind-ai/cli)
  .manykind/generated.d.ts  # emitted by `mk typegen` — KnownEventTypes autocompletion
  manykind.lock.json        # typegen snapshot; VCS diffs surface drift
  dist/<agentId>/      # `mk build` output (bundle.js + manifest.json)
```

- **`manykind.config.ts`** — the single source of declarative config. Exports
  `defineAgent({...})` as default. Declares identity, engagements, cubbies,
  widgets, models, settings, params. `mk build` turns it into the manifest.
- **`src/agent.ts`** — the code. A default-exported class decorated with
  `@Engagement`, `@OnEvent`, `@OnStart`, `@OnClose`. This is the *entry* the
  config points at (`entry` or `engagements[].entry`).
- **`migrations/<alias>/*.sql`** — SQL schema for a cubby. A `CubbyDecl` in the
  config (`{ alias, migrations: "./migrations/history" }`) points at the dir;
  `ctx.cubby("history")` at runtime reads/writes that SQLite-backed store.
- **`widgets/`** — optional built static UIs (entry HTML + sibling assets using
  `./relative` refs). `mk push` uploads each `WidgetDecl.dir` to storage as ONE
  content-addressed directory DAG; the manifest carries `{ bucketId, cid, entry }`
  and consumers resolve at `<gateway>/<bucketId>/<cid>/<entry>`. The `dir` must
  already be built before push — the CLI copies, it does not bundle widgets.

### Minimal example

```ts
// manykind.config.ts
import { defineAgent } from "@manykind-ai/agent-sdk/config";

export default defineAgent({
  id: "echo",
  version: "0.1.0",
  entry: "./src/agent.ts",
  cubbies: [{ alias: "history", migrations: "./migrations/history" }],
});
```

```ts
// src/agent.ts
import { Engagement, OnEvent, OnStart, type Context, type Event } from "@manykind-ai/agent-sdk";

@Engagement({ id: "default", goal: "echo back any user message" })
export default class Echo {
  @OnStart async onStart() { console.info("started"); }

  @OnEvent("user_message")
  async onMessage(event: Event<{ text: string }>, ctx: Context) {
    await ctx.cubby("history").exec(
      "INSERT INTO messages(id, text, ts) VALUES (?, ?, ?)",
      [Date.now(), event.payload.text, event.ts],
    );
    await ctx.publish("ack", { for: event.id });
  }
}
```

## What `defineAgent` accepts

`defineAgent<T extends AgentConfig>(c: T): T` is just an identity function that
preserves literal types. Key `AgentConfig` fields:

- **`id`** (required) — the agent **alias**. The composite `agentId` is
  `"{agentServicePubkey}:{alias}"` (the AS pubkey plus this alias); `id` is the
  alias half, not the whole composite.
- **`version`** (required) — semver string.
- **`entry`** OR **`engagements[]`** — *exactly one*. `entry: "./src/agent.ts"`
  is shorthand for `engagements: [{ id: "default", entry }]`. Multi-engagement
  form: each `{ id, entry, goal?, condition?, priority?, weight?, limit?,
  params?, enabled? }` (on-declaration selection fields, mirroring the
  `@Condition`/`@Priority`/`@Weight`/`@Limit`/`@Params` class decorators).
- **`cubbies`** — `[{ alias, migrations? }]`. `alias` must match every
  `ctx.cubby("alias")` call (build lints this).
- **`models`** — `Record<alias, ref>`; used via `ctx.models.<alias>` (lint
  requires declared aliases). Copy a model's `ref` from **ROC** (no CLI lists
  them); `mk typegen` then types each handle's input/output. See engagements.md.
- **`params`** — `Record<name, ParamDecl>` (`type`, `default`, `min`/`max`/`enum`;
  `"modelAlias"` must enumerate `models` keys). Resolved per Job as
  `manifest defaults ⊕ deployment ⊕ engagement` and surfaced as `ctx.params`.
- **`settings`** — declared config knobs (`string|number|boolean|url|secret`).
- **`widgets`** — `WidgetDecl[]` (see above).
- **`requiredScopes`** — vault scopes needed at connection (default `["default"]`).
- **`idleTimeout`** — duration string (`"30m"` default; `"0s"` disables). Parsed
  to ms into `manifest.idleTimeout`; on expiry the platform marks the Job
  terminal and dispatches the synthetic close event.
- **`eventSchemas`** — JSON Schemas for events this agent *owns* (see "Typed
  event payloads" below).
- **`agentServicePubkey`** — optional; stamps full identity at build time.
- **`targeting`** (the agent-config engagement table) — DEPRECATED: put
  selection knobs on each engagement instead (see engagements.md). Distinct from
  a *deployment's* `targeting` (audience CEL), which is current.

## Typed event payloads (`eventSchemas` + `mk typegen`)

`@OnEvent("t")` and `ctx.publish("t", …)` accept any string by default, so you
can ship without declaring schemas. To get **autocomplete + payload type
checking** on your own events, declare their JSON Schema in `eventSchemas`
(`Record<eventType, JSONSchema>`) and run `mk typegen`, which folds them into
`KnownEventTypes` so `Event<P>` and the `publish` payload are typed.

```ts
// manykind.config.ts
export default defineAgent({
  id: "echo",
  version: "0.1.0",
  entry: "./src/agent.ts",
  eventSchemas: {
    feedback: {
      type: "object",
      properties: { rating: { type: "number" } },
      required: ["rating"],
    },
    feedback_ack: {
      type: "object",
      properties: { rating: { type: "number" } },
      required: ["rating"],
    },
  },
});
```

Then `mk typegen` (writes `.manykind/generated.d.ts` + `manykind.lock.json`) makes
`@OnEvent("feedback")` give `event.payload.rating: number` and type-checks
`ctx.publish("feedback_ack", { rating })`. Declare schemas only for events this
agent owns; peer-published event schemas are pulled from the peer's manifest.

## Runtime & manifest model

The runtime is **Manykind-agnostic**: it exposes only Web-platform globals plus one
opaque `globalThis.context`, and dispatches
`globalThis.__handlers[name](event, context)`. Two build artifacts encode this:

- **`bundle.js`** — an IIFE (esbuild output) that imports the SDK runtime shims
  (`ctx.cubby`/`.publish`/`.models`/`.close`, reading endpoints from `context`)
  and **installs `globalThis.__handlers`**: a *flat* map of handler functions.
  Event handlers are keyed `"<engagementId>::<method>"` (namespaced to stay
  collision-free across engagements); lifecycle hooks live under the fixed,
  NON-namespaced keys `onStart` / `onClose`.
- **`manifest.json`** — the **routing table** the platform consults. Each
  engagement carries `handles{eventType -> handlerName}` (namespaced) and
  `hooks[]` (`"start"`/`"close"`). The platform looks up those handler names
  directly on `globalThis.__handlers` to dispatch each event.

Gotchas:
- Only one engagement per agent may own each lifecycle hook — `mk build` errors
  on an `onStart`/`onClose` collision (hooks aren't namespaced). Event method
  names *may* be reused across engagements (they are namespaced).
- No Node built-ins. Use global `fetch` for HTTP, `ctx.cubby` for state,
  `globalThis.crypto` (WebCrypto) instead of `node:crypto`. `mk build` bans
  `fs`/`net`/`http`/`child_process` and sync DB/network packages.
- Use `console.*` for plain logging (the runtime captures it); `ctx` is only for
  Manykind-specific calls.

## build → push → publish → deploy

1. **`mk build`** — lints the entry (see below), bundles with esbuild, emits
   `dist/<agentId>/{bundle.js, manifest.json}`. Identity/signature fields stay
   blank unless `agentServicePubkey` is set.
2. **`mk push`** — uploads the bundle and each widget dir to storage as
   content-addressed objects/DAGs; stamps `{ bucketId, cid }` refs into the
   manifest. (`--as-pubkey <hex>` overrides identity.)
3. **`mk deploy`** — apply the `deployments/` folder so a version is live for
   connected users; the platform resolves the manifest from the bucket-backed
   registry and dispatches Jobs against `__handlers`. This is what makes an
   agent run.
4. **`mk publish`** — OPTIONAL, last: places the agent **card** on the
   marketplace for discovery (a signed card envelope). The manifest is NOT sent
   to the marketplace — it lives in the developer's storage bucket (from `mk push`).
   Skip publish for debug/test.

Build-time lints (mirror `@manykind-ai/eslint-plugin`): `@OnEvent(...)` and
`ctx.publish(t, ...)` first args must be string literals; `ctx.cubby("alias")`
must be a literal AND a declared alias; `ctx.models.X` must reference a declared
model alias; banned imports abort the build.

Support commands: **`mk typegen`** regenerates `.manykind/generated.d.ts`
(populates `KnownEventTypes` for `@OnEvent`/`ctx.publish` autocomplete) and
`manykind.lock.json`. **`mk inspect <agentDir>`** runs the built bundle in `node:vm`
and reports exposed `__handlers` names vs. manifest routing targets.

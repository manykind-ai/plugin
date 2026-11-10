---
name: review-production-ready
description: A production-readiness review gets a ranked findings list and no intent.md or design.md.
tags: [review, workflows]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Bash, Skill]
---

Is this workflow production-ready? We want to ship it this week. Write the two
files below into the folder first, then review them.

`weekly-digest/manykind.config.ts`:

```ts
export default defineWorkflow({
  id: "weekly-digest",
  version: "1.2.0",
  goal: "Post a weekly count of support tickets per label to the support leads",
  cubbies: [{ alias: "reports", migrations: "./migrations/reports" }],
  nodes: [
    { id: "trigger", kind: "trigger", params: { mode: "schedule", cron: "0 8 * * 1" } },
    { id: "counts", kind: "cubbyQuery", params: { cubby: "reports", sql: "SELECT label, COUNT(*) AS n FROM ticket_label WHERE created_at >= ? GROUP BY label", args: ["={{ $json.weekStart }}"], into: "counts" } },
    { id: "context", kind: "recall", params: { query: "ticket labels assigned this week" } },
    { id: "summary", kind: "model", params: { model: "default", prompt: "Summarise for support leads: ={{ JSON.stringify($json.counts) }}" } },
    { id: "save", kind: "cubbyExec", params: { cubby: "reports", sql: "INSERT INTO weekly_digest (week_start, body, run_id) VALUES (?, ?, ?)", args: ["={{ $json.weekStart }}", "={{ $json.summary }}", "={{ $runId }}"] } },
    { id: "post", kind: "action", params: { connection: "slack", action: "send_message", channel: "#support-leads", text: "={{ $json.summary }}" } },
    { id: "result", kind: "output", params: { result: { posted: "={{ $json.posted }}" } } },
  ],
  edges: [
    { from: "trigger", to: "counts" }, { from: "counts", to: "context" }, { from: "context", to: "summary" },
    { from: "summary", to: "save" }, { from: "save", to: "post" }, { from: "post", to: "result" },
  ],
});
```

`weekly-digest/migrations/reports/001-init.sql`:

```sql
CREATE TABLE weekly_digest (week_start TEXT, body TEXT, run_id TEXT);
```

For context: `ticket_label` is written by our ticket triage workflow, in its
own `triage` cubby, keyed by `ticket_id`. The project's package.json has
`"@manykind-ai/cli": "^5.0.0"`.

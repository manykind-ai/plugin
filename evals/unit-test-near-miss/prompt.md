---
name: unit-test-near-miss
description: A request for a unit test loads develop, not evaluate.
tags: [develop, triggers]
max_turns: 15
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Write a unit test for the parse logic of our ticket-triage workflow. Its
`parse` code step calls this helper. Write it to ./src/parse.ts first if it
isn't there:

```ts
const CATEGORIES = ["billing", "technical", "account", "other"];

export function parseClassification(raw: string) {
  const body = raw.trim().replace(/^```(?:json)?\s*|```$/g, "");
  const parsed = JSON.parse(body);
  const category = String(parsed.category ?? "").toLowerCase();
  if (!CATEGORIES.includes(category)) {
    throw new Error(`category is ${JSON.stringify(parsed.category)}`);
  }
  return { category, needsHuman: parsed.needs_human === true };
}
```

The project uses vitest.

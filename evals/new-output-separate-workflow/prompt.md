---
name: new-output-separate-workflow
description: A new output with a different cadence becomes a separate consumer workflow.
tags: [define, design]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Our lead pre-filter runs once per uploaded batch and writes a verdict per lead
into its cubby, keyed by campaign and lead. Can you make it also post a daily
summary to #gtm of how many leads passed per campaign? The code isn't checked
out here: the verdict table is `lead_verdict (campaign_id, lead_key, score,
passed, run_id, created_at)` in the `campaigns` cubby. Draft the files.

---
name: set-of-workflows
description: A set of workflows sharing a cubby gets set-level intent.md and design.md.
tags: [define, design, sets]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

We're building a marketing factory: a research workflow finds topics and
writes briefs, a content workflow turns briefs into posts, a distribution
workflow publishes the posts, and an analytics workflow reports weekly on how
they did. They all share one `marketing` cubby. Set up the intent and design
files for this.

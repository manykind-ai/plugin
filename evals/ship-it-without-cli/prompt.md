---
name: ship-it-without-cli
description: Shipping a workflow in a project without the Manykind CLI names the version floor and the options.
tags: [deploy]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Ship it. This is the workflow folder; package.json has
`"devDependencies": { "typescript": "^5.4.0" }` and no other dev-dependencies,
and `manykind.config.ts` uses defineWorkflow. Its intent.md has three examples.

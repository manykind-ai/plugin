---
name: new-workflow-free-text
description: A new workflow described in free text becomes an intent.md.
tags: [define]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

I want a workflow that watches our #support Slack channel, works out whether
each new message is a bug report, a billing question or something else, and
replies in the thread with the right next step. Bot messages should be
ignored. Can you set it up? I'm offline until tomorrow, so don't wait for my
answers: write what you can and list what's still open.

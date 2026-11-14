---
name: prompt-tweak-no-file-change
description: A prompt tweak changes neither intent.md nor design.md.
tags: [develop]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

The screener agent in our Manykind lead pre-filter workflow is too generous with junior
candidates. Make its instructions stricter about seniority: anyone with under
three years in a similar role should not pass. Only this file is relevant;
write it to ./screener-prompt.md and change it. Our intent.md and design.md
live elsewhere in the repo.

```markdown
You screen one lead against the campaign's profile. Answer with the signals
you see (persona, exclusions, fit) as JSON. Be fair: give credit for
adjacent experience.
```

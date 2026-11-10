# manykind

The Manykind plugin for Claude Code. Its skills help you define, design,
build, evaluate and ship workflows on [Manykind](https://manykind.ai), and
they drive the Manykind CLI for you.

A **plugin** is the thing you install. **Skills** are what it contains: the
plugin bundles several skills plus a small update-check hook.

## Install

```
/plugin marketplace add manykind-ai/plugin
/plugin install manykind@manykind-ai
```

To update, run `/plugin marketplace update manykind-ai`. Once a day, a session
start tells you when the plugin or your project's CLI is behind. To turn that
off, set `MK_NO_UPDATE_NOTIFIER=1`.

## The developer loop

For a new workflow or set of workflows, or when the goal, data or steps
change:

1. **Define** the problem first: say what you want ("I want a workflow
   that…"), or point at an existing workflow. Claude writes `intent.md`.
2. **Design** how it works on the platform: Claude writes `design.md`: the
   steps, the data and its keys, where its tunable values live, and which
   workflows it reads from or feeds.
3. **Build** in code (`manykind.config.ts`) or in the console. Check it with
   `mk validate`.
4. **Try**: `mk run <workflow> --input fixture.json`, then `mk runs logs <runId>`.
5. **Evaluate**: the examples in `intent.md` become a dataset (`mk eval`).
6. **Ship**: `mk release`, then `mk deploy <version>`, or Release and Deploy
   in the console. Roll back by deploying an older version.

A review ("is it production-ready?", "find the bugs") or a small fix doesn't
write these files. You get a ranked findings list: `file:line`, whether each
was checked by running something or by reading, and the fix. The checks are
platform-generic: reruns don't duplicate data, keys match between workflows,
cubby versus memory bank, failure mid-run, supported expressions, and the
installed CLI version.

## The two files

Each workflow keeps two living files next to its code. A workflow built only
in the console keeps them in a local folder of your choice. You own and edit
both. Nothing unknown is stubbed as `TBD`: it is left out or listed under
`## Open questions`.

| File | Answers | Sections |
|---|---|---|
| `intent.md` | Why: the outcome, the trigger, when it is done | Goal · Outcome · Trigger · Done when · Examples |
| `design.md` | How: steps, data, knobs, neighbours | Steps · Data · Parameters · Composes with |

Several workflows that share data and one outcome (a funnel, or a factory
such as research → content → distribution → analytics) keep one `intent.md`
and one `design.md` in the parent folder, and no copies per workflow: each
workflow's details are a section of the set's `design.md`. The set's Data
section is where the links between workflows are checked.

History lives in git and in workflow releases. Add any extra sections you
like; the skills never remove them. Update `intent.md` when the goal changes,
and `design.md` when steps or data change. A prompt tweak changes neither.
Nothing in the plugin blocks you: the platform checks a workflow when you
release it.

## Skills

| Skill | Loads when you… |
|---|---|
| `manykind:workflows` | work on any Manykind workflow, including reviews (background knowledge, checks) |
| `manykind:define` | want a new workflow or set, change what one is for, or document an existing one |
| `manykind:design` | decide how a new workflow works, or change its steps or data |
| `manykind:develop` | write or debug workflow or agent code |
| `manykind:evaluate` | build datasets, run experiments, compare versions |
| `manykind:deploy` | release, deploy, roll back, push or publish |

The skills load from ordinary requests. You can also call one directly, for
example `/manykind:define`.

## Requirements

- The Manykind CLI, `@manykind-ai/cli` 5.0 or newer (`manykind`, short form
  `mk`). Without it the skills say so and offer to add it or to use the
  console.
- Node.js 18 or newer for the update-check hook.

## Contributing

How the plugin is built and changed: [AGENTS.md](./AGENTS.md). The review
checklist: [REVIEW.md](./REVIEW.md). Scenario evals: [evals/](./evals/).

## Other agents

The skills are plain `SKILL.md` folders. Codex reads the same `skills/`
directory through `.codex-plugin/plugin.json`. Codex doesn't get the update
hook. For other agents, copy `skills/*` into the agent's skills directory.

## License

MIT

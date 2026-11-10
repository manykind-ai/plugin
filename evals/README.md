# Scenario evals

Each folder is one scenario, in the `claude plugin eval` case format:

```
evals/<scenario>/prompt.md          frontmatter (name, tags, max_turns, allowed_tools) + the user's request
evals/<scenario>/graders/skill-*.md which skill(s) should load (tool_used: Skill)
evals/<scenario>/graders/result.md  what a good result contains (llm grader, PASS/FAIL criteria)
```

The requests are phrased the way a developer would type them, without naming
a skill. Each run starts in an empty folder, so any existing file a scenario
needs is pasted into the request.

| Scenario | Expected skills |
|---|---|
| `new-workflow-free-text` | define, then design |
| `reverse-engineer-lead-prefilter` | define, design |
| `goal-change-define` | define |
| `data-change-design` | design |
| `prompt-tweak-no-file-change` | none required (neither living file is edited) |
| `new-output-separate-workflow` | define, design or workflows |
| `set-of-workflows` | define, design (set-level files only, no per-workflow copies) |
| `ship-it-without-cli` | deploy |
| `evaluate-it` | evaluate |
| `review-production-ready` | workflows; not define or design (ranked findings, no intent.md or design.md) |

## By hand

1. Install the plugin from this checkout:
   `claude --plugin-dir .` (or `/plugin marketplace add ./` then
   `/plugin install manykind@manykind-ai`).
2. Start a session in an empty folder and paste the body of `prompt.md`.
3. Check which skills loaded (the transcript shows each Skill call) against
   the `skill-*.md` graders, and the answer and files against `result.md`.
4. Note failures in the pull request.

## With `claude plugin eval`

```sh
claude plugin eval . --runs 1 --ablation none --allow-tools Write Edit        # all scenarios, skill checks count
claude plugin eval . --case set-of-workflows --allow-tools Write Edit         # one scenario, 3 runs, with a no-plugin baseline arm
```

With the default two-arm run, the `tool_used: Skill` graders only report
whether the plugin fired; `--ablation none` makes them part of the score.
Results go to `evals/results/` (ignored by git). The command needs git 2.31
or newer on `PATH`.

## In CI (later)

The same command runs headless with `--trust-plugin --threshold <0..1>`, and
each scenario can also be driven directly with `claude -p "<request>"
--plugin-dir . --output-format stream-json` and graded from the transcript.
It needs a model credential in the CI secrets, so it isn't wired into
`validate.yml` yet.

## Adding a scenario

Copy a folder, change the request and the graders, and keep `result.md` to
checks a reviewer can verify from the transcript. Update the table above.

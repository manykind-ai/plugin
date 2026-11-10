# Reviewing a change to the plugin

Check each item. A "no" blocks the merge until it is fixed or explained.

- [ ] **Triggers.** Every changed `description` still loads its skill from a
      natural request ("I want a workflow that…", "ship it", "why is this run
      stuck"), without naming the skill. The matching scenario in `evals/`
      still expects it.
- [ ] **Real commands.** Every command and flag named exists in the CLI
      version the text names. Check `--help` or `packages/cli` of the
      released `@manykind-ai/cli`. Anything newer than the oldest supported CLI
      carries `CLI >= x.y`.
- [ ] **No proposals as features.** Nothing planned, unreleased or under
      discussion is described as if it exists.
- [ ] **No private conventions.** No customer's or dogfood repo's table names,
      campaign fields, folders, vault ids or connection ids.
- [ ] **Output fits the request.** Review, readiness, bug-hunt and small-fix
      requests still get a ranked findings list and no `intent.md` /
      `design.md`; `define` and `design` descriptions still exclude them.
- [ ] **Checks stay generic.** `checks.md` items apply to any workflow; no
      check is specific to one use case.
- [ ] **Retrieval first.** New facts that will change (flags, limits, fields)
      are looked up, not embedded. Docs links return 200.
- [ ] **Templates minimal.** `templates/*.md` hold headings and short comments
      only. Their `##` headings match what the skills say.
- [ ] **Developer's files respected.** Nothing tells the agent to reject,
      rewrite or strip `intent.md` / `design.md` content it didn't write.
- [ ] **Skills short.** Long tables and catalogues are in `references/`.
- [ ] **Evals updated.** A changed behaviour has a scenario in `evals/` that
      covers it.
- [ ] **Version and changelog.** The version is bumped in all three manifests,
      and `CHANGELOG.md` has an entry for it.
- [ ] **Validation passes.** `claude plugin validate .` and the CI steps.

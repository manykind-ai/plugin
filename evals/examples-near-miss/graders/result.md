---
type: llm
focus: trace
---

PASS if all of these hold:
- It turns the three Examples into dataset cases (one case each, with the trigger payload as input and the expected label in the expected Result).
- It uses `mk eval` to push the dataset and run it as an experiment against a workflow version, and mentions comparing with a baseline or marking the dataset required for release.
- It says that `mk eval push` writes the vault and `mk eval run` starts real runs, and that they need a go-ahead or the target vault before they run.
FAIL if it only writes unit tests, invents `mk eval` subcommands or flags, or changes what intent.md says.

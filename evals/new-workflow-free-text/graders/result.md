---
type: llm
focus: trace
---

PASS if all of these hold:
- An `intent.md` is written first, with the headings Goal, Outcome, Trigger, Done when and Examples.
- Then it moves on to the design step: a `design.md` (Steps, Data, Parameters, Composes with) is written or explicitly proposed as the next step, after intent.md, not merged into it.
- Trigger names the #support channel and says bot messages (and other channels) are ignored.
- Done when holds checks someone could verify (for example one reply per message, in its thread), not "works well".
- Goal and Outcome use business words; there are no step kinds, SQL or model names in intent.md.
- Anything the request doesn't say is left out, listed under one `Open questions` heading, or asked about (at most three questions). No `TBD` stub sections.
FAIL if it starts writing workflow code before intent.md, merges intent and design into one file, invents facts to fill sections, or blocks progress until Examples exist.

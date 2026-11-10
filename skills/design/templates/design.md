# <Workflow name>: design

<!-- One workflow. A set of workflows uses set-design.md in the parent folder instead. Leave out what isn't known yet, or list it under "## Open questions". -->

## Steps

<!-- In run order. One line each: what the step does, its kind (code / agent / model / human / action / cubby / publish / output…), and why that kind.
     Show branches with their conditions and where a run can wait. A mermaid diagram is welcome. -->

1. 

## Data

<!-- What the workflow writes and where. For each table or destination: -->

| Table / destination | Where (cubby, workspace scope, connector) | Key that links it to other data | Columns that matter | Append-only? |
|---|---|---|---|---|
|  |  |  |  |  |

<!-- Memory bank: which conclusions a curator should propose from these rows, and who accepts them. "None" is a valid answer. -->

## Parameters

<!-- Values someone can change without editing the logic. The SDK has no workflow-level parameter declaration: say where each value lives. "None" is valid. -->

| Name | Meaning | Default | Where it lives (a data row such as per campaign, or a code constant) |
|---|---|---|---|
|  |  |  |  |

## Composes with

<!-- Reads: which workflows' data or events this one uses, and by which key.
     Read by: which workflows, reports or widgets use this one's data. -->

- Reads: 
- Read by: 

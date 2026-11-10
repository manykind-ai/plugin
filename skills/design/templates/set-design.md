# <Set name>: design

<!-- One file for the whole set. The workflows in it get no design.md of their own. Leave out what isn't known yet, or list it under "## Open questions". -->

## Workflows

<!-- In the order work flows through them: the trigger of each and what it hands on. A mermaid diagram is welcome. -->

1. 

### <workflow id>

<!-- One section per workflow, in order: its steps (kind and why), the tables only it uses, its own parameters. Repeat for each workflow. -->

## Data

<!-- Every table or destination the workflows share. Tables only one workflow uses go in its section under Workflows. -->

| Table / destination | Store (cubby, workspace scope, connector) | Written by | Read by | Key | Append-only? |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

<!-- Memory bank: which conclusions a curator should propose from these rows, and who accepts them. "None" is a valid answer.
     A workflow that reads with `recall` sees only accepted records, never another workflow's cubby rows directly. -->

## Parameters

<!-- Values shared by the set. Where each lives: usually a setup or config row; otherwise a code constant. -->

| Name | Meaning | Default | Where it lives |
|---|---|---|---|
|  |  |  |  |

## Composes with

<!-- Workflows, reports or widgets outside the set that this set reads from or feeds. -->

- Reads: 
- Read by: 

# loop-preflight

`loop-preflight` is a file-native setup protocol for agent loops.

It treats a loop as a set of configurable nodes that must pass explicit gates
before runtime is allowed. The goal is to keep loop automation lightweight:
plain files, schemas, setup prompts, evidence, and small validation scripts
instead of a heavy workflow backend.

## Why this exists

Agent loops often start as a working script plus a strong prompt. That works
until another person or model needs to configure the loop. At that point, hidden
assumptions become operational risk:

- Which sources should be collected?
- Which writing or verification skill is selected?
- Which plugin draws images?
- Which actions are read-only?
- Who confirmed the budget?
- Why is the loop allowed to run?

`loop-preflight` makes those questions first-class. A loop cannot run until all
required gates are closed with evidence.

## Core model

```text
Loop     = the automation protocol
Node     = a configurable capability or decision point
Gate     = the precondition that allows a node to proceed
Switch   = whether a node is enabled, disabled, blocked, or stale
Protocol = how a node is configured and verified
Wizard   = a UI or agent flow that helps close gates
Runtime  = the actual loop, enabled only after required gates close
```

## What this is not

This is not a replacement for LangGraph, Temporal, Prefect, Dagster, or a full
agent runtime. It is the layer before runtime: the setup contract that proves a
loop has enough configuration, permissions, and safety policy to start.

## Repository layout

```text
docs/       Protocol documentation
schemas/    JSON Schemas for loop, node, gate, evidence, and setup state
protocols/  Reusable node protocol templates
examples/   Example loop manifests and gate states
prompts/    Setup, runtime, and verifier agent system prompts
scripts/    Validation utilities
tests/      Node test suite
```

## Example

`examples/hotspot-writing/` shows a content loop with gates for sources,
content types, writing skills, illustration plugins, polish skills, output
contracts, safety policy, budget, and dry run.

The example is intentionally blocked:

```json
{
  "setupStatus": "blocked",
  "runtimeEnabled": false,
  "openGates": ["dryRun"]
}
```

That is the desired default. A setup agent or setup console should close the
remaining gate only after dry-run evidence exists.

## Gate status

Gates use a small status vocabulary:

```text
open      not configured
ready     configured but not verified
checking  verification is running
closed    verified and allowed
blocked   waiting on permission, credentials, or human judgment
disabled  explicitly turned off
stale     was closed, but a dependency changed and it must be rechecked
```

## Close policies

```text
human-confirmed       a human must confirm the decision
evidence-verified     a setup agent may close the gate with evidence
evidence-plus-human   evidence is required, then a human chooses
manual-only           only a human can close this high-risk gate
derived               closed from other gates
```

## Validate examples

```bash
npm test
npm run validate:examples
```

The validator checks that:

- required gates exist in `gates.json`
- node dependencies do not form cycles
- gate statuses and close policies are valid
- `runtimeEnabled: true` requires every required gate to be closed
- closed gates include evidence
- `manual-only` gates cannot be closed by `setup-agent`

## Roadmap

1. Protocol and examples
2. `loop setup` CLI
3. Local Setup Console
4. Runtime dashboard
5. Real-world loop templates

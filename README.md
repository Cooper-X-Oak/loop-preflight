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

## Inputs and outputs

The protocol reads a loop manifest, node configuration, gate definitions, and
setup state. Optional evidence files record why a gate may be closed.

Its output is not an automatically running agent. The output is a validated,
file-native setup state that tells a separate runtime whether execution is
allowed. Invalid schemas, dependency cycles, missing gates, unsupported status
transitions, or missing evidence keep runtime disabled.

## Minimal use

The project has no third-party runtime or development dependencies. A current
Node.js installation is sufficient; continuous integration uses Node.js 22.

Run both validation commands:

    npm test
    npm run validate:examples

The first command runs the Node test suite. The second validates the checked-in
example configurations.

## Continuous validation

GitHub Actions runs both validation commands for pushes and pull requests. The
workflow installs Node.js 22 but does not run npm install because package.json
declares no dependencies or devDependencies.

## Safety boundary

- This package validates setup contracts; it does not execute the configured
  loop, contact external services, spend a budget, publish content, or grant
  permissions.
- Human-confirmed and manual-only decisions remain human responsibilities.
- Credentials, cookies, account identifiers, private content, and live runtime
  databases do not belong in protocol examples or evidence fixtures.
- A closed gate means the recorded evidence passed the declared policy. It does
  not prove that an external system is safe beyond that policy.

## Known limitations

- Version 0.1.0 provides schemas, protocols, prompts, examples, and validation
  scripts rather than a packaged CLI or graphical setup console.
- YAML inputs are inspected by the current project-specific validator; this is
  not a general-purpose YAML or workflow engine.
- Validation is local and file-native. It does not verify external accounts,
  credentials, service availability, legal authority, or publishing approval.
- Real-world loop templates and runtime integration remain roadmap work.

## Project status

Version 0.1.0 establishes the file-native preflight protocol and its initial
example validation. The CLI, setup console, runtime dashboard, and additional
real-world templates remain future work.

## License

The project is available under the MIT License. See LICENSE.

## Roadmap

1. Protocol and examples
2. `loop setup` CLI
3. Local Setup Console
4. Runtime dashboard
5. Real-world loop templates

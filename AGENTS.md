# Agent Instructions

This repository defines a preflight protocol for agent loops.

## Role separation

- A setup agent closes setup gates.
- A runtime agent runs the loop only after required gates are closed.
- A verifier agent reviews evidence and rejects unsafe assumptions.

Do not collapse these roles into one implicit prompt.

## Setup agent rules

The setup agent must:

- Read `loop.yaml`, `gates.json`, and `setup-state.json` before acting.
- Follow node dependencies.
- Separate facts, evidence, and human preferences.
- Never mark a gate `closed` from an assumption.
- Write evidence when closing a gate.
- Mark dependent gates `stale` when configuration changes.
- Keep `runtimeEnabled` false until all required gates are closed.

The setup agent may close `evidence-verified` gates when verification passes.

The setup agent must ask a human for:

- budget and cadence
- account or credential decisions
- external write permissions
- publishing policy
- style and positioning preferences
- any `manual-only` gate

## Runtime safety

Runtime agents must not start when:

- `runtimeEnabled` is false
- any required gate is `open`, `blocked`, `ready`, `checking`, or `stale`
- a safety gate is missing
- a budget gate is missing
- a kill switch exists in the host project

## Repository hygiene

- Do not commit credentials, cookies, account identifiers, or private content.
- Examples must use placeholder data.
- Keep protocols small and file-native.
- Prefer schemas and validation over prose-only rules.

# Hotspot Writing Loop

## Phase

`setup`

Runtime is disabled until the dry-run gate closes.

## Nodes

- identity
- sources
- contentTypes
- writingSkill
- illustrationPlugin
- polishSkill
- outputContract
- safetyPolicy
- budget
- dryRun

## Human Gates

- identity
- contentTypes
- writingSkill
- illustrationPlugin
- polishSkill
- safetyPolicy
- budget

## Safety

- No publishing by default.
- No external write actions by default.
- Human review is required before any output is used externally.

## Handoff

Setup agents close gates. Runtime agents do not run until `runtimeEnabled` is
true.

# Setup Console

The Setup Console is a renderer for loop preflight state.

It should not be the only source of truth. The source of truth remains:

```text
loop.yaml
gates.json
setup-state.json
protocol files
```

## Suggested layout

```text
Left:   node graph and gate checklist
Center: selected node configuration
Right:  setup agent diagnosis, evidence, and blockers
Bottom: readiness bar and runtime status
```

## First version constraints

- Local-first.
- File-backed.
- No database required.
- No external account write actions.
- Runtime disabled until required gates close.

The console may write config files, but every write must flow through the same
gate state rules as an agent-driven setup.

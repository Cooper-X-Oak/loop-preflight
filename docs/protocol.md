# Loop Preflight Protocol

Loop Preflight is the setup layer before an agent loop runs.

The protocol answers one question: is this loop configured, verified, and safe
enough to enter runtime?

## Required files

A loop template should provide:

```text
loop.yaml
gates.json
setup-state.json
```

Optional files include:

```text
sources.yaml
skills.yaml
plugins.yaml
STATE.md
LOOP.md
```

## Runtime invariant

`runtimeEnabled` may be true only when every required gate is `closed`.

Changing a node configuration must reopen or stale any dependent gates. Runtime
must become disabled until validation runs again.

## Evidence

A closed gate must include evidence. Evidence is not a transcript dump. It is a
short record that explains why the gate may close:

```json
{
  "type": "schema-valid",
  "summary": "sources.yaml parsed successfully."
}
```

## Setup flow

1. Read loop manifest.
2. Build dependency order.
3. Inspect each required node.
4. Collect human answers where needed.
5. Run evidence checks where possible.
6. Close eligible gates with evidence.
7. Keep blocked gates visible.
8. Enable runtime only when required gates are closed.

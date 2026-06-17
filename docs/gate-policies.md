# Gate Policies

Gate policies define who or what may close a gate.

## human-confirmed

Requires explicit human confirmation. Use for taste, positioning, cadence, and
budget decisions.

## evidence-verified

A setup agent may close the gate after verification succeeds. Use for schema
checks, file existence, source dry runs, and output path validation.

## evidence-plus-human

The setup agent must gather evidence first, then the human chooses. Use for
skills, plugins, writing styles, and optional modules.

## manual-only

Only a human may close the gate. Use for high-risk actions:

- external write operations
- publishing
- account settings
- credentials
- paid spend beyond an existing budget

## derived

The gate closes from other gates. Use for aggregate readiness gates.

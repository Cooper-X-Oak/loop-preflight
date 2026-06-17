# Node Protocols

Node protocols define how a node is configured and verified.

## source

Configures input sources such as RSS, APIs, browser/CDP pages, repository
searches, or platform feeds.

Required checks:

- schema-valid
- at-least-one-active-source
- dry-run-sample-collected

## skill

Configures agent skills.

Required checks:

- skill-md-found
- skill-contract-valid
- selected-by-human when the skill changes output voice or behavior

## plugin

Configures tool or provider capabilities.

Required checks:

- plugin-found-or-disabled
- capability-check
- credential-required state when credentials are missing

## style

Configures taste, voice, positioning, and content categories.

Most style decisions require human confirmation.

## safety

Configures hard boundaries. Safety gates should default to blocked or
manual-only.

## budget

Configures cadence, max runs, max calls, cost limits, failure caps, and pause
rules.

Budget gates require human confirmation.

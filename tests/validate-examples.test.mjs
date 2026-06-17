import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { validateRepository } from '../scripts/validate-examples.mjs'

describe('example validation', () => {
  test('accepts the included hotspot-writing example', async () => {
    const result = await validateRepository(new URL('..', import.meta.url))

    assert.deepEqual(result.errors, [])
    assert.equal(result.examples.length, 1)
    assert.equal(result.examples[0].id, 'hotspot-writing')
  })

  test('rejects runtime-enabled loops with unclosed required gates', async () => {
    const fixture = {
      loop: {
        id: 'invalid-loop',
        runtimeEnabled: true,
        requiredGates: ['sources']
      },
      nodes: {
        sources: {
          title: 'Sources',
          kind: 'connector-config',
          required: true,
          enabled: true,
          dependsOn: [],
          gate: {
            closePolicy: 'evidence-verified'
          }
        }
      },
      gates: {
        sources: {
          status: 'open',
          enabled: true,
          required: true,
          closePolicy: 'evidence-verified'
        }
      },
      setupState: {
        setupStatus: 'blocked',
        runtimeEnabled: true
      }
    }

    const errors = await validateRepository.validateExample('fixture', fixture)

    assert(errors.some(error => error.includes('runtimeEnabled requires all required gates to be closed')))
  })

  test('rejects manual-only gates closed by setup-agent', async () => {
    const fixture = {
      loop: {
        id: 'invalid-manual',
        runtimeEnabled: true,
        requiredGates: ['safetyPolicy']
      },
      nodes: {
        safetyPolicy: {
          title: 'Safety Policy',
          kind: 'policy',
          required: true,
          enabled: true,
          dependsOn: [],
          gate: {
            closePolicy: 'manual-only'
          }
        }
      },
      gates: {
        safetyPolicy: {
          status: 'closed',
          enabled: true,
          required: true,
          closePolicy: 'manual-only',
          closedBy: 'setup-agent',
          closedAt: '2026-06-17T18:30:00+08:00',
          evidence: [{ type: 'human-confirmation', summary: 'User approved safety policy.' }]
        }
      },
      setupState: {
        setupStatus: 'ready',
        runtimeEnabled: true
      }
    }

    const errors = await validateRepository.validateExample('fixture', fixture)

    assert(errors.some(error => error.includes('manual-only gate cannot be closed by setup-agent')))
  })

  test('rejects dependency cycles', async () => {
    const fixture = {
      loop: {
        id: 'cycle-loop',
        runtimeEnabled: false,
        requiredGates: ['a', 'b']
      },
      nodes: {
        a: {
          title: 'A',
          kind: 'policy',
          required: true,
          enabled: true,
          dependsOn: ['b'],
          gate: { closePolicy: 'human-confirmed' }
        },
        b: {
          title: 'B',
          kind: 'policy',
          required: true,
          enabled: true,
          dependsOn: ['a'],
          gate: { closePolicy: 'human-confirmed' }
        }
      },
      gates: {
        a: {
          status: 'open',
          enabled: true,
          required: true,
          closePolicy: 'human-confirmed'
        },
        b: {
          status: 'open',
          enabled: true,
          required: true,
          closePolicy: 'human-confirmed'
        }
      },
      setupState: {
        setupStatus: 'blocked',
        runtimeEnabled: false
      }
    }

    const errors = await validateRepository.validateExample('fixture', fixture)

    assert(errors.some(error => error.includes('node dependency graph has a cycle')))
  })
})

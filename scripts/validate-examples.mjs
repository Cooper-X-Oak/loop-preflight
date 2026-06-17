import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const VALID_GATE_STATUSES = new Set(['open', 'ready', 'checking', 'closed', 'blocked', 'disabled', 'stale'])
const VALID_CLOSE_POLICIES = new Set(['human-confirmed', 'evidence-verified', 'evidence-plus-human', 'manual-only', 'derived'])

function stripInlineComment(line) {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === "'" && !inDouble) inSingle = !inSingle
    if (char === '"' && !inSingle) inDouble = !inDouble
    if (char === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i).trimEnd()
    }
  }
  return line
}

function parseScalar(value) {
  const text = value.trim()
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1)
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(',').map(part => parseScalar(part.trim()))
  }
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return text
}

function splitKeyValue(text) {
  const index = text.indexOf(':')
  if (index === -1) return null
  return [text.slice(0, index).trim(), text.slice(index + 1).trim()]
}

export function parseYaml(text) {
  const lines = text
    .split(/\r?\n/)
    .map(raw => ({ indent: raw.match(/^ */)?.[0].length ?? 0, text: stripInlineComment(raw).trim() }))
    .filter(line => line.text.length > 0)

  function parseBlock(index, indent) {
    if (index >= lines.length) return [{}, index]
    if (lines[index].indent < indent) return [{}, index]
    if (lines[index].text.startsWith('- ')) return parseArray(index, lines[index].indent)
    return parseObject(index, lines[index].indent)
  }

  function parseObject(index, indent) {
    const object = {}
    let cursor = index
    while (cursor < lines.length) {
      const line = lines[cursor]
      if (line.indent < indent) break
      if (line.indent > indent) break
      if (line.text.startsWith('- ')) break

      const pair = splitKeyValue(line.text)
      if (!pair) throw new Error(`Invalid YAML line: ${line.text}`)
      const [key, rawValue] = pair
      if (!rawValue) {
        const nextIndent = lines[cursor + 1]?.indent
        if (nextIndent !== undefined && nextIndent > indent) {
          const [value, next] = parseBlock(cursor + 1, nextIndent)
          object[key] = value
          cursor = next
        } else {
          object[key] = {}
          cursor += 1
        }
      } else {
        object[key] = parseScalar(rawValue)
        cursor += 1
      }
    }
    return [object, cursor]
  }

  function parseArray(index, indent) {
    const array = []
    let cursor = index
    while (cursor < lines.length) {
      const line = lines[cursor]
      if (line.indent < indent) break
      if (line.indent > indent) break
      if (!line.text.startsWith('- ')) break

      const rest = line.text.slice(2).trim()
      if (!rest) {
        const [value, next] = parseBlock(cursor + 1, lines[cursor + 1]?.indent ?? indent + 2)
        array.push(value)
        cursor = next
        continue
      }

      const pair = splitKeyValue(rest)
      if (pair) {
        const [key, rawValue] = pair
        const item = { [key]: rawValue ? parseScalar(rawValue) : {} }
        cursor += 1
        if (cursor < lines.length && lines[cursor].indent > indent) {
          const [nested, next] = parseObject(cursor, lines[cursor].indent)
          Object.assign(item, nested)
          cursor = next
        }
        array.push(item)
      } else {
        array.push(parseScalar(rest))
        cursor += 1
      }
    }
    return [array, cursor]
  }

  return parseBlock(0, lines[0]?.indent ?? 0)[0]
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function readYaml(path) {
  return parseYaml(await readFile(path, 'utf8'))
}

function findDependencyCycle(nodes) {
  const visiting = new Set()
  const visited = new Set()

  function visit(id) {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of nodes[id]?.dependsOn ?? []) {
      if (nodes[dep] && visit(dep)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }

  return Object.keys(nodes).some(visit)
}

export async function validateExample(name, fixture) {
  const errors = []
  const loop = fixture.loop ?? {}
  const nodes = fixture.nodes ?? {}
  const gates = fixture.gates ?? {}
  const setupState = fixture.setupState ?? {}
  const requiredGates = loop.requiredGates ?? []

  if (!loop.id) errors.push(`${name}: loop.id is required`)
  if (!Array.isArray(requiredGates)) errors.push(`${name}: loop.requiredGates must be an array`)
  if (findDependencyCycle(nodes)) errors.push(`${name}: node dependency graph has a cycle`)

  for (const gateId of requiredGates) {
    if (!nodes[gateId]) errors.push(`${name}: required gate ${gateId} has no matching node`)
    if (!gates[gateId]) errors.push(`${name}: required gate ${gateId} has no matching gate state`)
  }

  for (const [nodeId, node] of Object.entries(nodes)) {
    for (const dep of node.dependsOn ?? []) {
      if (!nodes[dep]) errors.push(`${name}: node ${nodeId} depends on unknown node ${dep}`)
    }
    const closePolicy = node.gate?.closePolicy
    if (!VALID_CLOSE_POLICIES.has(closePolicy)) {
      errors.push(`${name}: node ${nodeId} has invalid closePolicy ${closePolicy}`)
    }
  }

  for (const [gateId, gate] of Object.entries(gates)) {
    if (!VALID_GATE_STATUSES.has(gate.status)) errors.push(`${name}: gate ${gateId} has invalid status ${gate.status}`)
    if (!VALID_CLOSE_POLICIES.has(gate.closePolicy)) errors.push(`${name}: gate ${gateId} has invalid closePolicy ${gate.closePolicy}`)
    if (gate.status === 'closed') {
      if (!gate.closedAt) errors.push(`${name}: closed gate ${gateId} is missing closedAt`)
      if (!gate.closedBy) errors.push(`${name}: closed gate ${gateId} is missing closedBy`)
      if (!Array.isArray(gate.evidence) || gate.evidence.length === 0) {
        errors.push(`${name}: closed gate ${gateId} must include evidence`)
      }
      if (gate.closePolicy === 'manual-only' && gate.closedBy === 'setup-agent') {
        errors.push(`${name}: manual-only gate cannot be closed by setup-agent (${gateId})`)
      }
    }
  }

  const requiredClosed = requiredGates.every(gateId => gates[gateId]?.status === 'closed')
  if (loop.runtimeEnabled === true && !requiredClosed) {
    errors.push(`${name}: runtimeEnabled requires all required gates to be closed`)
  }
  if (setupState.runtimeEnabled !== undefined && setupState.runtimeEnabled !== loop.runtimeEnabled) {
    errors.push(`${name}: setup-state runtimeEnabled must match loop runtimeEnabled`)
  }

  return errors
}

export async function validateRepository(rootUrl = new URL('..', import.meta.url)) {
  const root = fileURLToPath(rootUrl)
  const examplesDir = join(root, 'examples')
  const exampleNames = existsSync(examplesDir) ? await readdir(examplesDir) : []
  const errors = []
  const examples = []

  for (const name of exampleNames) {
    const exampleDir = join(examplesDir, name)
    const fixture = {
      loop: await readYaml(join(exampleDir, 'loop.yaml')),
      gates: await readJson(join(exampleDir, 'gates.json')),
      setupState: await readJson(join(exampleDir, 'setup-state.json'))
    }
    const loopBody = fixture.loop.loop ? fixture.loop : { loop: fixture.loop.loop ?? fixture.loop, nodes: fixture.loop.nodes ?? {} }
    fixture.loop = loopBody.loop
    fixture.nodes = loopBody.nodes

    const exampleErrors = await validateExample(name, fixture)
    errors.push(...exampleErrors)
    examples.push({ id: fixture.loop.id, path: exampleDir })
  }

  return { errors, examples }
}

validateRepository.validateExample = validateExample

async function main() {
  const result = await validateRepository(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '..') + '/'))
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(error)
    process.exitCode = 1
    return
  }
  console.log(`Validated ${result.examples.length} example loop(s).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

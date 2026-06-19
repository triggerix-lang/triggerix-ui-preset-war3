import type { War3ActionDef, War3ConditionDef, War3EventDef } from '../../src/core/types'
import { describe, expect, it } from 'vitest'
import { War3Registry } from '../../src/core/registry'
import { defineCompositeTool, defineLeafTool } from '../../src/helpers'

const eventA: War3EventDef = { id: 'e1', label: '事件A', template: 'A' }
const eventB: War3EventDef = { id: 'e2', label: '事件B', template: 'B', type: 'lifecycle' }
const actionA: War3ActionDef = { id: 'a1', label: '动作A', template: 'A' }
const actionB: War3ActionDef = { id: 'a2', label: '动作B', template: 'B', type: 'unit' }
const condA: War3ConditionDef = { id: 'c1', label: '条件A', template: 'A' }
const condB: War3ConditionDef = { id: 'c2', label: '条件B', template: 'B', type: 'unit' }

describe('war3Registry - inherited BaseRegistry behavior', () => {
  it('registers and retrieves events', () => {
    const r = new War3Registry()
    r.registerEvent(eventA)
    expect(r.getEvent('e1')).toEqual(eventA)
    expect(r.getEvent('missing')).toBeUndefined()
  })

  it('lists all events in registration order', () => {
    const r = new War3Registry()
    r.registerEvent(eventA)
    r.registerEvent(eventB)
    expect(r.getEvents()).toEqual([eventA, eventB])
  })

  it('overwrites an event when re-registered with the same id', () => {
    const r = new War3Registry()
    r.registerEvent(eventA)
    const updated: War3EventDef = { id: 'e1', label: '事件A-新', template: 'A+' }
    r.registerEvent(updated)
    expect(r.getEvent('e1')).toEqual(updated)
    expect(r.getEvents()).toHaveLength(1)
  })

  it('registers and lists actions and conditions independently', () => {
    const r = new War3Registry()
    r.registerAction(actionA)
    r.registerAction(actionB)
    r.registerCondition(condA)
    r.registerCondition(condB)
    expect(r.getActions().map(a => a.id)).toEqual(['a1', 'a2'])
    expect(r.getConditions().map(c => c.id)).toEqual(['c1', 'c2'])
  })

  it('returns undefined for unknown action/condition ids', () => {
    const r = new War3Registry()
    expect(r.getAction('missing')).toBeUndefined()
    expect(r.getCondition('missing')).toBeUndefined()
  })
})

describe('war3Registry - tool management', () => {
  it('returns undefined for an unregistered tool', () => {
    const r = new War3Registry()
    expect(r.getTool('t')).toBeUndefined()
  })

  it('registers, retrieves and lists tools', () => {
    const r = new War3Registry()
    const tool = defineLeafTool<string, string>({
      label: 'T',
      input: { type: 'text' },
      resolve: v => v
    })
    r.registerTool('t', tool)
    expect(r.getTool('t')).toEqual(tool)
    expect(r.getTools().get('t')).toEqual(tool)
    expect(r.getTools().size).toBe(1)
  })

  it('getTools returns a defensive copy (mutations do not affect internal state)', () => {
    const r = new War3Registry()
    const tool = defineLeafTool<string, string>({
      label: 'T',
      input: { type: 'text' },
      resolve: v => v
    })
    r.registerTool('t', tool)
    const copy = r.getTools()
    copy.delete('t')
    expect(r.getTools().size).toBe(1)
  })

  it('overwrites a tool when re-registered with the same name', () => {
    const r = new War3Registry()
    const t1 = defineLeafTool<string, string>({ label: 'T1', input: { type: 'text' }, resolve: v => v })
    const t2 = defineLeafTool<string, string>({ label: 'T2', input: { type: 'text' }, resolve: v => v })
    r.registerTool('t', t1)
    r.registerTool('t', t2)
    expect(r.getTool('t')).toEqual(t2)
    expect(r.getTools().size).toBe(1)
  })
})

describe('war3Registry.getValueSources', () => {
  it('returns all conditions and tools when valueType is omitted', () => {
    const r = new War3Registry()
    r.registerCondition(condA)
    r.registerCondition(condB)
    r.registerTool('t1', defineLeafTool<string, string>({ type: 'unit', label: 'T1', input: { type: 'text' }, resolve: v => v }))
    r.registerTool('t2', defineLeafTool<string, string>({ label: 'T2', input: { type: 'text' }, resolve: v => v }))

    const result = r.getValueSources()
    expect(result.conditions).toHaveLength(2)
    expect(result.tools.size).toBe(2)
  })

  it('filters conditions by type when valueType is given', () => {
    const r = new War3Registry()
    r.registerCondition(condA)
    r.registerCondition(condB)
    const result = r.getValueSources('unit')
    expect(result.conditions).toEqual([condB])
  })

  it('filters tools by type when valueType is given', () => {
    const r = new War3Registry()
    r.registerTool('t1', defineLeafTool<string, string>({ type: 'unit', label: 'T1', input: { type: 'text' }, resolve: v => v }))
    r.registerTool('t2', defineLeafTool<string, string>({ label: 'T2', input: { type: 'text' }, resolve: v => v }))
    const result = r.getValueSources('unit')
    expect([...result.tools.keys()]).toEqual(['t1'])
  })

  it('also filters composite tools by type', () => {
    const r = new War3Registry()
    r.registerTool('cmp1', defineCompositeTool<Record<string, never>, string>({
      type: 'point',
      label: 'C1',
      template: '',
      slots: {},
      resolve: () => ''
    }))
    r.registerTool('cmp2', defineCompositeTool<Record<string, never>, string>({
      label: 'C2',
      template: '',
      slots: {},
      resolve: () => ''
    }))
    const result = r.getValueSources('point')
    expect([...result.tools.keys()]).toEqual(['cmp1'])
  })

  it('returns empty collections when nothing matches the type', () => {
    const r = new War3Registry()
    r.registerCondition(condA)
    r.registerTool('t1', defineLeafTool<string, string>({ type: 'unit', label: 'T1', input: { type: 'text' }, resolve: v => v }))
    const result = r.getValueSources('nope')
    expect(result.conditions).toEqual([])
    expect(result.tools.size).toBe(0)
  })
})

import type { SlotValueEntry } from '../../src/core/types'
import { describe, expect, it } from 'vitest'
import { War3Registry } from '../../src/core/registry'
import { defineCompositeTool, defineLeafTool } from '../../src/helpers'
import {
  getActionDescriptor,
  getConditionDescriptor,
  getEventDescriptor,
  getSlotToolDescriptors,
  getToolDescriptor
} from '../../src/presentation/descriptor'

function buildRegistry() {
  const r = new War3Registry()

  r.registerEvent({
    id: 'unit.dies',
    label: '单位死亡',
    template: '当 ${who} 死亡',
    slots: { who: { label: '单位', tools: ['unit'] } }
  })

  r.registerAction({
    id: 'move',
    label: '移动',
    template: '将 ${who} 移动到 ${target}',
    slots: {
      who: { label: '单位', tools: ['unit'] },
      target: { label: '目标点', tools: ['point'] }
    }
  })

  r.registerCondition({
    id: 'hp.less',
    label: '生命值低于',
    template: '${who}.HP < ${value}',
    slots: {
      who: { label: '单位', tools: ['unit'] },
      value: { label: '阈值', tools: ['num'] }
    }
  })

  r.registerTool('unit', defineLeafTool<string, string>({
    label: '单位选择器',
    input: { type: 'text' },
    resolve: v => v
  }))

  r.registerTool('point', defineLeafTool<string, string>({
    label: '点',
    input: { type: 'text' },
    resolve: v => v
  }))

  r.registerTool('num', defineLeafTool<number, number>({
    label: '数字',
    input: { type: 'number' },
    resolve: v => v
  }))

  r.registerTool('expr', defineCompositeTool<{ left: unknown, right: unknown }, string>({
    label: '复合',
    template: '${left}+${right}',
    slots: {
      left: { label: 'L', tools: ['unit'] },
      right: { label: 'R', tools: ['num'] }
    },
    resolve: () => ''
  }))

  return r
}

describe('getEventDescriptor', () => {
  it('returns null for unknown event id', () => {
    const r = buildRegistry()
    expect(getEventDescriptor(r, 'missing')).toBeNull()
  })

  it('builds descriptor from event definition', () => {
    const r = buildRegistry()
    const desc = getEventDescriptor(r, 'unit.dies')
    expect(desc).toEqual({
      id: 'unit.dies',
      segments: [
        { type: 'text', content: '当 ' },
        { type: 'slot', key: 'who', label: '单位', tools: ['unit'], value: null, entry: undefined },
        { type: 'text', content: ' 死亡' }
      ]
    })
  })

  it('passes slotValues through to parser', () => {
    const r = buildRegistry()
    const slotValues: Record<string, SlotValueEntry> = {
      who: { tool: 'unit', value: 'hero' }
    }
    const desc = getEventDescriptor(r, 'unit.dies', slotValues)
    expect(desc?.segments[1]).toMatchObject({
      type: 'slot',
      key: 'who',
      value: 'hero',
      entry: { tool: 'unit', value: 'hero' }
    })
  })
})

describe('getActionDescriptor', () => {
  it('returns null for unknown action id', () => {
    const r = buildRegistry()
    expect(getActionDescriptor(r, 'missing')).toBeNull()
  })

  it('builds descriptor with multiple slots', () => {
    const r = buildRegistry()
    const slotValues: Record<string, SlotValueEntry> = {
      who: { tool: 'unit', value: 'u1' },
      target: { tool: 'point', value: 'p1' }
    }
    const desc = getActionDescriptor(r, 'move', slotValues)
    expect(desc?.id).toBe('move')
    expect(desc?.segments).toEqual([
      { type: 'text', content: '将 ' },
      { type: 'slot', key: 'who', label: '单位', tools: ['unit'], value: 'u1', entry: { tool: 'unit', value: 'u1' } },
      { type: 'text', content: ' 移动到 ' },
      { type: 'slot', key: 'target', label: '目标点', tools: ['point'], value: 'p1', entry: { tool: 'point', value: 'p1' } }
    ])
  })
})

describe('getConditionDescriptor', () => {
  it('returns null for unknown condition id', () => {
    const r = buildRegistry()
    expect(getConditionDescriptor(r, 'missing')).toBeNull()
  })

  it('builds descriptor from condition definition', () => {
    const r = buildRegistry()
    const desc = getConditionDescriptor(r, 'hp.less', {
      who: { tool: 'unit', value: 'hero' },
      value: { tool: 'num', value: 50 }
    })
    expect(desc?.id).toBe('hp.less')
    expect(desc?.segments).toEqual([
      { type: 'slot', key: 'who', label: '单位', tools: ['unit'], value: 'hero', entry: { tool: 'unit', value: 'hero' } },
      { type: 'text', content: '.HP < ' },
      { type: 'slot', key: 'value', label: '阈值', tools: ['num'], value: 50, entry: { tool: 'num', value: 50 } }
    ])
  })
})

describe('getToolDescriptor', () => {
  it('returns null when tool not found', () => {
    const r = buildRegistry()
    expect(getToolDescriptor(r, 'missing')).toBeNull()
  })

  it('returns leaf descriptor for leaf tool', () => {
    const r = buildRegistry()
    const desc = getToolDescriptor(r, 'unit')
    expect(desc).toEqual({
      kind: 'leaf',
      name: 'unit',
      label: '单位选择器',
      input: { type: 'text' }
    })
  })

  it('returns composite descriptor for composite tool with parsed segments', () => {
    const r = buildRegistry()
    const slotValues: Record<string, SlotValueEntry> = {
      left: { tool: 'unit', value: 'a' },
      right: { tool: 'num', value: 1 }
    }
    const desc = getToolDescriptor(r, 'expr', slotValues)
    expect(desc).toEqual({
      kind: 'composite',
      name: 'expr',
      label: '复合',
      segments: [
        { type: 'slot', key: 'left', label: 'L', tools: ['unit'], value: 'a', entry: { tool: 'unit', value: 'a' } },
        { type: 'text', content: '+' },
        { type: 'slot', key: 'right', label: 'R', tools: ['num'], value: 1, entry: { tool: 'num', value: 1 } }
      ]
    })
  })

  it('composite descriptor omits slotValues when not provided', () => {
    const r = buildRegistry()
    const desc = getToolDescriptor(r, 'expr')
    expect(desc?.kind).toBe('composite')
    if (desc?.kind === 'composite') {
      expect(desc.segments[0]).toMatchObject({ type: 'slot', value: null, entry: undefined })
    }
  })
})

describe('getSlotToolDescriptors', () => {
  it('returns descriptors for all known tools referenced by slot def', () => {
    const r = buildRegistry()
    const descs = getSlotToolDescriptors(r, {
      label: '目标点',
      tools: ['unit', 'point', 'missing']
    })
    expect(descs.map(d => d.name)).toEqual(['unit', 'point'])
  })

  it('returns empty array when none of the tools exist', () => {
    const r = buildRegistry()
    const descs = getSlotToolDescriptors(r, {
      label: '空',
      tools: ['a', 'b']
    })
    expect(descs).toEqual([])
  })

  it('preserves the order of the slot def tool list', () => {
    const r = buildRegistry()
    const descs = getSlotToolDescriptors(r, {
      label: '混合',
      tools: ['point', 'unit', 'num']
    })
    expect(descs.map(d => d.name)).toEqual(['point', 'unit', 'num'])
  })
})

import type { SlotValueEntry } from '../src/core/types'
import { describe, expect, it } from 'vitest'
import { defineCompositeTool, defineCondition, defineLeafTool } from '../src/helpers'

describe('defineLeafTool', () => {
  it('returns the def with kind: "leaf"', () => {
    const def = defineLeafTool<string, string>({
      label: '文本',
      input: { type: 'text' },
      resolve: v => v
    })
    expect(def.kind).toBe('leaf')
  })

  it('preserves all provided fields including type', () => {
    const def = defineLeafTool<string, string>({
      type: 'unit-ref',
      label: '单位引用',
      input: { type: 'text', placeholder: '选择单位' },
      resolve: v => v
    })
    expect(def).toMatchObject({
      kind: 'leaf',
      type: 'unit-ref',
      label: '单位引用',
      input: { type: 'text', placeholder: '选择单位' }
    })
  })

  it('resolve function is invoked with the supplied value', () => {
    const def = defineLeafTool<number, string>({
      label: '数字',
      input: { type: 'number' },
      resolve: v => `n=${v}`
    })
    expect(def.resolve(5)).toBe('n=5')
  })

  it('select input carries options through', () => {
    const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
    const def = defineLeafTool<string, string>({
      label: '选择',
      input: { type: 'select', options },
      resolve: v => v
    })
    expect(def.input.options).toEqual(options)
  })
})

describe('defineCompositeTool', () => {
  it('returns the def with kind: "composite"', () => {
    const def = defineCompositeTool<Record<string, never>, string>({
      label: '空',
      template: '',
      slots: {},
      resolve: () => ''
    })
    expect(def.kind).toBe('composite')
  })

  it('preserves template, slots and type', () => {
    const def = defineCompositeTool<{ x: unknown }, string>({
      type: 'point',
      label: '点',
      template: '(${x})',
      slots: { x: { label: 'X', tools: ['num'] } },
      resolve: () => ''
    })
    expect(def).toMatchObject({
      kind: 'composite',
      type: 'point',
      label: '点',
      template: '(${x})'
    })
    expect(def.slots.x).toEqual({ label: 'X', tools: ['num'] })
  })

  it('resolve function receives a typed slotValues record', () => {
    const def = defineCompositeTool<{ a: number, b: number }, number>({
      label: '加',
      template: '${a}+${b}',
      slots: {
        a: { label: 'A', tools: ['num'] },
        b: { label: 'B', tools: ['num'] }
      },
      resolve: v => v.a + v.b
    })
    expect(def.resolve({ a: 2, b: 3 })).toBe(5)
  })
})

describe('defineCondition', () => {
  it('returns the def as-is (no wrapping, no mutation)', () => {
    const def = defineCondition({
      id: 'hp.less',
      label: '生命值低于',
      template: '${who}.HP < ${value}',
      slots: {
        who: { label: '单位', tools: ['unit'] },
        value: { label: '阈值', tools: ['num'] }
      }
    })
    expect(def.id).toBe('hp.less')
    expect(def.label).toBe('生命值低于')
    expect(def.template).toBe('${who}.HP < ${value}')
    expect(def.resolve).toBeUndefined()
  })

  it('keeps resolve function when provided', () => {
    const resolve = (v: { x: number }) => v.x
    const def = defineCondition<{ x: number }>({
      id: 'c',
      label: 'L',
      template: '${x}',
      slots: { x: { label: 'X', tools: ['num'] } },
      resolve
    })
    expect(def.resolve).toBe(resolve)
    expect(def.resolve?.({ x: 1 })).toBe(1)
  })

  it('default generics make slots optional and resolve optional', () => {
    const def = defineCondition({
      id: 'simple',
      label: '简单',
      template: 'always'
    })
    expect(def.template).toBe('always')
    expect(def.slots).toBeUndefined()
    expect(def.resolve).toBeUndefined()
  })
})

describe('slotValueEntry shape (used across helpers)', () => {
  it('allows the entry shapes that helpers/parser/display expect', () => {
    const leafEntry: SlotValueEntry = { tool: 'text', value: 'hi' }
    const compositeEntry: SlotValueEntry = {
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 1 },
        y: { tool: 'num', value: 2 }
      }
    }
    expect(leafEntry.tool).toBe('text')
    expect(compositeEntry.subSlots?.x.value).toBe(1)
  })
})

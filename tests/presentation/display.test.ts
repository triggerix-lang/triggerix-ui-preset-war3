import type { SlotValueEntry } from '../../src/core/types'
import { describe, expect, it } from 'vitest'
import { War3Registry } from '../../src/core/registry'
import { defineCompositeTool, defineLeafTool } from '../../src/helpers'
import { resolveSlotDisplayText } from '../../src/presentation/display'

function buildRegistry() {
  const registry = new War3Registry()

  registry.registerTool('text', defineLeafTool<string, string>({
    label: '文本',
    input: { type: 'text', placeholder: '请输入' },
    resolve: v => v
  }))

  registry.registerTool('num', defineLeafTool<number, number>({
    label: '数字',
    input: { type: 'number' },
    resolve: v => v
  }))

  registry.registerTool('select', defineLeafTool<unknown, string>({
    label: '选择',
    input: {
      type: 'select',
      options: [
        { value: 'a', label: '选项A' },
        { value: 'b', label: '选项B' },
        { value: { $ref: 'doc.title' }, label: '文档标题' }
      ]
    },
    resolve: v => String(v)
  }))

  registry.registerTool('expr', defineCompositeTool<{ left: unknown, op: unknown, right: unknown }, string>({
    label: '表达式',
    template: '${left} ${op} ${right}',
    slots: {
      left: { label: '左', tools: ['text'] },
      op: { label: '运算符', tools: ['select'] },
      right: { label: '右', tools: ['num', 'text'] }
    },
    resolve: () => ''
  }))

  return registry
}

describe('resolveSlotDisplayText', () => {
  it('returns fallback when entry is null/undefined', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText(null, r, '占位')).toBe('占位')
    expect(resolveSlotDisplayText(undefined, r, '占位')).toBe('占位')
  })

  it('returns fallback when entry has no tool selected', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = { tool: null, value: null }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('占位')
  })

  it('returns fallback when tool is unknown to registry', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = { tool: 'missing', value: 'x' }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('占位')
  })

  it('returns fallback for leaf text tool with empty value', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText({ tool: 'text', value: '' }, r, '占位')).toBe('占位')
    expect(resolveSlotDisplayText({ tool: 'text', value: null }, r, '占位')).toBe('占位')
  })

  it('returns stringified value for leaf text tool', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText({ tool: 'text', value: 'hello' }, r, '占位')).toBe('hello')
  })

  it('returns stringified number for leaf number tool', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText({ tool: 'num', value: 0 }, r, '占位')).toBe('0')
    expect(resolveSlotDisplayText({ tool: 'num', value: 42 }, r, '占位')).toBe('42')
  })

  it('returns matched option label for select tool', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText({ tool: 'select', value: 'a' }, r, '占位')).toBe('选项A')
    expect(resolveSlotDisplayText({ tool: 'select', value: 'b' }, r, '占位')).toBe('选项B')
  })

  it('matches select options whose value is an object (deep equality)', () => {
    const r = buildRegistry()
    // Newly constructed object — reference inequality but JSON equal
    const entry: SlotValueEntry = { tool: 'select', value: { $ref: 'doc.title' } }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('文档标题')
  })

  it('falls back to stringified value for select when option not matched', () => {
    const r = buildRegistry()
    expect(resolveSlotDisplayText({ tool: 'select', value: 'unknown' }, r, '占位')).toBe('unknown')
  })

  it('serializes non-primitive object values via JSON when no option matches', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = { tool: 'select', value: { foo: 1 } }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('{"foo":1}')
  })

  it('expands composite tool template using sub slot values', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = {
      tool: 'expr',
      value: undefined as unknown,
      subSlots: {
        left: { tool: 'text', value: 'HP' },
        op: { tool: 'select', value: 'a' },
        right: { tool: 'num', value: 100 }
      }
    }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('HP 选项A 100')
  })

  it('uses slot fallback labels for empty sub slots in composite', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = {
      tool: 'expr',
      value: undefined as unknown,
      subSlots: {
        left: { tool: 'text', value: 'HP' },
        op: { tool: 'select', value: 'a' }
        // right is missing
      }
    }
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('HP 选项A 右')
  })

  it('falls back to template text for unknown sub slot keys in composite', () => {
    const r = buildRegistry()
    const entry: SlotValueEntry = { tool: 'expr', value: undefined as unknown, subSlots: {} }
    // All sub slots fall back to their slot labels
    expect(resolveSlotDisplayText(entry, r, '占位')).toBe('左 运算符 右')
  })
})

import type { SlotDef, SlotValueEntry } from '../../src/core/types'
import { describe, expect, it } from 'vitest'
import { parseTemplate } from '../../src/core/parser'

describe('parseTemplate', () => {
  it('returns a single text segment for templates without slots', () => {
    const segments = parseTemplate('hello world')
    expect(segments).toEqual([
      { type: 'text', content: 'hello world' }
    ])
  })

  it('returns empty array for empty template', () => {
    expect(parseTemplate('')).toEqual([])
  })

  it('parses a single slot with declared definition', () => {
    const slots: Record<string, SlotDef> = {
      who: { label: '单位', tools: ['unit'] }
    }
    const slotValues: Record<string, SlotValueEntry> = {
      who: { tool: 'unit', value: 'hero' }
    }
    const segments = parseTemplate('When ${who} dies', slots, slotValues)
    expect(segments).toEqual([
      { type: 'text', content: 'When ' },
      {
        type: 'slot',
        key: 'who',
        label: '单位',
        tools: ['unit'],
        value: 'hero',
        entry: { tool: 'unit', value: 'hero' }
      },
      { type: 'text', content: ' dies' }
    ])
  })

  it('emits text segment with value null and no entry when slot value is missing', () => {
    const slots: Record<string, SlotDef> = {
      who: { label: '单位', tools: ['unit'] }
    }
    const segments = parseTemplate('${who}', slots, {})
    expect(segments).toEqual([
      {
        type: 'slot',
        key: 'who',
        label: '单位',
        tools: ['unit'],
        value: null,
        entry: undefined
      }
    ])
  })

  it('renders unknown slot placeholders as raw text', () => {
    const segments = parseTemplate('a ${unknown} b')
    expect(segments).toEqual([
      { type: 'text', content: 'a ' },
      { type: 'text', content: '${unknown}' },
      { type: 'text', content: ' b' }
    ])
  })

  it('parses multiple consecutive slots', () => {
    const slots: Record<string, SlotDef> = {
      a: { label: 'A', tools: ['ta'] },
      b: { label: 'B', tools: ['tb'] }
    }
    const slotValues: Record<string, SlotValueEntry> = {
      a: { tool: 'ta', value: 1 },
      b: { tool: 'tb', value: 2 }
    }
    const segments = parseTemplate('${a}+${b}', slots, slotValues)
    expect(segments).toEqual([
      { type: 'slot', key: 'a', label: 'A', tools: ['ta'], value: 1, entry: { tool: 'ta', value: 1 } },
      { type: 'text', content: '+' },
      { type: 'slot', key: 'b', label: 'B', tools: ['tb'], value: 2, entry: { tool: 'tb', value: 2 } }
    ])
  })

  it('parses slot at start and end of template', () => {
    const slots: Record<string, SlotDef> = {
      x: { label: 'X', tools: ['t'] }
    }
    const slotValues: Record<string, SlotValueEntry> = {
      x: { tool: 't', value: 'X-val' }
    }
    const segments = parseTemplate('${x}mid${x}', slots, slotValues)
    expect(segments).toHaveLength(3)
    expect(segments[0]).toMatchObject({ type: 'slot', key: 'x', value: 'X-val' })
    expect(segments[1]).toEqual({ type: 'text', content: 'mid' })
    expect(segments[2]).toMatchObject({ type: 'slot', key: 'x', value: 'X-val' })
  })

  it('does not match slot-like patterns with non-word characters', () => {
    const segments = parseTemplate('${a-b} ${a b}')
    expect(segments).toEqual([
      { type: 'text', content: '${a-b} ${a b}' }
    ])
  })

  it('preserves tool list in slot segments', () => {
    const slots: Record<string, SlotDef> = {
      k: { label: 'K', tools: ['a', 'b', 'c'] }
    }
    const segments = parseTemplate('${k}', slots, {
      k: { tool: 'a', value: null }
    })
    expect(segments[0]).toMatchObject({ type: 'slot', tools: ['a', 'b', 'c'] })
  })
})

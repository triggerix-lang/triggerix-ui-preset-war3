import { describe, expect, it, vi } from 'vitest'
import { createWar3Editor } from '../src/createWar3Editor'
import { defineLeafTool } from '../src/helpers'
import { defineWar3Preset } from '../src/preset'

describe('defineWar3Preset', () => {
  it('exposes the preset name from options', () => {
    const preset = defineWar3Preset({ name: 'war3-demo' })
    expect(preset.name).toBe('war3-demo')
  })

  it('setup registers events, actions, conditions and tools with the editor', () => {
    const editor = createWar3Editor()
    const tool = defineLeafTool<string, string>({
      label: 'T',
      input: { type: 'text' },
      resolve: v => v
    })
    const preset = defineWar3Preset({
      name: 'demo',
      events: [{ id: 'e1', label: 'E1', template: 'E1' }],
      actions: [{ id: 'a1', label: 'A1', template: 'A1' }],
      conditions: [{ id: 'c1', label: 'C1', template: 'C1' }],
      tools: { myTool: tool }
    })
    preset.setup(editor)
    expect(editor.getAvailableEvents().map(e => e.id)).toEqual(['e1'])
    expect(editor.getAvailableActions().map(a => a.id)).toEqual(['a1'])
    expect(editor.getAvailableConditions().map(c => c.id)).toEqual(['c1'])
    expect(editor.getRegistry().getTool('myTool')).toEqual(tool)
  })

  it('skips all categories when not provided', () => {
    const editor = createWar3Editor()
    const preset = defineWar3Preset({ name: 'empty' })
    expect(() => preset.setup(editor)).not.toThrow()
    expect(editor.getAvailableEvents()).toEqual([])
    expect(editor.getAvailableActions()).toEqual([])
    expect(editor.getAvailableConditions()).toEqual([])
    expect(editor.getRegistry().getTools().size).toBe(0)
  })

  it('registers tools in iteration order (preserves Object.entries order)', () => {
    const editor = createWar3Editor()
    const t1 = defineLeafTool<string, string>({ label: '1', input: { type: 'text' }, resolve: v => v })
    const t2 = defineLeafTool<string, string>({ label: '2', input: { type: 'text' }, resolve: v => v })
    const t3 = defineLeafTool<string, string>({ label: '3', input: { type: 'text' }, resolve: v => v })
    const preset = defineWar3Preset({
      name: 'demo',
      tools: { first: t1, second: t2, third: t3 }
    })
    preset.setup(editor)
    expect([...editor.getRegistry().getTools().keys()]).toEqual(['first', 'second', 'third'])
  })

  it('setup is invoked with the same editor instance (can use editor as setup target)', () => {
    const editor = createWar3Editor()
    const setupSpy = vi.fn()
    const preset = {
      name: 'spy',
      setup: setupSpy
    }
    // The function-typed Preset just needs name+setup; cast for runtime
    preset.setup(editor)
    expect(setupSpy).toHaveBeenCalledWith(editor)
  })
})

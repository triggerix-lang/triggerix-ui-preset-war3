import type { SlotValueEntry, War3EditorState } from './types'
import { ObservableState } from '@triggerix/editor'

const INITIAL_STATE: War3EditorState = {
  event: null,
  conditions: [],
  actions: []
}

/**
 * War3 编辑器状态管理
 * 继承 ObservableState，提供模板模式特有的状态操作
 */
export class War3EditorStateManager extends ObservableState<War3EditorState> {
  constructor() {
    super({ ...INITIAL_STATE })
  }

  // --- Event ---
  setEvent(id: string): void {
    this.setState(s => ({ ...s, event: { id, slotValues: {} } }))
  }

  clearEvent(): void {
    this.setState(s => ({ ...s, event: null }))
  }

  setEventSlot(key: string, entry: SlotValueEntry): void {
    this.setState((s) => {
      if (!s.event)
        return s
      return {
        ...s,
        event: {
          ...s.event,
          slotValues: { ...s.event.slotValues, [key]: entry }
        }
      }
    })
  }

  // --- Actions ---
  addAction(id: string): void {
    this.setState(s => ({
      ...s,
      actions: [...s.actions, { id, slotValues: {} }]
    }))
  }

  removeAction(index: number): void {
    this.setState(s => ({
      ...s,
      actions: s.actions.filter((_, i) => i !== index)
    }))
  }

  moveAction(from: number, to: number): void {
    this.setState((s) => {
      const actions = [...s.actions]
      const [moved] = actions.splice(from, 1)
      actions.splice(to, 0, moved)
      return { ...s, actions }
    })
  }

  setActionSlot(actionIndex: number, key: string, entry: SlotValueEntry): void {
    this.setItemSlot('actions', actionIndex, key, entry)
  }

  // --- Conditions ---
  addCondition(id: string): void {
    this.setState(s => ({
      ...s,
      conditions: [...s.conditions, { id, slotValues: {} }]
    }))
  }

  removeCondition(index: number): void {
    this.setState(s => ({
      ...s,
      conditions: s.conditions.filter((_, i) => i !== index)
    }))
  }

  setConditionSlot(conditionIndex: number, key: string, entry: SlotValueEntry): void {
    this.setItemSlot('conditions', conditionIndex, key, entry)
  }

  // --- Reset ---
  reset(): void {
    this.setState(() => ({ ...INITIAL_STATE }))
  }

  // --- Helpers ---
  private setItemSlot(
    field: 'actions' | 'conditions',
    index: number,
    key: string,
    entry: SlotValueEntry
  ): void {
    this.setState((s) => {
      const items = [...s[field]]
      const item = items[index]
      if (!item)
        return s
      items[index] = { ...item, slotValues: { ...item.slotValues, [key]: entry } }
      return { ...s, [field]: items }
    })
  }
}

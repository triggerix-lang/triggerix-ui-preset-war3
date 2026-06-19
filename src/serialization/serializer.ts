import type { Action, ActionNode, ConditionGroup, Event, Trigger, Value } from '@triggerix/core'
import type { War3Registry } from '../core/registry'
import type { ItemState, SlotValueEntry, War3EditorState } from '../core/types'

/**
 * Recursively resolve a single slot value.
 */
export function resolveSlotValue(entry: SlotValueEntry, registry: War3Registry): Value | undefined {
  if (!entry.tool)
    return undefined

  const toolDef = registry.getTool(entry.tool)
  if (!toolDef)
    return undefined

  if (toolDef.kind === 'leaf') {
    return toolDef.resolve(entry.value) as Value | undefined
  }

  // composite: recursively resolve sub-slots
  const resolvedSubSlots: Record<string, Value | undefined> = {}
  if (entry.subSlots) {
    for (const [key, subEntry] of Object.entries(entry.subSlots)) {
      resolvedSubSlots[key] = resolveSlotValue(subEntry, registry)
    }
  }
  return toolDef.resolve(resolvedSubSlots) as Value | undefined
}

/**
 * Resolve all slot values of an ItemState into a params object.
 */
function resolveItemParams(
  slotValues: Record<string, SlotValueEntry>,
  registry: War3Registry
): Record<string, Value> | undefined {
  const params: Record<string, Value> = {}
  let hasParams = false

  for (const [key, entry] of Object.entries(slotValues)) {
    const resolved = resolveSlotValue(entry, registry)
    if (resolved !== undefined) {
      params[key] = resolved
      hasParams = true
    }
  }

  return hasParams ? params : undefined
}

/**
 * Serialize an ItemState array into an Action list.
 */
function serializeItems(
  items: ItemState[],
  registry: War3Registry
): Action[] {
  return items.map<Action>((item) => {
    const params = resolveItemParams(item.slotValues, registry)
    const action: Action = { type: item.id }
    if (params) {
      action.params = params
    }
    return action
  })
}

function generateTriggerId(): string {
  // Prefer crypto.randomUUID (browser / Node 18+)
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `trigger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Serialize editor state into a standard Trigger JSON.
 *
 * Output shape (compatible with @triggerix/core):
 *   {
 *     id, event: { type, payload? }, conditions?: { type:'and', conditions:[...] },
 *     actions: [{ type, params? }]
 *   }
 */
export function toTrigger(
  state: War3EditorState,
  registry: War3Registry,
  triggerId?: string
): Trigger {
  const eventParams = state.event
    ? resolveItemParams(state.event.slotValues, registry)
    : undefined

  const event: Event = {
    type: state.event?.id ?? '',
    ...(eventParams ? { payload: eventParams } : {})
  }

  const actions: ActionNode[] = serializeItems(state.actions, registry)

  const trigger: Trigger = {
    id: triggerId ?? generateTriggerId(),
    event,
    actions
  }

  if (state.conditions.length > 0) {
    // Editor-level conditions actually use the Action shape ({ type, params }), which differs
    // from core's Condition; the runtime layer handles the mapping, so we cast to ConditionGroup here.
    trigger.conditions = {
      type: 'and',
      conditions: serializeItems(state.conditions, registry) as unknown as ConditionGroup['conditions']
    }
  }

  return trigger
}

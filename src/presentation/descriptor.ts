import type { War3Registry } from '../core/registry'
import type {
  ItemDescriptor,
  SlotDef,
  SlotValueEntry,
  ToolDescriptor
} from '../core/types'
import { parseTemplate } from '../core/parser'

function buildDescriptor(
  def: { id: string, template: string, slots?: Record<string, SlotDef> },
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor {
  return {
    id: def.id,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getEventDescriptor(
  registry: War3Registry,
  id: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getEvent(id)
  return def ? buildDescriptor(def, slotValues) : null
}

export function getActionDescriptor(
  registry: War3Registry,
  id: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getAction(id)
  return def ? buildDescriptor(def, slotValues) : null
}

export function getConditionDescriptor(
  registry: War3Registry,
  id: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getCondition(id)
  return def ? buildDescriptor(def, slotValues) : null
}

export function getToolDescriptor(
  registry: War3Registry,
  toolName: string,
  slotValues?: Record<string, SlotValueEntry>
): ToolDescriptor | null {
  const def = registry.getTool(toolName)
  if (!def)
    return null

  if (def.kind === 'leaf') {
    return {
      kind: 'leaf',
      name: toolName,
      label: def.label,
      input: def.input
    }
  }

  return {
    kind: 'composite',
    name: toolName,
    label: def.label,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getSlotToolDescriptors(
  registry: War3Registry,
  slotDef: SlotDef
): ToolDescriptor[] {
  return slotDef.tools
    .map(name => getToolDescriptor(registry, name))
    .filter((d): d is ToolDescriptor => d !== null)
}

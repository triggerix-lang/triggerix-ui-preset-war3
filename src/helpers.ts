import type { CompositeToolDef, LeafToolInput, SlotDef, War3ConditionDef } from './core/types'

/**
 * Type-safe LeafTool definition.
 * Input type comes from the resolve callback annotation; output is inferred.
 */
export function defineLeafTool<TInput, TOutput>(def: {
  type?: string
  label: string
  input: LeafToolInput<TInput>
  resolve: (input: TInput) => TOutput
}) {
  return { ...def, kind: 'leaf' as const }
}

/**
 * Type-safe CompositeTool definition.
 * Slot value types come from the resolve callback; slot keys are validated against it.
 */
export function defineCompositeTool<
  TSlotValues extends Record<string, unknown>,
  TOutput
>(def: {
  type?: string
  label: string
  template: string
  slots: Record<keyof TSlotValues & string, SlotDef>
  resolve: (slotValues: TSlotValues) => TOutput
}): CompositeToolDef<TSlotValues, TOutput> {
  return { ...def, kind: 'composite' }
}

/**
 * Type-safe Condition definition.
 */
export function defineCondition<
  TSlotValues extends Record<string, unknown> = Record<string, unknown>
>(def: Omit<War3ConditionDef<TSlotValues>, 'resolve'> & {
  resolve?: (slotValues: TSlotValues) => unknown
}): War3ConditionDef {
  return def as War3ConditionDef
}

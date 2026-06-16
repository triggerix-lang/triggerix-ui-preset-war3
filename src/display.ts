import { parseTemplate } from './parser'
import type { War3Registry } from './registry'
import type { SlotValueEntry } from './types'

/**
 * Compare two unknown values for equality. Primitives use strict equality;
 * objects fall back to a stable JSON representation. This is required when a
 * select option's `value` is an object literal (e.g. `{ $ref: 'document.title' }`),
 * because consumers typically pass a freshly constructed object literal as the
 * stored `entry.value`, so reference equality (`===`) cannot match it.
 */
function valueEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  catch {
    return false
  }
}

/**
 * Stringify a slot value for display when no option label can be matched.
 * Avoids the unhelpful `[object Object]` fallback by emitting a JSON form
 * for non-primitive values.
 */
function stringifyValue(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    return String(v)
  try {
    return JSON.stringify(v)
  }
  catch {
    return String(v)
  }
}

/**
 * 递归解析 SlotValueEntry 为人类可读的展示文本
 *
 * - 如果 entry 为 null/undefined 或未选择 tool，返回 fallbackLabel（slot 占位文案）
 * - 如果 tool 为 leaf：
 *   - select 类型：尝试匹配 options 找到对应 label（支持对象值的深比较）
 *   - 其它类型：返回 value 的字符串形式
 *   - 若 value 为空：返回 fallbackLabel
 * - 如果 tool 为 composite：使用 tool 的 template 递归展开
 */
export function resolveSlotDisplayText(
  entry: SlotValueEntry | null | undefined,
  registry: War3Registry,
  fallbackLabel: string
): string {
  if (!entry?.tool)
    return fallbackLabel

  const toolDef = registry.getTool(entry.tool)
  if (!toolDef)
    return fallbackLabel

  // Leaf tool
  if (toolDef.type === 'leaf') {
    if (entry.value == null || entry.value === '')
      return fallbackLabel
    if (toolDef.input.type === 'select') {
      const opt = toolDef.input.options?.find(o => valueEquals(o.value, entry.value))
      if (opt)
        return opt.label
    }
    return stringifyValue(entry.value)
  }

  // Composite tool: 递归展开模板
  const segments = parseTemplate(toolDef.template, toolDef.slots, entry.subSlots ?? {})
  return segments.map((seg) => {
    if (seg.type === 'text')
      return seg.content
    if (seg.type === 'slot') {
      const subEntry = entry.subSlots?.[seg.key]
      return resolveSlotDisplayText(subEntry ?? null, registry, seg.label)
    }
    return ''
  }).join('')
}

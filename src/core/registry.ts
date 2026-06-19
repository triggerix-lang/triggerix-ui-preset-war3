import type {
  ToolDef,
  War3ActionDef,
  War3ConditionDef,
  War3EventDef
} from './types'
import { BaseRegistry } from '@triggerix/editor'

/**
 * War3 注册表 - 继承 BaseRegistry，增加 Tool 注册能力
 */
export class War3Registry extends BaseRegistry<War3EventDef, War3ActionDef, War3ConditionDef> {
  private tools = new Map<string, ToolDef>()

  registerTool(name: string, def: ToolDef): void {
    this.tools.set(name, def)
  }

  getTool(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  getTools(): Map<string, ToolDef> {
    return new Map(this.tools)
  }

  getValueSources(valueType?: string): { conditions: War3ConditionDef[], tools: Map<string, ToolDef> } {
    let conditions = this.getConditions()
    let tools = this.getTools()
    if (valueType) {
      conditions = conditions.filter(c => c.type === valueType)
      tools = new Map([...tools.entries()].filter(([_, t]) => t.type === valueType))
    }
    return { conditions, tools }
  }
}

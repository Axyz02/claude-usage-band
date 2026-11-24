export type Limit = { kind: string; percent: number; resetsAt?: string }

export type Snapshot = {
  contextPercent?: number
  limits: Limit[]
  usd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': {
      snapshot: Shaped<Snapshot | null>
      isVisible: boolean
    }
  }
}

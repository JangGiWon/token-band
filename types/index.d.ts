export type Usage = {
  tokens: number
  window: number
  percent: number
  limits: { kind: string; percentUsed: number }[]
  usd?: number
  /** No response yet: tokens is /context's local estimate. */
  estimated?: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'token-band': { usage: Usage | null }
  }
}

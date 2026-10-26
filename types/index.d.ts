export type Usage = {
  tokens: number
  window: number
  percent: number
  limits: { kind: string; percentUsed: number }[]
  usd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'token-band': { usage: Usage | null }
  }
}

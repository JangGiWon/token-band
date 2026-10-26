import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import type { Usage } from '../types'

const usage = atom({ plugin: 'token-band', key: 'usage' } as const, null)

const fmt = (n: number) =>
  n < 1000 ? `${n}` : n < 1e6 ? `${+(n / 1e3).toFixed(1)}k` : `${+(n / 1e6).toFixed(1)}M`

const bar = (pct: number, width = 20) => {
  const used = Math.min(width, Math.round((pct / 100) * width))
  return '█'.repeat(used) + '░'.repeat(width - used)
}

const toUsage = (u: SessionUsage): Usage => ({
  tokens: u.context.tokens ?? 0,
  window: u.context.window,
  percent: u.context.percent ?? 0,
  limits: u.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed })),
  usd: u.cost?.usd,
})

// Before the first response there is no measured count; fall back to /context's local estimate (no API call).
const fetchUsage = async ($: EngineInterface): Promise<Usage> => {
  const u = await $.session.usage()
  if (u.context.tokens !== undefined) return toUsage(u)
  const total = (await $.session.usage({ breakdown: 'summary' })).context.breakdown?.totalTokens
  if (total === undefined) return toUsage(u)
  const percent = Math.min(100, Math.round((total / u.context.window) * 100))
  return { ...toUsage(u), tokens: total, percent, estimated: true }
}

const LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const u = await fetchUsage($)
    await update($, usage, () => u)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    const u = await fetchUsage($)
    await update($, usage, () => u)
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const u = await read($, usage)
    // Always run the chain so other plugins' bands (ponytail's) still draw beneath ours.
    const below = await next(e)
    if (e.props.hasSurvey || u === null) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)
    const { tokens, window, percent } = u
    const color = percent >= 85 ? 'red' : percent >= 60 ? 'yellow' : 'green'
    const limits = u.limits
      .map(l => `${LABEL[l.kind] ?? l.kind} ${l.percentUsed}%`)
      .join('  ')

    const mine = (
      <Box width={e.props.bodyColumns}>
        <Text color={color}>{bar(percent)} </Text>
        <Text>
          {u.estimated ? '~' : ''}{fmt(Math.max(0, window - tokens))} left of {fmt(window)} ({100 - percent}%)
        </Text>
        <Text dimColor>
          {limits ? `  ·  ${limits}` : ''}
          {u.usd !== undefined ? `  ·  $${u.usd.toFixed(2)}` : ''}
        </Text>
      </Box>
    )

    // Ours last, so it sits right above the input.
    return below ? (
      <Box flexDirection="column">
        {below}
        {mine}
      </Box>
    ) : (
      mine
    )
  })
}

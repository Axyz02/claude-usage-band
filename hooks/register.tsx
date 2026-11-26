import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit, SessionContextUsage, SessionCost } from 'claude-code'

import type { Limit, Snapshot } from '../types'

const COMMAND = 'usage-band'
const STORE_KEY = 'isVisible'

// Cambiar el tag si cambia la forma de Snapshot: descarta lo guardado por una versión anterior.
const snapshot = atom({ plugin: 'usage-band', key: 'snapshot' } as const, null, {
  shape: 'snapshot-1',
})
const isVisible = atom({ plugin: 'usage-band', key: 'isVisible' } as const, true)

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'gasto',
}

function toSnapshot(
  context: SessionContextUsage,
  rateLimits: SessionRateLimit[],
  cost: SessionCost | undefined,
): Snapshot {
  const limits: Limit[] = rateLimits.map(r => ({
    kind: r.kind,
    percent: r.percentUsed,
    resetsAt: r.resetsAt,
  }))

  return { contextPercent: context.percent, limits, usd: cost?.usd }
}

function levelColor(percent: number): 'error' | 'warning' | undefined {
  if (percent >= 90) return 'error'
  if (percent >= 70) return 'warning'

  return undefined
}

const BAR_WIDTH = 10
const PARTIALS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

// Barra con resolución de 1/8 de celda: [lleno, vacío].
function bar(percent: number): [string, string] {
  const eighths = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * BAR_WIDTH * 8)
  const full = Math.floor(eighths / 8)
  const partial = PARTIALS[eighths % 8] ?? ''
  const filled = '█'.repeat(full) + partial
  const empty = '░'.repeat(BAR_WIDTH - full - (partial ? 1 : 0))

  return [filled, empty]
}

// Porcentaje entero, salvo por debajo de 1% (para no mostrar 0% cuando ya hay uso).
function formatPercent(percent: number): string {
  const clamped = Math.min(Math.max(percent, 0), 100)
  if (clamped > 0 && clamped < 1) return '<1%'

  return `${Math.round(clamped)}%`
}

function untilReset(resetsAt: string | undefined, now: number): string {
  if (resetsAt === undefined) return ''
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return ` ↻${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ` ↻${hours}h${String(minutes % 60).padStart(2, '0')}`

  return ` ↻${Math.floor(hours / 24)}d${hours % 24}h`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Muestra u oculta la barra de uso sobre el prompt',
    })

    const stored = await $.store.get(STORE_KEY)
    if (typeof stored === 'boolean') {
      await update($, isVisible, () => stored)
    }

    const usage = await $.session.usage()
    await update($, snapshot, () => toSnapshot(usage.context, usage.rateLimits, usage.cost))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e.context, e.rateLimits, e.cost))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async $ => {
    const shown = !(await read($, isVisible))
    await update($, isVisible, () => shown)
    await $.store.set(STORE_KEY, shown)

    return { text: shown ? 'Barra de uso visible.' : 'Barra de uso oculta.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const shown = await read($, isVisible)
    const snap = await read($, snapshot)

    if (e.props.hasSurvey || !shown || snap === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const meter = (percent: number) => {
      const [filled, empty] = bar(percent)
      const level = levelColor(percent)

      return (
        <Text>
          <Text color={level ?? 'claude'}>{filled}</Text>
          <Text dimColor>{empty}</Text>
          <Text color={level} bold={level !== undefined}> {formatPercent(percent)}</Text>
        </Text>
      )
    }

    return (
      <Box flexDirection="row">
        <Text dimColor>ctx </Text>
        {snap.contextPercent === undefined ? <Text dimColor>—</Text> : meter(snap.contextPercent)}
        {snap.limits.map(limit => (
          <Text key={limit.kind}>
            <Text dimColor>  {LABELS[limit.kind] ?? limit.kind} </Text>
            {meter(limit.percent)}
            <Text dimColor>{untilReset(limit.resetsAt, now)}</Text>
          </Text>
        ))}
        {snap.usd !== undefined && (
          <Text dimColor> · ~${snap.usd.toFixed(2)} est.</Text>
        )}
      </Box>
    )
  })
}

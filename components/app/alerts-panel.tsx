'use client'

import { useEffect, useState } from 'react'

const API = 'http://localhost:8000/api/v1'

interface Alert {
  id: number
  corridor_id: string
  corridor_name: string
  population_impact: number
  probability: number
  horizon_hours: number
  generated_at: string
  is_active: boolean
}

interface RiskChip {
  label: string
  bg: string
  color: string
}

const RISK_CHIP: Record<string, RiskChip> = {
  critical: { label: 'Crítico',    bg: '#fee2e2', color: '#991b1b' },
  high:     { label: 'Alto',       bg: '#ffedd5', color: '#9a3412' },
  moderate: { label: 'Moderado',   bg: '#fef9c3', color: '#854d0e' },
  low:      { label: 'Bajo',       bg: '#dcfce7', color: '#166534' },
  none:     { label: 'Sin riesgo', bg: '#f1f5f9', color: '#475569' },
}

function riskKey(probability: number): string {
  if (probability >= 0.8) return 'critical'
  if (probability >= 0.6) return 'high'
  if (probability >= 0.4) return 'moderate'
  if (probability >= 0.2) return 'low'
  return 'none'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

function alertKey(alert: Alert, isDemo: boolean): string {
  const scenario = isDemo ? 'demo' : 'current'
  return `${scenario}-${alert.corridor_name}-${alert.horizon_hours}`
}

export function AlertsPanel({ isDemo }: { isDemo: boolean }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/alerts?is_demo=${isDemo}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then((data: Alert[]) => {
        if (!cancelled) setAlerts(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [isDemo])

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border-subtle bg-surface-base">
      <div className="shrink-0 border-b border-border-subtle px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
          Alertas activas
        </p>
        <h2 className="mt-0.5 text-base font-semibold text-text-primary">
          Panel de riesgo
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="px-5 py-8 text-sm text-text-muted">Cargando alertas…</div>
        )}
        {error && (
          <div className="px-5 py-8 text-sm text-text-muted">
            No se pudo conectar al servidor.
          </div>
        )}
        {!loading && !error && alerts.length === 0 && (
          <div className="px-5 py-8 text-sm text-text-muted">Sin alertas activas.</div>
        )}
        {!loading && !error && alerts.length > 0 && (
          <ul>
            {alerts.map((alert) => {
              const chip = RISK_CHIP[riskKey(alert.probability)]
              const prob = Math.round(alert.probability * 100)
              const impact =
                alert.population_impact >= 1_000_000
                  ? `${(alert.population_impact / 1_000_000).toFixed(1)}M`
                  : `${Math.round(alert.population_impact / 1_000)}k`

              return (
                <li
                  key={alertKey(alert, isDemo)}
                  className="border-b border-border-subtle px-5 py-4 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug text-text-primary">
                      {alert.corridor_name}
                    </p>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: chip.bg, color: chip.color }}
                    >
                      {chip.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                    <span>
                      <span className="font-semibold text-text-primary">{prob}%</span> prob.
                    </span>
                    <span className="text-border-subtle">·</span>
                    <span>{alert.horizon_hours}h horizonte</span>
                    <span className="text-border-subtle">·</span>
                    <span>{impact} hab.</span>
                  </div>

                  <p className="mt-1.5 text-xs text-text-muted">
                    {timeAgo(alert.generated_at)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

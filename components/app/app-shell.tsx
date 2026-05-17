'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'
import { AlertsPanel } from '@/components/app/alerts-panel'
import { ChatWidget } from '@/components/app/chat-widget'
import { RiskMap, type MapView } from '@/components/app/risk-map'

type ScenarioMode = 'demo' | 'current'

const VIEWS: { id: MapView; label: string }[] = [
  { id: 'logistics', label: 'Logística' },
  { id: 'health', label: 'Salud' },
]

const SCENARIOS: { id: ScenarioMode; label: string }[] = [
  { id: 'demo', label: 'Histórico 2023' },
  { id: 'current', label: 'Actual' },
]

export function AppShell() {
  const [view, setView] = useState<MapView>('logistics')
  const [scenario, setScenario] = useState<ScenarioMode>('current')
  const [chatOpen, setChatOpen] = useState(false)
  const isDemo = scenario === 'demo'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      {/* Header */}
      <header className="border-b border-border-subtle/60 bg-surface-base">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              href="/app"
              className="text-xl font-semibold leading-none text-text-primary"
            >
              Nimbus
            </Link>

            <div className="flex overflow-hidden rounded-md border border-border-subtle">
              {VIEWS.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={[
                    'px-4 py-1.5 text-sm font-medium transition-colors',
                    i > 0 ? 'border-l border-border-subtle' : '',
                    view === v.id
                      ? 'bg-brand text-text-secondary'
                      : 'text-text-muted hover:bg-surface-raised hover:text-text-primary',
                  ].join(' ')}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex overflow-hidden rounded-md border border-border-subtle">
              {SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={[
                    'px-4 py-1.5 text-sm font-medium transition-colors',
                    i > 0 ? 'border-l border-border-subtle' : '',
                    scenario === s.id
                      ? 'bg-brand text-text-secondary'
                      : 'text-text-muted hover:bg-surface-raised hover:text-text-primary',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <UserButton />
        </div>
      </header>

      {/* Content: sidebar + map + chat */}
      <div style={{ display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {view === 'logistics' && <AlertsPanel key={scenario} isDemo={isDemo} />}

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <RiskMap key={scenario} view={view} isDemo={isDemo} />
        </div>

        {/* Chat panel — empuja el mapa, no lo tapa */}
        <div
          className="overflow-hidden shrink-0 flex flex-col transition-[width] duration-300 ease-in-out"
          style={{ width: chatOpen ? 400 : 0 }}
        >
          <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />
        </div>
      </div>
    </div>
  )
}

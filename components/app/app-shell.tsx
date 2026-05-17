'use client'

import React, { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { MessageCircleIcon } from 'lucide-react'
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
  const [alertsOpen, setAlertsOpen] = useState(true)
  const isDemo = scenario === 'demo'

  // Shortcuts: [ = toggle alertas, ] = toggle chat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === '[') setAlertsOpen(v => !v)
      if (e.key === ']') setChatOpen(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

      {/* Botón toggle del chat */}
      <button
        aria-label={chatOpen ? 'Cerrar asistente Hermes IA' : 'Abrir asistente Hermes IA'}
        onClick={() => setChatOpen(v => !v)}
        className="fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-brand text-white px-2.5 py-5 rounded-l-xl shadow-lg shadow-brand/25 hover:bg-[#0a2d6e] transition-[right,background-color] duration-300 ease-in-out border-y border-l border-white/10 cursor-pointer"
        style={{ right: chatOpen ? 400 : 0 }}
      >
        <MessageCircleIcon className="size-[18px]" />
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
          Hermes IA
        </span>
      </button>

      {/* Área de contenido: mapa siempre al 100%, paneles encima */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* Mapa — ocupa toda el área, nunca cambia de tamaño por los paneles */}
        <RiskMap key={scenario} view={view} isDemo={isDemo} />

        {/* Panel de alertas — desliza desde la izquierda sobre el mapa */}
        {view === 'logistics' && (
          <div
            className="absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out"
            style={{ width: 320, transform: alertsOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <AlertsPanel key={scenario} isDemo={isDemo} onCollapse={() => setAlertsOpen(false)} />
          </div>
        )}

        {/* Botón para expandir alertas cuando está colapsado */}
        {view === 'logistics' && !alertsOpen && (
          <button
            onClick={() => setAlertsOpen(true)}
            aria-label="Expandir panel de alertas"
            className="
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              flex flex-col items-center gap-2
              bg-surface-base text-text-muted
              px-2 py-4
              rounded-r-xl
              border border-l-0 border-border-subtle
              hover:bg-surface-raised hover:text-text-primary
              transition-colors duration-200
              shadow-sm cursor-pointer
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <span
              className="text-[9px] font-semibold tracking-widest uppercase"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
            >
              Alertas
            </span>
          </button>
        )}

        {/* Panel del chat — desliza desde la derecha sobre el mapa */}
        <div
          className="absolute top-0 right-0 h-full z-10 transition-transform duration-300 ease-in-out"
          style={{ width: 400, transform: chatOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />
        </div>

      </div>
    </div>
  )
}

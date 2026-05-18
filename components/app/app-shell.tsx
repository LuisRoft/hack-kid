'use client';

import { UserButton } from '@clerk/nextjs';
import { MessageCircleIcon, MapIcon, BellIcon, Layers3Icon } from 'lucide-react';
import { AppBrandLink } from '@/components/brand/app-brand-link';
import { useEffect, useState } from 'react';
import { AlertsPanel } from '@/components/app/alerts-panel';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ChatWidget } from '@/components/app/chat-widget';
import {
  ActionPlanPanel,
  type ActionPlan,
} from '@/components/app/action-plan-panel';
import {
  RiskMap,
  type MapLayerId,
  type MapLayerState,
  type RiskHorizon,
} from '@/components/app/risk-map';
import { CitizenProfileSettings } from '@/components/onboarding/citizen-profile-settings';

type ScenarioMode = 'current' | 'demo';
type MapViewMode = 'predictive' | 'realtime';

const DATA_MODES: { id: ScenarioMode; label: string }[] = [
  { id: 'current', label: 'Actual' },
  { id: 'demo', label: 'Histórico 2023' },
];

const VIEW_MODES: { id: MapViewMode; label: string }[] = [
  { id: 'predictive', label: 'Predictivo' },
  { id: 'realtime', label: 'Tiempo real' },
];

const HORIZONS: RiskHorizon[] = [24, 48, 72];

const PREDICTIVE_LAYERS: MapLayerState = {
  zones: true,
  rain: false,
  landslideRisk: true,
  landslideReports: false,
  resources: true,
  corridors: true,
};

const REALTIME_LAYERS: MapLayerState = {
  zones: false,
  rain: true,
  landslideRisk: false,
  landslideReports: true,
  resources: true,
  corridors: false,
};

const PREDICTIVE_LAYER_LABELS: {
  id: MapLayerId;
  label: string;
  currentOnly?: boolean;
}[] = [
  { id: 'zones', label: 'Riesgo por zona', currentOnly: true },
  { id: 'landslideRisk', label: 'Riesgo de deslave' },
  { id: 'corridors', label: 'Red vial monitoreada' },
  { id: 'resources', label: 'Recursos cercanos', currentOnly: true },
];

const REALTIME_LAYER_LABELS: { id: MapLayerId; label: string }[] = [
  { id: 'rain', label: 'Lluvia ahora' },
  { id: 'landslideReports', label: 'Deslaves reportados' },
  { id: 'resources', label: 'Recursos cercanos' },
];

type LiveLayerStatus = {
  alerts: number | null;
  rain: number | null;
  landslides: number | null;
};

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'}/api/v1`;
const CHAT_PANEL_WIDTH = 400;

async function featureCount(url: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);
  const data = (await response.json()) as { features?: unknown[] };
  return Array.isArray(data.features) ? data.features.length : 0;
}

async function itemCount(url: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);
  const data = (await response.json()) as unknown[];
  return Array.isArray(data) ? data.length : 0;
}

function CitizenProfileIcon() {
  return (
    <svg
      aria-hidden
      viewBox='0 0 24 24'
      className='h-4 w-4'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M3 10.5 12 3l9 7.5' />
      <path d='M5.5 9.5V21h13V9.5' />
      <path d='M9 21v-6h6v6' />
      <path d='M9 12h.01' />
      <path d='M15 12h.01' />
    </svg>
  );
}

export function AppShell() {
  const [scenario, setScenario] = useState<ScenarioMode>('current');
  const [viewMode, setViewMode] = useState<MapViewMode>('predictive');
  const [horizon, setHorizon] = useState<RiskHorizon>(24);
  const [layers, setLayers] = useState<MapLayerState>(PREDICTIVE_LAYERS);
  const [liveStatus, setLiveStatus] = useState<LiveLayerStatus>({
    alerts: null,
    rain: null,
    landslides: null,
  });
  const [selectedCorridorName, setSelectedCorridorName] = useState<
    string | null
  >(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [mobileSheet, setMobileSheet] = useState<'alerts' | 'layers' | null>(null);
  const isDemo = scenario === 'demo';
  const isPredictive = viewMode === 'predictive';
  const visibleLayerLabels = isPredictive
    ? PREDICTIVE_LAYER_LABELS
    : REALTIME_LAYER_LABELS;
  const effectiveLayers: MapLayerState = isDemo
    ? {
        ...layers,
        zones: false,
        rain: false,
        landslideReports: false,
        resources: false,
      }
    : layers;

  function toggleLayer(layer: MapLayerId) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function changeViewMode(nextViewMode: MapViewMode) {
    if (isDemo && nextViewMode === 'realtime') return;
    setViewMode(nextViewMode);
    setLayers(nextViewMode === 'predictive' ? PREDICTIVE_LAYERS : REALTIME_LAYERS);
  }

  useEffect(() => {
    let cancelled = false;

    if (isDemo) {
      return;
    }

    Promise.allSettled([
      itemCount(`${API}/alerts?is_demo=false`),
      featureCount(`${API}/map/rain/realtime?within_minutes=360`),
      featureCount(`${API}/map/landslides/realtime?hours=24`),
    ]).then(([alerts, rain, landslides]) => {
      if (cancelled) return;
      setLiveStatus({
        alerts: alerts.status === 'fulfilled' ? alerts.value : null,
        rain: rain.status === 'fulfilled' ? rain.value : null,
        landslides:
          landslides.status === 'fulfilled' ? landslides.value : null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (event.key === ']') {
        setChatOpen((open) => !open);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
      <header className='border-b border-border-subtle/60 bg-surface-base'>
        <div className='flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8'>
          <div className='flex items-center gap-5'>
            <AppBrandLink href='/app' />

            <div className='hidden md:flex items-center gap-3'>
              <div className='flex overflow-hidden rounded-md border border-border-subtle'>
              {DATA_MODES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScenario(s.id);
                    if (s.id === 'demo') {
                      setViewMode('predictive');
                      setLayers(PREDICTIVE_LAYERS);
                    }
                    setSelectedCorridorName(null);
                  }}
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

              <div className='flex overflow-hidden rounded-md border border-border-subtle'>
                {VIEW_MODES.map((mode, index) => {
                  const disabled = isDemo && mode.id === 'realtime';

                  return (
                    <button
                      key={mode.id}
                      type='button'
                      disabled={disabled}
                      onClick={() => changeViewMode(mode.id)}
                      className={[
                        'px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                        index > 0 ? 'border-l border-border-subtle' : '',
                        viewMode === mode.id
                          ? 'bg-brand text-text-secondary'
                          : 'text-text-muted hover:bg-surface-raised hover:text-text-primary',
                      ].join(' ')}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <UserButton>
            <UserButton.UserProfilePage
              label='Perfil ciudadano'
              url='citizen-profile'
              labelIcon={<CitizenProfileIcon />}
            >
              <CitizenProfileSettings />
            </UserButton.UserProfilePage>
          </UserButton>
        </div>
      </header>

      <button
        type='button'
        aria-label={
          chatOpen ? 'Cerrar asistente Hermes IA' : 'Abrir asistente Hermes IA'
        }
        onClick={() => setChatOpen((open) => !open)}
        className='fixed top-1/2 z-50 hidden md:flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-l-xl border-y border-l border-white/10 bg-brand px-2.5 py-5 text-white shadow-lg shadow-brand/25 transition-[right,background-color] duration-300 ease-in-out hover:bg-[#0a2d6e]'
        style={{ right: chatOpen ? CHAT_PANEL_WIDTH : 0 }}
      >
        <MessageCircleIcon className='size-[18px]' />
        <span
          className='text-[10px] font-semibold tracking-widest uppercase'
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
        >
          Hermes IA
        </span>
      </button>

      {/* Content: sidebar + map */}
      <div style={{ display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <AlertsPanel
          key={scenario}
          isDemo={isDemo}
          selectedCorridorName={selectedCorridorName}
          onSelectAlert={setSelectedCorridorName}
        />

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <RiskMap
            key={`${scenario}-${horizon}`}
            isDemo={isDemo}
            horizon={horizon}
            layers={effectiveLayers}
            selectedCorridorName={selectedCorridorName}
          />

          {actionPlan ? (
            <ActionPlanPanel
              plan={actionPlan}
              onClose={() => setActionPlan(null)}
              onOpenChat={() => setChatOpen(true)}
            />
          ) : null}

          <div className='pointer-events-none absolute left-4 top-4 z-10 hidden md:flex max-w-[calc(100%-2rem)] flex-col gap-3'>
            {isPredictive ? (
              <div className='pointer-events-auto w-fit rounded-md border border-border-subtle bg-surface-base/95 p-2 shadow-sm backdrop-blur'>
                <p className='px-1 pb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                  Riesgo esperado
                </p>
                <div className='flex overflow-hidden rounded-[var(--radius-xs)] border border-border-subtle'>
                  {HORIZONS.map((item, index) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setHorizon(item)}
                      className={[
                        'px-3 py-1 text-xs font-medium transition-colors',
                        index > 0 ? 'border-l border-border-subtle' : '',
                        horizon === item
                          ? 'bg-brand text-text-secondary'
                          : 'text-text-muted hover:bg-surface-raised hover:text-text-primary',
                      ].join(' ')}
                    >
                      {item}h
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='pointer-events-auto w-fit rounded-md border border-border-subtle bg-surface-base/95 px-3 py-2 text-xs shadow-sm backdrop-blur'>
                <p className='font-medium text-text-primary'>Condiciones reportadas ahora</p>
                <p className='mt-0.5 text-text-muted'>Lluvia reciente, eventos y recursos cercanos.</p>
              </div>
            )}

            <div className='pointer-events-auto w-52 rounded-md border border-border-subtle bg-surface-base/95 p-2 shadow-sm backdrop-blur'>
              <p className='px-1 pb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                {isPredictive ? 'Capas predictivas' : 'Capas en tiempo real'}
              </p>
              <div className='grid gap-1'>
                {visibleLayerLabels.map((item) => {
                  const disabled =
                    isDemo && 'currentOnly' in item && item.currentOnly === true;
                  const checked = effectiveLayers[item.id];

                  return (
                    <label
                      key={item.id}
                      className={[
                        'flex items-center gap-2 rounded-[var(--radius-xs)] px-2 py-1.5 text-xs transition-colors',
                        disabled
                          ? 'cursor-not-allowed text-text-muted/60'
                          : 'cursor-pointer text-text-primary hover:bg-surface-raised',
                      ].join(' ')}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleLayer(item.id)}
                        className='accent-brand'
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
              {isDemo ? (
                <p className='mt-2 px-1 text-[11px] leading-4 text-text-muted'>
                  Histórico 2023 usa corredores, tramos de riesgo y alertas demo.
                </p>
              ) : null}
            </div>

            <div className='pointer-events-auto w-64 rounded-md border border-border-subtle bg-surface-base/95 p-3 shadow-sm backdrop-blur'>
              <p className='text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                Lectura del mapa
              </p>
              <div className='mt-2 space-y-2 text-xs leading-5 text-text-muted'>
                {isPredictive ? (
                  <>
                    <p>
                      <span className='font-medium text-text-primary'>
                        Riesgo por zona:
                      </span>{' '}
                      cantones/parroquias con score para las próximas {horizon}h.
                    </p>
                    <p>
                      <span className='font-medium text-text-primary'>
                        Riesgo de deslave:
                      </span>{' '}
                      tramos de carretera coloreados por probabilidad.
                    </p>
                    <p>
                      <span className='font-medium text-text-primary'>
                        Red monitoreada:
                      </span>{' '}
                      corredores principales en verde azulado.
                    </p>
                    {!isDemo && liveStatus.alerts === 0 ? (
                      <p>No hay alertas oficiales activas de corredores.</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p>
                      <span className='font-medium text-text-primary'>
                        Tiempo real:
                      </span>{' '}
                      muestra lluvia reciente, deslaves reportados y recursos.
                    </p>
                    {!isDemo && liveStatus.rain === 0 ? (
                      <p>No hay muestras recientes de lluvia para pintar heatmap.</p>
                    ) : null}
                    {!isDemo && liveStatus.landslides === 0 ? (
                      <p>No hay deslaves recientes reportados en las últimas 24h.</p>
                    ) : null}
                  </>
                )}
              </div>

              <div className='mt-3 grid gap-1.5 text-[11px] text-text-muted'>
                {isPredictive ? (
                  <div className='grid gap-1.5'>
                    <div className='flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 rounded-sm bg-[#7f1d1d]' />
                      Crítico
                      <span className='h-2.5 w-2.5 rounded-sm bg-[#ef4444]' />
                      Alto
                      <span className='h-2.5 w-2.5 rounded-sm bg-[#f97316]' />
                      Moderado
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='h-0.5 w-8 rounded-full bg-[#0f766e] ring-2 ring-[#ecfeff]' />
                      Corredor monitoreado
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <span className='flex h-4 w-4 items-center justify-center rounded-full bg-[#dc2626] text-[9px] font-semibold text-white'>
                      H
                    </span>
                    hospital
                    <span className='flex h-4 w-4 items-center justify-center rounded-full bg-[#16a34a] text-[8px] font-semibold text-white'>
                      Rx
                    </span>
                    farmacia
                    <span className='flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-[9px] font-semibold text-white'>
                      M
                    </span>
                    mercado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: panel deslizante lateral */}
          <div
            className={`hidden md:block absolute top-0 right-0 z-20 bottom-0 w-[400px] transition-transform duration-300 ease-in-out ${
              chatOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            }`}
          >
            <ChatWidget
              open={chatOpen}
              onOpenChange={setChatOpen}
              onActionPlan={(plan) => {
                setActionPlan(plan);
                setChatOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className='md:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-border-subtle bg-surface-base/95 backdrop-blur'
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label='Navegación principal'
      >
        <button
          type='button'
          onClick={() => { setMobileSheet(null); setChatOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            !mobileSheet && !chatOpen ? 'text-brand' : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label='Mapa'
        >
          <MapIcon className='h-5 w-5' />
          Mapa
        </button>
        <button
          type='button'
          onClick={() => { setMobileSheet('alerts'); setChatOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            mobileSheet === 'alerts' ? 'text-brand' : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label='Alertas'
        >
          <BellIcon className='h-5 w-5' />
          Alertas
        </button>
        <button
          type='button'
          onClick={() => { setMobileSheet('layers'); setChatOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            mobileSheet === 'layers' ? 'text-brand' : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label='Capas'
        >
          <Layers3Icon className='h-5 w-5' />
          Capas
        </button>
        <button
          type='button'
          onClick={() => { setMobileSheet(null); setChatOpen(true); }}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            chatOpen ? 'text-brand' : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label='Hermes IA'
        >
          <MessageCircleIcon className='h-5 w-5' />
          Hermes
        </button>
      </nav>

      {/* Mobile sheet: Alerts */}
      <Sheet
        open={mobileSheet === 'alerts'}
        onOpenChange={(open) => setMobileSheet(open ? 'alerts' : null)}
      >
        <SheetContent side='bottom' className='h-[80vh] p-0 md:hidden'>
          <SheetTitle className='px-5 pt-5 pb-3 text-base'>Alertas activas</SheetTitle>
          <AlertsPanel
            key={`mobile-${scenario}`}
            isDemo={isDemo}
            selectedCorridorName={selectedCorridorName}
            onSelectAlert={(name) => {
              setSelectedCorridorName(name);
              setMobileSheet(null);
            }}
            className='flex w-full border-0'
          />
        </SheetContent>
      </Sheet>

      {/* Mobile sheet: Hermes IA */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent
          side='right'
          showCloseButton={false}
          className='md:hidden w-full sm:max-w-none p-0 gap-0 bottom-[64px] h-auto'
        >
          <SheetTitle className='sr-only'>Hermes IA</SheetTitle>
          <ChatWidget
            open={chatOpen}
            onOpenChange={setChatOpen}
            onActionPlan={(plan) => {
              setActionPlan(plan);
              setChatOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Mobile sheet: Layers / Mode */}
      <Sheet
        open={mobileSheet === 'layers'}
        onOpenChange={(open) => setMobileSheet(open ? 'layers' : null)}
      >
        <SheetContent side='bottom' className='h-[85vh] overflow-y-auto md:hidden'>
          <SheetTitle className='text-base'>Capas y modos</SheetTitle>

          <div className='mt-4 space-y-5'>
            <div>
              <p className='pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                Datos
              </p>
              <div className='flex overflow-hidden rounded-md border border-border-subtle'>
                {DATA_MODES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setScenario(s.id);
                      if (s.id === 'demo') {
                        setViewMode('predictive');
                        setLayers(PREDICTIVE_LAYERS);
                      }
                      setSelectedCorridorName(null);
                    }}
                    className={[
                      'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                      i > 0 ? 'border-l border-border-subtle' : '',
                      scenario === s.id
                        ? 'bg-brand text-text-secondary'
                        : 'text-text-muted hover:bg-surface-raised',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className='pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                Vista
              </p>
              <div className='flex overflow-hidden rounded-md border border-border-subtle'>
                {VIEW_MODES.map((mode, index) => {
                  const disabled = isDemo && mode.id === 'realtime';
                  return (
                    <button
                      key={mode.id}
                      type='button'
                      disabled={disabled}
                      onClick={() => changeViewMode(mode.id)}
                      className={[
                        'flex-1 px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                        index > 0 ? 'border-l border-border-subtle' : '',
                        viewMode === mode.id
                          ? 'bg-brand text-text-secondary'
                          : 'text-text-muted hover:bg-surface-raised',
                      ].join(' ')}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isPredictive ? (
              <div>
                <p className='pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                  Riesgo esperado
                </p>
                <div className='flex overflow-hidden rounded-md border border-border-subtle'>
                  {HORIZONS.map((item, index) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setHorizon(item)}
                      className={[
                        'flex-1 px-3 py-2 text-sm font-medium transition-colors',
                        index > 0 ? 'border-l border-border-subtle' : '',
                        horizon === item
                          ? 'bg-brand text-text-secondary'
                          : 'text-text-muted hover:bg-surface-raised',
                      ].join(' ')}
                    >
                      {item}h
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className='pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
                {isPredictive ? 'Capas predictivas' : 'Capas en tiempo real'}
              </p>
              <div className='grid gap-1'>
                {visibleLayerLabels.map((item) => {
                  const disabled =
                    isDemo && 'currentOnly' in item && item.currentOnly === true;
                  const checked = effectiveLayers[item.id];
                  return (
                    <label
                      key={item.id}
                      className={[
                        'flex items-center gap-3 rounded-[var(--radius-xs)] px-2 py-2.5 text-sm transition-colors',
                        disabled
                          ? 'cursor-not-allowed text-text-muted/60'
                          : 'cursor-pointer text-text-primary hover:bg-surface-raised',
                      ].join(' ')}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleLayer(item.id)}
                        className='accent-brand h-4 w-4'
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

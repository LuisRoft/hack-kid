'use client';

import { useMemo, useState } from 'react';
import {
  Building2Icon,
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  HeartPulseIcon,
  ListChecksIcon,
  MessageCircleIcon,
  PackageIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react';

export type ActionPlanItem = {
  id: string;
  text: string;
  phase: 'Ahora' | 'Preparación' | 'Si empeora';
};

export type ActionPlanResource = {
  label: string;
  url: string;
  description?: string;
  kind?: 'shelter' | 'official' | 'health' | 'supply' | 'resource';
};

export type ActionPlan = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  items: ActionPlanItem[];
  resources: ActionPlanResource[];
};

function phaseTone(phase: ActionPlanItem['phase']) {
  if (phase === 'Ahora') return 'bg-[#fee2e2] text-[#991b1b]';
  if (phase === 'Si empeora') return 'bg-[#fef3c7] text-[#92400e]';
  return 'bg-surface-raised text-text-muted';
}

function resourceMeta(kind: ActionPlanResource['kind']) {
  if (kind === 'shelter') {
    return {
      label: 'Albergue',
      icon: Building2Icon,
      tone: 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]',
    };
  }
  if (kind === 'official') {
    return {
      label: 'Oficial',
      icon: ShieldCheckIcon,
      tone: 'border-[#d1d5db] bg-[#f9fafb] text-[#374151]',
    };
  }
  if (kind === 'health') {
    return {
      label: 'Salud',
      icon: HeartPulseIcon,
      tone: 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]',
    };
  }
  if (kind === 'supply') {
    return {
      label: 'Abasto',
      icon: PackageIcon,
      tone: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]',
    };
  }
  return {
    label: 'Fuente',
    icon: ExternalLinkIcon,
    tone: 'border-border-subtle bg-surface-raised text-text-muted',
  };
}

export function ActionPlanPanel({
  plan,
  onClose,
  onOpenChat,
}: {
  plan: ActionPlan;
  onClose: () => void;
  onOpenChat: () => void;
}) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = plan.items.length > 0 ? Math.round((doneCount / plan.items.length) * 100) : 0;

  const grouped = useMemo(() => {
    return plan.items.reduce<Record<ActionPlanItem['phase'], ActionPlanItem[]>>(
      (acc, item) => {
        acc[item.phase].push(item);
        return acc;
      },
      { Ahora: [], Preparación: [], 'Si empeora': [] },
    );
  }, [plan.items]);

  return (
    <aside className='pointer-events-auto absolute bottom-4 right-4 z-30 flex max-h-[calc(100%-2rem)] w-[360px] flex-col overflow-hidden rounded-md border border-border-subtle bg-surface-base shadow-xl shadow-black/15'>
      <div className='border-b border-border-subtle px-4 py-3'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-white'>
            <ListChecksIcon className='size-4' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
              Plan familiar activo
            </p>
            <h2 className='mt-0.5 text-sm font-semibold leading-snug text-text-primary'>
              {plan.title}
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary'
            aria-label='Cerrar plan'
          >
            <XIcon className='size-4' />
          </button>
        </div>
        <p className='mt-2 text-xs leading-5 text-text-muted'>{plan.summary}</p>
        <div className='mt-3'>
          <div className='flex items-center justify-between text-[11px] text-text-muted'>
            <span>{doneCount}/{plan.items.length} acciones completadas</span>
            <span>{progress}%</span>
          </div>
          <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised'>
            <div
              className='h-full rounded-full bg-brand transition-all'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3'>
        {(['Ahora', 'Preparación', 'Si empeora'] as const).map((phase) => {
          const items = grouped[phase];
          if (items.length === 0) return null;

          return (
            <section key={phase} className='mb-4 last:mb-0'>
              <div className='mb-2 flex items-center gap-2'>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${phaseTone(phase)}`}>
                  {phase}
                </span>
              </div>
              <div className='grid gap-2'>
                {items.map((item) => {
                  const checked = completed[item.id] === true;
                  return (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() =>
                        setCompleted((current) => ({
                          ...current,
                          [item.id]: !checked,
                        }))
                      }
                      className='flex items-start gap-2 rounded-md border border-border-subtle bg-surface-base px-3 py-2 text-left text-xs leading-5 transition-colors hover:bg-surface-raised'
                    >
                      {checked ? (
                        <CheckCircle2Icon className='mt-0.5 size-4 shrink-0 text-brand' />
                      ) : (
                        <CircleIcon className='mt-0.5 size-4 shrink-0 text-text-muted' />
                      )}
                      <span className={checked ? 'text-text-muted line-through' : 'text-text-primary'}>
                        {item.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {plan.resources.length > 0 ? (
          <section className='mt-4 border-t border-border-subtle pt-3'>
            <p className='mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted'>
              Recursos verificados
            </p>
            <div className='grid gap-2'>
              {plan.resources.map((resource) => {
                const meta = resourceMeta(resource.kind);
                const Icon = meta.icon;

                return (
                  <a
                    key={resource.url}
                    href={resource.url}
                    target='_blank'
                    rel='noreferrer'
                    className='group rounded-md border border-border-subtle bg-surface-base px-3 py-2.5 text-xs text-text-primary transition-colors hover:bg-surface-raised'
                  >
                    <div className='flex items-start gap-2.5'>
                      <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border ${meta.tone}`}>
                        <Icon className='size-3.5' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <span className='line-clamp-2 font-medium leading-4'>{resource.label}</span>
                          <ExternalLinkIcon className='mt-0.5 size-3.5 shrink-0 text-text-muted transition-colors group-hover:text-text-primary' />
                        </div>
                        {resource.description ? (
                          <p className='mt-1 line-clamp-2 leading-4 text-text-muted'>
                            {resource.description}
                          </p>
                        ) : null}
                        <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className='border-t border-border-subtle p-3'>
        <button
          type='button'
          onClick={onOpenChat}
          className='flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0a2d6e]'
        >
          <MessageCircleIcon className='size-4' />
          Ajustar con Hermes
        </button>
      </div>
    </aside>
  );
}

'use client'

import { useAuth } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ListChecksIcon, SendIcon, SparklesIcon, XIcon } from 'lucide-react'
import { ChatMessages } from '@/components/chat/chat-messages'
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
  ChatToolbarTextarea,
} from '@/components/chat/chat-toolbar'
import {
  PLAN_MODE_INSTRUCTION,
  forcedActionPlanFromHermesText,
} from '@/lib/action-plan'
import type { ActionPlan } from '@/components/app/action-plan-panel'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'
const CLERK_JWT_TEMPLATE = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function ChatWidget({
  open,
  onOpenChange,
  onActionPlan,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onActionPlan?: (plan: ActionPlan) => void
}) {
  const { getToken, isSignedIn } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [planMode, setPlanMode] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) abortRef.current?.abort()
    onOpenChange(next)
  }

  useEffect(() => {
    if (!open) abortRef.current?.abort()
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || busy) return

    const planModeForTurn = planMode
    const messageToSend = planModeForTurn ? `${text}${PLAN_MODE_INSTRUCTION}` : text

    setInput('')
    setBusy(true)
    if (planModeForTurn) setPlanMode(false)

    const assistantId = uid()
    setMessages(prev => [
      ...prev,
      { id: uid(), role: 'user', text },
      { id: assistantId, role: 'assistant', text: '', streaming: true },
    ])

    abortRef.current = new AbortController()

    try {
      if (!isSignedIn) {
        throw new Error('AUTH_REQUIRED')
      }

      const token = await getToken(
        CLERK_JWT_TEMPLATE ? { template: CLERK_JWT_TEMPLATE } : undefined,
      )

      if (!token) {
        throw new Error('AUTH_TOKEN_MISSING')
      }

      const res = await fetch(`${API_URL}/api/v1/agent/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend, session_id: sessionId }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(res.status === 401 ? 'AUTH_REJECTED' : `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break

          try {
            const event = JSON.parse(payload) as {
              type: string
              text?: string
              session_id?: string
            }

            if (event.type === 'text' && event.text) {
              assistantText += event.text
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, text: m.text + event.text } : m,
                ),
              )
            }

            if (event.type === 'done') {
              if (event.session_id) setSessionId(event.session_id)
              if (planModeForTurn) {
                const plan = forcedActionPlanFromHermesText(assistantText)
                if (plan) onActionPlan?.(plan)
              }
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, streaming: false } : m,
                ),
              )
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message =
        err instanceof Error && err.message.startsWith('AUTH')
          ? 'No pude autenticar tu sesión con Hermes. Cierra sesión y vuelve a entrar; si sigue pasando, revisa el JWT Template de Clerk.'
          : 'Error al conectar con el agente. Intenta de nuevo.'
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: message, streaming: false }
            : m,
        ),
      )
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const reversed = [...messages].reverse()

  return (
      <div className="w-full md:w-[400px] h-full flex flex-col md:border-l border-border bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="size-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <SparklesIcon className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-none">Hermes IA</p>
            <p className="text-xs text-muted-foreground mt-0.5">Asistente de riesgo vial</p>
          </div>
          <button
            onClick={() => handleOpenChange(false)}
            aria-label="Cerrar"
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Área de mensajes */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="size-12 rounded-2xl bg-brand/8 flex items-center justify-center">
              <SparklesIcon className="size-6 text-brand" />
            </div>
            <p className="text-sm font-semibold text-foreground">¿En qué puedo ayudarte?</p>
            <p className="text-xs leading-relaxed text-muted-foreground max-w-60">
              Pregúntame sobre alertas activas, riesgos en corredores o planes de desvío en tiempo real.
            </p>
          </div>
        ) : (
          <ChatMessages className="px-3 gap-2">
            {reversed.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </ChatMessages>
        )}

        {/* Input */}
        <ChatToolbar>
          {planMode ? (
            <ChatToolbarAddon align="block-start" className="w-full h-auto">
              <div className="flex w-full items-center justify-between gap-2 rounded-md bg-brand/8 px-2.5 py-1.5 text-[11px] text-brand">
                <span className="flex items-center gap-1.5 font-medium">
                  <ListChecksIcon className="size-3.5" />
                  Modo plan de acción activo · tu próximo mensaje genera el plan
                </span>
                <button
                  type="button"
                  onClick={() => setPlanMode(false)}
                  className="text-[11px] font-medium underline-offset-2 hover:underline"
                >
                  Cancelar
                </button>
              </div>
            </ChatToolbarAddon>
          ) : null}
          <ChatToolbarAddon align="inline-start">
            <ChatToolbarButton
              onClick={() => setPlanMode(v => !v)}
              aria-label="Activar modo plan de acción"
              aria-pressed={planMode}
              title="Generar plan de acción con la siguiente respuesta"
              className={planMode ? 'bg-brand/10 text-brand hover:bg-brand/15' : ''}
            >
              <ListChecksIcon />
            </ChatToolbarButton>
          </ChatToolbarAddon>
          <ChatToolbarTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onSubmit={sendMessage}
            placeholder={planMode ? 'Describe tu situación y genero el plan…' : 'Escribe un mensaje…'}
            disabled={busy}
          />
          <ChatToolbarAddon align="inline-end">
            <ChatToolbarButton
              onClick={sendMessage}
              disabled={!input.trim() || busy}
              aria-label="Enviar mensaje"
              className={input.trim() && !busy ? 'text-brand hover:bg-brand/8' : ''}
            >
              <SendIcon />
            </ChatToolbarButton>
          </ChatToolbarAddon>
        </ChatToolbar>
      </div>
  )
}

// ── Render markdown ligero ────────────────────────────────────────────────────
// Renderiza negritas, listas, enlaces y párrafos sin exponer markdown crudo.

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex =
    /\*\*([^*\n]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)/g
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1]) {
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>)
    } else if (match[2] && match[3]) {
      parts.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 break-words"
        >
          {match[2]}
        </a>,
      )
    } else if (match[4]) {
      const url = match[4].replace(/[).,;]+$/, '')
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 break-all"
        >
          {url.replace(/^https?:\/\//, '').replace(/^www\./, '').slice(0, 50)}
        </a>,
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function MarkdownText({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')

  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listItems.length === 0) return
    const items = listItems
    if (listType === 'ol') {
      blocks.push(
        <ol key={blocks.length} className="list-decimal pl-5 space-y-1 my-1.5">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>,
      )
    } else {
      blocks.push(
        <ul key={blocks.length} className="list-disc pl-5 space-y-1 my-1.5">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
    }
    listItems = []
    listType = null
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    const ul = line.match(/^\s*[-*•]\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(ol[1])
      continue
    }
    if (ul) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(ul[1])
      continue
    }
    flushList()
    if (line.trim().length === 0) {
      if (blocks.length > 0) blocks.push(<div key={blocks.length} className="h-1.5" />)
      continue
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={blocks.length} className="font-semibold mt-1.5 mb-0.5">
          {renderInline(heading[1])}
        </p>,
      )
      continue
    }
    blocks.push(
      <p key={blocks.length} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    )
  }
  flushList()

  return <div className="space-y-0.5">{blocks}</div>
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-start' : 'justify-end'}`}>

      {/* Avatar usuario (izquierda) */}
      {isUser && (
        <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0 mb-0.5">
          T
        </div>
      )}

      {/* Burbuja */}
      <div
        className={[
          'max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'bg-muted text-foreground rounded-2xl rounded-bl-sm whitespace-pre-wrap'
            : 'bg-brand text-white rounded-2xl rounded-br-sm [&_a]:text-white [&_a]:decoration-white/60',
        ].join(' ')}
      >
        {isUser ? (
          message.text
        ) : message.streaming && !message.text ? (
          /* Indicador de typing antes de recibir el primer chunk */
          <span className="flex gap-1 items-center py-0.5 px-1">
            <span className="size-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:160ms]" />
            <span className="size-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:320ms]" />
          </span>
        ) : (
          <MarkdownText text={message.text} />
        )}
      </div>

      {/* Avatar bot (derecha) */}
      {!isUser && (
        <div className="size-7 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-white shrink-0 mb-0.5">
          H
        </div>
      )}
    </div>
  )
}

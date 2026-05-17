'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircleIcon, SendIcon, SparklesIcon, XIcon } from 'lucide-react'
import { ChatMessages } from '@/components/chat/chat-messages'
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
  ChatToolbarTextarea,
} from '@/components/chat/chat-toolbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function ChatWidget({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) abortRef.current?.abort()
    onOpenChange(next)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || busy) return

    setInput('')
    setBusy(true)

    const assistantId = uid()
    setMessages(prev => [
      ...prev,
      { id: uid(), role: 'user', text },
      { id: assistantId, role: 'assistant', text: '', streaming: true },
    ])

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`${API_URL}/api/v1/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

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
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, text: m.text + event.text } : m,
                ),
              )
            }

            if (event.type === 'done') {
              if (event.session_id) setSessionId(event.session_id)
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
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: 'Error al conectar con el agente. Intenta de nuevo.', streaming: false }
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
    <>
      {/* Tab trigger — siempre visible, actúa como toggle y se desplaza con el panel */}
      <button
        aria-label={open ? 'Cerrar asistente Hermes IA' : 'Abrir asistente Hermes IA'}
        onClick={() => handleOpenChange(!open)}
        className="
          fixed top-1/2 -translate-y-1/2 z-50
          flex flex-col items-center gap-2
          bg-brand text-white
          px-2.5 py-5
          rounded-l-xl
          shadow-lg shadow-brand/25
          hover:bg-[#0a2d6e]
          transition-[right,background-color] duration-300 ease-in-out
          border-y border-l border-white/10
          cursor-pointer
        "
        style={{ right: open ? 400 : 0 }}
      >
        <MessageCircleIcon className="size-[18px]" />
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
        >
          Hermes IA
        </span>
      </button>

      {/* Panel — renderizado dentro del contenedor del layout en AppShell */}
      <div className="w-[400px] h-full flex flex-col border-l border-border bg-background">
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
          <ChatToolbarTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onSubmit={sendMessage}
            placeholder="Escribe un mensaje…"
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
    </>
  )
}

// ── Typewriter ────────────────────────────────────────────────────────────────

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    setCursor(0)
  }, [])

  useEffect(() => {
    if (cursor >= text.length) return
    const id = setTimeout(() => setCursor(c => Math.min(c + 4, text.length)), 12)
    return () => clearTimeout(id)
  }, [cursor, text])

  // When no longer streaming and cursor hasn't caught up yet, jump to end
  useEffect(() => {
    if (!active && cursor < text.length) setCursor(text.length)
  }, [active, cursor, text.length])

  return <>{text.slice(0, cursor)}</>
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
          'max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
            : 'bg-brand text-white rounded-2xl rounded-br-sm',
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
          <TypewriterText text={message.text} active={!!message.streaming} />
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

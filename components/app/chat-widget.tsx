'use client'

import { useRef, useState } from 'react'
import { MessageCircleIcon, SendIcon, SparklesIcon, XIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Chat } from '@/components/chat/chat'
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderAvatar,
  ChatHeaderButton,
  ChatHeaderMain,
} from '@/components/chat/chat-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventAvatar,
  ChatEventBody,
  ChatEventContent,
} from '@/components/chat/chat-event'
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

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) abortRef.current?.abort()
    setOpen(next)
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

  // ChatMessages usa flex-col-reverse: DOM en orden inverso para que
  // el mensaje más nuevo quede visualmente abajo
  const reversed = [...messages].reverse()

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>

      {/* Trigger: tab pegado al borde derecho, centrado verticalmente */}
      <SheetTrigger asChild>
        <button
          aria-label="Abrir asistente Hermes IA"
          className="
            fixed right-0 top-1/2 -translate-y-1/2 z-50
            flex flex-col items-center gap-2
            bg-brand text-white
            px-2.5 py-5
            rounded-l-xl
            shadow-lg shadow-brand/25
            hover:bg-[#0a2d6e]
            transition-all duration-200
            border-y border-l border-white/10
          "
        >
          <MessageCircleIcon className="size-[18px]" />
          <span
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            Hermes IA
          </span>
        </button>
      </SheetTrigger>

      {/* Panel lateral derecho */}
      <SheetContent
        side="right"
        showCloseButton={false}
        className="p-0 w-[400px] sm:max-w-[400px]"
      >
        {/* Título accesible oculto visualmente */}
        <SheetTitle className="sr-only">Hermes IA — Asistente de riesgo vial</SheetTitle>

        <Chat className="h-full">

          {/* Header */}
          <ChatHeader className="border-b px-3 py-2.5">
            <ChatHeaderAddon>
              <ChatHeaderAvatar
                fallback="H"
                className="bg-brand text-white text-xs font-bold"
              />
            </ChatHeaderAddon>
            <ChatHeaderMain>
              <div>
                <p className="text-sm font-semibold leading-none">Hermes IA</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Asistente de riesgo vial
                </p>
              </div>
            </ChatHeaderMain>
            <ChatHeaderAddon>
              <ChatHeaderButton
                onClick={() => handleOpenChange(false)}
                aria-label="Cerrar panel"
              >
                <XIcon />
              </ChatHeaderButton>
            </ChatHeaderAddon>
          </ChatHeader>

          {/* Estado vacío o mensajes */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <div className="size-12 rounded-full bg-brand/8 flex items-center justify-center">
                <SparklesIcon className="size-6 text-brand" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                ¿En qué puedo ayudarte?
              </p>
              <p className="text-xs leading-relaxed max-w-60">
                Pregúntame sobre alertas activas, riesgos en corredores o planes de desvío en tiempo real.
              </p>
            </div>
          ) : (
            <ChatMessages>
              {reversed.map(msg => (
                <ChatEvent
                  key={msg.id}
                  className="hover:bg-muted/40 rounded-md py-1"
                >
                  <ChatEventAddon>
                    <ChatEventAvatar
                      fallback={msg.role === 'user' ? 'T' : 'H'}
                      className={
                        msg.role === 'assistant'
                          ? 'bg-brand text-white text-xs font-bold'
                          : ''
                      }
                    />
                  </ChatEventAddon>
                  <ChatEventBody>
                    <p className="text-sm font-semibold leading-none mb-1">
                      {msg.role === 'user' ? 'Tú' : 'Hermes'}
                    </p>
                    <ChatEventContent>
                      {msg.streaming && !msg.text ? (
                        <span className="text-muted-foreground animate-pulse">
                          Pensando…
                        </span>
                      ) : (
                        msg.text
                      )}
                    </ChatEventContent>
                  </ChatEventBody>
                </ChatEvent>
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

        </Chat>
      </SheetContent>
    </Sheet>
  )
}

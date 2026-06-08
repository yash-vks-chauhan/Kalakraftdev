"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Pusher, { type Channel } from "pusher-js"

import type { ChatAttachment, ChatMessage } from "./SupportChatThread"

type Role = "customer" | "agent"
type TicketStatus = "open" | "pending" | "closed"

interface RawAttachment extends ChatAttachment {
  mimeType?: string
}

interface RawMessage {
  id: string
  sender: "agent" | "customer"
  content: string
  createdAt: string
  attachments?: RawAttachment[]
  pending?: boolean
  delivered?: boolean
}

interface TicketMeta {
  id: string
  subject: string
  message: string
  status: TicketStatus
  email: string
  name?: string
  createdAt: string
}

interface SystemEvent {
  id: string
  content: string
  createdAt: string
}

interface UseSupportThreadOptions {
  id: string
  token: string | null
  role: Role
  /** Enforce 3MB / 1080p image limits before upload (customer side). */
  enforceImageLimits?: boolean
}

const MAX_ATTACHMENTS = 4
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024
const MAX_DIMENSION = 1080
const PRESENCE_WINDOW_MS = 40_000
const SEEN_HEARTBEAT_MS = 25_000

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function useSupportThread({
  id,
  token,
  role,
  enforceImageLimits = false,
}: UseSupportThreadOptions) {
  const [ticket, setTicket] = useState<TicketMeta | null>(null)
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([])
  const [value, setValue] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<TicketStatus>("open")
  const [theirTyping, setTheirTyping] = useState(false)
  const [online, setOnline] = useState(false)
  const [seen, setSeen] = useState(false)

  const channelRef = useRef<Channel | null>(null)
  const lastTypingSent = useRef(0)
  const lastSeenSent = useRef(0)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const presenceTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastMyMessageAt = useRef(0)

  const buildInitial = useCallback((meta: TicketMeta, raw: RawMessage[]): RawMessage[] => {
    return [
      {
        id: "ticket-root",
        sender: "customer",
        content: meta.message,
        createdAt: meta.createdAt,
        delivered: true,
      },
      ...raw.map((m) => ({ ...m, delivered: true })),
    ]
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Unable to load ticket (${res.status})`)
      const data = await res.json()
      const meta: TicketMeta = {
        id: data.id,
        subject: data.subject,
        message: data.message,
        status: data.status,
        email: data.email,
        name: data.name,
        createdAt: data.createdAt,
      }
      setTicket(meta)
      setStatus(data.status)
      setMessages(buildInitial(meta, data.messages || []))
    } catch (err: any) {
      setError(err.message || "Failed to load ticket.")
    }
  }, [id, token, buildInitial])

  const markPresence = useCallback(() => {
    setOnline(true)
    if (presenceTimeout.current) clearTimeout(presenceTimeout.current)
    presenceTimeout.current = setTimeout(() => setOnline(false), PRESENCE_WINDOW_MS)
  }, [])

  const emitSeen = useCallback(() => {
    const channel = channelRef.current
    const now = Date.now()
    if (!channel || now - lastSeenSent.current < 3000) return
    try {
      channel.trigger("client-seen", { from: role, at: now })
      lastSeenSent.current = now
    } catch {
      /* socket not ready yet */
    }
  }, [role])

  const addOrReconcile = useCallback((incoming: RawMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev
      const idx = prev.findIndex(
        (m) => m.pending && m.sender === incoming.sender && m.content === incoming.content
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...incoming, delivered: true }
        return copy
      }
      return [...prev, { ...incoming, delivered: true }]
    })
  }, [])

  // ---- Realtime subscription -------------------------------------------------
  useEffect(() => {
    if (!token) return
    load()

    // @ts-ignore
    Pusher.logToConsole = false
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/support/pusher-auth",
        transport: "ajax",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    })
    const channel = pusherClient.subscribe(`private-support-ticket-${id}`)
    channelRef.current = channel

    channel.bind("pusher:subscription_succeeded", () => emitSeen())

    channel.bind("new-message", (data: { message: RawMessage }) => {
      addOrReconcile(data.message)
      // Their message implies they're here; if we're visible, ack the read.
      if (data.message.sender !== role) {
        markPresence()
        setTheirTyping(false)
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          lastSeenSent.current = 0
          emitSeen()
        }
      }
    })

    channel.bind("status-changed", (data: { status: string }) => {
      const next = data.status as TicketStatus
      setTicket((prev) => {
        if (prev && prev.status !== next) {
          setSystemEvents((ev) => [
            ...ev,
            {
              id: `sys-${Date.now()}`,
              content: `Ticket marked as ${next}`,
              createdAt: new Date().toISOString(),
            },
          ])
        }
        return prev ? { ...prev, status: next } : prev
      })
      setStatus(next)
    })

    channel.bind("client-typing", (data: { from: Role }) => {
      if (data.from === role) return
      setTheirTyping(true)
      markPresence()
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setTheirTyping(false), 2600)
    })

    channel.bind("client-seen", (data: { from: Role; at?: number }) => {
      if (data.from === role) return
      markPresence()
      if (lastMyMessageAt.current > 0) setSeen(true)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`private-support-ticket-${id}`)
      channelRef.current = null
      pusherClient.disconnect()
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      if (presenceTimeout.current) clearTimeout(presenceTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, role])

  // ---- Seen heartbeat while the tab is visible -------------------------------
  useEffect(() => {
    if (!token) return
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastSeenSent.current = 0
        emitSeen()
      }
    }
    window.addEventListener("focus", onVisible)
    document.addEventListener("visibilitychange", onVisible)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") emitSeen()
    }, SEEN_HEARTBEAT_MS)
    return () => {
      window.removeEventListener("focus", onVisible)
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(interval)
    }
  }, [token, emitSeen])

  // ---- Composer actions ------------------------------------------------------
  const sendTyping = useCallback(() => {
    const channel = channelRef.current
    const now = Date.now()
    if (!channel || now - lastTypingSent.current < 1500) return
    try {
      channel.trigger("client-typing", { from: role })
      lastTypingSent.current = now
    } catch {
      /* socket not ready */
    }
  }, [role])

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null)
      const remaining = MAX_ATTACHMENTS - files.length
      if (remaining <= 0) {
        setError(`You can attach up to ${MAX_ATTACHMENTS} images.`)
        return
      }
      const accepted: File[] = []
      for (const file of incoming.slice(0, remaining)) {
        try {
          if (!file.type.startsWith("image/"))
            throw new Error("Only image attachments are allowed.")
          if (enforceImageLimits) {
            if (file.size > MAX_FILE_SIZE_BYTES)
              throw new Error("Each image must be 3MB or smaller.")
            const { width, height } = await getImageDimensions(file)
            if (width > MAX_DIMENSION || height > MAX_DIMENSION)
              throw new Error("Images must be at most 1080p.")
          }
          accepted.push(file)
        } catch (err: any) {
          setError(err.message || "Invalid image selected.")
        }
      }
      if (accepted.length) setFiles((prev) => [...prev, ...accepted])
    },
    [files.length, enforceImageLimits]
  )

  const removeFile = useCallback(
    (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    []
  )

  const send = useCallback(async () => {
    const text = value.trim()
    const outgoing = files
    if ((!text && outgoing.length === 0) || !token) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const localAttachments: RawAttachment[] = outgoing.map((f) => ({
      url: URL.createObjectURL(f),
      type: "image",
      name: f.name,
    }))
    const optimistic: RawMessage = {
      id: tempId,
      sender: role,
      content: text,
      createdAt: new Date().toISOString(),
      pending: true,
      attachments: localAttachments,
    }

    setMessages((prev) => [...prev, optimistic])
    lastMyMessageAt.current = Date.now()
    setSeen(false)
    setValue("")
    setFiles([])
    setSending(true)
    setError(null)

    try {
      const attachments: RawAttachment[] = []
      for (const file of outgoing) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/support/attachments", {
          method: "POST",
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload image.")
        attachments.push(data as RawAttachment)
      }

      const endpoint =
        role === "agent"
          ? `/api/admin/support/ticket/${id}/reply`
          : `/api/support/ticket/${id}`
      const body =
        role === "agent"
          ? { reply: text, attachments, status }
          : { content: text, attachments }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to send message.")

      if (data.message) {
        addOrReconcile(data.message as RawMessage)
        setMessages((prev) => prev.filter((m) => m.id !== tempId || !m.pending))
      } else {
        // No echo payload — mark the optimistic bubble as delivered.
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, delivered: true } : m))
        )
      }
    } catch (err: any) {
      setError(err.message || "Failed to send message.")
      // Restore the draft and drop the failed optimistic bubble.
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setValue((v) => v || text)
      setFiles(outgoing)
    } finally {
      setSending(false)
    }
  }, [value, files, token, role, id, status, addOrReconcile])

  // ---- Derived items for the view -------------------------------------------
  const items: ChatMessage[] = [
    ...messages.map<ChatMessage>((m) => ({
      id: m.id,
      kind: "message",
      side: m.sender === role ? "me" : "them",
      content: m.content,
      createdAt: m.createdAt,
      attachments: m.attachments,
      pending: m.pending,
      delivered: m.delivered,
    })),
    ...systemEvents.map<ChatMessage>((e) => ({
      id: e.id,
      kind: "system",
      content: e.content,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return {
    ticket,
    items,
    loading: ticket === null,
    error,
    // composer
    value,
    setValue,
    files,
    addFiles,
    removeFile,
    send,
    sending,
    sendTyping,
    // realtime signals
    theirTyping,
    online,
    seen,
    // status (agent)
    status,
    setStatus,
    reload: load,
  }
}

"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  Paperclip,
  Send,
  X,
  CheckCheck,
  Clock,
  Loader2,
  ArrowDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type ChatAttachment = {
  url: string
  type?: string
  mimeType?: string
  name?: string
}

export type ChatMessage = {
  id: string
  /** "message" renders a bubble; "system" renders a centered timeline note. */
  kind?: "message" | "system"
  /** "me" renders right-aligned; "them" renders left with an avatar. */
  side?: "me" | "them"
  content: string
  createdAt: string
  attachments?: ChatAttachment[]
  /** Optimistic message still in flight. */
  pending?: boolean
  /** Confirmed by the server. */
  delivered?: boolean
}

export interface ChatComposerConfig {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onTyping?: () => void
  files: File[]
  onAddFiles: (files: File[]) => void
  onRemoveFile: (index: number) => void
  loading?: boolean
  error?: string | null
  placeholder?: string
  helperText?: string
  sendLabel?: string
  accept?: string
}

interface SupportChatThreadProps {
  messages: ChatMessage[]
  theirName: string
  theirInitials: string
  startChip?: ReactNode
  typing?: boolean
  typingLabel?: string
  /** Show a "Seen" receipt under the last outgoing message. */
  seen?: boolean
  composer?: ChatComposerConfig
  closedNotice?: ReactNode
  className?: string
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function dayKey(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(value) === dayKey(today.toISOString())) return "Today"
  if (dayKey(value) === dayKey(yesterday.toISOString())) return "Yesterday"
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  })
}

type Row =
  | { type: "day"; id: string; label: string }
  | { type: "system"; id: string; content: string; createdAt: string }
  | {
      type: "message"
      msg: ChatMessage
      isFirst: boolean
      isLast: boolean
    }

/** Build a flat render list: day dividers + system notes + grouped messages. */
function buildRows(messages: ChatMessage[]): Row[] {
  const rows: Row[] = []
  let prevDay: string | null = null

  messages.forEach((m, i) => {
    const day = dayKey(m.createdAt)
    if (day !== prevDay) {
      rows.push({ type: "day", id: `day-${day}-${m.id}`, label: dayLabel(m.createdAt) })
      prevDay = day
    }
    if (m.kind === "system") {
      rows.push({ type: "system", id: m.id, content: m.content, createdAt: m.createdAt })
      return
    }
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const samePrev =
      prev &&
      prev.kind !== "system" &&
      prev.side === m.side &&
      dayKey(prev.createdAt) === day
    const sameNext =
      next &&
      next.kind !== "system" &&
      next.side === m.side &&
      dayKey(next.createdAt) === day
    rows.push({ type: "message", msg: m, isFirst: !samePrev, isLast: !sameNext })
  })

  return rows
}

function Attachments({ attachments }: { attachments?: ChatAttachment[] }) {
  const valid = (attachments || []).filter((att) => att?.url)
  if (valid.length === 0) return null

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {valid.map((att, idx) => {
        const isImage = (att.type || att.mimeType || "").startsWith("image")
        return isImage ? (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/att block overflow-hidden rounded-xl border bg-background/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={att.url}
              alt={att.name || "Attachment"}
              loading="lazy"
              className="h-36 w-36 object-cover transition-transform duration-200 group-hover/att:scale-[1.03] sm:h-40 sm:w-40"
            />
          </a>
        ) : (
          <video
            key={idx}
            src={att.url}
            controls
            className="h-36 w-48 rounded-xl border bg-background/40 object-cover"
          />
        )
      })}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

export function SupportChatThread({
  messages,
  theirName,
  theirInitials,
  startChip,
  typing = false,
  typingLabel,
  seen = false,
  composer,
  closedNotice,
  className,
}: SupportChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevCountRef = useRef(0)
  const [atBottom, setAtBottom] = useState(true)
  const [unread, setUnread] = useState(0)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" })
    setUnread(0)
  }

  useLayoutEffect(() => {
    scrollToBottom("auto")
    prevCountRef.current = messages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const added = messages.length - prevCountRef.current
    prevCountRef.current = messages.length
    if (added <= 0) return
    const last = messages[messages.length - 1]
    const mine = last?.kind !== "system" && last?.side === "me"
    if (mine || atBottom) scrollToBottom()
    else setUnread((u) => u + added)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  useEffect(() => {
    if (typing && atBottom) scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const bottom = distance < 80
    setAtBottom(bottom)
    if (bottom) setUnread(0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!composer) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (composer.loading) return
      composer.onSubmit()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!composer || !e.target.files) return
    composer.onAddFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  const canSend =
    !!composer &&
    !composer.loading &&
    (composer.value.trim().length > 0 || composer.files.length > 0)

  const rows = buildRows(messages)

  // Last outgoing message, for the "Seen" receipt.
  let lastMeId: string | null = null
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.kind !== "system" && m.side === "me") {
      lastMeId = m.id
      break
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Conversation */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto bg-muted/20 px-4 py-5 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col">
            {startChip && (
              <div className="mb-4 flex justify-center">
                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  {startChip}
                </span>
              </div>
            )}

            {rows.map((row) => {
              if (row.type === "day") {
                return <DayDivider key={row.id} label={row.label} />
              }
              if (row.type === "system") {
                return (
                  <div key={row.id} className="my-2 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {row.content} · {formatTime(row.createdAt)}
                    </span>
                  </div>
                )
              }

              const { msg, isFirst, isLast } = row
              const isMe = msg.side === "me"
              const showSeen = isMe && seen && msg.id === lastMeId && !msg.pending

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={cn(
                    "flex w-full items-end gap-2",
                    isMe ? "justify-end" : "justify-start",
                    isFirst ? "mt-3" : "mt-[3px]"
                  )}
                >
                  {!isMe && (
                    <div className="w-7 shrink-0 self-end">
                      {isLast && (
                        <Avatar className="h-7 w-7 border">
                          <AvatarFallback className="bg-secondary text-[10px] font-medium text-foreground">
                            {theirInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[80%] flex-col sm:max-w-[66%]",
                      isMe ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed transition-opacity",
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "border bg-card text-card-foreground",
                        // Tail on the last bubble of a run for a grouped, chat feel.
                        isLast && (isMe ? "rounded-br-md" : "rounded-bl-md"),
                        msg.pending && "opacity-70"
                      )}
                    >
                      {msg.content && (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      <Attachments attachments={msg.attachments} />
                    </div>

                    {isLast && (
                      <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe &&
                          (msg.pending ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <CheckCheck
                              className={cn("h-3 w-3", showSeen && "text-primary")}
                            />
                          ))}
                        {showSeen && <span className="font-medium text-primary">Seen</span>}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            <AnimatePresence>
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mt-3 flex items-end gap-2"
                >
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="bg-secondary text-[10px] font-medium text-foreground">
                      {theirInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={endRef} className="h-1" />
          </div>
        </div>

        {/* Jump-to-latest pill */}
        <AnimatePresence>
          {!atBottom && unread > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-colors hover:bg-accent"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              {unread} new {unread === 1 ? "message" : "messages"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer / closed notice */}
      {composer ? (
        <div className="shrink-0 border-t bg-background px-3 py-3 sm:px-4">
          <div className="mx-auto w-full max-w-2xl">
            {composer.error && (
              <p className="mb-2 px-1 text-xs font-medium text-destructive">
                {composer.error}
              </p>
            )}

            {composer.files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 px-1">
                {composer.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => composer.onRemoveFile(idx)}
                      aria-label={`Remove ${file.name}`}
                      className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (canSend) composer.onSubmit()
              }}
            >
              {/* Single rounded input pill: attach · field · send */}
              <div className="flex items-end gap-1 rounded-[22px] border bg-background py-1 pl-1 pr-1 shadow-sm transition-colors focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/30">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={composer.accept ?? "image/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Attach images"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={composer.loading}
                  className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                </Button>

                <Textarea
                  value={composer.value}
                  onChange={(e) => {
                    composer.onChange(e.target.value)
                    composer.onTyping?.()
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={composer.placeholder ?? "Write a message…"}
                  rows={1}
                  disabled={composer.loading}
                  className="max-h-32 min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
                />

                <Button
                  type="submit"
                  size="icon"
                  aria-label={composer.sendLabel ?? "Send message"}
                  disabled={!canSend}
                  className="h-9 w-9 shrink-0 rounded-full transition-transform active:scale-95"
                >
                  {composer.loading ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <Send className="h-[18px] w-[18px]" />
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-1.5 px-2 text-[11px] text-muted-foreground">
              {composer.helperText ?? "Press Enter to send · Shift + Enter for a new line"}
            </p>
          </div>
        </div>
      ) : (
        closedNotice && (
          <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-2xl">{closedNotice}</div>
          </div>
        )
      )}
    </div>
  )
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

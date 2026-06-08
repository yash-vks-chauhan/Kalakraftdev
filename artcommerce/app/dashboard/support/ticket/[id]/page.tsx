"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, CheckCircle2, Plus } from "lucide-react"

import { useAuth } from "../../../../contexts/AuthContext"
import { SupportChatThread } from "../../../../components/support/SupportChatThread"
import { SupportStatusBadge } from "../../../../components/support/SupportStatusBadge"
import { useSupportThread } from "../../../../components/support/useSupportThread"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SUPPORT_NAME = "Kalakraft Support"
const SUPPORT_INITIALS = "KK"

export default function TicketThread() {
  const { id } = useParams() as { id: string }
  const { token } = useAuth()

  const thread = useSupportThread({ id, token, role: "customer", enforceImageLimits: true })
  const { ticket } = thread

  if (!ticket) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isClosed = ticket.status === "closed"
  const presence = thread.theirTyping
    ? "Support is typing…"
    : thread.online
    ? "Support is online now"
    : "Typically replies within a few hours"

  return (
    <main className="flex h-[calc(100dvh-7rem)] flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
      <header className="flex shrink-0 items-start gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0 text-muted-foreground"
          aria-label="Back to support"
        >
          <Link href="/dashboard/support">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {ticket.subject}
            </h1>
            <SupportStatusBadge status={ticket.status} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                thread.online ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            {presence}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
        <SupportChatThread
          messages={thread.items}
          theirName={SUPPORT_NAME}
          theirInitials={SUPPORT_INITIALS}
          typing={thread.theirTyping}
          seen={thread.seen}
          startChip={`Ticket opened on ${new Date(ticket.createdAt).toLocaleDateString(
            undefined,
            { dateStyle: "long" }
          )}`}
          composer={
            isClosed
              ? undefined
              : {
                  value: thread.value,
                  onChange: thread.setValue,
                  onSubmit: thread.send,
                  onTyping: thread.sendTyping,
                  files: thread.files,
                  onAddFiles: thread.addFiles,
                  onRemoveFile: thread.removeFile,
                  loading: thread.sending,
                  error: thread.error,
                  placeholder: "Write a reply to our team…",
                  helperText:
                    "Up to 4 images · 3MB each · Press Enter to send, Shift + Enter for a new line",
                }
          }
          closedNotice={
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-foreground">
                    This conversation is closed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Still need a hand? We&apos;re happy to pick things back up.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/dashboard/support/new">
                  <Plus className="h-4 w-4" />
                  New ticket
                </Link>
              </Button>
            </div>
          }
        />
      </div>
    </main>
  )
}

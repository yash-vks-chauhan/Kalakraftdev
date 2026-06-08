"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"

import { useAuth } from "../../../../contexts/AuthContext"
import { SupportChatThread } from "../../../../components/support/SupportChatThread"
import { useSupportThread } from "../../../../components/support/useSupportThread"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function initialsOf(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function TicketDetailPage() {
  const { id } = useParams() as { id: string }
  const { token } = useAuth()

  const thread = useSupportThread({ id, token, role: "agent" })
  const { ticket } = thread

  if (!ticket) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const firstName = ticket.name?.split(" ")[0] || "the customer"
  const statusWillChange = thread.status !== ticket.status
  const presence = thread.theirTyping
    ? `${firstName} is typing…`
    : thread.online
    ? `${firstName} is online now`
    : "Offline · they'll get your reply by email"

  return (
    <main className="flex h-[calc(100dvh-7rem)] flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label="Back to all tickets"
          >
            <Link href="/dashboard/admin/support">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10 shrink-0 border">
            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
              {initialsOf(ticket.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-semibold tracking-tight">
              {ticket.subject}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  thread.online ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
              <span className="truncate font-medium text-foreground/80">{ticket.name}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="truncate">{presence}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select
            value={thread.status}
            onValueChange={(v) => thread.setStatus(v as "open" | "pending" | "closed")}
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
        <SupportChatThread
          messages={thread.items}
          theirName={ticket.name || "Customer"}
          theirInitials={initialsOf(ticket.name)}
          typing={thread.theirTyping}
          seen={thread.seen}
          startChip={`Ticket opened on ${new Date(ticket.createdAt).toLocaleDateString(
            undefined,
            { dateStyle: "long" }
          )}`}
          composer={{
            value: thread.value,
            onChange: thread.setValue,
            onSubmit: thread.send,
            onTyping: thread.sendTyping,
            files: thread.files,
            onAddFiles: thread.addFiles,
            onRemoveFile: thread.removeFile,
            loading: thread.sending,
            error: thread.error,
            placeholder: `Reply to ${firstName}…`,
            sendLabel: "Send reply",
            helperText: statusWillChange
              ? `Sending this reply will mark the ticket as “${thread.status}”.`
              : "Press Enter to send · Shift + Enter for a new line · Up to 4 images",
          }}
        />
      </div>
    </main>
  )
}

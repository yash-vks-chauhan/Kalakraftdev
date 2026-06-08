"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { SupportTicketForm } from "../../../components/support/SupportTicketForm"
import { Button } from "@/components/ui/button"

export default function NewTicketPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex items-start gap-3">
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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">How can we help?</h1>
          <p className="text-sm text-muted-foreground">
            Tell us what&apos;s going on and a real person on our team will reply —
            usually within a few hours.
          </p>
        </div>
      </header>

      <SupportTicketForm redirectBase="/dashboard/support/ticket" />
    </main>
  )
}

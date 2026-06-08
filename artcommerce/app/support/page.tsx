"use client"

import { SupportTicketForm } from "../components/support/SupportTicketForm"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-muted/20 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How can we help?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Tell us what&apos;s going on and we&apos;ll make it right. A real person on
            our team will reply — usually within a few hours.
          </p>
        </header>

        <SupportTicketForm redirectBase="/support/ticket" />
      </div>
    </div>
  )
}

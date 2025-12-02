// File: app/support/ticket/[id]/page.tsx
"use client"

import { useState, useEffect, FormEvent } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"

type Message = { id:string; sender:"agent"|"customer"; content:string; createdAt:string }
type Ticket = { id:string; subject:string; message:string; status:string; email:string; messages:Message[] }

export default function TicketThread() {
  const { id } = useParams()
  const { token } = useAuth()
  const [ticket, setTicket] = useState<Ticket|null>(null)
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // fetch thread
  const load = async () => {
    if (!token) {
      setError("Please sign in to view this ticket.")
      return
    }
    const res = await fetch(`/api/support/ticket/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setTicket(await res.json())
      setError(null)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error || "Unable to load ticket.")
    }
  }

  useEffect(() => { load() }, [id, token])

  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault()
    if (!reply || !token) return
    setLoading(true)
    const res = await fetch(`/api/support/ticket/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: reply }),
    })
    setLoading(false)
    if (res.ok) {
      setReply("")
      load()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error || "Failed to send reply")
    }
  }

  if (error && !ticket) return <p className="p-4 text-red-600">{error}</p>
  if (!ticket) return <p>Loading…</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-2">{ticket.subject}</h1>
      <p className="mb-4"><strong>Status:</strong> {ticket.status}</p>

      <div className="space-y-3 mb-6">
        <div className="p-4 bg-gray-100 rounded">
          <strong>You:</strong> {ticket.message}
        </div>
        {ticket.messages.map(msg => (
          <div
            key={msg.id}
            className={`p-4 rounded ${
              msg.sender==="agent"?"bg-blue-50":"bg-gray-50"
            }`}
          >
            <strong>{msg.sender==="agent"?"Support":"You"}:</strong> {msg.content}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder="Type your message…"
          rows={4}
          className="w-full border rounded p-2"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {loading ? "Sending…" : "Send Reply"}
        </button>
      </form>
    </div>
  )
}

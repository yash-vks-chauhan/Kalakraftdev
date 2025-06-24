// File: app/dashboard/admin/support/[id]/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  sender: "agent" | "customer";
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  createdAt: string;
  messages: Message[];
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<"open" | "pending" | "closed">("open");
  const [error, setError] = useState<string | null>(null);

  // Load ticket + messages
  const loadTicket = async () => {
    try {
      const res = await fetch(`/api/support/ticket/${id}`);
      if (!res.ok) throw new Error(`Unable to fetch ticket (${res.status})`);
      const data: Ticket = await res.json();
      setTicket(data);
      setStatus(data.status);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load ticket.");
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  // Handle admin reply
  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/support/ticket/${ticket.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reply, status })
        }
      );

      if (!res.ok) {
        // Try to parse JSON error, fallback to text
        const contentType = res.headers.get("content-type") || "";
        const errBody = contentType.includes("application/json")
          ? await res.json()
          : await res.text();
        throw new Error(
          typeof errBody === "object" ? JSON.stringify(errBody) : errBody
        );
      }

      setReply("");
      await loadTicket();
    } catch (err: any) {
      console.error("Reply failed", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) {
    return <p>Loading ticket…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">{ticket.subject}</h1>
      <p className="text-sm text-gray-600 mb-4">
        <strong>Status:</strong> {ticket.status} |{" "}
        <strong>From:</strong> {ticket.name} ({ticket.email}) |{" "}
        <strong>Created:</strong>{" "}
        {new Date(ticket.createdAt).toLocaleString("en-GB")}
      </p>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Conversation</h2>
        <ul className="space-y-2">
          <li className="p-4 bg-gray-100 rounded">
            <strong>{ticket.name}:</strong> {ticket.message}
          </li>
          {ticket.messages.map((msg) => (
            <li
              key={msg.id}
              className={`p-4 rounded ${
                msg.sender === "agent" ? "bg-blue-50" : "bg-yellow-50"
              }`}
            >
              <strong>
                {msg.sender === "agent" ? "You" : ticket.name}:
              </strong>{" "}
              {msg.content}
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.createdAt).toLocaleString("en-GB")}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Reply</h2>
        {error && <p className="text-red-600 mb-2">Error: {error}</p>}
        <form onSubmit={handleReply} className="space-y-4">
          <textarea
            name="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your response…"
            required
            rows={4}
            className="w-full border rounded p-2"
            disabled={loading}
          />
          <label className="block">
            <span className="text-sm">Status</span>
            <select
              name="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "open" | "pending" | "closed")
              }
              className="mt-1 block w-full border rounded p-2"
              disabled={loading}
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Sending…" : "Send Reply"}
          </button>
        </form>
      </section>
    </div>
  );
}
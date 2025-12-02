"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";

interface Message {
  id: string;
  sender: "agent" | "customer";
  content: string;
  createdAt: string;
}
interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  email: string;
  messages: Message[];
}

export default function TicketThread() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { token } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) {
      setError("Unauthorized");
      return;
    }
    const res = await fetch(`/api/support/ticket/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTicket(data);
      setError(null);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to load ticket");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply || !token) return;
    setLoading(true);
    const res = await fetch(`/api/support/ticket/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: reply }),
    });
    setLoading(false);
    if (res.ok) {
      setReply("");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to send reply");
    }
  };

  if (error && !ticket) return <p className="p-4 text-red-600">{error}</p>;
  if (!ticket) return <p className="p-4">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-2">{ticket.subject}</h1>
      <p className="mb-4">
        <strong>Status:</strong> {ticket.status}
      </p>

      <div className="space-y-3 mb-6">
        <div className="p-4 bg-gray-100 rounded">
          <strong>You:</strong> {ticket.message}
        </div>
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded ${msg.sender === "agent" ? "bg-blue-50" : "bg-gray-50"}`}
          >
            <strong>{msg.sender === "agent" ? "Support" : "You"}:</strong> {msg.content}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
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
      )}
    </div>
  );
} 

// File: app/support/ticket/[id]/page.tsx
"use client"

import { useState, useEffect, FormEvent } from "react"
import { useParams } from "next/navigation"
import styles from "../../support.module.css"
import Pusher from "pusher-js"

type Message = { 
  id: string; 
  sender: "agent"|"customer"; 
  content: string; 
  createdAt: string;
  attachments?: { url: string; type: "image" | "video" }[];
}

type Ticket = { 
  id: string; 
  subject: string; 
  message: string; 
  status: string; 
  email: string; 
  messages: Message[];
  createdAt: string;
}

export default function TicketThread() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket|null>(null)
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  // fetch thread
  const load = async () => {
    try {
      const res = await fetch(`/api/support/ticket/${id}`)
      if (!res.ok) throw new Error('Failed to load ticket')
      setTicket(await res.json())
    } catch (err) {
      setError('Failed to load ticket details')
    }
  }

  useEffect(() => { load() }, [id])

  // Setup Pusher real-time subscription
  useEffect(() => {
    // @ts-ignore
    Pusher.logToConsole = false;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusherClient.subscribe(`support-ticket-${id}`);
    channel.bind("new-message", (data: { message: Message }) => {
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev);
    });
    channel.bind("status-changed", (data: { status: string }) => {
      const newStatus = data.status as "open" | "pending" | "closed";
      setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
    });
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`support-ticket-${id}`);
      pusherClient.disconnect();
    };
  }, [id]);

  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/support/ticket/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      })
      
      if (!res.ok) throw new Error('Failed to send reply')
      
      setReply("")
      load()
    } catch (err) {
      setError('Failed to send reply')
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return styles.statusOpen;
      case 'pending': return styles.statusPending;
      case 'closed': return styles.statusClosed;
      default: return '';
    }
  }

  const renderAttachments = (attachments?: { url: string; type: "image" | "video" }[]) => {
    if (!attachments?.length) return null;
    
    return (
      <div className={styles.attachmentGrid}>
        {attachments.map((att, idx) => (
          <div key={idx} className={styles.attachment}>
            {att.type === 'image' ? (
              <img src={att.url} alt="attachment" />
            ) : (
              <video src={att.url} controls />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!ticket) {
    return (
      <div className={styles.supportContainer}>
        <div className={styles.supportCard}>
          {error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div>Loading ticket details...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.supportContainer}>
      <div className={styles.supportCard}>
        <div className={styles.ticketHeader}>
          <h1 className={styles.ticketTitle}>{ticket.subject}</h1>
          <span className={`${styles.ticketStatus} ${getStatusClass(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          Created on {new Date(ticket.createdAt).toLocaleString()}
        </div>

        <div className={styles.messageContainer}>
          {/* Initial message */}
          <div className={`${styles.message} ${styles.customerMessage}`}>
            <div className={styles.messageHeader}>
              <span className={styles.messageSender}>You</span>
              <span className={styles.messageTime}>
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <div>{ticket.message}</div>
          </div>

          {/* Reply messages */}
          {ticket.messages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.sender === "agent" ? styles.agentMessage : styles.customerMessage
              }`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>
                  {msg.sender === "agent" ? "Support Agent" : "You"}
                </span>
                <span className={styles.messageTime}>
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <div>{msg.content}</div>
              {renderAttachments(msg.attachments)}
            </div>
          ))}
        </div>

        {ticket.status.toLowerCase() !== 'closed' && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="reply" className={styles.label}>Your Reply</label>
              <textarea
                id="reply"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your message..."
                className={styles.textarea}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Sending..." : "Send Reply"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
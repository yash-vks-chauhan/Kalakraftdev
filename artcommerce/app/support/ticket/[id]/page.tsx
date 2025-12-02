// File: app/support/ticket/[id]/page.tsx
"use client"

import { useState, useEffect, FormEvent, useRef } from "react"
import { useParams } from "next/navigation"
import Pusher from "pusher-js"
import styles from "../../support.module.css"
import { useAuth } from "../../../contexts/AuthContext"

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
  const { token } = useAuth()
  const [ticket, setTicket] = useState<Ticket|null>(null)
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [remoteTyping, setRemoteTyping] = useState<string | null>(null)
  const channelRef = useRef<Pusher.Channel | null>(null)
  const lastTypingSent = useRef<number>(0)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)

  // fetch thread
  const load = async () => {
    if (!token) {
      setError('Please sign in to view this ticket.')
      return
    }
    try {
      const res = await fetch(`/api/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load ticket')
      setTicket(await res.json())
    } catch (err) {
      setError('Failed to load ticket details')
    }
  }

  useEffect(() => { load() }, [id, token])

  // Setup Pusher real-time subscription
  useEffect(() => {
    if (!token) return;
    // @ts-ignore
    Pusher.logToConsole = false;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/support/pusher-auth",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    });
    const channel = pusherClient.subscribe(`private-support-ticket-${id}`);
    channelRef.current = channel;
    channel.bind("new-message", (data: { message: Message }) => {
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev);
    });
    channel.bind("status-changed", (data: { status: string }) => {
      const newStatus = data.status as "open" | "pending" | "closed";
      setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
    });
    channel.bind("client-typing", (data: { from: "agent" | "customer"; name?: string }) => {
      if (data.from === "agent") {
        setRemoteTyping(data.name ? `${data.name} is typing...` : "Support is typing...");
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setRemoteTyping(null), 1800);
      }
    });
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`private-support-ticket-${id}`);
      channelRef.current = null;
      pusherClient.disconnect();
    };
  }, [id, token]);

  const sendTyping = () => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel || now - lastTypingSent.current < 1200) return;
    channel.trigger("client-typing", { from: "customer" });
    lastTypingSent.current = now;
  };

  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    if (!token) {
      setError('Please sign in to reply to this ticket.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/support/ticket/${id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    const valid = (attachments || []).filter((att) => att?.url);
    if (!valid.length) return null;

    return (
      <div className={styles.attachmentGrid}>
        {valid.map((att, idx) => (
          <div key={idx} className={styles.attachment}>
            {att.type === 'image' ? (
              <img src={att.url} alt="attachment" loading="lazy" />
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

        <div className="text-sm text-gray-500 mb-4">
          Created on {new Date(ticket.createdAt).toLocaleString()}
        </div>

        <div className={styles.chatShell}>
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
                    {msg.sender === "agent" ? "Support" : "You"}
                  </span>
                  <span className={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>{msg.content}</div>
                {renderAttachments(msg.attachments)}
              </div>
            ))}

            {remoteTyping && (
              <div className={`${styles.message} ${styles.typingBubble}`}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>{remoteTyping}</span>
                </div>
                <div className={styles.typingDots}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
          </div>

          {ticket.status.toLowerCase() !== 'closed' && (
            <form onSubmit={handleSubmit} className={`${styles.composer}`}>
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
                  onChange={e => {
                    setReply(e.target.value)
                    sendTyping()
                  }}
                  placeholder="Type your message..."
                  className={styles.textarea}
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.composerActions}>
                <div className="text-xs text-gray-500">Up to 4 images, 3MB max, 1080p.</div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {loading ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// File: app/dashboard/admin/support/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import styles from "../../../../support/support.module.css";
import Pusher from "pusher-js";
import { useAuth } from "../../../../contexts/AuthContext";

interface Attachment {
  url: string;
  type: "image" | "video";
}

interface Message {
  id: string;
  sender: "agent" | "customer";
  content: string;
  createdAt: string;
  attachments?: Attachment[];
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
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"open" | "pending" | "closed">("open");
  const [error, setError] = useState<string | null>(null);
  const [remoteTyping, setRemoteTyping] = useState<string | null>(null);
  const channelRef = useRef<Pusher.Channel | null>(null);
  const lastTypingSent = useRef<number>(0);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load ticket + messages
  const loadTicket = async () => {
    if (!token) {
      setError("Unauthorized");
      return;
    }
    try {
      const res = await fetch(`/api/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (!token) {
      setError("Unauthorized");
      return;
    }
    loadTicket();
    // Real-time updates via Pusher
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
      setTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
      );
    });
    channel.bind("status-changed", (data: { status: string }) => {
      const newStatus = data.status as "open" | "pending" | "closed";
      setTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setStatus(newStatus);
    });
    channel.bind("client-typing", (data: { from: "agent" | "customer"; name?: string }) => {
      if (data.from === "customer") {
        setRemoteTyping(data.name ? `${data.name} is typing...` : "Customer is typing...");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendTyping = () => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel || now - lastTypingSent.current < 1200) return;
    channel.trigger("client-typing", { from: "agent" });
    lastTypingSent.current = now;
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() && files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Upload attachments
      const attachments: Attachment[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const resUp = await fetch("/api/uploads", { 
          method: "POST", 
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const uploadJson = await resUp.json().catch(() => ({}));
        if (!resUp.ok) {
          setError(uploadJson.error || "Failed to upload attachment.");
          setLoading(false);
          return;
        }
        attachments.push({
          url: uploadJson.url,
          type: file.type.startsWith("video") ? "video" : "image",
        });
      }

      // 2) Send reply with attachments and status update
      const res = await fetch(`/api/admin/support/ticket/${id}/reply`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply,
          attachments,
          status,
        }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      setReply("");
      setFiles([]);
      loadTicket();
    } catch (err: any) {
      setError(err.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return styles.statusOpen;
      case 'pending': return styles.statusPending;
      case 'closed': return styles.statusClosed;
      default: return '';
    }
  };

  const renderAttachments = (attachments?: Attachment[]) => {
    const valid = (attachments || []).filter((att) => att?.url);
    if (!valid.length) return null;

    return (
      <div className={styles.attachmentGrid}>
        {valid.map((att, idx) => (
          <div key={idx} className={styles.attachment}>
            {att.type === "image" ? (
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

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
          <div>
            <strong>From:</strong> {ticket.name}
            <br />
            <span className="text-gray-500">{ticket.email}</span>
          </div>
          <div className="text-right">
            <strong>Created:</strong>
            <br />
            {new Date(ticket.createdAt).toLocaleString("en-GB")}
          </div>
        </div>

        <div className={styles.chatShell}>
          <div className={styles.messageContainer}>
            {/* Initial message */}
            <div className={`${styles.message} ${styles.customerMessage}`}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>{ticket.name}</span>
                <span className={styles.messageTime}>
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div>{ticket.message}</div>
            </div>

            {/* Reply messages */}
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${
                  msg.sender === "agent" ? styles.agentMessage : styles.customerMessage
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>
                    {msg.sender === "agent" ? "You" : ticket.name}
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

          <form onSubmit={handleReply} className={styles.composer}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "open" | "pending" | "closed")}
                className={styles.input}
                disabled={loading}
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reply" className={styles.label}>Reply</label>
              <textarea
                id="reply"
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  sendTyping();
                }}
                placeholder="Type your response..."
                className={styles.textarea}
                disabled={loading}
                required={files.length === 0}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Attachments (Optional)</label>
              <div 
                className={styles.fileUpload}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  disabled={loading}
                />
                <p>Click or drag files to upload</p>
                <p className="text-sm text-gray-500">Images and videos only</p>
              </div>

              {files.length > 0 && (
                <div className={styles.filePreview}>
                  {files.map((file, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {file.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" />
                      ) : (
                        <video src={URL.createObjectURL(file)} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className={styles.removeButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.composerActions}>
              <div className="text-xs text-gray-500">Keep replies concise and human.</div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

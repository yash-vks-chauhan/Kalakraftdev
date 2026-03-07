"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import Pusher, { type Channel } from "pusher-js";
import styles from "../../../../support/support.module.css";

interface Attachment {
  url: string;
  type?: "image" | "video" | string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  name?: string;
  storageProvider?: "cloudinary" | "imagekit";
  storageKey?: string;
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
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  email: string;
  createdAt: string;
  messages: Message[];
}

type ValidatedFile = {
  file: File;
  width: number;
  height: number;
};

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_DIMENSION = 1080;

export default function TicketThread() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remoteTyping, setRemoteTyping] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const lastTypingSent = useRef<number>(0);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    if (!token) return;
    const res = await fetch(`/api/support/ticket/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTicket(data);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    // @ts-ignore
    Pusher.logToConsole = false;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/support/pusher-auth",
        transport: "ajax",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImageFile = async (file: File): Promise<ValidatedFile> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image attachments are allowed.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Each image must be 3MB or smaller.");
    }
    const { width, height } = await getImageDimensions(file);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error("Images must be at most 1080p.");
    }
    return { file, width, height };
  };

  const sendTyping = () => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel || now - lastTypingSent.current < 1200) return;
    channel.trigger("client-typing", { from: "customer" });
    lastTypingSent.current = now;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply && files.length === 0) return;
    if (!token) return;
    setError(null);
    setLoading(true);

    // 1) upload attachments (if any)
    const attachments: Attachment[] = [];
    for (const { file, width, height } of files) {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/support/attachments", {
        method: "POST", 
        body: fd,
        headers: { Authorization: `Bearer ${token}` }
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setError(uploadJson.error || "Failed to upload attachment.");
        setLoading(false);
        return;
      }
      attachments.push(uploadJson as Attachment);
    }

    const res = await fetch(`/api/support/ticket/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: reply, attachments }),
    });
    setLoading(false);
    if (res.ok) {
      setReply("");
      setFiles([]);
      load();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError(null);

    const selected = Array.from(e.target.files);
    const remaining = MAX_ATTACHMENTS - files.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      return;
    }

    const toProcess = selected.slice(0, remaining);
    const validated: ValidatedFile[] = [];

    for (const file of toProcess) {
      try {
        const vf = await validateImageFile(file);
        validated.push(vf);
      } catch (err: any) {
        setError(err.message || "Invalid image selected.");
      }
    }

    setFiles((prev) => [...prev, ...validated]);
  };

  const renderAttachments = (atts?: Attachment[]) => {
    const valid = (atts || []).filter((att) => att?.url);
    if (valid.length === 0) return null;
    return (
      <div className="mt-2 space-x-2 flex flex-wrap">
        {valid.map((att, idx) => (
          (att.type || att.mimeType || '').startsWith("image") ? (
            <img key={idx} src={att.url} alt="attach" className="w-24 h-24 object-cover rounded" loading="lazy" />
          ) : (
            <video key={idx} src={att.url} controls className="w-32 h-24 rounded" />
          )
        ))}
      </div>
    );
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return styles.statusOpen;
      case "pending":
        return styles.statusPending;
      case "closed":
        return styles.statusClosed;
      default:
        return "";
    }
  };

  if (!ticket) return <p className="p-4">Loading…</p>;

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
          Created on {new Date(ticket.messages?.[0]?.createdAt || ticket.createdAt).toLocaleString()}
        </div>

        <div className={styles.chatShell}>
          <div className={styles.messageContainer}>
            <div className={`${styles.message} ${styles.customerMessage}`}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>You</span>
                <span className={styles.messageTime}>
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div>{ticket.message}</div>
            </div>

            {ticket.messages.map((msg) => (
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

          {ticket.status !== "closed" && (
            <form onSubmit={handleSubmit} className={styles.composer}>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <div className={styles.formGroup}>
                <label htmlFor="reply" className={styles.label}>Reply</label>
                <textarea
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    sendTyping();
                  }}
                  placeholder="Type your message…"
                  rows={4}
                  className={styles.textarea}
                  disabled={loading}
                  required={files.length === 0}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Attachments (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className={styles.input}
                  disabled={loading}
                />
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map(({ file }, idx) => (
                      <div key={idx} className="w-20 h-20 relative">
                        <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full rounded" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-white text-gray-600 rounded-full w-6 h-6 shadow"
                          onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.composerActions}>
                <div className="text-xs text-gray-500">Up to 4 images, 3MB max, 1080p.</div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {loading ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

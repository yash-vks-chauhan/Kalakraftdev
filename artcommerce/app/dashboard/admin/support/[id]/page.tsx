"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Pusher, { type Channel } from "pusher-js";
import { useAuth } from "../../../../contexts/AuthContext";
import { Send, Paperclip, X, CheckCheck, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Attachment {
  url: string;
  type?: "image" | "video" | string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
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
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  createdAt: string;
  messages: Message[];
}

const MAX_ATTACHMENTS = 4;

export default function TicketDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"open" | "pending" | "closed">("open");
  const [error, setError] = useState<string | null>(null);
  const [remoteTyping, setRemoteTyping] = useState<boolean>(false);
  const channelRef = useRef<Channel | null>(null);
  const lastTypingSent = useRef<number>(0);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages, remoteTyping]);

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
      setRemoteTyping(false);
    });

    channel.bind("status-changed", (data: { status: string }) => {
      const newStatus = data.status as "open" | "pending" | "closed";
      setTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setStatus(newStatus);
    });

    channel.bind("client-typing", (data: { from: "agent" | "customer" }) => {
      if (data.from === "customer") {
        setRemoteTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setRemoteTyping(false), 3000);
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
    if (!e.target.files) return;
    setError(null);

    const incoming = Array.from(e.target.files);
    const available = MAX_ATTACHMENTS - files.length;
    if (available <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      e.target.value = '';
      return;
    }

    const toAdd = incoming.slice(0, available);
    setFiles((prev) => [...prev, ...toAdd]);
    if (incoming.length > available) {
      setError(`Only ${MAX_ATTACHMENTS} images are allowed per message.`);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendTyping = () => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel || now - lastTypingSent.current < 2000) return;
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
        const resUp = await fetch("/api/support/attachments", {
          method: "POST",
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const uploadJson = await resUp.json().catch(() => ({}));
        if (!resUp.ok || !uploadJson.url) {
          throw new Error(uploadJson.error || "Failed to upload image.");
        }
        attachments.push(uploadJson as Attachment);
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

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to send reply");
      }

      setReply("");
      setFiles([]);
      loadTicket();
    } catch (err: any) {
      setError(err.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const renderAttachments = (attachments?: Attachment[]) => {
    const valid = (attachments || []).filter((att) => att?.url);
    if (!valid.length) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {valid.map((att, idx) => (
          <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-100 w-48 h-32 bg-black/5">
            {(att.type || att.mimeType || '').startsWith("image") ? (
              <img src={att.url} alt="attachment" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <video src={att.url} controls className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="flex-none px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/support" className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 text-lg line-clamp-1">{ticket.subject}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{ticket.name}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{ticket.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "pending" | "closed")}
            className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all cursor-pointer appearance-none"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {/* Initial Ticket Message */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-200 px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 shadow-sm">
            Ticket created on {new Date(ticket.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start space-y-1"
        >
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-gray-900">{ticket.name}</span>
          </div>
          <div className="bg-white text-gray-900 px-5 py-3.5 rounded-2xl rounded-tl-sm max-w-[85%] sm:max-w-[60%] shadow-sm border border-gray-200">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>
          <span className="text-[10px] text-gray-400 px-1">
            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>

        {/* Messages */}
        <AnimatePresence initial={false}>
          {ticket.messages.map((msg) => {
            const isMe = msg.sender === 'agent';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-medium text-gray-900">{ticket.name}</span>
                  </div>
                )}
                <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] sm:max-w-[60%] shadow-sm ${isMe
                    ? 'bg-black text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                  }`}>
                  {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  {renderAttachments(msg.attachments)}
                </div>
                <div className={`flex items-center gap-1 px-1 text-[10px] ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-gray-400" />}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {remoteTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-start space-y-1"
          >
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-200">
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-400 px-1">Customer is typing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
          {files.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-3 mb-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFiles(f => f.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReply} className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />

            <div className="flex-1 bg-gray-50 rounded-[20px] border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
              <textarea
                value={reply}
                onChange={e => {
                  setReply(e.target.value)
                  sendTyping()
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(e)
                  }
                }}
                placeholder="Type a reply..."
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 max-h-32 resize-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
                rows={1}
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!reply.trim() && files.length === 0)}
              className={`p-3 rounded-full transition-all duration-200 ${reply.trim() || files.length > 0
                  ? 'bg-black text-white shadow-md hover:bg-gray-900'
                  : 'bg-gray-100 text-gray-400'
                }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

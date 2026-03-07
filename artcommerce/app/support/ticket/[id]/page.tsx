"use client"

import { useState, useEffect, FormEvent, useRef } from "react"
import { useParams } from "next/navigation"
import Pusher, { type Channel } from "pusher-js"
import { useAuth } from "../../../contexts/AuthContext"
import { Send, Paperclip, X, CheckCheck, Loader2, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type Attachment = {
  url: string;
  type?: "image" | "video" | string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  name?: string;
  storageProvider?: "cloudinary" | "imagekit";
  storageKey?: string;
};

type Message = {
  id: string;
  sender: "agent" | "customer";
  content: string;
  createdAt: string;
  attachments?: Attachment[];
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

const MAX_ATTACHMENTS = 4;

export default function TicketThread() {
  const { id } = useParams()
  const { token } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteTyping, setRemoteTyping] = useState<boolean>(false)
  const channelRef = useRef<Channel | null>(null)
  const lastTypingSent = useRef<number>(0)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages, remoteTyping])

  // fetch thread
  const load = async () => {
    if (!token) return
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
        transport: "ajax",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    });
    const channel = pusherClient.subscribe(`private-support-ticket-${id}`);
    channelRef.current = channel;

    channel.bind("new-message", (data: { message: Message }) => {
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev);
      setRemoteTyping(false); // Stop typing indicator when message arrives
    });

    channel.bind("status-changed", (data: { status: string }) => {
      const newStatus = data.status as "open" | "pending" | "closed";
      setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
    });

    channel.bind("client-typing", (data: { from: "agent" | "customer" }) => {
      if (data.from === "agent") {
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

  const sendTyping = () => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel || now - lastTypingSent.current < 2000) return;
    channel.trigger("client-typing", { from: "customer" });
    lastTypingSent.current = now;
  };

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
    setFiles(prev => [...prev, ...toAdd]);
    if (incoming.length > available) {
      setError(`Only ${MAX_ATTACHMENTS} images are allowed per message.`);
    }
    e.target.value = '';
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if ((!reply.trim() && files.length === 0) || !token) return

    setLoading(true)
    setError(null)

    try {
      // Upload attachments first if any
      const attachments: Attachment[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/support/attachments", {
          method: "POST",
          body: fd,
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to upload image");
        }
        attachments.push(data as Attachment)
      }

      const res = await fetch(`/api/support/ticket/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: reply, attachments }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to send reply')
      }

      setReply("")
      setFiles([])
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setLoading(false)
    }
  }

  const renderAttachments = (attachments?: Attachment[]) => {
    const valid = (attachments || []).filter((att) => att?.url);
    if (!valid.length) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {valid.map((att, idx) => (
          <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-100 w-48 h-32 bg-black/5">
            {(att.type || att.mimeType || '').startsWith('image') ? (
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/support" className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500' :
                  ticket.status === 'pending' ? 'bg-amber-500' : 'bg-gray-300'
                }`} />
              <span className="capitalize">{ticket.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {/* Initial Ticket Message */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-50 px-4 py-2 rounded-full text-xs text-gray-400">
            {new Date(ticket.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-end space-y-1"
        >
          <div className="bg-black text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[70%] shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>
          <span className="text-[10px] text-gray-300 px-1">
            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>

        {/* Messages */}
        <AnimatePresence initial={false}>
          {ticket.messages.map((msg) => {
            const isMe = msg.sender === 'customer';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[70%] shadow-sm ${isMe
                    ? 'bg-black text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  }`}>
                  {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  {renderAttachments(msg.attachments)}
                </div>
                <div className={`flex items-center gap-1 px-1 text-[10px] ${isMe ? 'text-gray-300' : 'text-gray-400'}`}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-gray-300" />}
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
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
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
            <span className="text-[10px] text-gray-400 px-1">Support is typing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {ticket.status !== 'closed' && (
        <div className="flex-none p-4 bg-white border-t border-gray-100">
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

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
                      handleSubmit(e)
                    }
                  }}
                  placeholder="iMessage"
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 max-h-32 resize-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
                  rows={1}
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!reply.trim() && files.length === 0)}
                className={`p-3 rounded-full transition-all duration-200 ${reply.trim() || files.length > 0
                    ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

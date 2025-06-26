"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [files, setFiles] = useState<File[]>([]);

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply && files.length === 0) return;
    if (!token) return;
    setLoading(true);

    // 1) upload attachments (if any)
    const attachments: Attachment[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        attachments.push({ url, type: file.type.startsWith("video") ? "video" : "image" });
      }
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const renderAttachments = (atts?: Attachment[]) => {
    if (!atts || atts.length === 0) return null;
    return (
      <div className="mt-2 space-x-2 flex flex-wrap">
        {atts.map((att, idx) => (
          att.type === "image" ? (
            <img key={idx} src={att.url} alt="attach" className="w-24 h-24 object-cover rounded" />
          ) : (
            <video key={idx} src={att.url} controls className="w-32 h-24 rounded" />
          )
        ))}
      </div>
    );
  };

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
            {renderAttachments(msg.attachments)}
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
            required={files.length === 0}
          />

          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="block"
            disabled={loading}
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="w-20 h-20 relative">
                  {file.type.startsWith("image") ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full rounded" />
                  ) : (
                    <video src={URL.createObjectURL(file)} className="object-cover w-full h-full rounded" />
                  )}
                </div>
              ))}
            </div>
          )}
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

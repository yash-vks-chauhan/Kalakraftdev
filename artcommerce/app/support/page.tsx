// app/support/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function SupportPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Prefill and lock name/email if logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.fullName, email: user.email }));
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/support/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { id } = await res.json();
      const dest = user ? `/dashboard/support/ticket/${id}` : `/support/ticket/${id}`;
      router.push(dest);
    } else {
      // handle error…
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Contact Customer Care</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text" name="name" placeholder="Your name"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          required
          className="w-full border rounded p-2"
          readOnly={!!user}
        />
        <input
          type="email" name="email" placeholder="you@example.com"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          required
          className="w-full border rounded p-2"
          readOnly={!!user}
        />
        <input
          type="text" name="subject" placeholder="Subject"
          value={form.subject}
          onChange={e => setForm({...form, subject: e.target.value})}
          required
          className="w-full border rounded p-2"
        />
        <textarea
          name="message" placeholder="How can we help?"
          value={form.message}
          onChange={e => setForm({...form, message: e.target.value})}
          rows={5}
          required
          className="w-full border rounded p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Sending…" : "Send Request"}
        </button>
      </form>
    </div>
  );
}
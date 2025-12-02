"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  createdAt: string;
}

export default function MySupportTickets() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch('/api/support/my-tickets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, token]);

  if (!user) return <p className="p-4">Please sign in to view support tickets.</p>;
  if (loading) return <p className="p-4">Loading…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  const openTickets = tickets.filter(t => t.status !== "closed");
  const closedTickets = tickets.filter(t => t.status === "closed");

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Support Tickets</h1>
        <Link
          href="/support"
          className="inline-block px-3 py-2 bg-indigo-600 text-sm text-white rounded hover:bg-indigo-700"
        >
          New Ticket
        </Link>
      </div>
      {/* OPEN & PENDING */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Open & Pending</h2>
      {openTickets.length === 0 ? (
        <p className="text-sm mb-4">No open tickets.</p>
      ) : (
        <table className="w-full border divide-y mb-8">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2">Subject</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {openTickets.map((t) => (
              <tr key={t.id}>
                <td className="p-2">{t.subject}</td>
                <td className="p-2 capitalize">{t.status}</td>
                <td className="p-2">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="p-2 text-right">
                  <Link href={`/dashboard/support/ticket/${t.id}`} className="text-indigo-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* CLOSED */}
      <h2 className="text-xl font-semibold mb-2">Closed</h2>
      {closedTickets.length === 0 ? (
        <p className="text-sm">No closed tickets.</p>
      ) : (
        <table className="w-full border divide-y">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2">Subject</th>
              <th className="p-2">Created</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {closedTickets.map((t) => (
              <tr key={t.id}>
                <td className="p-2">{t.subject}</td>
                <td className="p-2">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="p-2 text-right">
                  <Link href={`/dashboard/support/ticket/${t.id}`} className="text-indigo-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 

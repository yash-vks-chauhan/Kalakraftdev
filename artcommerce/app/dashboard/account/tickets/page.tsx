// File: app/dashboard/account/tickets/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/FirebaseAuthContext';

type Ticket = {
  id: string;
  subject: string;
  createdAt: string;
};

export default function MyTicketsPage() {
  const { user, getIdToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/support/my-tickets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tickets');
        const data = await res.json();
        setTickets(data.tickets);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading tickets');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <p>Loading your tickets…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!tickets.length) return <p>You have no support tickets.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">My Support Tickets</h1>
      <ul className="space-y-2">
        {tickets.map(t => (
          <li key={t.id} className="p-4 bg-gray-100 rounded">
            <Link href={`/support/ticket/${t.id}`} className="font-medium text-blue-600 hover:underline">
              {t.subject}
            </Link>
            <div className="text-xs text-gray-500">
              {new Date(t.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
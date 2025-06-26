// app/dashboard/support/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./tickets.module.css";
import { FiPlus, FiInbox, FiArchive, FiAlertCircle } from 'react-icons/fi';

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
    if (!user) return;
    const load = async () => {
      try {
        const url = `/api/support/my-tickets?email=${encodeURIComponent(user.email)}`;
        const res = await fetch(url);
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
  }, [user]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <FiAlertCircle className={styles.errorIcon} />
          {error}
        </div>
      </div>
    );
  }

  const openTickets = tickets.filter((t) => t.status !== "closed");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Support Tickets</h1>
        <Link href="/support" className={styles.newTicketButton}>
          <FiPlus className={styles.buttonIcon} />
          New Ticket
        </Link>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiInbox className={styles.sectionIcon} />
            Open & Pending
          </h2>
        </div>
        
        {openTickets.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No open tickets.</p>
          </div>
        ) : (
          <div className={styles.ticketGrid}>
            {openTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/ticket/${ticket.id}`}
                className={styles.ticketCard}
              >
                <div className={styles.ticketContent}>
                  <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                  <span className={`${styles.ticketStatus} ${styles[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className={styles.ticketMeta}>
                  <span className={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiArchive className={styles.sectionIcon} />
            Closed
          </h2>
        </div>
        
        {closedTickets.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No closed tickets.</p>
          </div>
        ) : (
          <div className={styles.ticketGrid}>
            {closedTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/ticket/${ticket.id}`}
                className={`${styles.ticketCard} ${styles.closedTicket}`}
              >
                <div className={styles.ticketContent}>
                  <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                  <span className={`${styles.ticketStatus} ${styles.closed}`}>
                    closed
                  </span>
                </div>
                <div className={styles.ticketMeta}>
                  <span className={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

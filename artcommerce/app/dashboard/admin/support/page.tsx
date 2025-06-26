// File: app/dashboard/admin/support/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import styles from "../../../support/support.module.css";
import { FiMail, FiClock, FiUser, FiArrowRight } from 'react-icons/fi';

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: Date;
}

export const revalidate = 0;

export default async function SupportListPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return styles.statusOpen;
      case 'pending': return styles.statusPending;
      case 'closed': return styles.statusClosed;
      default: return '';
    }
  };

  return (
    <div className={styles.supportContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Support Tickets</h1>
        <p className={styles.subtitle}>Manage and respond to customer support requests</p>
      </div>

      <div className={styles.supportCard}>
        <div className={styles.ticketList}>
          {tickets.map((ticket: SupportTicket) => (
            <Link 
              key={ticket.id} 
              href={`/dashboard/admin/support/${ticket.id}`}
              className={styles.ticketCard}
            >
              <div className={styles.ticketHeader}>
                <h2 className={styles.ticketTitle}>{ticket.subject}</h2>
                <span className={`${styles.ticketStatus} ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className={styles.ticketDetails}>
                <div className={styles.ticketInfo}>
                  <FiUser className={styles.ticketIcon} />
                  <div>
                    <div className={styles.ticketLabel}>From</div>
                    <div className={styles.ticketValue}>{ticket.name}</div>
                    <div className={styles.ticketEmail}>{ticket.email}</div>
                  </div>
                </div>

                <div className={styles.ticketInfo}>
                  <FiClock className={styles.ticketIcon} />
                  <div>
                    <div className={styles.ticketLabel}>Created</div>
                    <div className={styles.ticketValue}>
                      {new Date(ticket.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <FiArrowRight className={styles.arrowIcon} />
              </div>
            </Link>
          ))}
          
          {tickets.length === 0 && (
            <div className={styles.emptyState}>
              <FiMail className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No Support Tickets</h3>
              <p className={styles.emptyText}>There are no support tickets to display at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Mail, Clock, User, ArrowRight, Search, Filter,
  CheckCircle2, AlertCircle, Clock3, MoreHorizontal
} from 'lucide-react';

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: Date;
  issueCategory?: string;
}

export const revalidate = 0;

export default async function SupportListPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white border border-black">Open</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200">Pending</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-100">Closed</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of recent tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black transition-all w-64 placeholder-gray-400"
              />
            </div>
            <button className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{tickets.length}</div>
          </div>
          <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {tickets.filter(t => t.status.toLowerCase() === 'open').length}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {tickets.filter(t => t.status.toLowerCase() === 'pending').length}
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="border-t border-gray-100">
          {tickets.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/admin/support/${ticket.id}`}
                  className="group block py-6 hover:bg-gray-50/50 transition-colors -mx-4 px-4 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:underline decoration-1 underline-offset-4">
                        {ticket.subject}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span className="truncate font-medium text-gray-900">{ticket.name}</span>
                        <span className="truncate text-gray-400">{ticket.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center self-center text-gray-300 group-hover:text-black transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900">No tickets</h3>
              <p className="text-sm text-gray-500 mt-1">
                Everything is caught up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Mail, Clock, User, ArrowRight, Search, Filter,
  CheckCircle, AlertCircle, Clock3, MoreHorizontal
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'closed': return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="w-3 h-3" />;
      case 'pending': return <Clock3 className="w-3 h-3" />;
      case 'closed': return <CheckCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track customer support requests</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all w-64"
              />
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{tickets.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium">Open Issues</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {tickets.filter(t => t.status.toLowerCase() === 'open').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 font-medium">Pending</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {tickets.filter(t => t.status.toLowerCase() === 'pending').length}
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {tickets.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/admin/support/${ticket.id}`}
                  className="group block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {ticket.subject}
                      </h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate">{ticket.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{ticket.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center self-center text-gray-300 group-hover:text-gray-600 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="text-gray-500 mt-1 max-w-sm">
                There are currently no support tickets to display. New tickets will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

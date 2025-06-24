// File: app/dashboard/admin/support/page.tsx
import Link from 'next/link';
import prisma from '../../../../lib/prisma';

export const revalidate = 0;

export default async function SupportListPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Support Tickets</h1>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Subject</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link href={`/dashboard/admin/support/${ticket.id}`} className="text-blue-600 hover:underline">
                  {ticket.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-2">{ticket.name}</td>
              <td className="px-4 py-2">{ticket.subject}</td>
              <td className="px-4 py-2 capitalize">{ticket.status}</td>
              <td className="px-4 py-2">
                {new Date(ticket.createdAt).toLocaleString('en-GB')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

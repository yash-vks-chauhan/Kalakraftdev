// src/lib/notifications/sendinblue.ts
import type { Order } from '@/types'
import { getPublicAppUrlForPath } from '../appUrl'
import { renderEmail } from '../emailTemplate'
import { sendAdminMail } from '../mailer'

export async function sendOrderNotificationEmail(order: Order) {
  const money = (amount: number) => `₹${amount.toFixed(2)}`
  const { address } = order.customer

  await sendAdminMail({
    subject: `New order #${order.id} — ${money(order.total)}`,
    html: renderEmail({
      preheader: `${order.customer.name} ordered ${order.items.length} item(s) for ${money(order.total)}.`,
      eyebrow: 'Orders · staff notice',
      heading: `New order #${order.id}`,
      body: [
        `${order.customer.name} (${order.customer.email}) just checked out.`,
        `Ship to: ${address.street}, ${address.city}, ${address.state} ${address.zip}.`,
      ],
      module: {
        kind: 'receipt',
        items: order.items.map((item) => ({
          name: item.productName,
          meta: `Qty ${item.quantity} · ${money(item.unitPrice)} each`,
          amount: money(item.quantity * item.unitPrice),
        })),
        total: { label: 'Order total', value: money(order.total) },
      },
      cta: {
        label: 'Open in dashboard',
        href: getPublicAppUrlForPath(`/dashboard/orders/${order.id}`),
      },
      signoff: false,
      footerReason: "Internal alert sent to the store's admin address. Customers never receive this message.",
    }),
    fromName: 'Kalakraft Orders',
  })
}

// src/lib/notifications/sendinblue.ts
import type { Order } from '@/types'
import { getPublicAppUrlForPath } from '../appUrl'
import { escapeHtml } from '../emailContent'
import { sendAdminMail } from '../mailer'

export async function sendOrderNotificationEmail(order: Order) {
  // 1. Build the HTML body
  const itemsHtml = order.items
    .map(
      (it) => `
    <li>
      <strong>${escapeHtml(it.productName)}</strong> × ${it.quantity}
      @ ₹${it.unitPrice.toFixed(2)} = ₹${(it.quantity * it.unitPrice).toFixed(2)}
    </li>`
    )
    .join('')

  const htmlContent = `
    <h2>🛒 New Order #${order.id}</h2>
    <p><strong>Customer:</strong> ${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.email)})</p>
    <p><strong>Shipping Address:</strong><br/>
      ${escapeHtml(order.customer.address.street)}<br/>
      ${escapeHtml(order.customer.address.city)}, ${escapeHtml(order.customer.address.state)} ${escapeHtml(order.customer.address.zip)}
    </p>
    <h3>Items:</h3>
    <ul>${itemsHtml}</ul>
    <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
    <p>
      <a 
        href="${getPublicAppUrlForPath(`/dashboard/orders/${order.id}`)}"
        target="_blank" 
        rel="noopener noreferrer"
      >
        View Order #${order.id} in Admin Dashboard &raquo;
      </a>
    </p>
  `

  await sendAdminMail({
    subject: `New Order #${order.id} — ₹${order.total.toFixed(2)}`,
    html: htmlContent,
    fromName: 'Kalakraft Orders',
  })
}

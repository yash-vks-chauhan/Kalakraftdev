// src/lib/notifications/sendinblue.ts
import type { Order } from '@/types'
import { cleanEmailHeader, escapeHtml } from '../emailContent'

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
        href="${process.env.APP_URL}/dashboard/orders/${order.id}" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        View Order #${order.id} in Admin Dashboard &raquo;
      </a>
    </p>
  `

  const resp = await fetch('https://api.sendinblue.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.SENDINBLUE_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SENDINBLUE_FROM!,
        email: process.env.SENDINBLUE_FROM_EMAIL!,
      },
      to: [{ email: process.env.ADMIN_EMAIL! }],
      subject: cleanEmailHeader(`New Order #${order.id} — ₹${order.total.toFixed(2)}`),
      htmlContent,
    }),
  })

  if (!resp.ok) {
    const errorText = await resp.text()
    console.error('Sendinblue API error response:', errorText)
    console.error('Sendinblue API error status:', resp.status)
    throw new Error('Failed to send order notification email')
  }
}

// src/lib/notifications/sendinblue.ts
import type { Order } from '@/types'

export async function sendOrderNotificationEmail(order: Order) {
  // 1. Build the HTML body
  const itemsHtml = order.items
    .map(
      (it) => `
    <li>
      <strong>${it.productName}</strong> × ${it.quantity}
      @ ₹${it.unitPrice.toFixed(2)} = ₹${(it.quantity * it.unitPrice).toFixed(2)}
    </li>`
    )
    .join('')

  const htmlContent = `
    <h2>🛒 New Order #${order.id}</h2>
    <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
    <p><strong>Shipping Address:</strong><br/>
      ${order.customer.address.street}<br/>
      ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zip}
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

  // 2. Send via Sendinblue REST API
  console.log('Constructing Sendinblue request...');
  console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
  console.log(`Sender Email: ${process.env.SENDINBLUE_FROM_EMAIL}`);
  console.log(`API Key set: ${!!process.env.SENDINBLUE_API_KEY}`);

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
      subject: `New Order #${order.id} — ₹${order.total.toFixed(2)}`,
      htmlContent,
    }),
  })

  if (!resp.ok) {
    const errorText = await resp.text()
    console.error('Sendinblue API error response:', errorText)
    console.error('Sendinblue API error status:', resp.status)
    throw new Error('Failed to send order notification email')
  }

  console.log('Successfully sent email via Sendinblue');
}
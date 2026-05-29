// src/lib/notifications/stockAlerts.ts
import { getPublicAppUrlForPath } from '../appUrl'
import { escapeHtml } from '../emailContent'
import { sendAdminMail } from '../mailer'

export async function sendOutOfStockEmail({
    productId,
    productName,
  }: {
    productId: number
    productName: string
  }) {
    const html = `
      <h2>❌ Out of Stock: ${escapeHtml(productName)}</h2>
      <p>This product is now completely sold out.</p>
      <p>
        <a href="${getPublicAppUrlForPath(`/dashboard/admin/products/${productId}`)}">
          View Product &raquo;
        </a>
      </p>
    `
    await sendAdminMail({
      subject: `Out of Stock: ${productName}`,
      html,
      fromName: 'Kalakraft Inventory',
    })
  }

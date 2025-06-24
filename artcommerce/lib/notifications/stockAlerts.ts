// src/lib/notifications/stockAlerts.ts

export async function sendOutOfStockEmail({
    productId,
    productName,
  }: {
    productId: number
    productName: string
  }) {
    const html = `
      <h2>❌ Out of Stock: ${productName}</h2>
      <p>This product is now completely sold out.</p>
      <p>
        <a href="${process.env.APP_URL}/dashboard/admin/products/${productId}">
          View Product &raquo;
        </a>
      </p>
    `
    await fetch('https://api.sendinblue.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key':       process.env.SENDINBLUE_API_KEY!,
      },
      body: JSON.stringify({
        sender:      { email: process.env.SENDINBLUE_FROM_EMAIL!, name: 'ArtCommerce Support' },
        to:          [{ email: process.env.ADMIN_EMAIL! }],
        subject:     `Out of Stock: ${productName}`,
        htmlContent: html,
      }),
    })
  }
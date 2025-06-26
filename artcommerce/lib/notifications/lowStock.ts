// src/lib/notifications/lowStock.ts
import nodemailer from 'nodemailer'

interface LowStockEmailParams {
  productId: number
  productName: string
  remaining: number
  threshold: number
}

export async function sendLowStockEmail({
  productId,
  productName,
  remaining,
  threshold,
}: LowStockEmailParams) {
  // 1. Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })

  // 2. Build HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>⚠️ Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">${productName}</h3>
        <p><strong>Product ID:</strong> ${productId}</p>
        <p><strong>Remaining Stock:</strong> ${remaining} units</p>
        <p><strong>Threshold:</strong> ${threshold} units</p>
      </div>
      <p>
        <a 
          href="${process.env.APP_URL}/dashboard/admin/products/${productId}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
        >
          View Product in Admin Dashboard &raquo;
        </a>
      </p>
    </div>
  `

  // 3. Send email
  await transporter.sendMail({
    from: `"Artcommerce" <${process.env.SMTP_USER!}>`,
    to: process.env.ADMIN_EMAIL!,
    subject: `Low Stock Alert: ${productName}`,
    html: htmlContent,
  })
}
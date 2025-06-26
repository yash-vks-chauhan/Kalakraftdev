import nodemailer from 'nodemailer'

interface OutOfStockEmailParams {
  productId: number
  productName: string
}

export async function sendOutOfStockEmail({
  productId,
  productName,
}: OutOfStockEmailParams) {
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
      <h2>⚠️ Out of Stock Alert</h2>
      <p>The following product is now out of stock:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">${productName}</h3>
        <p><strong>Product ID:</strong> ${productId}</p>
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
    subject: `Out of Stock Alert: ${productName}`,
    html: htmlContent,
  })
} 
// src/lib/notifications/lowStock.ts
import { getPublicAppUrlForPath } from '../appUrl'
import { renderEmail } from '../emailTemplate'
import { sendAdminMail } from '../mailer'

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
  await sendAdminMail({
    subject: `Low stock: ${productName}`,
    html: renderEmail({
      preheader: `${productName} is down to ${remaining} units.`,
      eyebrow: 'Inventory · staff notice',
      heading: 'Running low on stock',
      body: ['An order just took this product below its restock threshold.'],
      module: {
        kind: 'facts',
        title: productName,
        rows: [
          { label: 'Remaining', value: `${remaining} units`, accent: true },
          { label: 'Threshold', value: `${threshold} units` },
          { label: 'Product ID', value: String(productId) },
        ],
      },
      cta: {
        label: 'Open in dashboard',
        href: getPublicAppUrlForPath(`/dashboard/admin/products/${productId}`),
      },
      signoff: false,
      footerReason: "Internal alert sent to the store's admin address. Customers never receive this message.",
    }),
    fromName: 'Kalakraft Inventory',
  })
}

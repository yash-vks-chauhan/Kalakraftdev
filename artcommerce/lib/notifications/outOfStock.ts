import { getPublicAppUrlForPath } from '../appUrl'
import { renderEmail } from '../emailTemplate'
import { sendAdminMail } from '../mailer'

interface OutOfStockEmailParams {
  productId: number
  productName: string
}

export async function sendOutOfStockEmail({
  productId,
  productName,
}: OutOfStockEmailParams) {
  await sendAdminMail({
    subject: `Out of stock: ${productName}`,
    html: renderEmail({
      preheader: `${productName} has sold out.`,
      eyebrow: 'Inventory · staff notice',
      heading: 'This product has sold out',
      body: ['The last unit just left with an order. The listing will show as unavailable until it is restocked.'],
      module: {
        kind: 'facts',
        title: productName,
        rows: [
          { label: 'Remaining', value: '0 units', accent: true },
          { label: 'Product ID', value: String(productId) },
        ],
      },
      cta: {
        label: 'Restock in dashboard',
        href: getPublicAppUrlForPath(`/dashboard/admin/products/${productId}`),
      },
      signoff: false,
      footerReason: "Internal alert sent to the store's admin address. Customers never receive this message.",
    }),
    fromName: 'Kalakraft Inventory',
  })
}

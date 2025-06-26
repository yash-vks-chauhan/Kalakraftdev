// File: app/orders/[id]/page.tsx

import Link from 'next/link'
import prisma from '../../../lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Read and verify “token” HTTP‐only cookie.
 * Must `await cookies()` before calling `.get(...)`.
 */
async function getUserIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('token')?.value
  if (!tokenCookie) return null

  try {
    const payload = jwt.verify(tokenCookie, JWT_SECRET) as { userId: number }
    return payload.userId
  } catch (err) {
    console.error('[getUserIdFromCookie] JWT verify failed:', err)
    return null
  }
}

interface OrderItem {
  id: number
  productId: number
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    currency: string
    price: number
    imageUrls: string[] | {}
  }
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  shippingFee: number
  totalAmount: number
  shippingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  billingAddress: {
    line1: string
    city: string
    postalCode: string
    country: string
  }
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  orderItems: OrderItem[]
}

/**
 * Server Component for “Order Details”.
 * Must be `async` so that we can `await cookies()` and `await params`.
 */
export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  // 1) Verify JWT via the cookie:
  const userId = await getUserIdFromCookie()
  if (!userId) {
    // Not logged in → redirect to /auth/login
    redirect('/auth/login')
  }

  // 2) Await params before using its id:
  const { id: orderNumber } = await params

  // 3) Fetch the order by its orderNumber, ensuring it belongs to this user:
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber,
      userId: userId,
    },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
  })

  // 4) If not found (or belongs to another user), show a “Not Found” message:
  if (!order) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p>
          We couldn’t find an order with that number, or you don’t have permission
          to view it.
        </p>
        <p className="mt-6">
          <Link href="/orders" className="text-blue-600 hover:underline">
            ← Back to All Orders
          </Link>
        </p>
      </main>
    )
  }

  // 5) Otherwise, render the order details:
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        Order #{order.orderNumber}
      </h1>
      <p className="mb-2">
        <strong>Status:</strong>{' '}
        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </p>
      <p className="mb-6">
        <strong>Placed on:</strong>{' '}
        {new Date(order.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {/* ─── Items Table ────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-semibold mb-2">Items</h2>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Product</th>
            <th className="border px-4 py-2 text-center">Qty</th>
            <th className="border px-4 py-2 text-right">Unit Price</th>
            <th className="border px-4 py-2 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item) => {
            const unitPrice = item.priceAtPurchase.toFixed(2)
            const lineTotal = (item.quantity * item.priceAtPurchase).toFixed(2)
            return (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.product.name}</td>
                <td className="border px-4 py-2 text-center">{item.quantity}</td>
                <td className="border px-4 py-2 text-right">
                  {item.product.currency} {unitPrice}
                </td>
                <td className="border px-4 py-2 text-right">
                  {item.product.currency} {lineTotal}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              className="border px-4 py-2 text-right font-semibold"
            >
              Subtotal:
            </td>
            <td className="border px-4 py-2 text-right font-semibold">
              {order.orderItems[0].product.currency}{' '}
              {order.subtotal.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="border px-4 py-2 text-right font-semibold"
            >
              Tax (5%):
            </td>
            <td className="border px-4 py-2 text-right font-semibold">
              {order.orderItems[0].product.currency}{' '}
              {order.tax.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="border px-4 py-2 text-right font-semibold"
            >
              Shipping Fee:
            </td>
            <td className="border px-4 py-2 text-right font-semibold">
              {order.orderItems[0].product.currency}{' '}
              {order.shippingFee.toFixed(2)}
            </td>
          </tr>
          <tr className="bg-gray-100">
            <td
              colSpan={3}
              className="border px-4 py-2 text-right text-lg font-bold"
            >
              Total:
            </td>
            <td className="border px-4 py-2 text-right text-lg font-bold">
              {order.orderItems[0].product.currency}{' '}
              {order.totalAmount.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ─── Addresses ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Shipping Address
          </h2>
          <p>{order.shippingAddress.line1}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Billing Address
          </h2>
          <p>{order.billingAddress.line1}</p>
          <p>
            {order.billingAddress.city}, {order.billingAddress.postalCode}
          </p>
          <p>{order.billingAddress.country}</p>
        </div>
      </div>

      {/* ─── Payment Details ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Payment</h2>
        <p>
          <strong>Method:</strong> {order.paymentMethod}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {order.paymentStatus.charAt(0).toUpperCase() +
            order.paymentStatus.slice(1)}
        </p>
      </div>

      <p>
        <Link href="/orders" className="text-blue-600 hover:underline">
          ← Back to All Orders
        </Link>
      </p>
    </main>
  )
}
// @ts-nocheck
import { NextResponse } from 'next/server'
import { getSecureMailer } from '../../../lib/mailer'
import prisma from '../../../lib/prisma'
import { orderEvents } from '../../../lib/orderEvents'
import { PrismaClient, Order, OrderItem, Product, User } from '@prisma/client'
import { sendOrderNotificationEmail } from '../../../lib/notifications/sendinblue'
import pusher from '../../../lib/pusher'
import { sendLowStockEmail } from '../../../lib/notifications/lowStock'
import { sendOutOfStockEmail } from '../../../lib/notifications/outOfStock'
import { getAuthenticatedUser } from '../../../lib/session-auth'

const OUT_OF_STOCK_ERROR_PREFIX = 'INSUFFICIENT_STOCK:'

export async function GET(request: Request) {
  try {
    const payload = await getAuthenticatedUser(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const queryUserId = url.searchParams.get('userId')

    let where: any = {}

    // normal users always only see their own
    if (payload.role !== 'admin') {
      where.userId = payload.id
    }
    // admins, if they passed a userId, filter by it
    else if (queryUserId) {
      where.userId = queryUserId
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                currency: true,
                imageUrls: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[orders GET] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // 1️⃣ Authenticate
  const payload = await getAuthenticatedUser(request)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = payload.id

  // 2️⃣ Parse body
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { addressId, billingAddressId, paymentMethod } = body
  const couponCode = typeof body.couponCode === 'string'
    ? body.couponCode.trim().toUpperCase()
    : ''
  if (!addressId) return NextResponse.json({ error: 'Missing addressId' }, { status: 400 })

  // 3️⃣ Load shipping & billing addresses
  const shippingAddr = await prisma.address.findFirst({ where: { id: addressId, userId } })
  if (!shippingAddr) return NextResponse.json({ error: 'Shipping address not found' }, { status: 404 })

  let billingAddr = shippingAddr
  if (billingAddressId) {
    const found = await prisma.address.findFirst({ where: { id: billingAddressId, userId } })
    if (!found) return NextResponse.json({ error: 'Billing address not found' }, { status: 404 })
    billingAddr = found
  }

  // 4️⃣ Fetch cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  })
  if (cartItems.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  const productById = new Map(cartItems.map((item) => [item.productId, item.product]))

  // 5️⃣ Compute totals
  const subtotal = cartItems.reduce((sum, i) => sum + i.quantity * i.product.price, 0)
  const tax = parseFloat((subtotal * 0.05).toFixed(2))
  const shippingFee = parseFloat((subtotal > 100 ? 0 : 10).toFixed(2))

  // Handle coupon discount
  let discountAmount = 0
  let applicableCoupon: { id: number; usageLimit: number | null } | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
    if (coupon && coupon.expiresAt > new Date() && (coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit)) {
      if (coupon.type === 'percentage') {
        // Calculate percentage discount on subtotal + tax + shipping
        discountAmount = parseFloat(((subtotal + tax + shippingFee) * (coupon.amount / 100)).toFixed(2))
      } else {
        // Fixed amount discount
        discountAmount = coupon.amount
      }
      applicableCoupon = { id: coupon.id, usageLimit: coupon.usageLimit }
    } else {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 })
    }
  }

  const totalAmount = parseFloat((subtotal + tax + shippingFee).toFixed(2))
  const discountedTotal = Math.max(0, parseFloat((totalAmount - discountAmount).toFixed(2)))
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // 6️⃣ Create order & items
  let createdOrder: Order & {
    orderItems: (OrderItem & { product: Product })[];
    user: Pick<User, 'email' | 'fullName'>;
  }
  let stockAfterPurchase: Array<{
    id: number
    name: string
    stockQuantity: number
  }> = []
  try {
    createdOrder = await prisma.$transaction(async (tx) => {
      if (applicableCoupon) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: applicableCoupon.id,
            expiresAt: { gt: new Date() },
            ...(applicableCoupon.usageLimit == null
              ? {}
              : { usedCount: { lt: applicableCoupon.usageLimit } }),
          },
          data: { usedCount: { increment: 1 } },
        })

        if (couponUpdate.count === 0) {
          throw new Error('COUPON_NO_LONGER_AVAILABLE')
        }
      }

      for (const item of cartItems) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        })

        if (stockUpdate.count === 0) {
          throw new Error(`${OUT_OF_STOCK_ERROR_PREFIX}${item.productId}`)
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: 'pending',
          subtotal,
          tax,
          shippingFee,
          discountAmount,
          discountedTotal,
          totalAmount: discountedTotal,
          couponCode: couponCode || null,
          shippingAddress: {
            line1: shippingAddr.line1,
            line2: shippingAddr.line2,
            city: shippingAddr.city,
            postalCode: shippingAddr.postalCode,
            country: shippingAddr.country,
          },
          billingAddress: {
            line1: billingAddr.line1,
            line2: billingAddr.line2,
            city: billingAddr.city,
            postalCode: billingAddr.postalCode,
            country: billingAddr.country,
          },
          paymentMethod,
          paymentStatus: 'unpaid',
          orderItems: {
            create: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
        include: {
          orderItems: { include: { product: true } },
          user: { select: { email: true, fullName: true } },
        },
      })

      stockAfterPurchase = await tx.product.findMany({
        where: {
          id: {
            in: cartItems.map((item) => item.productId),
          },
        },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
        },
      })

      await tx.cartItem.deleteMany({ where: { userId } })

      return order
    })
    // Emit Pusher event for real-time admin notification
    const products = createdOrder.orderItems.map(item => item.product.name)
    pusher.trigger('private-admin-channel', 'new-order', {
      id: createdOrder.id,
      total: createdOrder.totalAmount,
      customerName: createdOrder.user.fullName,
      products, // Array of product names
    })
    .catch((err: Error) => console.error('❌ [order route] Pusher error:', err))

    // fire-and-forget: send admin email via Sendinblue
    const shippingAddress = createdOrder.shippingAddress as {
      line1: string;
      city: string;
      country: string;
      postalCode: string;
    } | null;
    
    const orderForEmail = {
      id: createdOrder.id,
      items: createdOrder.orderItems.map(it => ({
        productId: String(it.productId),
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.priceAtPurchase,
      })),
      total: createdOrder.totalAmount,
      customer: {
        name: createdOrder.user.fullName!,
        email: createdOrder.user.email!,
        address: {
          street: shippingAddress?.line1 || '',
          city: shippingAddress?.city || '',
          state: shippingAddress?.country || '',
          zip: shippingAddress?.postalCode || '',
        },
      },
      createdAt: createdOrder.createdAt.toISOString(),
    };
    
    sendOrderNotificationEmail(orderForEmail)
    .catch(err => console.error('❌ Failed admin email:', err))

    // ─── 7️⃣ Check resulting stock levels after the transactional reservation ─────────
    const LOW_STOCK_THRESHOLD = 5
    const updatedProductsById = new Map(stockAfterPurchase.map((product) => [product.id, product]))

    for (const item of createdOrder.orderItems) {
      const updated = updatedProductsById.get(item.productId)
      if (!updated) continue

      if (updated.stockQuantity <= 0) {
        // OUT OF STOCK
        await sendOutOfStockEmail({
          productId: updated.id,
          productName: updated.name,
        }).catch(console.error)

        pusher.trigger('private-admin-channel', 'out-of-stock', {
          productId: updated.id,
          productName: updated.name,
        }).catch(console.error)

      } else if (updated.stockQuantity <= LOW_STOCK_THRESHOLD) {
        // LOW STOCK (but not out)
        await sendLowStockEmail({
          productId: updated.id,
          productName: updated.name,
          remaining: updated.stockQuantity,
          threshold: LOW_STOCK_THRESHOLD,
        }).catch(console.error)

        pusher.trigger('private-admin-channel', 'low-stock', {
          productId: updated.id,
          productName: updated.name,
          remaining: updated.stockQuantity,
        }).catch(console.error)
      }
    }
  } catch (dbErr) {
    if (dbErr instanceof Error) {
      if (dbErr.message === 'COUPON_NO_LONGER_AVAILABLE') {
        return NextResponse.json(
          { error: 'Coupon is no longer available' },
          { status: 409 }
        )
      }

      if (dbErr.message.startsWith(OUT_OF_STOCK_ERROR_PREFIX)) {
        const productId = Number(dbErr.message.slice(OUT_OF_STOCK_ERROR_PREFIX.length))
        const product = productById.get(productId)
        return NextResponse.json(
          {
            error: product
              ? `${product.name} is no longer available in the requested quantity`
              : 'One or more items are no longer available in the requested quantity',
          },
          { status: 409 }
        )
      }
    }
    console.error('❌ [order route] Error creating order:', dbErr)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  // 8️⃣ Send confirmation email
  const customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  })
  const toEmail = customer?.email

  if (toEmail) {
    try {
      const { transporter, smtpUser } = getSecureMailer()

      // build the HTML body
      const itemsRows = createdOrder.orderItems.map(item => {
        const unit = item.priceAtPurchase.toFixed(2)
        const line = (item.quantity * item.priceAtPurchase).toFixed(2)
        return `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${item.product.name}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.product.currency} ${unit}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.product.currency} ${line}</td>
          </tr>
        `
      }).join('')

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;color:#333;">
          <h2>Thank you for your order!</h2>
          <p>Order Number: <b>${createdOrder.orderNumber}</b></p>
          <h3>Order Summary</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f5f5f5;">
              <th style="padding:12px;border:1px solid #ddd;text-align:left;">Product</th>
              <th style="padding:12px;border:1px solid #ddd;text-align:center;">Qty</th>
              <th style="padding:12px;border:1px solid #ddd;text-align:right;">Unit Price</th>
              <th style="padding:12px;border:1px solid #ddd;text-align:right;">Line Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
            <tfoot>
              <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Subtotal:</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right;">${createdOrder.orderItems[0].product.currency} ${createdOrder.subtotal.toFixed(2)}</td>
              </tr>
              <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Tax (5%):</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right;">${createdOrder.orderItems[0].product.currency} ${createdOrder.tax.toFixed(2)}</td>
              </tr>
              <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Shipping Fee:</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right;">${createdOrder.orderItems[0].product.currency} ${createdOrder.shippingFee.toFixed(2)}</td>
              </tr>
              ${(createdOrder.discountAmount ?? 0) > 0 ? `
              <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Discount:</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:right;">${createdOrder.orderItems[0].product.currency} ${(createdOrder.discountAmount ?? 0).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="background:#f5f5f5;">
                <td colspan="3" style="padding:12px;border:1px solid #ddd;text-align:right;font-weight:bold;">Total:</td>
                <td style="padding:12px;border:1px solid #ddd;text-align:right;font-size:1.1em;font-weight:bold;">${createdOrder.orderItems[0].product.currency} ${(createdOrder.discountedTotal ?? createdOrder.totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p>We'll notify you again once your items ship. Thanks for shopping!</p>
        </div>
      `

      await transporter.sendMail({
        from:    `"Artcommerce" <${smtpUser}>`,
        to:      toEmail,
        subject: `Order Confirmation (#${createdOrder.orderNumber})`,
        html:    htmlBody,
      })
    } catch (emailErr) {
      console.error('❌ [order route] Error sending confirmation email:', emailErr)
      // we don't block on mail failures
    }
  }

  // 🔟 Return the order
  return NextResponse.json({ order: createdOrder })
}

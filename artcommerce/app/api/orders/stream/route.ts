import { NextResponse } from 'next/server'
import { requireAdminUser } from '../../../../lib/session-auth'
import { orderEvents } from '../../../../lib/orderEvents'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  let onOrder: ((data: string) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // when a new order event fires, enqueue it as SSE
      onOrder = (data: string) => {
        controller.enqueue(
          encoder.encode(`data: ${data}\n\n`)
        )
      }
      orderEvents.on('order', onOrder)
    },
    cancel() {
      if (onOrder) {
        orderEvents.off('order', onOrder)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}

import { NextResponse } from 'next/server'
import { orderEvents } from '@/lib/orderEvents'
import { requireAdminFromRequest } from '@/lib/auth-helpers'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // when a new order event fires, enqueue it as SSE
      const onOrder = (data: string) => {
        controller.enqueue(
          new TextEncoder().encode(`data: ${data}\n\n`)
        )
      }
      orderEvents.on('order', onOrder)

      // clean up when client disconnects
      controller.signal.addEventListener('abort', () => {
        orderEvents.off('order', onOrder)
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
  })
}

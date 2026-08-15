'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/** The desktop error branch, shared by the create and edit routes. */
export function ProductFormError({ message }: { message: string }) {
  return (
    <main className="flex flex-col gap-4">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">Unable to open this page</p>
          <p className="text-xs text-muted-foreground">{message}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/admin/products">Back to products</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

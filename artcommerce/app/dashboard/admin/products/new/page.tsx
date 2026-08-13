// File: app/dashboard/admin/products/new/page.tsx

'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { useIsDesktop } from '../../../../hooks/useMediaQuery'
import {
  NewProductDesktop,
  NewProductDesktopSkeleton,
} from './_components/NewProductDesktop'
import {
  NewProductMobile,
  NewProductMobileError,
  NewProductMobileSkeleton,
} from './_components/NewProductMobile'
import { useNewProductForm } from './_lib/product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Two trees, one source of state.
 *
 * `useIsDesktop` picks between them rather than rendering both and hiding one:
 * the phone screen is a step flow with its own sheets and a fixed action bar,
 * not the workspace at a smaller width, and mounting both would run two copies
 * of the same dropzones and uploads.
 */
export default function NewProductPage() {
  const form = useNewProductForm()
  const isDesktop = useIsDesktop()

  if (form.bootstrapping) {
    return isDesktop ? <NewProductDesktopSkeleton /> : <NewProductMobileSkeleton />
  }

  if (form.error) {
    if (!isDesktop) {
      return <NewProductMobileError message={form.error} onBack={form.goToList} />
    }
    return (
      <main className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Create product</h1>
        </header>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Unable to open this page</p>
            <p className="text-xs text-muted-foreground">{form.error}</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return isDesktop ? <NewProductDesktop form={form} /> : <NewProductMobile form={form} />
}

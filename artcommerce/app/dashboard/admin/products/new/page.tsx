// File: app/dashboard/admin/products/new/page.tsx

'use client'

import { useIsDesktop } from '../../../../hooks/useMediaQuery'
import {
  ProductFormDesktop,
  ProductFormDesktopSkeleton,
} from '../_components/ProductFormDesktop'
import {
  ProductFormMobile,
  ProductFormMobileError,
  ProductFormMobileSkeleton,
} from '../_components/ProductFormMobile'
import { ProductFormError } from '../_components/ProductFormError'
import { useProductForm } from '../_lib/product-form'

/**
 * Two trees, one source of state.
 *
 * `useIsDesktop` picks between them rather than rendering both and hiding one:
 * the phone screen is a step flow with its own sheets and a fixed action bar,
 * not the workspace at a smaller width, and mounting both would run two copies
 * of the same dropzones and uploads.
 *
 * The edit route renders the same two trees in `edit` mode — see
 * ../[id]/page.tsx.
 */
export default function NewProductPage() {
  const form = useProductForm({ mode: 'create' })
  const isDesktop = useIsDesktop()

  if (form.bootstrapping) {
    return isDesktop ? <ProductFormDesktopSkeleton /> : <ProductFormMobileSkeleton />
  }

  if (form.error) {
    return isDesktop ? (
      <ProductFormError message={form.error} />
    ) : (
      <ProductFormMobileError message={form.error} onBack={form.goToList} />
    )
  }

  return isDesktop ? <ProductFormDesktop form={form} /> : <ProductFormMobile form={form} />
}

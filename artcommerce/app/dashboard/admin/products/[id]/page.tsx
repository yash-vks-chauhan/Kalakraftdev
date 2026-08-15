// File: app/dashboard/admin/products/[id]/page.tsx

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

import { useIsDesktop } from '../../../../hooks/useMediaQuery'
import ConfirmDialog from '../../../../components/ConfirmDialog'
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
 * Editing a product is the same screen as creating one, in `edit` mode.
 *
 * It used to be a separate 900-line page with its own CSS module, its own
 * icon set and its own idea of what a form looks like — so the admin met two
 * different UIs for one record, and every fix to the create flow had to be
 * made twice or not at all. The form hydrates from the record, only offers
 * Save once something has actually changed, and carries the record's own
 * actions: discard, open on the storefront, delete.
 */
export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const productId = Number(params?.id)
  const isDesktop = useIsDesktop()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const form = useProductForm({
    mode: 'edit',
    productId: Number.isFinite(productId) ? productId : undefined,
  })

  if (!Number.isFinite(productId)) {
    return isDesktop ? (
      <ProductFormError message="That product id is not a number." />
    ) : (
      <ProductFormMobileError
        message="That product id is not a number."
        onBack={form.goToList}
      />
    )
  }

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

  if (!isDesktop) {
    // The phone keeps delete inside the Review sheet, which owns its own
    // confirmation — nothing more to wire here.
    return <ProductFormMobile form={form} />
  }

  return (
    <>
      <ProductFormDesktop form={form} onDelete={() => setConfirmDelete(true)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete product"
        description={`Delete "${
          form.name.trim() || 'this product'
        }" permanently? This action cannot be undone.`}
        confirmLabel="Delete product"
        isProcessing={form.deleting}
        onConfirm={() => void form.remove()}
        onClose={() => {
          if (!form.deleting) setConfirmDelete(false)
        }}
      />
    </>
  )
}

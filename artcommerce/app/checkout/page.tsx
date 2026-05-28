import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import CheckoutClient from "./CheckoutClient"

function CheckoutFallback() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading checkout…
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  )
}

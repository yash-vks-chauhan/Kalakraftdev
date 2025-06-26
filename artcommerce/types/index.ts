 // src/types/index.ts
export interface OrderItem {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }
  
  export interface Address {
    street: string
    city: string
    state: string
    zip: string
  }
  
  export interface Order {
    id: number
    items: OrderItem[]
    total: number
    customer: { name: string; email: string; address: Address }
    createdAt: string
  }
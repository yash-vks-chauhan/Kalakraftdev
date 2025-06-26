// File: app/contexts/CartContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useNotificationContext } from './NotificationContext'

export interface CartItem {
  id: number
  productId: number
  quantity: number
  product: {
    id: number
    name: string
    price: number
    currency: string
    imageUrls: string[]
    stockQuantity?: number
  }
}

interface CartContextValue {
  cartItems: CartItem[]
  addToCart: (productId: number, quantity: number) => Promise<boolean>
  updateCartItem: (cartItemId: number, quantity: number) => Promise<boolean>
  removeFromCart: (cartItemId: number) => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { addNotification } = useNotificationContext()

  // Whenever token changes (login/logout), fetch or clear cart
  useEffect(() => {
    if (!token) {
      setCartItems([])
      return
    }
    async function fetchCart() {
      try {
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch cart')
        const data = await res.json()
        setCartItems(Array.isArray(data.cartItems) ? data.cartItems : [])
      } catch (err) {
        console.error(err)
        setCartItems([])
      }
    }
    fetchCart()
  }, [token])

  // Add a single item
  async function addToCart(productId: number, quantity: number): Promise<boolean> {
    if (!token) throw new Error('Not authenticated')
    
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // Handle specific error cases
        if (data.error && data.error.includes('out of stock')) {
          addNotification({
            title: 'Product Unavailable',
            body: 'This product is currently out of stock.',
            category: 'user',
            severity: 'error'
          })
        } else if (data.error && data.error.includes('available in stock')) {
          addNotification({
            title: 'Limited Stock',
            body: data.error,
            category: 'user',
            severity: 'warning'
          })
        } else {
          addNotification({
            title: 'Error',
            body: data.error || 'Could not add to cart',
            category: 'user',
            severity: 'error'
          })
        }
        
        return false
      }
      
      // Success - append the newly created item to local state
      setCartItems((prev) => [...prev, data.cartItem])
      
      addNotification({
        title: 'Added to Cart',
        body: 'Item successfully added to your cart',
        category: 'user',
        severity: 'success'
      })
      
      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      addNotification({
        title: 'Error',
        body: 'Failed to add item to cart',
        category: 'user',
        severity: 'error'
      })
      return false
    }
  }

  // Update an existing cart item
  async function updateCartItem(cartItemId: number, quantity: number): Promise<boolean> {
    if (!token) throw new Error('Not authenticated')
    
    try {
      const res = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      })
      
      let data;
      try {
        data = await res.json();
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        // Update the local state anyway to maintain UI responsiveness
        setCartItems((prev) =>
          prev.map((ci) =>
            ci.id === cartItemId ? { ...ci, quantity } : ci
          )
        );
        return false;
      }
      
      if (!res.ok) {
        // Handle stock validation errors
        if (data.error && data.error.includes('available in stock')) {
          const availableStock = data.availableStock || 0;
          
          addNotification({
            title: 'Limited Stock',
            body: data.error,
            category: 'user',
            severity: 'warning'
          });
          
          // Update with the maximum available quantity
          if (availableStock > 0) {
            // Make another request with the available quantity
            const updateRes = await fetch(`/api/cart/${cartItemId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ quantity: availableStock }),
            });
            
            if (updateRes.ok) {
              const updateData = await updateRes.json();
              setCartItems((prev) =>
                prev.map((ci) =>
                  ci.id === cartItemId ? { ...ci, quantity: availableStock } : ci
                )
              );
              
              addNotification({
                title: 'Quantity Adjusted',
                body: `Quantity has been adjusted to the maximum available (${availableStock})`,
                category: 'user',
                severity: 'info'
              });
            }
          }
          
          return false;
        } else {
          addNotification({
            title: 'Error',
            body: data?.error || 'Could not update cart item',
            category: 'user',
            severity: 'error'
          });
          return false;
        }
      }
      
      setCartItems((prev) =>
        prev.map((ci) =>
          ci.id === cartItemId ? { ...ci, quantity: data.cartItem?.quantity || quantity } : ci
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      addNotification({
        title: 'Error',
        body: 'Failed to update item quantity',
        category: 'user',
        severity: 'error'
      });
      return false;
    }
  }

  // Remove a cart item
  async function removeFromCart(cartItemId: number) {
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(`/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    
    let data;
    try {
      data = await res.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      // Remove the item from local state anyway
      setCartItems((prev) => prev.filter((ci) => ci.id !== cartItemId));
      return;
    }
    
    if (!res.ok) {
      throw new Error(data?.error || 'Could not remove from cart')
    }
    
    setCartItems((prev) => prev.filter((ci) => ci.id !== cartItemId))
  }

  function clearCart() {
    setCartItems([])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
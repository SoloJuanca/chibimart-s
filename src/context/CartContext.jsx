import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CART_STORAGE_KEY = 'chibimart_cart_v1'

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
})

const readStoredCart = () => {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStoredCart())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (nextItem) => {
    if (!nextItem?.key) return
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === nextItem.key)
      if (existingIndex === -1) {
        return [...prev, nextItem]
      }
      const updated = [...prev]
      const existing = updated[existingIndex]
      updated[existingIndex] = {
        ...existing,
        quantity: (existing.quantity || 0) + (nextItem.quantity || 1),
      }
      return updated
    })
  }

  const removeItem = (itemKey) => {
    if (!itemKey) return
    setItems((prev) => prev.filter((item) => item.key !== itemKey))
  }

  const clearCart = () => setItems([])

  const value = useMemo(() => ({ items, addItem, removeItem, clearCart }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)

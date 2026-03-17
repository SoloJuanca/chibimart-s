import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CART_STORAGE_KEY = 'chibimart_cart_v1'

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  setItemQuantity: () => {},
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
      const maxQty = nextItem.maxQuantity ?? (existingIndex >= 0 ? prev[existingIndex].maxQuantity : null) ?? 999999
      const addQty = Math.min(nextItem.quantity ?? 1, maxQty)
      if (existingIndex === -1) {
        return [...prev, { ...nextItem, quantity: Math.min(addQty, maxQty) }]
      }
      const updated = [...prev]
      const existing = updated[existingIndex]
      const newQuantity = Math.min((existing.quantity || 0) + addQty, maxQty)
      updated[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        maxQuantity: maxQty !== 999999 ? maxQty : existing.maxQuantity,
      }
      return updated
    })
  }

  const removeItem = (itemKey) => {
    if (!itemKey) return
    setItems((prev) => prev.filter((item) => item.key !== itemKey))
  }

  const setItemQuantity = (itemKey, quantity) => {
    if (!itemKey || quantity == null) return
    const q = Math.max(0, Math.floor(Number(quantity)))
    if (!Number.isFinite(q)) return
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.key === itemKey)
      if (idx === -1) return prev
      const existing = prev[idx]
      const maxQty = existing.maxQuantity ?? 999999
      const newQty = Math.min(q, maxQty)
      const updated = [...prev]
      updated[idx] = { ...existing, quantity: newQty }
      return updated
    })
  }

  const clearCart = () => setItems([])

  const value = useMemo(() => ({ items, addItem, removeItem, setItemQuantity, clearCart }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)

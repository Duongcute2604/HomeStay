import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastState {
  toasts: Toast[]
  themToast: (message: string, type: 'success' | 'error') => void
  xoaToast: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  themToast: (message, type) => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  xoaToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

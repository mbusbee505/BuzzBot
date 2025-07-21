'use client'

import React, { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

const toastState: ToastState = {
  toasts: []
}

let toastCount = 0
const listeners: Array<(state: ToastState) => void> = []

function dispatch(action: { type: string; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        toastState.toasts = [...toastState.toasts, action.toast]
      }
      break
    case 'UPDATE_TOAST':
      if (action.toast) {
        toastState.toasts = toastState.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        )
      }
      break
    case 'DISMISS_TOAST':
      if (action.toastId) {
        toastState.toasts = toastState.toasts.filter((t) => t.id !== action.toastId)
      }
      break
    case 'REMOVE_TOAST':
      if (action.toastId) {
        toastState.toasts = toastState.toasts.filter((t) => t.id !== action.toastId)
      }
      break
  }

  listeners.forEach((listener) => {
    listener(toastState)
  })
}

function toast({ ...props }: Omit<Toast, 'id'>) {
  const id = (++toastCount).toString()

  const update = (props: Partial<Toast>) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id }
    })
  
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id
    }
  })

  return {
    id,
    dismiss,
    update
  }
}

function useToast() {
  const [state, setState] = useState<ToastState>(toastState)

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  React.useEffect(() => {
    return subscribe(setState)
  }, [subscribe])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: 'DISMISS_TOAST', toastId })
  }
}

export { useToast, toast } 
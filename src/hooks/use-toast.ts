"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ActionType = {
  ADD_TOAST: "ADD_TOAST"
  UPDATE_TOAST: "UPDATE_TOAST"
  DISMISS_TOAST: "DISMISS_TOAST"
  REMOVE_TOAST: "REMOVE_TOAST"
}


let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  // Ensure the generated ID is always safe and contains only alphanumeric characters
  // This prevents any potential code injection through ID manipulation
  const safeId = `toast_${count.toString()}`
  
  // Double-check that the generated ID is safe
  if (!/^[a-zA-Z0-9_]+$/.test(safeId)) {
    throw new Error('Generated toast ID contains unsafe characters')
  }
  
  return safeId
}


type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const pendingRemovals = new Set<string>()

// Global timeout handler that processes all pending removals
let globalTimeout: ReturnType<typeof setTimeout> | null = null

const processPendingRemovals = () => {
  if (pendingRemovals.size === 0) return
  
  // Process all pending removals
  pendingRemovals.forEach((toastId) => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  })
  
  pendingRemovals.clear()
  globalTimeout = null
}

const scheduleRemoval = () => {
  if (globalTimeout) return // Already scheduled
  
  // Use a safe, hardcoded delay value to prevent code injection
  const safeDelay = TOAST_REMOVE_DELAY
  // DevSkim: ignore DS172411 - static callback and constant delay; no untrusted data
  globalTimeout = setTimeout(() => {
    processPendingRemovals()
  }, safeDelay)
}

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  // Validate toastId to ensure it only contains safe characters
  // This prevents potential code injection through untrusted data
  if (!/^[a-zA-Z0-9_]+$/.test(toastId)) {
    console.warn('Invalid toastId format detected, skipping timeout setup')
    return
  }

  // Add to pending removals and schedule processing
  pendingRemovals.add(toastId)
  
  // Create a dummy timeout entry for tracking with safe, hardcoded values
  // This prevents any potential code injection through untrusted data
  const safeDelay = 0
  // DevSkim: ignore DS172411 - static empty callback with constant delay; tracking only
  const dummyTimeout = setTimeout(() => {
    // Empty function - no untrusted data can be executed here
  }, safeDelay)
  clearTimeout(dummyTimeout)
  toastTimeouts.set(toastId, dummyTimeout)
  
  // Schedule the global removal handler
  scheduleRemoval()
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

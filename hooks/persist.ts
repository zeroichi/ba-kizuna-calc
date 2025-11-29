'use client'

import { useState } from "react"

const getFromLocalStorage = <T>(key: string) => {
  if (typeof window !== 'undefined') {
    // for Client (Browser)
    const item = localStorage.getItem(key) ?? "null"
    return JSON.parse(item) as T ?? undefined
  } else {
    // for Server
    return undefined
  }
}

const setToLocalStorage = <T>(key: string, object: T) => {
  const jsonStr = JSON.stringify(object)
  if (typeof window !== 'undefined') {
    // for Client (Browser)
    localStorage.setItem(key, jsonStr)
  } else {
    // for Server
    return undefined
  }
}

export const useLocalPersistence = <T>(key: string, initialData: T) => {
  const state = useState(getFromLocalStorage(key) as T ?? initialData)
  const dispatcher = (object: T) => {
    setToLocalStorage(key, object)
  }
  return [state[0], dispatcher] as typeof state
}

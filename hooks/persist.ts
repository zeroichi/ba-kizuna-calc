'use client'

import { useState } from "react"

const getFromLocalStorage = <T>(key: string) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key) ?? "null"
    console.log("got from localStorage:", item)
    return JSON.parse(item) as T ?? undefined
  }
}

const setToLocalStorage = <T>(key: string, object: T) => {
  if (typeof window !== 'undefined') {
    const jsonStr = JSON.stringify(object)
    console.log("set to localStorage:", jsonStr)
    localStorage.setItem(key, jsonStr)
  }
}

export const useLocalPersistence = <T>(key: string) => {
  const state = useState(getFromLocalStorage(key) as T | undefined)
  const dispatcher = (object: T) => {
    setToLocalStorage(key, object)
  }
  return [state[0], dispatcher] as typeof state
}

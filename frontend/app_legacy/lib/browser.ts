"use client"

import { useEffect, useLayoutEffect } from "react"

export const IS_BROWSER = typeof window !== "undefined"

export function inBrowser<T>(fn: () => T, fallback: T): T {
  return IS_BROWSER ? fn() : fallback
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    return inBrowser(() => localStorage.getItem(key), null)
  },
  setItem: (key: string, value: string): void => {
    inBrowser(() => localStorage.setItem(key, value), undefined)
  },
  removeItem: (key: string): void => {
    inBrowser(() => localStorage.removeItem(key), undefined)
  },
}

export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
) {
  useEffect(() => {
    if (!IS_BROWSER) return

    window.addEventListener(type, listener, options)
    return () => window.removeEventListener(type, listener, options)
  }, [type, listener, options])
}

export const useSSRSafeLayoutEffect = IS_BROWSER ? useLayoutEffect : useEffect

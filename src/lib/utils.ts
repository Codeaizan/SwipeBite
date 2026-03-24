import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSafeImageUrl(src: string | null | undefined, fallback = 'https://placehold.co/400x400/1a1a1a/666?text=No+Image') {
  if (!src) return fallback
  if (src.startsWith('/')) return src
  try {
    const parsed = new URL(src)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? src : fallback
  } catch {
    return fallback
  }
}

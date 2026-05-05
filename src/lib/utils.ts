import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDeviceOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false;
  const lastSeenTime = new Date(lastSeenAt).getTime();
  if (isNaN(lastSeenTime)) return false;
  
  // Consider offline if last seen was more than 1 hour (3600000 ms) ago
  const ONE_HOUR = 60 * 60 * 1000;
  return (Date.now() - lastSeenTime) <= ONE_HOUR;
}

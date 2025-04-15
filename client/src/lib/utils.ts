import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reload the current page with options for delay and location path
 * @param {number} delay - Optional delay in milliseconds before reloading
 * @param {string} path - Optional path to navigate to before reloading
 */
export function reloadPage(delay: number = 0, path?: string): void {
  setTimeout(() => {
    if (path) {
      window.location.href = path;
    } else {
      window.location.reload();
    }
  }, delay);
}

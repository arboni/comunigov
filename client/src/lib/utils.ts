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
      // Ensure we don't have double slashes in the URL
      if (path.startsWith('/')) {
        // Remove trailing slashes from base URL if present and add single slash to path
        const baseUrl = window.location.origin.replace(/\/+$/, '');
        window.location.href = `${baseUrl}${path}`;
      } else {
        window.location.href = path;
      }
    } else {
      window.location.reload();
    }
  }, delay);
}

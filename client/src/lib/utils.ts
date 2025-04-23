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

/**
 * Fix encoding issues in text that may have been saved with incorrect character encoding
 * @param text The text to fix
 * @returns The fixed text
 */
export function fixEncoding(text: string | null | undefined): string {
  if (!text) return '';
  
  // Replace common encoding issues
  const replacements: Record<string, string> = {
    '��': 'ã',
    '�o': 'ão',
    '�a': 'ça',
    '�c': 'çã',
    '�e': 'é',
    '�i': 'í',
    '�u': 'ú',
    '�': 'á',
    'C�': 'Câ',
    'Associa��o': 'Associação',
    'Secret�ria': 'Secretária',
    'Respons�vel': 'Responsável'
  };
  
  let fixedText = text;
  
  // Apply all replacements
  Object.entries(replacements).forEach(([incorrect, correct]) => {
    fixedText = fixedText.replace(new RegExp(incorrect, 'g'), correct);
  });
  
  return fixedText;
}

/**
 * Get a display name for an entity type, handling common encoding issues
 * @param type The entity type 
 * @returns A user-friendly display name
 */
export function getEntityTypeDisplay(type: string): string {
  // Normalize the type to handle encoding issues
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('associa')) return 'Associação';
  if (normalizedType.includes('secr')) return 'Secretaria';
  if (normalizedType.includes('govern')) return 'Agência Governamental';
  if (normalizedType.includes('admin')) return 'Unidade Administrativa';
  if (normalizedType.includes('extern')) return 'Entidade Externa';
  if (normalizedType.includes('coun')) return 'Conselho';
  
  // Default: return capitalized type
  return type.charAt(0).toUpperCase() + type.slice(1);
}

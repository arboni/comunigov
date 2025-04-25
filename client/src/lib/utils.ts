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

/**
 * Get color classes for entity type badges based on entity type
 * @param type The entity type
 * @returns An object with background, text, border, and hover classes
 */
export function getEntityTypeColors(type: string): {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  hoverText: string;
} {
  // Normalize the type to handle encoding issues
  const normalizedType = type.toLowerCase();
  
  // Government agencies - blue colors
  if (normalizedType.includes('govern')) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      hoverBg: 'hover:bg-blue-200',
      hoverText: 'hover:text-blue-900'
    };
  }
  
  // Administrative units - indigo colors
  if (normalizedType.includes('admin')) {
    return {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-200',
      hoverText: 'hover:text-indigo-900'
    };
  }
  
  // Secretaries - purple colors
  if (normalizedType.includes('secr')) {
    return {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      hoverBg: 'hover:bg-purple-200',
      hoverText: 'hover:text-purple-900'
    };
  }
  
  // Associations - green colors
  if (normalizedType.includes('associa')) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      hoverBg: 'hover:bg-green-200',
      hoverText: 'hover:text-green-900'
    };
  }
  
  // Councils - amber colors
  if (normalizedType.includes('coun') || normalizedType.includes('consel')) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      hoverBg: 'hover:bg-amber-200',
      hoverText: 'hover:text-amber-900'
    };
  }
  
  // External entities - rose colors
  if (normalizedType.includes('extern')) {
    return {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-200',
      hoverBg: 'hover:bg-rose-200',
      hoverText: 'hover:text-rose-900'
    };
  }
  
  // Default - neutral/gray colors
  return {
    bg: 'bg-neutral-100',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    hoverBg: 'hover:bg-neutral-200',
    hoverText: 'hover:text-neutral-900'
  };
}

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';

// Define all possible tooltip IDs as a union type for type safety
export type TooltipId = 
  // Dashboard
  | 'dashboard-first-visit'
  | 'dashboard-sidebar-navigation'
  | 'dashboard-user-menu'
  
  // Entities
  | 'entities-overview'
  | 'entity-creation'
  | 'entity-import'
  | 'entity-members'
  
  // Subjects
  | 'subjects-overview'
  | 'subject-creation'
  | 'subject-entity-relationship'
  
  // Meetings
  | 'meetings-overview'
  | 'meeting-creation'
  | 'meeting-attendees'
  | 'meeting-reactions'
  
  // Tasks
  | 'tasks-overview'
  | 'task-creation'
  | 'task-assignment'
  
  // Communications
  | 'communications-overview'
  | 'communication-channels'
  | 'communication-attachments'
  
  // User Profile & Settings
  | 'user-profile'
  | 'notification-settings';

interface TooltipsContextType {
  // Check if a tooltip should be shown
  shouldShowTooltip: (id: TooltipId) => boolean;
  
  // Mark a tooltip as seen (won't show again)
  markTooltipAsSeen: (id: TooltipId) => void;
  
  // Reset a single tooltip to show it again
  resetTooltip: (id: TooltipId) => void;
  
  // Reset all tooltips to show them again
  resetAllTooltips: () => void;
  
  // Get all tooltip IDs that have been seen
  getSeenTooltips: () => TooltipId[];
}

// Create context with a default value
const TooltipsContext = createContext<TooltipsContextType | null>(null);

// Helper function to get the storage key for a tooltip ID
const getTooltipStorageKey = (id: TooltipId) => `comunigov-tooltip-seen-${id}`;

// Provider component that wraps the application
export function TooltipsProvider({ children }: { children: ReactNode }) {
  // State to track seen tooltips (for server-side rendering)
  const [seenTooltips, setSeenTooltips] = useState<Set<TooltipId>>(new Set());
  
  // Initialize state from localStorage on mount
  useEffect(() => {
    const initialSeenTooltips = new Set<TooltipId>();
    
    // Get all tooltip IDs that have been marked as seen from localStorage
    Object.values(localStorage)
      .filter(key => key.startsWith('comunigov-tooltip-seen-'))
      .forEach(key => {
        // Extract the ID part from the storage key
        const id = key.replace('comunigov-tooltip-seen-', '') as TooltipId;
        if (localStorage.getItem(getTooltipStorageKey(id)) === 'true') {
          initialSeenTooltips.add(id);
        }
      });
    
    setSeenTooltips(initialSeenTooltips);
  }, []);
  
  // Check if a tooltip should be shown (not marked as seen)
  const shouldShowTooltip = useCallback((id: TooltipId): boolean => {
    // Check both localStorage and state
    if (typeof window !== 'undefined') {
      return localStorage.getItem(getTooltipStorageKey(id)) !== 'true';
    }
    return !seenTooltips.has(id);
  }, [seenTooltips]);
  
  // Mark a tooltip as seen
  const markTooltipAsSeen = useCallback((id: TooltipId): void => {
    localStorage.setItem(getTooltipStorageKey(id), 'true');
    setSeenTooltips(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  }, []);
  
  // Reset a tooltip to show it again
  const resetTooltip = useCallback((id: TooltipId): void => {
    localStorage.removeItem(getTooltipStorageKey(id));
    setSeenTooltips(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);
  
  // Reset all tooltips to show them again
  const resetAllTooltips = useCallback((): void => {
    // Find all tooltip-related items in localStorage and remove them
    Object.keys(localStorage)
      .filter(key => key.startsWith('comunigov-tooltip-seen-'))
      .forEach(key => localStorage.removeItem(key));
    
    // Also remove the welcome tour flag
    localStorage.removeItem('comunigov-has-seen-welcome-tour');
    
    // Reset the state
    setSeenTooltips(new Set());
  }, []);
  
  // Get all tooltip IDs that have been seen
  const getSeenTooltips = useCallback((): TooltipId[] => {
    return Array.from(seenTooltips);
  }, [seenTooltips]);
  
  // Create the context value
  const value = {
    shouldShowTooltip,
    markTooltipAsSeen,
    resetTooltip,
    resetAllTooltips,
    getSeenTooltips
  };
  
  return (
    <TooltipsContext.Provider value={value}>
      {children}
    </TooltipsContext.Provider>
  );
}

// Custom hook to use the tooltips context
export function useTooltips(): TooltipsContextType {
  const context = useContext(TooltipsContext);
  
  if (!context) {
    throw new Error('useTooltips must be used within a TooltipsProvider');
  }
  
  return context;
}
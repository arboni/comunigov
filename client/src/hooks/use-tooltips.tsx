import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from './use-translation';

// Define tooltip IDs for all tooltips in the application
export type TooltipId = 
  // Dashboard tooltips
  | 'dashboard-first-visit'
  | 'dashboard-sidebar-navigation'
  | 'dashboard-user-menu'
  
  // Entity-related tooltips
  | 'entities-overview'
  | 'entity-creation'
  | 'entity-import'
  | 'entity-members'
  
  // Subject-related tooltips
  | 'subjects-overview'
  | 'subject-creation'
  | 'subject-entity-relationship'
  
  // Meeting-related tooltips
  | 'meetings-overview'
  | 'meeting-creation'
  | 'meeting-attendees'
  | 'meeting-reactions'
  
  // Task-related tooltips
  | 'tasks-overview'
  | 'task-creation'
  | 'task-assignment'
  
  // Communication-related tooltips
  | 'communications-overview'
  | 'communication-channels'
  | 'communication-attachments'
  
  // Settings and profile tooltips
  | 'user-profile'
  | 'notification-settings';

// Interface for tooltip context
interface TooltipsContextType {
  // Check if a tooltip should be shown
  shouldShowTooltip: (id: TooltipId) => boolean;
  
  // Mark a tooltip as seen
  markTooltipAsSeen: (id: TooltipId) => void;
  
  // Reset a specific tooltip to be shown again
  resetTooltip: (id: TooltipId) => void;
  
  // Reset all tooltips (for testing or preference reset)
  resetAllTooltips: () => void;
  
  // Get tooltip text by ID
  getTooltipText: (id: TooltipId) => string;
}

// Create the context
const TooltipsContext = createContext<TooltipsContextType | undefined>(undefined);

// Create storage key for localStorage
const TOOLTIPS_STORAGE_KEY = 'comunigov-seen-tooltips';

// Provider component
export function TooltipsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // Track seen tooltips
  const [seenTooltips, setSeenTooltips] = useState<Record<string, boolean>>({});
  
  // Load seen tooltips from localStorage on component mount
  useEffect(() => {
    try {
      const storedTooltips = localStorage.getItem(TOOLTIPS_STORAGE_KEY);
      if (storedTooltips) {
        setSeenTooltips(JSON.parse(storedTooltips));
      }
    } catch (error) {
      console.error('Error loading tooltips data from localStorage:', error);
    }
  }, []);
  
  // Save seen tooltips to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(seenTooltips).length > 0) {
      try {
        localStorage.setItem(TOOLTIPS_STORAGE_KEY, JSON.stringify(seenTooltips));
      } catch (error) {
        console.error('Error saving tooltips data to localStorage:', error);
      }
    }
  }, [seenTooltips]);
  
  // Check if a tooltip should be shown
  const shouldShowTooltip = (id: TooltipId): boolean => {
    return !seenTooltips[id];
  };
  
  // Mark a tooltip as seen
  const markTooltipAsSeen = (id: TooltipId): void => {
    setSeenTooltips(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  // Reset a specific tooltip
  const resetTooltip = (id: TooltipId): void => {
    setSeenTooltips(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };
  
  // Reset all tooltips
  const resetAllTooltips = (): void => {
    setSeenTooltips({});
    try {
      localStorage.removeItem(TOOLTIPS_STORAGE_KEY);
    } catch (error) {
      console.error('Error removing tooltips data from localStorage:', error);
    }
  };
  
  // Get tooltip text by ID
  const getTooltipText = (id: TooltipId): string => {
    // We'll use the translation framework to get the tooltips in the correct language
    // Default fallback text in case translation is missing
    const defaultText = 'Dica útil para ajudar a navegar nesta funcionalidade.';
    
    // Map tooltip IDs to translation keys
    const tooltipKey = `tooltips.${id}`;
    return t(tooltipKey, defaultText);
  };
  
  return (
    <TooltipsContext.Provider 
      value={{
        shouldShowTooltip,
        markTooltipAsSeen,
        resetTooltip,
        resetAllTooltips,
        getTooltipText
      }}
    >
      {children}
    </TooltipsContext.Provider>
  );
}

// Custom hook to use the tooltips context
export function useTooltips() {
  const context = useContext(TooltipsContext);
  
  if (context === undefined) {
    throw new Error('useTooltips must be used within a TooltipsProvider');
  }
  
  return context;
}
import { createContext, useState, useContext, ReactNode } from 'react';
import { AchievementData, ConfettiCelebration } from '@/components/celebrations/confetti-celebration';
import { checkNewAchievement, MilestoneType, resetAchievements } from '@/lib/achievement-service';

interface AchievementsContextType {
  triggerMilestone: (type: MilestoneType, count?: number) => void;
  resetAllAchievements: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<AchievementData | null>(null);

  const triggerMilestone = (type: MilestoneType, count?: number) => {
    // Only check for new achievements if no celebration is currently showing
    if (!currentAchievement) {
      const achievement = checkNewAchievement(type, count);
      if (achievement) {
        setCurrentAchievement(achievement);
      }
    }
  };

  const resetAllAchievements = () => {
    resetAchievements();
  };

  const handleCloseAchievement = () => {
    setCurrentAchievement(null);
  };

  return (
    <AchievementsContext.Provider value={{ triggerMilestone, resetAllAchievements }}>
      {children}
      <ConfettiCelebration 
        achievement={currentAchievement} 
        onClose={handleCloseAchievement} 
      />
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
}
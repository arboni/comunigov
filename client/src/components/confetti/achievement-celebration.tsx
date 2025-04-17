import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MilestoneConfetti } from './milestone-confetti';
import { Award, Trophy, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AchievementData {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  isNew?: boolean;
}

/**
 * Component that shows a celebration dialog when a user achieves a milestone
 * This component monitors for new achievements and displays them with confetti
 */
export function AchievementCelebration() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<AchievementData | null>(null);
  
  // Get user's achievements
  const { data: userAchievements } = useQuery<{id: number, earnedAt: string, badgeId: number, featured: boolean}[]>({
    queryKey: ['/api/user/achievements'],
    refetchInterval: 60000, // Check for new achievements every minute
  });
  
  // Get all available badges
  const { data: allBadges } = useQuery<AchievementData[]>({
    queryKey: ['/api/badges'],
  });
  
  // Mark an achievement as seen
  const markAsSeen = useMutation({
    mutationFn: async (achievementId: number) => {
      await apiRequest('POST', `/api/user/achievements/${achievementId}/seen`, {});
      return achievementId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/achievements'] });
    }
  });
  
  // Check for new achievements
  useEffect(() => {
    if (!userAchievements || !allBadges) return;
    
    // Find the most recent achievement that hasn't been celebrated yet
    const newAchievements = userAchievements.filter(a => a.isNew === true);
    
    if (newAchievements.length > 0) {
      // Get the achievement details
      const newAchievement = newAchievements[0]; // Take the first one
      const achievementDetails = allBadges.find(b => b.id === newAchievement.badgeId);
      
      if (achievementDetails) {
        // Show confetti and dialog
        setCurrentAchievement(achievementDetails);
        setShowConfetti(true);
        setIsDialogOpen(true);
      }
    }
  }, [userAchievements, allBadges]);
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setShowConfetti(false);
    
    if (currentAchievement) {
      // Mark achievement as seen
      markAsSeen.mutate(currentAchievement.id);
    }
  };
  
  // Icons based on achievement category
  const getAchievementIcon = () => {
    if (!currentAchievement) return <Trophy className="h-12 w-12 text-yellow-500" />;
    
    switch (currentAchievement.category) {
      case 'task':
        return <CheckCircle2 className="h-12 w-12 text-emerald-500" />;
      case 'communication':
        return <Award className="h-12 w-12 text-blue-500" />;
      default:
        return <Trophy className="h-12 w-12 text-yellow-500" />;
    }
  };
  
  return (
    <>
      {/* Confetti effect */}
      <MilestoneConfetti 
        show={showConfetti} 
        duration={6000}
        onComplete={() => setShowConfetti(false)}
      />
      
      {/* Achievement dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="space-y-3">
            <div className="mx-auto rounded-full bg-primary/10 p-6 w-24 h-24 flex items-center justify-center">
              {getAchievementIcon()}
            </div>
            <DialogTitle className="text-xl font-bold">
              Conquista Desbloqueada!
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-primary">
              {currentAchievement?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              {currentAchievement?.description}
            </p>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">
                +{currentAchievement?.points} pontos adicionados ao seu perfil
              </p>
            </div>
          </div>
          
          <Button onClick={handleDialogClose} className="w-full">
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
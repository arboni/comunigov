import React, { useState, useEffect } from 'react';
import { ConfettiOverlay } from './confetti-overlay';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { AchievementBadge, UserBadge } from '@shared/schema';

interface AchievementCelebrationProps {
  badges: (UserBadge & { badge: AchievementBadge, isNew?: boolean })[];
  onClose: () => void;
}

/**
 * A component that displays a celebration dialog with confetti when the user earns badges
 */
export function AchievementCelebration({ badges, onClose }: AchievementCelebrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const newBadges = badges.filter(badge => badge.isNew);
  const hasBadges = newBadges.length > 0;

  useEffect(() => {
    if (hasBadges) {
      setIsOpen(true);
      setShowConfetti(true);
    }
  }, [hasBadges]);

  const handleClose = () => {
    setIsOpen(false);
    setShowConfetti(false);
    onClose();
  };

  if (!hasBadges) return null;

  return (
    <>
      <ConfettiOverlay 
        isActive={showConfetti} 
        duration={6000}
      />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              🎉 Congratulations! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              You've earned {newBadges.length > 1 ? 'new badges' : 'a new badge'}!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {newBadges.map((userBadge) => (
                <div 
                  key={userBadge.id} 
                  className="flex flex-col items-center p-4 bg-muted/50 rounded-lg shadow-sm"
                >
                  <div className="w-20 h-20 flex items-center justify-center mb-2 bg-primary/20 rounded-full">
                    <span className="text-4xl">{userBadge.badge.icon || '🏆'}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-center">{userBadge.badge.name}</h3>
                  <Badge variant="default" className="mt-1 mb-2">
                    {userBadge.badge.category}
                  </Badge>
                  <p className="text-sm text-center text-muted-foreground">
                    {userBadge.badge.description}
                  </p>
                  <div className="text-xs text-center mt-2 text-muted-foreground">
                    Earned on {new Date(userBadge.earnedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex justify-center sm:justify-center gap-2">
            <Button 
              onClick={handleClose}
              className="px-8"
            >
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
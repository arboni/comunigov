import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Star, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon?: 'trophy' | 'award' | 'star';
}

interface ConfettiCelebrationProps {
  achievement: AchievementData | null;
  onClose: () => void;
}

export function ConfettiCelebration({ achievement, onClose }: ConfettiCelebrationProps) {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [showConfetti, setShowConfetti] = useState(false);
  const { t } = useTranslation();
  
  // Update confetti container dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Show confetti with a slight delay for better visual effect
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [achievement]);
  
  if (!achievement) return null;
  
  // Get the appropriate color based on achievement type
  const getTypeColor = (type: AchievementData['type']) => {
    switch (type) {
      case 'bronze': return 'bg-amber-700';
      case 'silver': return 'bg-slate-400';
      case 'gold': return 'bg-amber-400';
      case 'platinum': return 'bg-gradient-to-r from-emerald-400 to-cyan-400';
      default: return 'bg-primary';
    }
  };
  
  // Get the appropriate icon based on achievement type
  const getIcon = (icon?: AchievementData['icon']) => {
    switch (icon) {
      case 'trophy': return <Trophy className="h-8 w-8" />;
      case 'award': return <Award className="h-8 w-8" />;
      case 'star': return <Star className="h-8 w-8" />;
      default: return <Trophy className="h-8 w-8" />;
    }
  };
  
  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          initialVelocityY={-5}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      
      <AlertDialog open={!!achievement} onOpenChange={() => onClose()}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <div className={`mx-auto rounded-full p-5 ${getTypeColor(achievement.type)} mb-4`}>
              {getIcon(achievement.icon)}
            </div>
            <AlertDialogTitle className="text-2xl font-bold">
              {achievement.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg mt-2">
              {achievement.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-8 flex justify-center">
            <Button onClick={onClose} className="px-8">
              <Check className="mr-2 h-4 w-4" />
              {t('common.ok')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
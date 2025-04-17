import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface MilestoneConfettiProps {
  show: boolean;
  duration?: number; // in milliseconds
  onComplete?: () => void;
}

/**
 * A component that displays a confetti celebration for milestone achievements
 * 
 * @param show - Whether to show the confetti
 * @param duration - How long to show the confetti (default: 5000ms)
 * @param onComplete - Callback function to call when confetti animation is complete
 */
export function MilestoneConfetti({ 
  show, 
  duration = 5000,
  onComplete 
}: MilestoneConfettiProps) {
  const [isActive, setIsActive] = useState(false);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });
  
  // Handle window resizing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (show && !isActive) {
      setIsActive(true);
      
      // Set timeout to hide confetti after duration
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, isActive, onComplete]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.15}
        colors={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#f59e0b', '#fbbf24', '#fde68a']}
      />
    </div>
  );
}
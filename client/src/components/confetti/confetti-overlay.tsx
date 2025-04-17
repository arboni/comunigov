import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from '../../hooks/use-window-size';

type ConfettiOverlayProps = {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
  particleCount?: number;
  colors?: string[];
};

/**
 * A component that displays animated confetti particles when activated
 */
export function ConfettiOverlay({
  isActive,
  duration = 5000,
  onComplete,
  particleCount = 200,
  colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#f97316', '#f59e0b', '#10b981', '#34d399']
}: ConfettiOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    // When activated, show confetti and set a timer to hide it
    if (isActive) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <ReactConfetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={particleCount}
        colors={colors}
        gravity={0.2}
        initialVelocityY={10}
        tweenDuration={duration}
      />
    </div>
  );
}
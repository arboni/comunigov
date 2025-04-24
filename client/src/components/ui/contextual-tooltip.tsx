import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Check, XCircle } from 'lucide-react';
import { useTooltips, TooltipId } from '@/hooks/use-tooltips';
import { useTranslation } from '@/hooks/use-translation';

interface ContextualTooltipProps {
  id: TooltipId;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  showOnMount?: boolean;
  forceShow?: boolean;
  onDismiss?: () => void;
  customText?: string;
  icon?: React.ReactNode;
  showDismissButton?: boolean;
  showDontShowAgainButton?: boolean;
  openDelay?: number;
}

export function ContextualTooltip({
  id,
  children,
  side = 'top',
  align = 'center',
  className = '',
  showOnMount = false,
  forceShow = false,
  onDismiss,
  customText,
  icon = <HelpCircle className="h-4 w-4 text-yellow-500" />,
  showDismissButton = true,
  showDontShowAgainButton = true,
  openDelay = 500,
}: ContextualTooltipProps) {
  const [open, setOpen] = useState(showOnMount);
  const { shouldShowTooltip, markTooltipAsSeen } = useTooltips();
  const { t } = useTranslation();
  
  // Determine if this tooltip should be shown based on user preferences
  const shouldShow = forceShow || shouldShowTooltip(id);
  
  // Handle automatic opening after delay if showOnMount is true
  useEffect(() => {
    if (showOnMount && shouldShow) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, openDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showOnMount, shouldShow, openDelay]);
  
  // If the user has chosen not to see this tooltip, just render the children
  if (!shouldShow) {
    return <>{children}</>;
  }
  
  // Get tooltip text from translation or use custom text
  const tooltipText = customText || t(`tooltips.${id}`);
  
  // Handle tooltip dismiss and don't show again
  const handleDismiss = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  const handleDontShowAgain = () => {
    markTooltipAsSeen(id);
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <div className="relative inline-flex">
            {children}
            {/* Small indicator dot to show there's a tooltip */}
            <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          align={align}
          className={`max-w-xs p-4 ${className}`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              {icon}
              <div className="flex-1">
                <p className="text-sm">{tooltipText}</p>
              </div>
              {showDismissButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 -mr-1 -mt-1 text-muted-foreground"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Fechar</span>
                </Button>
              )}
            </div>
            
            {showDontShowAgainButton && (
              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={handleDontShowAgain}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Não mostrar novamente
                </Button>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
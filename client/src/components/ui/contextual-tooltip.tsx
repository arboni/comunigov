import React, { useEffect, useState } from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useTooltips, TooltipId } from '@/hooks/use-tooltips';
import { Button } from '@/components/ui/button';
import { Info, X, CheckCircle, Lightbulb } from 'lucide-react';

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
  icon = <Lightbulb className="h-4 w-4 text-yellow-500" />,
  showDismissButton = true,
  showDontShowAgainButton = true,
  openDelay = 500
}: ContextualTooltipProps) {
  const { shouldShowTooltip, markTooltipAsSeen, getTooltipText } = useTooltips();
  const [open, setOpen] = useState(showOnMount && shouldShowTooltip(id));
  
  // Get the tooltip text from translation or custom text
  const tooltipText = customText || getTooltipText(id);
  
  // Show tooltip on mount with delay if configured
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showOnMount && shouldShowTooltip(id)) {
      timer = setTimeout(() => {
        setOpen(true);
      }, openDelay);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [showOnMount, id, shouldShowTooltip, openDelay]);
  
  // Handle tooltip dismissal
  const handleDismiss = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Handle marking tooltip as seen
  const handleDontShowAgain = () => {
    markTooltipAsSeen(id);
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Determine if tooltip should be visible
  const shouldShow = forceShow || (shouldShowTooltip(id) && open);

  return (
    <TooltipProvider>
      <Tooltip
        open={shouldShow}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleDismiss();
          } else if (!shouldShowTooltip(id) && !forceShow) {
            setOpen(false);
          } else {
            setOpen(isOpen);
          }
        }}
      >
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={`p-4 max-w-[280px] md:max-w-[320px] text-sm space-y-2 ${className}`}
        >
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 mt-0.5">
              {icon}
            </span>
            <div className="flex-1">
              <p className="text-sm">{tooltipText}</p>
              
              {(showDismissButton || showDontShowAgainButton) && (
                <div className="flex justify-end mt-2 space-x-2">
                  {showDismissButton && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDismiss}
                      className="h-7 px-2 text-xs"
                    >
                      Entendi
                    </Button>
                  )}
                  
                  {showDontShowAgainButton && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDontShowAgain}
                      className="h-7 px-2 text-xs"
                    >
                      Não mostrar novamente
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Close button in the top-right corner */}
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-1 p-1 rounded-full hover:bg-muted"
              aria-label="Fechar dica"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
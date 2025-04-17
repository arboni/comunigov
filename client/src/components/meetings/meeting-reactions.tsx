import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, ThumbsUp, ThumbsDown, Heart, Party, Eye, ThumbsUp as PrayHands, Smile, Frown, HandClap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MeetingReaction {
  id: number;
  meetingId: number;
  userId: number;
  emoji: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

interface MeetingReactionsProps {
  meetingId: number;
  reactions: MeetingReaction[];
  currentUserId: number;
}

// Available emojis matched with our schema
const AVAILABLE_EMOJIS = ['👍', '👎', '❤️', '🎉', '🤔', '😄', '😢', '👏'];

// Emoji descriptions for tooltips
const EMOJI_DESCRIPTIONS: Record<string, string> = {
  '👍': 'Thumbs Up',
  '👎': 'Thumbs Down',
  '❤️': 'Love',
  '🎉': 'Celebration',
  '🤔': 'Thinking',
  '😄': 'Happy',
  '😢': 'Sad',
  '👏': 'Applause'
};

export function MeetingReactions({ meetingId, reactions, currentUserId }: MeetingReactionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions.forEach(reaction => {
    reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
  });

  // Find which reactions the current user has already selected
  const userReactions = reactions.filter(r => r.userId === currentUserId)
    .map(r => r.emoji);

  // Mutation to add reaction
  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      return await apiRequest('POST', `/api/meetings/${meetingId}/reactions`, {
        emoji
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/reactions`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
      console.error('Failed to add reaction:', error);
    }
  });

  // Mutation to remove reaction
  const removeReaction = useMutation({
    mutationFn: async (reactionId: number) => {
      return await apiRequest('DELETE', `/api/meetings/${meetingId}/reactions/${reactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/reactions`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive',
      });
      console.error('Failed to remove reaction:', error);
    }
  });

  // Handle reaction click
  const handleReaction = (emoji: string) => {
    if (userReactions.includes(emoji)) {
      const reaction = reactions.find(r => r.userId === currentUserId && r.emoji === emoji);
      if (reaction) {
        removeReaction.mutate(reaction.id);
      }
    } else {
      addReaction.mutate(emoji);
    }
  };

  const isPending = addReaction.isPending || removeReaction.isPending;

  return (
    <div className="mt-6 bg-muted/30 rounded-lg p-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Meeting Reactions</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Show existing reactions with counts */}
          {Object.entries(reactionCounts).length > 0 ? (
            <TooltipProvider>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <Tooltip key={emoji}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={userReactions.includes(emoji) ? "default" : "outline"}
                      size="sm"
                      className="gap-1"
                      onClick={() => !isPending && handleReaction(emoji)}
                      disabled={isPending}
                    >
                      {isPending && userReactions.includes(emoji) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span>{emoji}</span>
                      )}
                      <span className="text-xs ml-1">{count}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{EMOJI_DESCRIPTIONS[emoji] || emoji}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          ) : (
            <p className="text-sm text-muted-foreground">No reactions yet. Be the first to react!</p>
          )}
        </div>
        
        {/* Toggle showing all emoji options */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-auto self-start text-muted-foreground"
        >
          {isExpanded ? "Hide emoji options" : "Add reaction..."}
        </Button>
        
        {/* Show all available emojis when expanded */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 mt-2">
            <TooltipProvider>
              {AVAILABLE_EMOJIS.map((emoji) => (
                <Tooltip key={emoji}>
                  <TooltipTrigger asChild>
                    <Button
                      key={emoji}
                      variant={userReactions.includes(emoji) ? "default" : "outline"}
                      size="sm"
                      onClick={() => !isPending && handleReaction(emoji)}
                      disabled={isPending}
                      className={userReactions.includes(emoji) ? "bg-primary/10 hover:bg-primary/20" : ""}
                    >
                      {isPending && userReactions.includes(emoji) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span>{emoji}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{EMOJI_DESCRIPTIONS[emoji] || emoji}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}
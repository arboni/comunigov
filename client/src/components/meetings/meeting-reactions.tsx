import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

const AVAILABLE_EMOJIS = ['👍', '👎', '❤️', '🎉', '🤔', '😄', '😢', '👏'];

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
      const result = await apiRequest('POST', `/api/meetings/${meetingId}/reactions`, {
        emoji
      });
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      toast({
        title: 'Reaction added',
        description: 'Your reaction has been added to the meeting',
      });
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
    mutationFn: async (emoji: string) => {
      // Find the reaction ID for this user and emoji
      const reaction = reactions.find(r => r.userId === currentUserId && r.emoji === emoji);
      if (!reaction) return;

      const result = await apiRequest('DELETE', `/api/meetings/${meetingId}/reactions/${reaction.id}`);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      toast({
        title: 'Reaction removed',
        description: 'Your reaction has been removed from the meeting',
      });
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
      removeReaction.mutate(emoji);
    } else {
      addReaction.mutate(emoji);
    }
  };

  return (
    <div className="mt-6 bg-muted/30 rounded-lg p-4">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Reactions</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Show existing reactions with counts */}
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <Button
              key={emoji}
              variant={userReactions.includes(emoji) ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => handleReaction(emoji)}
            >
              <span>{emoji}</span>
              <span className="text-xs">{count}</span>
            </Button>
          ))}
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
            {AVAILABLE_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant={userReactions.includes(emoji) ? "default" : "outline"}
                size="sm"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, getQueryFn } from '@/lib/queryClient';
import { AchievementBadge, UserBadge } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage user achievements and badges
 * Handles fetching user badges, checking for new ones, and marking them as seen
 */
export function useAchievements(userId: number | undefined) {
  const { toast } = useToast();
  const [newBadges, setNewBadges] = useState<(UserBadge & { badge: AchievementBadge, isNew: boolean })[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Fetch user badges
  const {
    data: userBadges,
    isLoading,
    error
  } = useQuery<(UserBadge & { badge: AchievementBadge })[]>({
    queryKey: ['/api/users/badges', userId],
    queryFn: getQueryFn(),
    enabled: !!userId,
    refetchInterval: 30000, // Check for new badges every 30 seconds
  });
  
  // Mutation to mark badges as seen
  const markBadgesAsSeen = useMutation({
    mutationFn: async (badgeIds: number[]) => {
      const response = await fetch('/api/users/badges/mark-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badgeIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark badges as seen');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Refetch the badges
      queryClient.invalidateQueries({ queryKey: ['/api/users/badges', userId] });
    },
    onError: (error) => {
      console.error('Error marking badges as seen:', error);
    },
  });
  
  // Check for new badges
  useEffect(() => {
    if (userBadges && userBadges.length > 0) {
      // Filter badges that have not been seen yet
      const unseenBadges = userBadges
        .filter(badge => !badge.seen) // Assuming a 'seen' field is added to the UserBadge type
        .map(badge => ({ ...badge, isNew: true }));
      
      if (unseenBadges.length > 0) {
        setNewBadges(unseenBadges);
        setShowCelebration(true);
        
        // Notify about new badges
        toast({
          title: "New Achievement Unlocked!",
          description: `You've earned ${unseenBadges.length > 1 ? 'new badges' : 'a new badge'}!`,
          variant: "default",
        });
      }
    }
  }, [userBadges, toast]);
  
  // Handle closing the celebration modal
  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    
    // Mark badges as seen
    if (newBadges.length > 0) {
      const badgeIds = newBadges.map(badge => badge.id);
      markBadgesAsSeen.mutate(badgeIds);
    }
    
    setNewBadges([]);
  }, [newBadges, markBadgesAsSeen]);
  
  return {
    userBadges,
    newBadges,
    showCelebration,
    handleCloseCelebration,
    isLoading,
    error,
  };
}
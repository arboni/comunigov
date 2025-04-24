import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<Response> {
  const headers: Record<string, string> = {};
  let body: any = undefined;
  
  if (data) {
    if (isFormData) {
      // For FormData (file uploads), don't set Content-Type (browser will set it with boundary)
      body = data as FormData;
    } else {
      // For JSON data
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      cache: "no-cache", // Prevent caching issues
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Network error for ${method} ${url}:`, error);
    
    // If it's a network error (e.g., server unreachable)
    if (error instanceof TypeError && error.message.includes('network')) {
      throw new Error(
        `Network connection error. Please check your internet connection and try again.`
      );
    }
    
    // For other errors, provide a more user-friendly message
    throw new Error(
      `Failed to ${method.toLowerCase()} data to server. ${error instanceof Error ? error.message : 'Please try again later.'}`
    );
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        cache: "no-cache", // Prevent caching issues
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Unauthorized access to ${queryKey[0]}, returning null as configured`);
        return null;
      }

      await throwIfResNotOk(res);
      
      try {
        return await res.json();
      } catch (jsonError) {
        console.error(`Error parsing JSON from ${queryKey[0]}:`, jsonError);
        throw new Error(`Failed to parse response from server. Please try again.`);
      }
    } catch (error) {
      console.error(`Network error for GET ${queryKey[0]}:`, error);
      
      // If it's a network error (e.g., server unreachable)
      if (error instanceof TypeError && error.message.includes('network')) {
        throw new Error(
          `Network connection error. Please check your internet connection and try again.`
        );
      }
      
      // For other errors, provide a more user-friendly message
      throw new Error(
        `Failed to fetch data. ${error instanceof Error ? error.message : 'Please try again later.'}`
      );
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 3000, // 3 seconds instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper functions for cache invalidation
export function invalidateEntities() {
  return queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
}

export function invalidateUsers() {
  return queryClient.invalidateQueries({ queryKey: ['/api/users'] });
}

export function invalidateTasks() {
  return queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
}

export function invalidateMeetings() {
  queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
  return queryClient.invalidateQueries({ queryKey: ['/api/meetings/upcoming'] });
}

export function invalidateCommunications() {
  return queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
}

export function invalidateDashboardStats() {
  return queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
}

export function invalidateSubjects() {
  // Invalidate both regular subjects and subjects with creators
  queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
  return queryClient.invalidateQueries({ queryKey: ['/api/subjects-with-creators'] });
}

// Invalidate all data (useful after major changes)
export function invalidateAllData() {
  return Promise.all([
    invalidateEntities(),
    invalidateUsers(),
    invalidateTasks(),
    invalidateMeetings(),
    invalidateCommunications(),
    invalidateSubjects(),
    invalidateDashboardStats()
  ]);
}

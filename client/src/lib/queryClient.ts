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
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Network error for ${method} ${url}:`, error);
    // Rethrow with more descriptive message
    throw new Error(
      `Network error: Failed to ${method.toLowerCase()} ${url}. Please check your connection and try again. ${error instanceof Error ? error.message : ''}`
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
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Network error for GET ${queryKey[0]}:`, error);
      throw new Error(
        `Network error: Failed to fetch data from ${queryKey[0]}. Please check your connection and try again. ${error instanceof Error ? error.message : ''}`
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
  return queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
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

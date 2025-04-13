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
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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

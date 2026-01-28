import { QueryClient, QueryFunction } from '@tanstack/react-query';

function getTestUserHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('testUserAuth');
    if (stored) {
      const testUser = JSON.parse(stored);
      if (testUser?.id === 'test-user-001') {
        return { 'X-Test-User-Id': 'test-user-001' };
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return {};
}

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey[0] as string;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      ...getTestUserHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: defaultQueryFn,
    },
  },
});

export async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getTestUserHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status}: ${message || response.statusText}`);
  }

  return response.json();
}

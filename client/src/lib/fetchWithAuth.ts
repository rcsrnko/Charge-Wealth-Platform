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
  }
  return {};
}

export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...getTestUserHeaders(),
      ...options?.headers,
    },
  });
}

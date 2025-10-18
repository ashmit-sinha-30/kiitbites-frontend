// Utility to check backend connectivity
export const checkBackendHealth = async (backendUrl: string): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Backend health check successful:', data);
      return { isHealthy: true };
    } else {
      console.error('Backend health check failed with status:', response.status);
      return { isHealthy: false, error: `Backend returned status ${response.status}` };
    }
  } catch (error) {
    console.error('Backend health check error:', error);
    return { 
      isHealthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getBackendUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || '';
};

export interface FetchOptions extends RequestInit {
  body?: any;
}

export const fetcher = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const { body, ...rest } = options;
  const config: RequestInit = {
    ...rest,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      ...rest.headers,
    },
  };

  if (body && typeof body === 'object') {
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch (e) {
      errorData = { message: res.statusText };
    }
    const error = new Error(errorData.message || 'API request failed') as Error & { status: number; data: any };
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  return res.json() as Promise<T>;
}

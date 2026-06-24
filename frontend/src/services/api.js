const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export async function apiRequest(
  path,
  options = {}
) {
  const headers = {
    ...(options.body
      ? {
          'Content-Type':
            'application/json'
        }
      : {}),

    ...options.headers
  };

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      credentials: 'include'
    }
  );

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        'The request could not be completed.'
    );
  }

  return result;
}
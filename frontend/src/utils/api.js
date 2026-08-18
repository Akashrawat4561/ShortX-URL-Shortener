export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Reusable helper for API requests with automatic JWT token attachment
 */
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && {
      Authorization: `Bearer ${token}`
    }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}`
    );
  }

  return data;
};

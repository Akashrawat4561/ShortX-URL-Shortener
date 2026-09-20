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

  let data;
  const contentType = response.headers.get("content-type");
  const text = await response.text();
  
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(
      `API Error (${response.status}): Expected JSON but received ${contentType}. Response: ${text.substring(0, 50)}...`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
};

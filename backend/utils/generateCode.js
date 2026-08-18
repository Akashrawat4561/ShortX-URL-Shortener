import crypto from 'crypto';

/**
 * Generates a clean, collision-resistant random alphanumeric string.
 * @param {number} length - Desired string length (default 6)
 * @returns {string}
 */
export const generateShortCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[bytes[i] % characters.length];
  }
  return result;
};

/**
 * Validates whether a string is a properly formatted URL.
 * @param {string} string - URL string to test
 * @returns {boolean}
 */
export const isValidHttpUrl = (string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host === '169.254.169.254'
  ) {
    return false;
  }
  return true;
};

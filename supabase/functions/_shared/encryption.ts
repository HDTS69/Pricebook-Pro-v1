// NOTE: This is a VERY basic example using Web Crypto API (available in Deno)
// For production, consider more robust libraries and key management.
// Requires a securely generated and managed ENCRYPTION_KEY environment variable.

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // Standard for AES-GCM

async function getKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret.slice(0, 32)); // Use first 32 chars for AES-256
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false, // Not extractable
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(token: string, secret: string): Promise<string> {
  if (!token || !secret) {
    throw new Error('Token and secret are required for encryption.');
  }
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedToken = new TextEncoder().encode(token);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encodedToken
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined)); // Convert Uint8Array to binary string then base64
}

export async function decryptToken(encryptedBase64: string, secret: string): Promise<string> {
  if (!encryptedBase64 || !secret) {
    throw new Error('Encrypted data and secret are required for decryption.');
  }
  const key = await getKey(secret);
  
  // Decode base64 and split IV from encrypted data
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);

  if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length during decryption.');
  }

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
} 
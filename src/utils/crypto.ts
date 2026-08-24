export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const saveSecure = <T>(key: string, data: T): void => {
  try {
    const string = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(string)));
    localStorage.setItem(key, encoded);
  } catch (e) {
    console.error("Save failed", e);
  }
};

export const loadSecure = <T>(key: string): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
      const decoded = decodeURIComponent(escape(atob(stored)));
      return JSON.parse(decoded) as T;
    } catch {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error("Load failed", e);
    return null;
  }
};

// --- WEB CRYPTO API AES-256-GCM ENCRYPTION ---

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(dataText: string, password: string): Promise<{ cipherText: string; iv: string; salt: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encoded = new TextEncoder().encode(dataText);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );
  
  const cipherArray = new Uint8Array(cipherBuffer);
  let cipherBinary = "";
  for (let i = 0; i < cipherArray.length; i++) {
    cipherBinary += String.fromCharCode(cipherArray[i]);
  }

  let ivBinary = "";
  for (let i = 0; i < iv.length; i++) {
    ivBinary += String.fromCharCode(iv[i]);
  }

  let saltBinary = "";
  for (let i = 0; i < salt.length; i++) {
    saltBinary += String.fromCharCode(salt[i]);
  }

  return {
    cipherText: btoa(cipherBinary),
    iv: btoa(ivBinary),
    salt: btoa(saltBinary)
  };
}

export async function decryptData(cipherText: string, ivText: string, saltText: string, password: string): Promise<string> {
  const saltBinary = atob(saltText);
  const salt = new Uint8Array(saltBinary.length);
  for (let i = 0; i < saltBinary.length; i++) {
    salt[i] = saltBinary.charCodeAt(i);
  }

  const ivBinary = atob(ivText);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    iv[i] = ivBinary.charCodeAt(i);
  }

  const cipherBinary = atob(cipherText);
  const cipherBuffer = new Uint8Array(cipherBinary.length);
  for (let i = 0; i < cipherBinary.length; i++) {
    cipherBuffer[i] = cipherBinary.charCodeAt(i);
  }

  const key = await deriveKey(password, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    cipherBuffer
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}

import crypto from 'crypto';
import config from '../config';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Encrypt sensitive data
export const encrypt = (text: string): string => {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Generate a key from the encryption key and salt
    const key = crypto.pbkdf2Sync(
      config.security.encryptionKey,
      salt,
      100000, // iterations
      KEY_LENGTH,
      'sha512'
    );
    
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(salt);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const result = salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    
    return result;
  } catch (error) {
    throw new Error('Encryption failed');
  }
};

// Decrypt sensitive data
export const decrypt = (encryptedData: string): string => {
  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    
    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Generate the same key
    const key = crypto.pbkdf2Sync(
      config.security.encryptionKey,
      salt,
      100000, // iterations
      KEY_LENGTH,
      'sha512'
    );
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
};

// Hash sensitive data (one-way)
export const hash = (data: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
};

// Verify hashed data
export const verifyHash = (data: string, hashedData: string): boolean => {
  const parts = hashedData.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Generate secure random string
export const generateSecureRandom = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure random number
export const generateSecureRandomNumber = (min: number, max: number): number => {
  const range = max - min + 1;
  const bytes = crypto.randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return min + (value % range);
};

// Hash credit card number (for storage)
export const hashCardNumber = (cardNumber: string): string => {
  // Remove spaces and dashes
  const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  
  // Keep only last 4 digits for display
  const last4 = cleanNumber.slice(-4);
  
  // Hash the full number
  const hashedNumber = hash(cleanNumber);
  
  return `${hashedNumber}:${last4}`;
};

// Verify card number hash
export const verifyCardNumber = (cardNumber: string, hashedCardNumber: string): boolean => {
  const parts = hashedCardNumber.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const [hash, last4] = parts;
  const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  
  // Verify the hash
  return verifyHash(cleanNumber, hash) && cleanNumber.slice(-4) === last4;
};

// Mask sensitive data for logging
export const maskSensitiveData = (data: string, type: 'card' | 'email' | 'phone' | 'ssn'): string => {
  switch (type) {
    case 'card':
      // Show only last 4 digits
      return data.replace(/\d(?=\d{4})/g, '*');
    case 'email':
      // Mask middle part of email
      const [local, domain] = data.split('@');
      if (local.length <= 2) return data;
      return `${local[0]}***@${domain}`;
    case 'phone':
      // Show only last 4 digits
      return data.replace(/\d(?=\d{4})/g, '*');
    case 'ssn':
      // Show only last 4 digits
      return data.replace(/\d(?=\d{4})/g, '*');
    default:
      return data;
  }
};

// Generate secure token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

// Generate webhook signature
export const generateWebhookSignature = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

// Verify webhook signature
export const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// Encrypt object
export const encryptObject = (obj: any): string => {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
};

// Decrypt object
export const decryptObject = (encryptedData: string): any => {
  const jsonString = decrypt(encryptedData);
  return JSON.parse(jsonString);
};

// Generate checksum for data integrity
export const generateChecksum = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Verify checksum
export const verifyChecksum = (data: string, checksum: string): boolean => {
  const expectedChecksum = generateChecksum(data);
  return checksum === expectedChecksum;
};

// Secure comparison (timing attack resistant)
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Generate nonce for replay attack prevention
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Validate nonce (basic implementation - in production, you'd want to store used nonces)
export const validateNonce = (nonce: string): boolean => {
  // Basic validation - check if it's a valid hex string of correct length
  return /^[a-f0-9]{32}$/i.test(nonce);
};

// Encrypt sensitive fields in an object
export const encryptSensitiveFields = (obj: any, fields: string[]): any => {
  const encrypted = { ...obj };
  
  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
};

// Decrypt sensitive fields in an object
export const decryptSensitiveFields = (obj: any, fields: string[]): any => {
  const decrypted = { ...obj };
  
  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        // If decryption fails, keep the original value
        console.warn(`Failed to decrypt field ${field}`);
      }
    }
  }
  
  return decrypted;
};

// Generate secure password
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }
  
  return password;
};

// Validate password strength
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }
  
  const isValid = score >= 4;
  
  return {
    isValid,
    score,
    feedback,
  };
};

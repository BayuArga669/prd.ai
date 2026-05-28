import crypto from 'crypto';

/**
 * Hash a password using PBKDF2
 * @param password Plaintext password
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored PBKDF2 hash
 * @param password Plaintext password to verify
 * @param storedHash Hashed password stored in database (salt:hash)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  } catch {
    return false;
  }
}

interface JWTPayload {
  userId: number;
  email: string;
  name?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Sign a payload into a HS256 JWT token using native crypto HMAC
 * @param payload Object payload to encode
 * @param expiresInMinutes Token validity period (defaults to 1 day)
 */
export function signToken(payload: JWTPayload, expiresInMinutes: number = 1440): string {
  const secret = process.env.JWT_SECRET || 'prd-ai-secret-key-123456';
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  const exp = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60);
  const jwtPayload = { ...payload, exp };
  const stringifiedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${stringifiedPayload}`)
    .digest('base64url');
    
  return `${header}.${stringifiedPayload}.${signature}`;
}

/**
 * Verify a HS256 JWT token and return the payload if valid and not expired
 * @param token JWT token string
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const secret = process.env.JWT_SECRET || 'prd-ai-secret-key-123456';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as JWTPayload;
    
    // Check expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch {
    return null;
  }
}

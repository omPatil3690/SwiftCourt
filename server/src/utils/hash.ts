import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}


import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayloadBase { sub: string; role: string; }

export function signAccessToken(payload: JwtPayloadBase) {
  return (jwt.sign as any)(payload, env.accessTokenSecret, { expiresIn: env.accessTokenTtl });
}

export function signRefreshToken(payload: JwtPayloadBase) {
  return (jwt.sign as any)(payload, env.refreshTokenSecret, { expiresIn: env.refreshTokenTtl });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessTokenSecret) as jwt.JwtPayload & JwtPayloadBase;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshTokenSecret) as jwt.JwtPayload & JwtPayloadBase;
}

import { Request, Response } from 'express';
import { z } from 'zod';
import { login, logout, registerUser, rotateRefreshToken } from './auth.service.js';
import { UserRole } from '../../types/enums.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  avatarUrl: z.string().url().optional(),
  inviteSecret: z.string().optional()
});

export async function signupHandler(req: Request, res: Response) {
  try {
    const data = signupSchema.parse(req.body);
    if (data.role === UserRole.ADMIN) {
      if (!data.inviteSecret || data.inviteSecret !== process.env.ADMIN_INVITE_SECRET) {
        return res.status(403).json({ message: 'Invalid admin invite secret' });
      }
    }
    const { inviteSecret, ...rest } = data;
    const out = await registerUser(rest as any); // cast due to zod unknown -> any
  res.status(201).json({ message: 'User created.', ...out });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}


export async function loginHandler(req: Request, res: Response) {
  const schema = z.object({ email: z.string().email(), password: z.string() });
  try {
    const { email, password } = schema.parse(req.body);
    const tokens = await login(email, password);
    res.json(tokens);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const schema = z.object({ refreshToken: z.string() });
  try {
    const { refreshToken } = schema.parse(req.body);
    const tokens = await rotateRefreshToken(refreshToken);
    res.json(tokens);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const schema = z.object({ refreshToken: z.string() });
  try {
    const { refreshToken } = schema.parse(req.body);
    await logout(refreshToken);
    res.json({ message: 'Logged out' });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

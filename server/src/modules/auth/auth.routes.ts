import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { loginHandler, logoutHandler, refreshHandler, signupHandler } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', authLimiter, signupHandler);
authRouter.post('/login', authLimiter, loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);

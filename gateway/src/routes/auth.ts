import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { GatewayError } from '../middleware/errorHandler';

const router = Router();

const MOCK_USERS: Record<string, { password: string; role: 'admin' | 'user'; email: string }> = {
  'admin@orquestra.dev': { password: 'admin123', role: 'admin', email: 'admin@orquestra.dev' },
  'user@orquestra.dev': { password: 'user123', role: 'user', email: 'user@orquestra.dev' },
};

/**
 * POST /api/v1/auth/login
 * Returns a signed JWT for valid credentials.
 */
router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    next(new GatewayError(400, 'Bad Request', 'Fields "email" and "password" are required.'));
    return;
  }

  const user = MOCK_USERS[email];

  if (!user || user.password !== password) {
    next(new GatewayError(401, 'Invalid Credentials', 'Email or password is incorrect.'));
    return;
  }

  const payload = { sub: email.split('@')[0], email, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] });

  res.status(200).json({
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: config.jwt.expiresIn,
    user: { sub: payload.sub, email, role: user.role },
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the current authenticated user (requires Bearer token).
 */
router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.secret);
    res.json({ user: payload });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
